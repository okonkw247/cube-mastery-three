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
const FROM_EMAIL = "Cube Mastery <hello@cube-mastery.site>";

// Brand colors
const PRIMARY = "#2dd4bf";
const BG_DARK = "#0a0b14";
const CARD_BG = "#151827";
const TEXT_LIGHT = "#e2e8f0";
const TEXT_MUTED = "#94a3b8";

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${BG_DARK}; color: ${TEXT_LIGHT}; margin: 0; padding: 40px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: ${CARD_BG}; border-radius: 16px; padding: 32px 24px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { font-size: 22px; margin: 0 0 8px; color: ${TEXT_LIGHT}; }
  .header p { color: ${TEXT_MUTED}; margin: 0; font-size: 14px; }
  .btn { display: inline-block; background: ${PRIMARY}; color: ${BG_DARK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .cta { text-align: center; margin: 28px 0; }
  .stat { background: ${BG_DARK}; border-radius: 10px; padding: 16px; margin: 12px 0; text-align: center; }
  .stat .value { font-size: 28px; font-weight: 700; color: ${PRIMARY}; }
  .stat .label { font-size: 12px; color: ${TEXT_MUTED}; }
  .footer { text-align: center; color: ${TEXT_MUTED}; font-size: 11px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e2235; }
  p { line-height: 1.6; color: ${TEXT_MUTED}; font-size: 14px; }
</style></head><body>
<div class="container">${content}</div>
<div class="footer"><p>© ${new Date().getFullYear()} Cube Mastery. All rights reserved.</p></div>
</body></html>`;
}

// ═══════════════════════════════════
// EMAIL TYPE 1: WELCOME
// ═══════════════════════════════════
function welcomeEmail(name: string, plan: string) {
  const planLabel = plan === 'free' ? 'Free Plan' : plan === 'starter' ? 'Starter Plan' : 'Pro Plan';
  const accessDesc = plan === 'free' 
    ? '3 free beginner lessons, basic algorithm reference, and limited practice tips'
    : plan === 'starter' 
    ? '15 video lessons, algorithm library, practice routines, and community access'
    : 'All lessons, advanced algorithms, priority support, and full community access';

  return emailWrapper(`
    <div class="header">
      <h1>Welcome, ${name}! 🎉</h1>
      <p>Your Rubik's journey starts now</p>
    </div>
    <p>We're thrilled to have you on board. You're currently on the <strong style="color:${PRIMARY}">${planLabel}</strong>.</p>
    <p>Here's what you have access to:</p>
    <div class="stat">
      <div class="label">YOUR PLAN</div>
      <div class="value">${planLabel}</div>
      <div class="label" style="margin-top:8px">${accessDesc}</div>
    </div>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Go to Dashboard →</a></div>
    <p>Need help getting started? Check out your first lesson — it only takes a few minutes!</p>
  `);
}

// ═══════════════════════════════════
// EMAIL TYPE 2: WE MISS YOU
// ═══════════════════════════════════
function missYouEmail(name: string, streak: number, progressPct: number) {
  return emailWrapper(`
    <div class="header">
      <h1>We miss you, ${name}! 🧩</h1>
      <p>Come back and keep solving</p>
    </div>
    <p>It's been a few days since we last saw you. Don't let your progress slip away!</p>
    <div style="display:flex;gap:12px">
      <div class="stat" style="flex:1">
        <div class="value">${streak}</div>
        <div class="label">Day Streak</div>
      </div>
      <div class="stat" style="flex:1">
        <div class="value">${progressPct}%</div>
        <div class="label">Overall Progress</div>
      </div>
    </div>
    <p>Jump back in and pick up right where you left off.</p>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Continue Learning →</a></div>
  `);
}

// ═══════════════════════════════════
// EMAIL TYPE 3: HALFWAY THERE
// ═══════════════════════════════════
function halfwayEmail(name: string, progressPct: number) {
  return emailWrapper(`
    <div class="header">
      <h1>You're halfway there, ${name}! ⚡</h1>
      <p>Don't stop now — the best is ahead</p>
    </div>
    <div class="stat">
      <div class="value">${progressPct}%</div>
      <div class="label">Course Progress</div>
    </div>
    <p>You've already mastered so much. Keep pushing and you'll be solving like a pro in no time.</p>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Keep Going →</a></div>
  `);
}

// ═══════════════════════════════════
// EMAIL TYPE 4: COURSE COMPLETE
// ═══════════════════════════════════
function courseCompleteEmail(name: string, planType: string) {
  const isMaxPlan = planType === 'pro' || planType === 'enterprise';
  const upgradeSection = isMaxPlan ? '' : `
    <p>Ready for the next level? Upgrade your plan to unlock advanced techniques and exclusive content.</p>
    <div class="cta"><a href="https://whop.com/cube-mastery/" class="btn">Upgrade Now →</a></div>
  `;
  return emailWrapper(`
    <div class="header">
      <h1>You did it, ${name}! 🏆</h1>
      <p>Course complete — congratulations!</p>
    </div>
    <p>You've completed all available lessons on your current plan. That's an incredible achievement!</p>
    <div class="stat">
      <div class="value">100%</div>
      <div class="label">Course Completed</div>
    </div>
    ${upgradeSection}
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">View Your Dashboard →</a></div>
  `);
}

// ═══════════════════════════════════
// EMAIL TYPE 5: PAYMENT CONFIRMED
// ═══════════════════════════════════
function paymentConfirmedEmail(name: string, planName: string, price: string) {
  const accessDesc = planName.toLowerCase().includes('starter')
    ? '15 video lessons, algorithm library, practice routines, community forum, and weekly progress reports'
    : 'All lessons, advanced algorithms, priority support, full community access, and downloadable resources';

  return emailWrapper(`
    <div class="header">
      <h1>Payment confirmed! 🎉</h1>
      <p>Welcome to ${planName}, ${name}</p>
    </div>
    <div class="stat">
      <div class="label">YOUR PLAN</div>
      <div class="value">${planName}</div>
      <div class="label" style="margin-top:4px">One-time payment: ${price}</div>
    </div>
    <p>You now have access to:</p>
    <p style="color:${TEXT_LIGHT}">${accessDesc}</p>
    <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Go to My Courses →</a></div>
    <p>Thank you for investing in your cubing journey!</p>
  `);
}

// ═══════════════════════════════════
// HANDLER
// ═══════════════════════════════════
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, name, data } = await req.json();

    if (!email || !type) {
      return new Response(JSON.stringify({ error: "email and type are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const displayName = name || email.split('@')[0];
    let subject = "";
    let html = "";

    switch (type) {
      case "welcome":
        subject = "Welcome! Your Rubik's journey starts now 🎉";
        html = welcomeEmail(displayName, data?.plan || 'free');
        break;
      case "miss_you":
        subject = "We miss you! Come back and keep solving 🧩";
        html = missYouEmail(displayName, data?.streak || 0, data?.progressPct || 0);
        break;
      case "halfway":
        subject = "You're halfway there — don't stop now! ⚡";
        html = halfwayEmail(displayName, data?.progressPct || 50);
        break;
      case "course_complete":
        subject = "You did it! Course complete 🏆";
        html = courseCompleteEmail(displayName, data?.planType || 'free');
        break;
      case "payment_confirmed":
        subject = `Payment confirmed — welcome to ${data?.planName || 'your new plan'}! 🎉`;
        html = paymentConfirmedEmail(displayName, data?.planName || 'Pro Plan', data?.price || '$40');
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid email type" }), {
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
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`${type} email sent to ${email}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-engagement-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
