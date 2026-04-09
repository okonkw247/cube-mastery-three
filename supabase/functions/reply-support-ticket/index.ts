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

const SITE_URL = "https://www.cube-mastery.site";
const FROM_EMAIL = "Cube Mastery Support <team@cube-mastery.site>";

const PRIMARY = "#2dd4bf";
const BG_DARK = "#0a0b14";
const CARD_BG = "#151827";
const TEXT_LIGHT = "#e2e8f0";
const TEXT_MUTED = "#94a3b8";

function replyEmail(userName: string, subject: string, reply: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${BG_DARK}; color: ${TEXT_LIGHT}; margin: 0; padding: 40px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: ${CARD_BG}; border-radius: 16px; padding: 32px 24px; }
  .reply-box { background: ${BG_DARK}; border-radius: 10px; padding: 20px; margin: 16px 0; border-left: 3px solid ${PRIMARY}; }
  p { line-height: 1.6; color: ${TEXT_MUTED}; font-size: 14px; }
  h1 { color: ${TEXT_LIGHT}; font-size: 20px; margin: 0 0 16px; }
  .footer { text-align: center; color: ${TEXT_MUTED}; font-size: 11px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e2235; }
</style></head><body>
<div class="container">
  <h1>Re: ${subject}</h1>
  <p>Hi ${userName},</p>
  <p>The Cube Mastery team has replied to your support request:</p>
  <div class="reply-box">
    <p style="color: ${TEXT_LIGHT}; white-space: pre-wrap;">${reply}</p>
  </div>
  <p>If you have more questions, just reply to this email or visit your dashboard.</p>
  <div style="text-align: center; margin-top: 24px;">
    <a href="${SITE_URL}/dashboard" style="display: inline-block; background: ${PRIMARY}; color: ${BG_DARK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Go to Dashboard →</a>
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
    const { ticketId, reply } = await req.json();

    if (!ticketId || !reply) {
      return new Response(JSON.stringify({ error: "ticketId and reply required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", ticket.user_id)
      .single();

    const userName = profile?.full_name || ticket.user_email.split("@")[0];

    // Send reply email
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ticket.user_email],
      subject: `Re: ${ticket.subject}`,
      html: replyEmail(userName, ticket.subject, reply),
    });

    if (emailError) {
      console.error("Failed to send reply email:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Log it
    await supabase.from("email_logs").insert({
      email: ticket.user_email,
      email_type: "support_reply",
      user_id: ticket.user_id,
      details: { ticketId, subject: ticket.subject },
    });

    console.log(`Support reply sent to ${ticket.user_email}`);
    return new Response(JSON.stringify({ success: true }), {
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
