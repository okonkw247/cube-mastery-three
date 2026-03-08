import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

// Web Push requires specific crypto operations.
// We implement the Web Push protocol using Web Crypto API available in Deno.

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const raw = atob(padded);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJWT(audience: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: "mailto:hello@cube-mastery.site",
  };

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  ).catch(async () => {
    // Try as raw key (32 bytes for P-256)
    const jwk = {
      kty: "EC",
      crv: "P-256",
      d: VAPID_PRIVATE_KEY,
      x: VAPID_PUBLIC_KEY.substring(0, 43),
      y: VAPID_PUBLIC_KEY.substring(43),
    };
    return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  });

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      encoder.encode(unsigned)
    )
  );

  // Convert DER to raw r,s format if needed (Web Crypto returns raw for ECDSA)
  const sigB64 = uint8ArrayToBase64Url(signature);
  return `${unsigned}.${sigB64}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    const jwt = await createJWT(audience);
    
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        TTL: "86400",
        Urgency: "normal",
      },
      body: payload,
    });

    if (response.status === 201 || response.status === 200) {
      return true;
    }
    
    console.log(`Push failed with status ${response.status}: ${await response.text()}`);
    
    // 410 Gone = subscription expired, should be removed
    if (response.status === 410 || response.status === 404) {
      return false; // Signal to remove subscription
    }
    
    return false;
  } catch (err) {
    console.error("Push send error:", err);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Can be called with either:
    // { user_id, title, body, url? } - send to one user
    // { user_ids, title, body, url? } - send to multiple users
    // { action: "get_vapid_key" } - return the public VAPID key
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

    // Process in batches of 50
    for (let i = 0; i < targetIds.length; i += 50) {
      const batch = targetIds.slice(i, i + 50);
      
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", batch);

      if (!subscriptions || subscriptions.length === 0) continue;

      const payload = JSON.stringify({
        title,
        body: body || "",
        icon: "/pwa-icon-512.png",
        badge: "/pwa-icon-512.png",
        tag: tag || `notif-${Date.now()}`,
        data: { url: url || "/dashboard" },
      });

      for (const sub of subscriptions) {
        const success = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        );

        if (success) {
          totalSent++;
        } else {
          totalFailed++;
          // Mark expired subscriptions for cleanup
          expiredEndpoints.push(sub.endpoint);
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
