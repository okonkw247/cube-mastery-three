import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, whop-signature",
};

// Whop Plan ID to Plan Type mapping
const WHOP_PLAN_MAPPING: Record<string, string> = {
  "plan_7NRvNAxpWhOse": "starter",
  "plan_aeLinh43MkIpm": "pro",
  // Add enterprise plan ID when available
};

// Plan access limits (section numbers)
const PLAN_ACCESS_LIMITS: Record<string, { start: number; end: number }> = {
  "free": { start: 1, end: 3 },
  "starter": { start: 1, end: 15 },
  "pro": { start: 1, end: 50 },
  "enterprise": { start: 1, end: 50 },
};

// Valid subscription statuses
type SubscriptionStatus = 'active' | 'inactive' | 'payment_pending' | 'payment_failed' | 'cancelled';

interface WhopWebhookPayload {
  action: string;
  data: {
    id: string;
    email?: string;
    user?: {
      email?: string;
      id?: string;
    };
    user_id?: string;
    status?: string;
    product?: {
      id: string;
      name: string;
    };
    plan?: {
      id: string;
      plan_type?: string;
    };
    membership_id?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: string;
    amount?: number;
    currency?: string;
    failure_reason?: string;
    refund_amount?: number;
  };
}

// Verify Whop webhook signature
async function verifyWhopSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.warn("Missing signature or secret, skipping verification");
    return true; // Allow in development, but log warning
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Grant course access based on plan type
async function grantCourseAccess(
  supabase: any,
  userId: string,
  planType: string
): Promise<void> {
  const limits = PLAN_ACCESS_LIMITS[planType] || PLAN_ACCESS_LIMITS["free"];
  
  // First, remove all existing access for this user
  await supabase
    .from("course_access")
    .delete()
    .eq("user_id", userId);
  
  // Grant access to sections based on plan
  const accessRecords = [];
  for (let section = limits.start; section <= limits.end; section++) {
    accessRecords.push({
      user_id: userId,
      course_section: section,
      has_access: true,
      granted_at: new Date().toISOString(),
    });
  }
  
  if (accessRecords.length > 0) {
    const { error } = await supabase
      .from("course_access")
      .insert(accessRecords);
    
    if (error) {
      console.error("Error granting course access:", error);
      throw error;
    }
  }
  
  console.log(`Granted access to sections ${limits.start}-${limits.end} for user ${userId}`);
}

// Log webhook event with detailed info
async function logWebhookEvent(
  supabase: any,
  eventType: string,
  payload: any,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from("webhook_logs").insert({
      event_type: eventType,
      payload: payload,
      status: status,
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    });
    console.log(`Logged webhook event: ${eventType} - ${status}`);
  } catch (error) {
    console.error("Failed to log webhook event:", error);
  }
}

// Update user profile with subscription info
async function updateUserProfile(
  supabase: any,
  userId: string,
  updates: {
    subscription_tier?: string;
    subscription_status?: SubscriptionStatus;
    whop_membership_id?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Find user by email
async function findUserByEmail(supabase: any, email: string): Promise<any | null> {
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error listing users:", authError);
    return null;
  }
  
  return authUsers.users.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
  ) || null;
}

// Find user by membership ID
async function findUserByMembershipId(supabase: any, membershipId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("whop_membership_id", membershipId)
    .single();

  return profile?.user_id || null;
}

// Send notification to user
async function sendUserNotification(
  supabase: any,
  userId: string,
  title: string,
  message: string,
  type: string = "payment"
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: title,
      message: message,
      type: type,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Log activity
async function logActivity(
  supabase: any,
  email: string | undefined,
  action: string,
  details: any
): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      user_email: email?.toLowerCase() || "unknown",
      action: action,
      action_type: "payment",
      details: details,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const whopWebhookSecret = Deno.env.get("WHOP_WEBHOOK_SECRET");

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("whop-signature");
    
    // Verify webhook signature
    if (whopWebhookSecret) {
      const isValid = await verifyWhopSignature(rawBody, signature, whopWebhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: WhopWebhookPayload = JSON.parse(rawBody);
    console.log("Received Whop webhook:", JSON.stringify(payload, null, 2));

    const { action, data } = payload;
    const email = data.email || data.user?.email;
    const membershipId = data.id || data.membership_id;
    const planId = data.plan?.id;
    const planType = planId ? (WHOP_PLAN_MAPPING[planId] || "pro") : "pro";

    // Log the incoming webhook immediately
    await logWebhookEvent(supabase, action, payload, "received");

    // Log activity for all events
    await logActivity(supabase, email, `Whop webhook: ${action}`, {
      action,
      planId,
      planType,
      membershipId,
      status: data.status,
      timestamp: new Date().toISOString(),
    });

    // Handle different webhook events
    switch (action) {
      // ============ MEMBERSHIP ACTIVATED ============
      case "membership.went_valid":
      case "membership_activated": {
        if (!email) {
          await logWebhookEvent(supabase, action, payload, "error", "No email in payload");
          return new Response(
            JSON.stringify({ error: "No email provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const user = await findUserByEmail(supabase, email);

        if (!user) {
          console.log(`User with email ${email} not found, storing for later activation`);

          // Store in pending_upgrades for when user signs up
          await supabase.from("pending_upgrades").upsert(
            {
              email: email.toLowerCase(),
              plan: planType,
              whop_membership_id: membershipId,
            },
            { onConflict: "email" }
          );

          await logWebhookEvent(supabase, action, payload, "pending", "User not found, stored for later");

          return new Response(
            JSON.stringify({ message: "User not found, pending upgrade stored" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update user's subscription
        await updateUserProfile(supabase, user.id, {
          subscription_tier: planType,
          subscription_status: "active",
          whop_membership_id: membershipId,
        });

        // Grant course access based on plan
        await grantCourseAccess(supabase, user.id, planType);

        // Send notification
        await sendUserNotification(
          supabase,
          user.id,
          "Subscription Activated! 🎉",
          `Your ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan is now active! Enjoy all premium content.`
        );

        await logWebhookEvent(supabase, action, payload, "success");
        // Send payment confirmation email via Resend
        try {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey && email) {
            const resend = new Resend(resendApiKey);
            const planLabel = planType === 'starter' ? 'Starter Plan' : 'Pro Plan';
            const price = planType === 'starter' ? '$15' : '$40';
            const userName = user.full_name || email.split('@')[0];

            // Fetch the engagement email function for consistency
            const engagementUrl = `${supabaseUrl}/functions/v1/send-engagement-email`;
            await fetch(engagementUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
              body: JSON.stringify({
                type: 'payment_confirmed',
                email,
                name: userName,
                data: { planName: planLabel, price },
              }),
            });
            console.log(`Payment confirmation email sent to ${email}`);
          }
        } catch (emailErr) {
          console.error("Failed to send payment confirmation email:", emailErr);
        }

        console.log(`Successfully activated ${planType} for user ${email}`);

        return new Response(
          JSON.stringify({ success: true, message: `User upgraded to ${planType}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ MEMBERSHIP DEACTIVATED ============
      case "membership.went_invalid":
      case "membership.canceled":
      case "membership_deactivated": {
        let userId: string | null = null;

        // Try to find user by membership ID first
        if (membershipId) {
          userId = await findUserByMembershipId(supabase, membershipId);
        }

        // If not found by membership ID, try by email
        if (!userId && email) {
          const user = await findUserByEmail(supabase, email);
          if (user) {
            userId = user.id;
          }
        }

        if (!userId) {
          await logWebhookEvent(supabase, action, payload, "error", "User not found");
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile to free tier
        await updateUserProfile(supabase, userId, {
          subscription_tier: "free",
          subscription_status: action === "membership.canceled" ? "cancelled" : "inactive",
        });

        // Update course access to free tier only
        await grantCourseAccess(supabase, userId, "free");

        // Send notification
        await sendUserNotification(
          supabase,
          userId,
          "Subscription Ended",
          "Your subscription has ended. Upgrade again to access premium content.",
          "payment"
        );

        await logWebhookEvent(supabase, action, payload, "success");
        console.log(`Deactivated subscription for user, reverted to free tier`);

        return new Response(
          JSON.stringify({ success: true, message: "Subscription deactivated, reverted to free" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ PAYMENT SUCCEEDED (Renewal) ============
      case "membership.renewed":
      case "payment_succeeded": {
        let userId: string | null = null;

        if (membershipId) {
          userId = await findUserByMembershipId(supabase, membershipId);
        }
        if (!userId && email) {
          const user = await findUserByEmail(supabase, email);
          if (user) userId = user.id;
        }

        if (userId) {
          // Keep subscription active
          await updateUserProfile(supabase, userId, {
            subscription_status: "active",
          });

          // Send renewal notification
          await sendUserNotification(
            supabase,
            userId,
            "Payment Successful ✓",
            `Your subscription has been renewed successfully. Amount: ${data.currency?.toUpperCase() || 'USD'} ${data.amount || 'N/A'}`,
            "payment"
          );
        }

        await logWebhookEvent(supabase, action, payload, "success");
        console.log(`Payment succeeded for membership ${membershipId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Payment recorded" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ PAYMENT FAILED ============
      case "payment_failed": {
        let userId: string | null = null;

        if (membershipId) {
          userId = await findUserByMembershipId(supabase, membershipId);
        }
        if (!userId && email) {
          const user = await findUserByEmail(supabase, email);
          if (user) userId = user.id;
        }

        if (userId) {
          // Update status to payment_failed
          await updateUserProfile(supabase, userId, {
            subscription_status: "payment_failed",
          });

          // Send failure notification
          await sendUserNotification(
            supabase,
            userId,
            "Payment Failed ⚠️",
            `Your payment could not be processed. Reason: ${data.failure_reason || 'Unknown'}. Please update your payment method to maintain access.`,
            "payment"
          );
        }

        await logWebhookEvent(supabase, action, payload, "success", `Payment failed: ${data.failure_reason}`);
        console.log(`Payment failed for membership ${membershipId}: ${data.failure_reason}`);

        return new Response(
          JSON.stringify({ success: true, message: "Payment failure recorded" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ PAYMENT PENDING ============
      case "payment_pending": {
        let userId: string | null = null;

        if (membershipId) {
          userId = await findUserByMembershipId(supabase, membershipId);
        }
        if (!userId && email) {
          const user = await findUserByEmail(supabase, email);
          if (user) userId = user.id;
        }

        if (userId) {
          // Update status to payment_pending
          await updateUserProfile(supabase, userId, {
            subscription_status: "payment_pending",
          });

          // Send pending notification
          await sendUserNotification(
            supabase,
            userId,
            "Payment Processing",
            "Your payment is being processed. This usually takes a few minutes.",
            "payment"
          );
        }

        await logWebhookEvent(supabase, action, payload, "success");
        console.log(`Payment pending for membership ${membershipId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Payment pending status recorded" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ REFUND CREATED ============
      case "refund_created": {
        let userId: string | null = null;

        if (membershipId) {
          userId = await findUserByMembershipId(supabase, membershipId);
        }
        if (!userId && email) {
          const user = await findUserByEmail(supabase, email);
          if (user) userId = user.id;
        }

        if (userId) {
          // Immediately revoke access
          await updateUserProfile(supabase, userId, {
            subscription_tier: "free",
            subscription_status: "inactive",
          });

          // Set to free tier access only
          await grantCourseAccess(supabase, userId, "free");

          // Send refund notification
          await sendUserNotification(
            supabase,
            userId,
            "Refund Processed",
            `A refund of ${data.currency?.toUpperCase() || 'USD'} ${data.refund_amount || data.amount || 'N/A'} has been processed. Your access has been updated to the free plan.`,
            "payment"
          );
        }

        await logWebhookEvent(supabase, action, payload, "success");
        console.log(`Refund created for membership ${membershipId}, access revoked`);

        return new Response(
          JSON.stringify({ success: true, message: "Refund processed, access revoked" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ CANCELLATION SCHEDULED ============
      case "membership.cancel_at_period_end_changed":
      case "membership_cancel_at_period_end_changed": {
        let userId: string | null = null;

        if (membershipId) {
          userId = await findUserByMembershipId(supabase, membershipId);
        }
        if (!userId && email) {
          const user = await findUserByEmail(supabase, email);
          if (user) userId = user.id;
        }

        if (userId) {
          // Log cancellation but keep access until period ends
          if (data.cancel_at_period_end) {
            // User scheduled cancellation
            await updateUserProfile(supabase, userId, {
              subscription_status: "cancelled",
            });

            const periodEnd = data.current_period_end 
              ? new Date(data.current_period_end).toLocaleDateString()
              : "the end of your billing period";

            await sendUserNotification(
              supabase,
              userId,
              "Cancellation Scheduled",
              `Your subscription will end on ${periodEnd}. You'll retain access until then.`,
              "payment"
            );
          } else {
            // User reactivated (cancelled the cancellation)
            await updateUserProfile(supabase, userId, {
              subscription_status: "active",
            });

            await sendUserNotification(
              supabase,
              userId,
              "Subscription Reactivated! 🎉",
              "Great news! Your subscription cancellation has been reversed. You'll continue to have full access.",
              "payment"
            );
          }
        }

        await logWebhookEvent(supabase, action, payload, "success", 
          data.cancel_at_period_end ? "Cancellation scheduled" : "Cancellation reversed");
        console.log(`Cancel at period end changed for ${membershipId}: ${data.cancel_at_period_end}`);

        return new Response(
          JSON.stringify({ success: true, message: "Cancellation status updated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ UNKNOWN EVENT ============
      default: {
        await logWebhookEvent(supabase, action, payload, "ignored", "Unknown action type");
        console.log(`Unknown webhook action: ${action}`);

        return new Response(
          JSON.stringify({ message: "Webhook received but action not handled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    
    try {
      await logWebhookEvent(supabase, "error", { error: error.message }, "error", error.message);
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
