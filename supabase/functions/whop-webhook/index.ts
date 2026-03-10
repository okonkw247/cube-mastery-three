import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, whop-signature",
};

// Single plan mapping
const WHOP_PLAN_MAPPING: Record<string, string> = {
  "plan_viVMSlpXhqRSZ": "paid",
  // Legacy plan IDs - map to paid for backwards compat
  "plan_7NRvNAxpWhOse": "paid",
  "plan_aeLinh43MkIpm": "paid",
};

// Plan access limits
const PLAN_ACCESS_LIMITS: Record<string, { start: number; end: number }> = {
  "free": { start: 1, end: 1 },
  "paid": { start: 1, end: 50 },
};

type SubscriptionStatus = 'active' | 'inactive' | 'payment_pending' | 'payment_failed' | 'cancelled';

interface WhopWebhookPayload {
  action: string;
  data: {
    id: string;
    email?: string;
    user?: { email?: string; id?: string };
    user_id?: string;
    status?: string;
    product?: { id: string; name: string };
    plan?: { id: string; plan_type?: string };
    membership_id?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: string;
    amount?: number;
    currency?: string;
    failure_reason?: string;
    refund_amount?: number;
  };
}

async function verifyWhopSignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) { console.warn("Missing signature or secret"); return true; }
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const buf = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const computed = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === signature;
  } catch (error) { console.error("Signature verification error:", error); return false; }
}

async function grantCourseAccess(supabase: any, userId: string, planType: string): Promise<void> {
  const limits = PLAN_ACCESS_LIMITS[planType] || PLAN_ACCESS_LIMITS["free"];
  await supabase.from("course_access").delete().eq("user_id", userId);
  const accessRecords = [];
  for (let section = limits.start; section <= limits.end; section++) {
    accessRecords.push({ user_id: userId, course_section: section, has_access: true, granted_at: new Date().toISOString() });
  }
  if (accessRecords.length > 0) {
    const { error } = await supabase.from("course_access").insert(accessRecords);
    if (error) { console.error("Error granting course access:", error); throw error; }
  }
  console.log(`Granted access to sections ${limits.start}-${limits.end} for user ${userId}`);
}

async function logWebhookEvent(supabase: any, eventType: string, payload: any, status: string, errorMessage?: string): Promise<void> {
  try { await supabase.from("webhook_logs").insert({ event_type: eventType, payload, status, error_message: errorMessage, processed_at: new Date().toISOString() }); } catch (error) { console.error("Failed to log webhook event:", error); }
}

async function updateUserProfile(supabase: any, userId: string, updates: { subscription_tier?: string; subscription_status?: SubscriptionStatus; whop_membership_id?: string }): Promise<void> {
  const { error } = await supabase.from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) { console.error("Error updating profile:", error); throw error; }
}

async function findUserByEmail(supabase: any, email: string): Promise<any | null> {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error("Error listing users:", error); return null; }
  return authUsers.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function findUserByMembershipId(supabase: any, membershipId: string): Promise<string | null> {
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("whop_membership_id", membershipId).single();
  return profile?.user_id || null;
}

async function sendUserNotification(supabase: any, userId: string, title: string, message: string, type: string = "payment"): Promise<void> {
  try { await supabase.from("notifications").insert({ user_id: userId, title, message, type }); } catch (error) { console.error("Error sending notification:", error); }
}

async function logActivity(supabase: any, email: string | undefined, action: string, details: any): Promise<void> {
  try { await supabase.from("activity_log").insert({ user_email: email?.toLowerCase() || "unknown", action, action_type: "payment", details }); } catch (error) { console.error("Error logging activity:", error); }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const whopWebhookSecret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("whop-signature");

    if (whopWebhookSecret) {
      const isValid = await verifyWhopSignature(rawBody, signature, whopWebhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const payload: WhopWebhookPayload = JSON.parse(rawBody);
    console.log("Received Whop webhook:", JSON.stringify(payload, null, 2));

    const { action, data } = payload;
    const email = data.email || data.user?.email;
    const membershipId = data.id || data.membership_id;
    const planId = data.plan?.id;
    const planType = planId ? (WHOP_PLAN_MAPPING[planId] || "paid") : "paid";

    await logWebhookEvent(supabase, action, payload, "received");
    await logActivity(supabase, email, `Whop webhook: ${action}`, { action, planId, planType, membershipId, status: data.status, timestamp: new Date().toISOString() });

    switch (action) {
      case "membership.went_valid":
      case "membership_activated": {
        if (!email) {
          await logWebhookEvent(supabase, action, payload, "error", "No email in payload");
          return new Response(JSON.stringify({ error: "No email provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const user = await findUserByEmail(supabase, email);
        if (!user) {
          await supabase.from("pending_upgrades").upsert({ email: email.toLowerCase(), plan: planType, whop_membership_id: membershipId }, { onConflict: "email" });
          await logWebhookEvent(supabase, action, payload, "pending", "User not found, stored for later");
          return new Response(JSON.stringify({ message: "User not found, pending upgrade stored" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await updateUserProfile(supabase, user.id, { subscription_tier: planType, subscription_status: "active", whop_membership_id: membershipId });
        await grantCourseAccess(supabase, user.id, planType);
        await sendUserNotification(supabase, user.id, "Sub 20 Mastery Activated! 🎉", "Your Sub 20 Mastery course is now active! All lessons are unlocked.");
        await logWebhookEvent(supabase, action, payload, "success");

        // Send payment confirmation email
        try {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey && email) {
            const userName = user.full_name || email.split('@')[0];
            const engagementUrl = `${supabaseUrl}/functions/v1/send-engagement-email`;
            await fetch(engagementUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
              body: JSON.stringify({ type: 'payment_confirmed', email, name: userName, data: { planName: 'Sub 20 Mastery', price: '$24.99' } }),
            });
          }
        } catch (emailErr) { console.error("Failed to send payment confirmation email:", emailErr); }

        return new Response(JSON.stringify({ success: true, message: `User upgraded to ${planType}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "membership.went_invalid":
      case "membership.canceled":
      case "membership_deactivated": {
        let userId: string | null = null;
        if (membershipId) userId = await findUserByMembershipId(supabase, membershipId);
        if (!userId && email) { const user = await findUserByEmail(supabase, email); if (user) userId = user.id; }
        if (!userId) {
          await logWebhookEvent(supabase, action, payload, "error", "User not found");
          return new Response(JSON.stringify({ error: "User not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await updateUserProfile(supabase, userId, { subscription_tier: "free", subscription_status: action === "membership.canceled" ? "cancelled" : "inactive" });
        await grantCourseAccess(supabase, userId, "free");
        await sendUserNotification(supabase, userId, "Subscription Ended", "Your subscription has ended. Upgrade again to access the full Sub 20 Mastery course.", "payment");
        await logWebhookEvent(supabase, action, payload, "success");
        return new Response(JSON.stringify({ success: true, message: "Subscription deactivated" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "membership.renewed":
      case "payment_succeeded": {
        let userId: string | null = null;
        if (membershipId) userId = await findUserByMembershipId(supabase, membershipId);
        if (!userId && email) { const user = await findUserByEmail(supabase, email); if (user) userId = user.id; }
        if (userId) {
          await updateUserProfile(supabase, userId, { subscription_status: "active" });
          await sendUserNotification(supabase, userId, "Payment Successful ✓", `Your payment has been processed successfully.`, "payment");
        }
        await logWebhookEvent(supabase, action, payload, "success");
        return new Response(JSON.stringify({ success: true, message: "Payment recorded" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "payment_failed": {
        let userId: string | null = null;
        if (membershipId) userId = await findUserByMembershipId(supabase, membershipId);
        if (!userId && email) { const user = await findUserByEmail(supabase, email); if (user) userId = user.id; }
        if (userId) {
          await updateUserProfile(supabase, userId, { subscription_status: "payment_failed" });
          await sendUserNotification(supabase, userId, "Payment Failed ⚠️", `Your payment could not be processed. Reason: ${data.failure_reason || 'Unknown'}.`, "payment");
        }
        await logWebhookEvent(supabase, action, payload, "success", `Payment failed: ${data.failure_reason}`);
        return new Response(JSON.stringify({ success: true, message: "Payment failure recorded" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "payment_pending": {
        let userId: string | null = null;
        if (membershipId) userId = await findUserByMembershipId(supabase, membershipId);
        if (!userId && email) { const user = await findUserByEmail(supabase, email); if (user) userId = user.id; }
        if (userId) {
          await updateUserProfile(supabase, userId, { subscription_status: "payment_pending" });
          await sendUserNotification(supabase, userId, "Payment Processing", "Your payment is being processed.", "payment");
        }
        await logWebhookEvent(supabase, action, payload, "success");
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "refund_created": {
        let userId: string | null = null;
        if (membershipId) userId = await findUserByMembershipId(supabase, membershipId);
        if (!userId && email) { const user = await findUserByEmail(supabase, email); if (user) userId = user.id; }
        if (userId) {
          await updateUserProfile(supabase, userId, { subscription_tier: "free", subscription_status: "inactive" });
          await grantCourseAccess(supabase, userId, "free");
          await sendUserNotification(supabase, userId, "Refund Processed", `A refund has been processed. Your access has been updated to the free plan.`, "payment");
        }
        await logWebhookEvent(supabase, action, payload, "success");
        return new Response(JSON.stringify({ success: true, message: "Refund processed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "membership.cancel_at_period_end_changed":
      case "membership_cancel_at_period_end_changed": {
        let userId: string | null = null;
        if (membershipId) userId = await findUserByMembershipId(supabase, membershipId);
        if (!userId && email) { const user = await findUserByEmail(supabase, email); if (user) userId = user.id; }
        if (userId) {
          if (data.cancel_at_period_end) {
            await updateUserProfile(supabase, userId, { subscription_status: "cancelled" });
            const periodEnd = data.current_period_end ? new Date(data.current_period_end).toLocaleDateString() : "the end of your billing period";
            await sendUserNotification(supabase, userId, "Cancellation Scheduled", `Your subscription will end on ${periodEnd}.`, "payment");
          } else {
            await updateUserProfile(supabase, userId, { subscription_status: "active" });
            await sendUserNotification(supabase, userId, "Subscription Reactivated! 🎉", "Your subscription cancellation has been reversed.", "payment");
          }
        }
        await logWebhookEvent(supabase, action, payload, "success");
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default: {
        await logWebhookEvent(supabase, action, payload, "ignored", "Unknown action type");
        return new Response(JSON.stringify({ message: "Webhook received but action not handled" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    try { await logWebhookEvent(supabase, "error", { error: error.message }, "error", error.message); } catch {}
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
