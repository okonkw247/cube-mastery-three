import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Invitation {
  id: string;
  invitee_email: string;
  token: string;
}

interface InvitationRequest {
  invitations: Invitation[];
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitations, inviterName }: InvitationRequest = await req.json();

    if (!invitations || invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No invitations provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const baseUrl = "https://cube-mastery-three.vercel.app";
    const results = [];

    for (const invitation of invitations) {
      const inviteLink = `${baseUrl}/auth?mode=signup&invite=${invitation.token}`;

      const { error: emailError } = await resend.emails.send({
        from: "Cube Mastery <invites@cube-mastery.site>",
        to: [invitation.invitee_email],
        subject: `${inviterName} invited you to join Cube Mastery! 🧊`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #ffffff; padding: 40px; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: #2d2d44; border-radius: 16px; padding: 40px; }
              .header { text-align: center; margin-bottom: 32px; }
              .header h1 { font-size: 28px; margin: 0; color: #8b5cf6; }
              .content { text-align: center; }
              .content p { color: #ccc; line-height: 1.6; }
              .highlight { color: #8b5cf6; font-weight: 600; }
              .cta { text-align: center; margin: 32px 0; }
              .cta a { background: #8b5cf6; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px; }
              .features { background: #1a1a2e; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left; }
              .features h3 { color: #8b5cf6; margin-top: 0; }
              .features ul { color: #ccc; padding-left: 20px; }
              .features li { margin: 8px 0; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #3d3d54; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧊 You're Invited!</h1>
              </div>
              
              <div class="content">
                <p>Hey there!</p>
                <p><span class="highlight">${inviterName}</span> thinks you'd love Cube Mastery - the ultimate platform to learn and master the Rubik's Cube!</p>
              </div>

              <div class="features">
                <h3>What you'll get:</h3>
                <ul>
                  <li>Step-by-step video lessons from beginner to advanced</li>
                  <li>Practice timer to track your solving speed</li>
                  <li>Progress tracking and achievement badges</li>
                  <li>Technique guides and algorithm sheets</li>
                </ul>
              </div>

              <div class="cta">
                <a href="${inviteLink}">Join Cube Mastery →</a>
              </div>

              <p style="text-align: center; color: #888; font-size: 14px;">
                Click the button above to create your free account and start your speedcubing journey!
              </p>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Cube Mastery. All rights reserved.</p>
                <p>You received this because ${inviterName} invited you to join Cube Mastery.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (emailError) {
        console.error(`Failed to send to ${invitation.invitee_email}:`, emailError);
        results.push({ email: invitation.invitee_email, success: false, error: emailError });
      } else {
        console.log(`Invitation sent to ${invitation.invitee_email}`);
        results.push({ email: invitation.invitee_email, success: true });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-friend-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
