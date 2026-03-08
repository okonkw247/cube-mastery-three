import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:hello@cube-mastery.site",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestBody = await req.json();

    // Return VAPID public key for client subscription
    if (requestBody.action === "get_vapid_key") {
      return new Response(JSON.stringify({ vapid_public_key: VAPID_PUBLIC_KEY }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { user_id, user_ids, title, body, url, tag } = requestBody;
    const targetIds: string[] = user_ids || (user_id ? [user_id] : []);

    if (targetIds.length === 0 || !title) {
      return new Response(JSON.stringify({ error: "user_id(s) and title required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let totalSent = 0;
    let totalFailed = 0;
    const expiredEndpoints: string[] = [];

    const payload = JSON.stringify({
      title,
      body: body || "",
      icon: "/pwa-icon-512.png",
      badge: "/pwa-icon-512.png",
      tag: tag || `notif-${Date.now()}`,
      data: { url: url || "/dashboard" },
    });

    // Process in batches of 50
    for (let i = 0; i < targetIds.length; i += 50) {
      const batch = targetIds.slice(i, i + 50);

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", batch);

      if (!subscriptions || subscriptions.length === 0) continue;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 86400, urgency: "normal" }
          );
          totalSent++;
        } catch (err: any) {
          totalFailed++;
          // 410 Gone or 404 = expired subscription
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint);
          }
          console.log(`Push failed for ${sub.endpoint}: ${err.statusCode || err.message}`);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, failed: totalFailed }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
