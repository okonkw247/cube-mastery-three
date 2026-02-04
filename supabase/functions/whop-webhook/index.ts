import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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

// Log webhook event
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
  } catch (error) {
    console.error("Failed to log webhook event:", error);
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

    // Log the incoming webhook
    await logWebhookEvent(supabase, action, payload, "received");

    // Determine subscription tier from Whop plan ID
    const planType = planId ? (WHOP_PLAN_MAPPING[planId] || "pro") : "pro";

    // Log activity
    await supabase.from("activity_log").insert({
      user_email: email?.toLowerCase() || "unknown",
      action: `Whop webhook: ${action}`,
      action_type: "payment",
      details: {
        action,
        planId,
        planType,
        membershipId,
        status: data.status,
      },
    });

    // Handle different webhook events
    if (action === "membership.went_valid" || action === "membership.renewed") {
      if (!email) {
        await logWebhookEvent(supabase, action, payload, "error", "No email in payload");
        return new Response(
          JSON.stringify({ error: "No email provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email using auth admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error("Error listing users:", authError);
        await logWebhookEvent(supabase, action, payload, "error", authError.message);
        return new Response(
          JSON.stringify({ error: "Failed to find user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = authUsers.users.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );

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

      // Update user's subscription in profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_tier: planType,
          subscription_status: "active",
          whop_membership_id: membershipId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        await logWebhookEvent(supabase, action, payload, "error", updateError.message);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Grant course access based on plan
      try {
        await grantCourseAccess(supabase, user.id, planType);
      } catch (accessError: any) {
        console.error("Error granting course access:", accessError);
        await logWebhookEvent(supabase, action, payload, "partial", `Access grant failed: ${accessError.message}`);
      }

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Subscription Activated",
        message: `Your ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan is now active! Enjoy all premium content.`,
        type: "payment",
      });

      await logWebhookEvent(supabase, action, payload, "success");
      console.log(`Successfully upgraded user ${email} to ${planType}`);

      return new Response(
        JSON.stringify({ success: true, message: `User upgraded to ${planType}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "membership.went_invalid" || action === "membership.canceled") {
      // Subscription ended - downgrade to free
      let userId: string | null = null;

      // Try to find user by membership ID first
      if (membershipId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("whop_membership_id", membershipId)
          .single();

        if (profile) {
          userId = profile.user_id;
        }
      }

      // If not found by membership ID, try by email
      if (!userId && email) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const user = authUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
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
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_status: action === "membership.canceled" ? "cancelled" : "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error downgrading profile:", updateError);
        await logWebhookEvent(supabase, action, payload, "error", updateError.message);
      }

      // Update course access to free tier only
      try {
        await grantCourseAccess(supabase, userId, "free");
      } catch (accessError: any) {
        console.error("Error updating course access:", accessError);
      }

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Subscription Ended",
        message: "Your subscription has ended. Upgrade again to access premium content.",
        type: "payment",
      });

      await logWebhookEvent(supabase, action, payload, "success");
      console.log(`Downgraded user to free tier`);

      return new Response(
        JSON.stringify({ success: true, message: "Subscription status updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action - just acknowledge
    await logWebhookEvent(supabase, action, payload, "ignored", "Unknown action type");

    return new Response(
      JSON.stringify({ message: "Webhook received" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

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
