import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Cube Mastery <team@cube-mastery.site>";
const PRIMARY = "#2dd4bf";
const BG_DARK = "#0a0b14";
const CARD_BG = "#151827";
const TEXT_LIGHT = "#e2e8f0";
const TEXT_MUTED = "#94a3b8";

function notificationEmail(title: string, message: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${BG_DARK}; color: ${TEXT_LIGHT}; margin: 0; padding: 40px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: ${CARD_BG}; border-radius: 16px; padding: 32px 24px; }
  p { line-height: 1.6; color: ${TEXT_MUTED}; font-size: 14px; }
  h1 { color: ${TEXT_LIGHT}; font-size: 22px; margin: 0 0 16px; text-align: center; }
  .footer { text-align: center; color: ${TEXT_MUTED}; font-size: 11px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e2235; }
</style></head><body>
<div class="container">
  <h1>${title}</h1>
  <p style="color: ${TEXT_LIGHT}; white-space: pre-wrap;">${message}</p>
  <div style="text-align: center; margin-top: 24px;">
    <a href="https://www.cube-mastery.site/dashboard" style="display: inline-block; background: ${PRIMARY}; color: ${BG_DARK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Dashboard →</a>
  </div>
</div>
<div class="footer"><p>© ${new Date().getFullYear()} Cube Mastery</p></div>
</body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, recipientGroup, channel } = await req.json();

    if (!title || !message) {
      return new Response(JSON.stringify({ error: "title and message required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recipient emails based on group
    let query = supabase.from("profiles").select("user_id");
    if (recipientGroup === "free") {
      query = query.eq("subscription_tier", "free");
    } else if (recipientGroup === "paid") {
      query = query.neq("subscription_tier", "free");
    }

    const { data: profiles } = await query;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients found" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get emails from auth
    const userIds = profiles.map((p) => p.user_id);
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map<string, string>();
    authData?.users?.forEach((u) => {
      if (u.email) emailMap.set(u.id, u.email);
    });

    const recipientEmails = userIds
      .map((id) => emailMap.get(id))
      .filter(Boolean) as string[];

    let sentCount = 0;
    let failedCount = 0;

    // Send emails if channel includes email
    if (channel === "email" || channel === "both") {
      const html = notificationEmail(title, message);

      // Send in batches of 10
      for (let i = 0; i < recipientEmails.length; i += 10) {
        const batch = recipientEmails.slice(i, i + 10);
        const promises = batch.map(async (email) => {
          try {
            const { error } = await resend.emails.send({
              from: FROM_EMAIL,
              to: [email],
              subject: title,
              html,
            });
            if (error) {
              failedCount++;
              console.error(`Failed to email ${email}:`, error);
            } else {
              sentCount++;
            }
          } catch {
            failedCount++;
          }
        });
        await Promise.all(promises);
      }
    }

    console.log(`Admin notification emails: ${sentCount} sent, ${failedCount} failed`);
    return new Response(JSON.stringify({ success: true, sent: sentCount, failed: failedCount }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
