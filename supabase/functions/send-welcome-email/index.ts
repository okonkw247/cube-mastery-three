import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  language?: string;
}

// Localized content for welcome emails
const getLocalizedContent = (language: string) => {
  const content: Record<string, {
    subject: string;
    greeting: string;
    welcome: string;
    gettingStarted: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    upgradeTitle: string;
    upgradeDesc: string;
    starterPlan: string;
    proPlan: string;
    oneTime: string;
    ctaButton: string;
    helpTitle: string;
    helpDesc: string;
    footer: string;
    receivingNotice: string;
  }> = {
    en: {
      subject: "Welcome to Cube Mastery! 🧊 Your Journey Begins Now",
      greeting: "Hi",
      welcome: "we're excited to have you!",
      gettingStarted: "🚀 Getting Started",
      step1Title: "Explore Free Lessons",
      step1Desc: "Start with our free beginner lessons to get a feel for the platform.",
      step2Title: "Track Your Progress",
      step2Desc: "Your dashboard shows completed lessons, practice attempts, and streaks.",
      step3Title: "Practice Regularly",
      step3Desc: "Use our Practice Coach to time your solves and improve your speed.",
      upgradeTitle: "💎 Upgrade Your Learning",
      upgradeDesc: "Unlock all lessons and advanced content with our plans:",
      starterPlan: "Starter Plan",
      proPlan: "Pro Plan",
      oneTime: "One-time payment",
      ctaButton: "Go to Your Dashboard →",
      helpTitle: "📖 Need Help?",
      helpDesc: "Check our lessons for step-by-step guides, or reach out through the Settings page if you need support. We're here to help you master the cube!",
      footer: "All rights reserved.",
      receivingNotice: "You're receiving this because you signed up for Cube Mastery."
    },
    es: {
      subject: "¡Bienvenido a Cube Mastery! 🧊 Tu viaje comienza ahora",
      greeting: "Hola",
      welcome: "¡estamos emocionados de tenerte!",
      gettingStarted: "🚀 Primeros Pasos",
      step1Title: "Explora Lecciones Gratis",
      step1Desc: "Comienza con nuestras lecciones gratuitas para principiantes.",
      step2Title: "Rastrea Tu Progreso",
      step2Desc: "Tu panel muestra lecciones completadas, intentos de práctica y rachas.",
      step3Title: "Practica Regularmente",
      step3Desc: "Usa nuestro Entrenador de Práctica para cronometrar tus soluciones.",
      upgradeTitle: "💎 Mejora Tu Aprendizaje",
      upgradeDesc: "Desbloquea todas las lecciones con nuestros planes:",
      starterPlan: "Plan Básico",
      proPlan: "Plan Pro",
      oneTime: "Pago único",
      ctaButton: "Ir a Tu Panel →",
      helpTitle: "📖 ¿Necesitas Ayuda?",
      helpDesc: "Revisa nuestras lecciones para guías paso a paso, o contáctanos a través de Configuración. ¡Estamos aquí para ayudarte!",
      footer: "Todos los derechos reservados.",
      receivingNotice: "Recibes esto porque te registraste en Cube Mastery."
    },
    fr: {
      subject: "Bienvenue sur Cube Mastery ! 🧊 Votre voyage commence",
      greeting: "Bonjour",
      welcome: "nous sommes ravis de vous avoir !",
      gettingStarted: "🚀 Premiers Pas",
      step1Title: "Explorez les Leçons Gratuites",
      step1Desc: "Commencez avec nos leçons gratuites pour débutants.",
      step2Title: "Suivez Votre Progression",
      step2Desc: "Votre tableau de bord affiche les leçons terminées et vos séries.",
      step3Title: "Pratiquez Régulièrement",
      step3Desc: "Utilisez notre Coach de Pratique pour chronométrer vos résolutions.",
      upgradeTitle: "💎 Améliorez Votre Apprentissage",
      upgradeDesc: "Débloquez toutes les leçons avec nos plans :",
      starterPlan: "Plan Starter",
      proPlan: "Plan Pro",
      oneTime: "Paiement unique",
      ctaButton: "Accéder à Votre Tableau de Bord →",
      helpTitle: "📖 Besoin d'Aide ?",
      helpDesc: "Consultez nos leçons pour des guides étape par étape, ou contactez-nous via les Paramètres.",
      footer: "Tous droits réservés.",
      receivingNotice: "Vous recevez ceci car vous vous êtes inscrit sur Cube Mastery."
    },
    de: {
      subject: "Willkommen bei Cube Mastery! 🧊 Deine Reise beginnt",
      greeting: "Hallo",
      welcome: "wir freuen uns, dich zu haben!",
      gettingStarted: "🚀 Erste Schritte",
      step1Title: "Entdecke Kostenlose Lektionen",
      step1Desc: "Beginne mit unseren kostenlosen Anfängerlektionen.",
      step2Title: "Verfolge Deinen Fortschritt",
      step2Desc: "Dein Dashboard zeigt abgeschlossene Lektionen und Streaks.",
      step3Title: "Übe Regelmäßig",
      step3Desc: "Nutze unseren Übungs-Coach, um deine Lösungszeit zu messen.",
      upgradeTitle: "💎 Erweitere Dein Lernen",
      upgradeDesc: "Schalte alle Lektionen mit unseren Plänen frei:",
      starterPlan: "Starter-Plan",
      proPlan: "Pro-Plan",
      oneTime: "Einmalzahlung",
      ctaButton: "Zum Dashboard →",
      helpTitle: "📖 Brauchst Du Hilfe?",
      helpDesc: "Schau dir unsere Lektionen an oder kontaktiere uns über die Einstellungen.",
      footer: "Alle Rechte vorbehalten.",
      receivingNotice: "Du erhältst dies, weil du dich bei Cube Mastery registriert hast."
    },
    pt: {
      subject: "Bem-vindo ao Cube Mastery! 🧊 Sua jornada começa agora",
      greeting: "Olá",
      welcome: "estamos animados em ter você!",
      gettingStarted: "🚀 Primeiros Passos",
      step1Title: "Explore Aulas Grátis",
      step1Desc: "Comece com nossas aulas gratuitas para iniciantes.",
      step2Title: "Acompanhe Seu Progresso",
      step2Desc: "Seu painel mostra aulas concluídas e sequências de prática.",
      step3Title: "Pratique Regularmente",
      step3Desc: "Use nosso Coach de Prática para cronometrar suas soluções.",
      upgradeTitle: "💎 Melhore Seu Aprendizado",
      upgradeDesc: "Desbloqueie todas as aulas com nossos planos:",
      starterPlan: "Plano Inicial",
      proPlan: "Plano Pro",
      oneTime: "Pagamento único",
      ctaButton: "Ir para Seu Painel →",
      helpTitle: "📖 Precisa de Ajuda?",
      helpDesc: "Confira nossas aulas para guias passo a passo ou entre em contato através das Configurações.",
      footer: "Todos os direitos reservados.",
      receivingNotice: "Você recebe isso porque se cadastrou no Cube Mastery."
    }
  };

  return content[language] || content.en;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, language = 'en' }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = name || email.split('@')[0];
    const content = getLocalizedContent(language);

    const { error: emailError } = await resend.emails.send({
      from: "Cube Mastery <welcome@cube-mastery.site>",
      to: [email],
      subject: content.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #ffffff; padding: 40px; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #2d2d44; border-radius: 16px; padding: 40px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { font-size: 28px; margin: 0; }
            .section { background: #1a1a2e; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .section h2 { color: #8b5cf6; margin-top: 0; font-size: 18px; }
            .step { display: flex; align-items: flex-start; margin: 16px 0; }
            .step-number { background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-weight: bold; }
            .step-content { flex: 1; }
            .step-content h3 { margin: 0 0 4px 0; font-size: 16px; }
            .step-content p { margin: 0; color: #ccc; font-size: 14px; }
            .cta { text-align: center; margin: 32px 0; }
            .cta a { background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
            .plans { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
            .plan { background: #2d2d44; border: 1px solid #3d3d54; border-radius: 8px; padding: 16px; text-align: center; }
            .plan h4 { margin: 0 0 8px 0; color: #8b5cf6; }
            .plan .price { font-size: 24px; font-weight: bold; }
            .plan .note { font-size: 12px; color: #888; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #3d3d54; }
            p { line-height: 1.6; color: #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧊 Welcome to Cube Mastery!</h1>
              <p style="color: #ccc; margin-top: 8px;">${content.greeting} ${displayName}, ${content.welcome}</p>
            </div>
            
            <div class="section">
              <h2>${content.gettingStarted}</h2>
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>${content.step1Title}</h3>
                  <p>${content.step1Desc}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>${content.step2Title}</h3>
                  <p>${content.step2Desc}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>${content.step3Title}</h3>
                  <p>${content.step3Desc}</p>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>${content.upgradeTitle}</h2>
              <p style="margin: 0 0 16px 0;">${content.upgradeDesc}</p>
              <div class="plans">
                <div class="plan">
                  <h4>${content.starterPlan}</h4>
                  <div class="price">$15</div>
                  <div class="note">${content.oneTime}</div>
                </div>
                <div class="plan">
                  <h4>${content.proPlan}</h4>
                  <div class="price">$40</div>
                  <div class="note">${content.oneTime}</div>
                </div>
              </div>
            </div>

            <div class="cta">
              <a href="https://cube-mastery.site/dashboard">${content.ctaButton}</a>
            </div>

            <div class="section">
              <h2>${content.helpTitle}</h2>
              <p style="margin: 0;">${content.helpDesc}</p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Cube Mastery. ${content.footer}</p>
              <p>${content.receivingNotice}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Failed to send welcome email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Welcome email sent to ${email} in ${language}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
