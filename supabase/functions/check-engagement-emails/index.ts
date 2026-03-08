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

// This function is meant to be called on a cron schedule (e.g. daily)
// It checks for users who haven't logged in for 3+ days and sends "we miss you" emails
// It also checks for 50%+ completion and sends halfway emails

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // ═══ WE MISS YOU EMAILS ═══
    // Find users who last signed in 3+ days ago and haven't received this email recently
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    
    if (authUsers?.users) {
      for (const authUser of authUsers.users) {
        const lastSignIn = authUser.last_sign_in_at;
        if (!lastSignIn || new Date(lastSignIn) > new Date(threeDaysAgo)) continue;

        // Check if we already sent a miss-you email in last 7 days
        const { data: recentLog } = await supabase
          .from('activity_log')
          .select('id')
          .eq('user_email', authUser.email?.toLowerCase())
          .eq('action', 'miss_you_email_sent')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentLog && recentLog.length > 0) continue;

        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, total_points, user_id')
          .eq('user_id', authUser.id)
          .single();

        if (!profile) continue;

        // Get progress
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('completed')
          .eq('user_id', authUser.id);

        const { count: totalLessons } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true });

        const completedCount = progressData?.filter(p => p.completed).length || 0;
        const progressPct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

        const name = profile.full_name || authUser.email?.split('@')[0] || 'Cuber';

        // Send miss you email
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
              <div class="value">${progressPct}%</div>
              <div class="label">Overall Progress</div>
            </div>
          </div>
          <p>Jump back in and pick up right where you left off.</p>
          <div class="cta"><a href="${SITE_URL}/dashboard" class="btn">Continue Learning →</a></div>
        `);

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [authUser.email!],
          subject: "We miss you! Come back and keep solving 🧩",
          html,
        });

        // Log that we sent it
        await supabase.from('activity_log').insert({
          user_email: authUser.email?.toLowerCase(),
          user_id: authUser.id,
          action: 'miss_you_email_sent',
          action_type: 'email',
          details: { progressPct },
        });

        console.log(`Sent miss-you email to ${authUser.email}`);
      }
    }

    // ═══ HALFWAY EMAILS ═══
    const { data: allProfiles } = await supabase.from('profiles').select('user_id, full_name');
    const { count: totalLessons } = await supabase.from('lessons').select('id', { count: 'exact', head: true });

    if (allProfiles && totalLessons) {
      for (const prof of allProfiles) {
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('completed')
          .eq('user_id', prof.user_id);

        const completedCount = progressData?.filter(p => p.completed).length || 0;
        const pct = Math.round((completedCount / totalLessons) * 100);

        // Only send at exactly 50%+ and haven't sent before
        if (pct < 50) continue;

        const { data: alreadySent } = await supabase
          .from('activity_log')
          .select('id')
          .eq('user_id', prof.user_id)
          .eq('action', 'halfway_email_sent')
          .limit(1);

        if (alreadySent && alreadySent.length > 0) continue;

        // Get email
        const { data: authData } = await supabase.auth.admin.getUserById(prof.user_id);
        if (!authData?.user?.email) continue;

        const name = prof.full_name || authData.user.email.split('@')[0];

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
          to: [authData.user.email],
          subject: "You're halfway there — don't stop now! ⚡",
          html,
        });

        await supabase.from('activity_log').insert({
          user_email: authData.user.email.toLowerCase(),
          user_id: prof.user_id,
          action: 'halfway_email_sent',
          action_type: 'email',
          details: { progressPct: pct },
        });

        console.log(`Sent halfway email to ${authData.user.email}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
