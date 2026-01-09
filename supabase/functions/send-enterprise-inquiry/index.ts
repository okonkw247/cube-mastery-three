import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnterpriseInquiryRequest {
  name: string;
  email: string;
  company: string;
  message: string;
  adminEmails: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, message, adminEmails }: EnterpriseInquiryRequest = await req.json();

    // Validate input
    if (!name || !email || !message || !adminEmails?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const companyInfo = company ? `<p><strong>Company:</strong> ${company}</p>` : "";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333; }
    .header { background: linear-gradient(90deg, #00d4ff, #00b4d8); padding: 30px; text-align: center; }
    .header h1 { color: #0a0a0a; margin: 0; font-size: 24px; font-weight: bold; }
    .content { padding: 30px; color: #e0e0e0; }
    .info-box { background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .info-box p { margin: 8px 0; font-size: 14px; }
    .info-box strong { color: #00d4ff; }
    .message-box { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; }
    .message-box h3 { color: #00d4ff; margin-top: 0; font-size: 16px; }
    .message-box p { line-height: 1.6; font-size: 14px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 New Enterprise Inquiry</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${companyInfo}
      </div>
      <div class="message-box">
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
    <div class="footer">
      <p>This inquiry was submitted via the Cube Mastery Enterprise Contact Form</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to all admin emails
    const emailPromises = adminEmails.map(async (adminEmail) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Cube Mastery <noreply@cube-mastery.site>",
          to: [adminEmail],
          subject: `🏢 Enterprise Inquiry from ${name}`,
          html: emailHtml,
          reply_to: email,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to send to ${adminEmail}:`, errorText);
        throw new Error(`Failed to send email to ${adminEmail}`);
      }

      return response.json();
    });

    await Promise.all(emailPromises);

    console.log(`Enterprise inquiry sent to ${adminEmails.length} admin(s)`);

    // Create in-app notification for admins
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get admin user IDs from profiles that match admin emails
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .in("user_id", 
          (await supabase.auth.admin.listUsers()).data.users
            .filter(u => adminEmails.includes(u.email || ""))
            .map(u => u.id)
        );

      if (adminProfiles && adminProfiles.length > 0) {
        const notifications = adminProfiles.map(profile => ({
          user_id: profile.user_id,
          title: "New Enterprise Inquiry",
          message: `${name} from ${company || "N/A"} submitted an enterprise inquiry.`,
          type: "announcement",
          is_read: false,
        }));

        await supabase.from("notifications").insert(notifications);
        console.log(`Created ${notifications.length} admin notification(s)`);
      }
    } catch (notifError) {
      console.error("Failed to create admin notifications:", notifError);
      // Don't fail the request if notification creation fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "Inquiry sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending enterprise inquiry:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
