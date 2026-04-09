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
const FROM_EMAIL = "Cube Mastery <team@cube-mastery.site>";

const PRIMARY = "#2dd4bf";
const BG_DARK = "#0a0b14";
const CARD_BG = "#151827";
const TEXT_LIGHT = "#e2e8f0";
const TEXT_MUTED = "#94a3b8";

function wrap(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${BG_DARK}; color: ${TEXT_LIGHT}; margin: 0; padding: 40px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: ${CARD_BG}; border-radius: 16px; padding: 32px 24px; }
  .btn { display: inline-block; background: ${PRIMARY}; color: ${BG_DARK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .cta { text-align: center; margin: 28px 0; }
  .stat { background: ${BG_DARK}; border-radius: 10px; padding: 16px; margin: 12px 0; text-align: center; }
  .stat .value { font-size: 28px; font-weight: 700; color: ${PRIMARY}; }
  .stat .label { font-size: 12px; color: ${TEXT_MUTED}; }
  p { line-height: 1.6; color: ${TEXT_MUTED}; font-size: 14px; }
  h1 { color: ${TEXT_LIGHT}; font-size: 22px; text-align: center; margin: 0 0 8px; }
  .footer { text-align: center; color: ${TEXT_MUTED}; font-size: 11px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e2235; }
</style></head><body>
<div class="container">${content}</div>
<div class="footer"><p>© ${new Date().getFullYear()} Cube Mastery</p></div>
</body></html>`;
}

function firstLessonEmail(name: string) {
  return wrap(`
    <h1>Congrats on your first lesson, ${name}! 🎉</h1>
    <p>You just completed your first lesson — that's the hardest step! Keep the momentum going.</p>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Continue Learning →</a></div>
  `);
}

function milestoneEmail(name: string, completed: number) {
  return wrap(`
    <h1>You're on fire, ${name}! 🔥</h1>
    <div class="stat">
      <div class="value">${completed}</div>
      <div class="label">Lessons Completed</div>
    </div>
    <p>You've completed ${completed} lessons so far. Keep going — consistency is the key to sub 20!</p>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Watch Next Lesson →</a></div>
  `);
}

function salesEmail(name: string) {
  return wrap(`
    <h1>Ready for the next level, ${name}? 🚀</h1>
    <p>You've completed all your free lessons — amazing progress! But there's so much more to learn.</p>
    <p style="color:${TEXT_LIGHT}; font-weight: 600;">Unlock Sub 20 Mastery and get:</p>
    <ul style="color:${TEXT_MUTED}; font-size: 14px; line-height: 2;">
      <li>✅ 20+ HD video lessons covering every technique</li>
      <li>✅ Advanced algorithm library with finger tricks</li>
      <li>✅ Speed-optimized practice routines</li>
      <li>✅ Cross, F2L, OLL, PLL deep dives</li>
      <li>✅ Private Discord community of cubers</li>
      <li>✅ Progress tracking & practice tools</li>
      <li>✅ Lifetime access — pay once, learn forever</li>
    </ul>
    <div class="stat">
      <div class="label">EARLY BIRD PRICE</div>
      <div class="value">$19.99</div>
      <div class="label">Use code EARLYBIRD (normally $24.99)</div>
    </div>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Upgrade Now →</a></div>
    <p style="text-align:center; font-size: 12px;">One-time payment · No subscription · Instant access</p>
  `);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, name, data } = await req.json();

    if (!email || !type) {
      return new Response(JSON.stringify({ error: "email and type required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const displayName = name || email.split("@")[0];
    let subject = "";
    let html = "";

    switch (type) {
      case "first_lesson":
        subject = "You completed your first lesson! 🎉";
        html = firstLessonEmail(displayName);
        break;
      case "milestone":
        subject = `${data?.completed || 5} lessons done — keep it up! 🔥`;
        html = milestoneEmail(displayName, data?.completed || 5);
        break;
      case "free_upsell":
        subject = "You've finished your free lessons — unlock the full course 🚀";
        html = salesEmail(displayName);
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html,
    });

    if (emailError) {
      console.error(`Failed to send ${type} email:`, emailError);
      return new Response(JSON.stringify({ error: "Failed to send" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Log it
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from("email_logs").insert({
      email, email_type: `progress_${type}`, details: data || {},
    });

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
