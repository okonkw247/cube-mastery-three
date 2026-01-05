import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, whop-signature",
};

interface WhopWebhookPayload {
  action: string;
  data: {
    id: string;
    email: string;
    user_id?: string;
    status: string;
    product: {
      id: string;
      name: string;
    };
    plan: {
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
    const whopApiKey = Deno.env.get("WHOP_API_KEY");

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WhopWebhookPayload = await req.json();
    console.log("Received Whop webhook:", JSON.stringify(payload, null, 2));

    const { action, data } = payload;

    // Handle different webhook events
    if (action === "membership.went_valid" || action === "membership.renewed") {
      // User has paid - upgrade to Pro
      const email = data.email;

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

      const user = authUser.users.find(u => u.email === email);

      if (!user) {
        console.log(`User with email ${email} not found, storing for later activation`);
        // Could store this in a pending_upgrades table for when user signs up
        return new Response(
          JSON.stringify({ message: "User not found, webhook logged" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user's subscription tier to pro
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ subscription_tier: "pro" })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully upgraded user ${email} to Pro`);
      return new Response(
        JSON.stringify({ success: true, message: "User upgraded to Pro" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "membership.went_invalid" || action === "membership.canceled") {
      // Subscription ended - downgrade to free
      const email = data.email;

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

      const user = authUser.users.find(u => u.email === email);

      if (user) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ subscription_tier: "free" })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error downgrading profile:", updateError);
        }

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