import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, whop-signature",
};

// Whop Plan IDs
const WHOP_PLANS = {
  "plan_7NRvNAxpWhOse": "starter",
  "plan_aeLinh43MkIpm": "pro",
};

interface WhopWebhookPayload {
  action: string;
  data: {
    id: string;
    email: string;
    user_id?: string;
    status: string;
    product?: {
      id: string;
      name: string;
    };
    plan?: {
      id: string;
      plan_type: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WhopWebhookPayload = await req.json();
    console.log("Received Whop webhook:", JSON.stringify(payload, null, 2));

    const { action, data } = payload;
    const email = data.email;
    const planId = data.plan?.id;

    // Determine subscription tier from Whop plan ID
    const subscriptionTier = planId ? (WHOP_PLANS[planId as keyof typeof WHOP_PLANS] || "pro") : "pro";

    // Log this payment activity
    await supabase.from("activity_log").insert({
      user_email: email?.toLowerCase() || "unknown",
      action: `Whop webhook: ${action}`,
      action_type: "payment",
      details: { 
        action,
        planId,
        subscriptionTier,
        membershipId: data.id,
        status: data.status
      }
    });

    // Handle different webhook events
    if (action === "membership.went_valid" || action === "membership.renewed") {
      if (!email) {
        console.error("No email in webhook payload");
        return new Response(
          JSON.stringify({ error: "No email provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error listing users:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to find user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = authUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        console.log(`User with email ${email} not found, storing for later activation`);
        
        // Store in pending_upgrades for when user signs up
        await supabase.from("pending_upgrades").upsert({
          email: email.toLowerCase(),
          plan: subscriptionTier,
          whop_membership_id: data.id,
        }, { onConflict: "email" });

        return new Response(
          JSON.stringify({ message: "User not found, pending upgrade stored" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user's subscription tier
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ subscription_tier: subscriptionTier })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Subscription Activated",
        message: `Your ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} plan is now active! Enjoy all premium content.`,
        type: "payment",
      });

      console.log(`Successfully upgraded user ${email} to ${subscriptionTier}`);
      return new Response(
        JSON.stringify({ success: true, message: `User upgraded to ${subscriptionTier}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "membership.went_invalid" || action === "membership.canceled") {
      // Subscription ended - downgrade to free
      if (!email) {
        return new Response(
          JSON.stringify({ error: "No email provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error listing users:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to find user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = authUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (user) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ subscription_tier: "free" })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error downgrading profile:", updateError);
        }

        // Send notification to user
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Subscription Ended",
          message: "Your subscription has ended. Upgrade again to access premium content.",
          type: "payment",
        });

        console.log(`Downgraded user ${email} to free tier`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Subscription status updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action - just acknowledge
    return new Response(
      JSON.stringify({ message: "Webhook received" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
