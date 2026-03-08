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

const SITE_URL = "https://cube-mastery.site";
const FROM_EMAIL = "Cube Mastery <hello@cube-mastery.site>";
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

async function sendPushToUser(supabase: any, userId: string, title: string, body: string, url?: string) {
  try {
    // Get all push subscriptions for this user
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint")
      .eq("user_id", userId);
    
    if (!subs || subs.length === 0) return;

    // Call the send-push-notification function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ user_id: userId, title, body, url }),
    });

    if (!response.ok) {
      console.error(`Push to ${userId} failed:`, await response.text());
    }
  } catch (err) {
    console.error(`Push notification error for ${userId}:`, err);
  }
}

async function logEmail(supabase: any, userId: string | null, email: string, emailType: string, details: Record<string, any> = {}) {
  await supabase.from("email_logs").insert({
    user_id: userId,
    email: email.toLowerCase(),
    email_type: emailType,
    details,
  });
}

async function hasRecentEmailLog(supabase: any, userId: string, emailType: string, withinDays: number): Promise<boolean> {
  const since = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .gte("sent_at", since)
    .limit(1);
  return (data && data.length > 0);
}

async function hasEverSentEmail(supabase: any, userId: string, emailType: string): Promise<boolean> {
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .limit(1);
  return (data && data.length > 0);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results = { miss_you: 0, halfway: 0, course_complete: 0, errors: 0 };

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { count: totalLessons } = await supabase.from("lessons").select("id", { count: "exact", head: true });

    // ═══ GET ALL USERS ═══
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (!authUsers?.users || !totalLessons) {
      return new Response(JSON.stringify({ success: true, results, note: "No users or lessons" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    for (const authUser of authUsers.users) {
      if (!authUser.email) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, subscription_tier, user_id")
        .eq("user_id", authUser.id)
        .single();

      if (!profile) continue;

      const name = profile.full_name || authUser.email.split("@")[0] || "Cuber";

      // Get progress data
      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("completed")
        .eq("user_id", authUser.id);

      const completedCount = progressData?.filter((p: any) => p.completed).length || 0;
      const pct = Math.round((completedCount / totalLessons) * 100);

      // ═══ 1. WE MISS YOU — 3 days inactive ═══
      const lastSignIn = authUser.last_sign_in_at;
      if (lastSignIn && new Date(lastSignIn) < new Date(threeDaysAgo)) {
        if (!(await hasRecentEmailLog(supabase, authUser.id, "miss_you", 7))) {
          try {
            const html = emailWrapper(`
              <div class="header">
                <h1>We miss you, ${name}! 🧩</h1>
                <p>Come back and keep solving</p>
              </div>
              <p>It's been a few days since we last saw you. Don't let your progress slip away!</p>
              <div style="display:flex;gap:12px">
                <div class="stat" style="flex:1">
                  <div class="value">${completedCount}</div>
                  <div class="label">Lessons Done</div>
                </div>
                <div class="stat" style="flex:1">
                  <div class="value">${pct}%</div>
                  <div class="label">Overall Progress</div>
                </div>
              </div>
              <p>Jump back in and pick up right where you left off.</p>
              <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Continue Learning →</a></div>
            `);

            await resend.emails.send({
              from: FROM_EMAIL,
              to: [authUser.email],
              subject: "We miss you! Come back and keep solving 🧩",
              html,
            });

            await logEmail(supabase, authUser.id, authUser.email, "miss_you", { pct });
            await sendPushToUser(supabase, authUser.id, `We miss you, ${name}! 🧩`, "It's been a few days. Jump back in and keep learning!", "/dashboard");
            results.miss_you++;
            console.log(`Sent miss-you to ${authUser.email}`);
          } catch (err) {
            console.error(`miss_you error for ${authUser.email}:`, err);
            results.errors++;
          }
        }
      }

      // ═══ 2. HALFWAY THERE — 50%+ completion ═══
      if (pct >= 50 && !(await hasEverSentEmail(supabase, authUser.id, "halfway"))) {
        try {
          const html = emailWrapper(`
            <div class="header">
              <h1>You're halfway there, ${name}! ⚡</h1>
              <p>Don't stop now — the best is ahead</p>
            </div>
            <div class="stat">
              <div class="value">${pct}%</div>
              <div class="label">Course Progress</div>
            </div>
            <p>You've already mastered so much. Keep pushing and you'll be solving like a pro in no time.</p>
            <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Keep Going →</a></div>
          `);

          await resend.emails.send({
            from: FROM_EMAIL,
            to: [authUser.email],
            subject: "You're halfway there — don't stop now! ⚡",
            html,
          });

          await logEmail(supabase, authUser.id, authUser.email, "halfway", { pct });
          await sendPushToUser(supabase, authUser.id, `Halfway there, ${name}! ⚡`, `You're at ${pct}% — keep going!`, "/dashboard");
          results.halfway++;
          console.log(`Sent halfway to ${authUser.email}`);
        } catch (err) {
          console.error(`halfway error for ${authUser.email}:`, err);
          results.errors++;
        }
      }

      // ═══ 3. COURSE COMPLETE — 100% completion ═══
      if (pct === 100 && !(await hasEverSentEmail(supabase, authUser.id, "course_complete"))) {
        try {
          const isMaxPlan = profile.subscription_tier === "pro" || profile.subscription_tier === "enterprise";
          const upgradeSection = isMaxPlan ? "" : `
            <p>Ready for the next level? Upgrade your plan to unlock advanced techniques and exclusive content.</p>
            <div class="cta"><a href="https://whop.com/cube-mastery/" class="btn">Upgrade Now →</a></div>
          `;

          const html = emailWrapper(`
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

          await resend.emails.send({
            from: FROM_EMAIL,
            to: [authUser.email],
            subject: "You did it! Course complete 🏆",
            html,
          });

          await logEmail(supabase, authUser.id, authUser.email, "course_complete", { tier: profile.subscription_tier });
          await sendPushToUser(supabase, authUser.id, `Congratulations, ${name}! 🏆`, "You completed all lessons! Check your dashboard.", "/dashboard");
          results.course_complete++;
          console.log(`Sent course-complete to ${authUser.email}`);
        } catch (err) {
          console.error(`course_complete error for ${authUser.email}:`, err);
          results.errors++;
        }
      }
    }

    console.log("Engagement check complete:", results);
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in check-engagement-emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
