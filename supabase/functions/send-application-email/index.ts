import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, position, message, cv_url } = await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const restaurantEmail = Deno.env.get("RESTAURANT_EMAIL") ?? "blackpearltoulouse@gmail.com";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@crazytoasty.fr";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!resendKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate signed URL for CV if provided
    let cvDownloadUrl: string | null = null;
    if (cv_url) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabase.storage
        .from("cv-uploads")
        .createSignedUrl(cv_url, 60 * 60 * 24 * 60); // 60 days
      cvDownloadUrl = data?.signedUrl ?? null;
    }

    // Email to restaurant: compact notification with downloadable CV
    const restaurantHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:#1e3a8a;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
          <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">Nouvelle candidature</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0">Candidature : ${position}</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> <a href="mailto:${email}" style="color:#f97316">${email}</a></p>
          <p><strong>Téléphone :</strong> ${phone || "Non renseigné"}</p>
          <div style="background:#1e293b;border-radius:8px;padding:16px;margin-top:12px">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Lettre de motivation :</p>
            <p style="margin:0;white-space:pre-wrap;font-size:14px;color:#cbd5e1">${message}</p>
          </div>
          ${
            cvDownloadUrl
              ? `<div style="margin-top:20px;text-align:center">
                  <a href="${cvDownloadUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:bold;font-size:14px">
                    📄 Télécharger le CV
                  </a>
                  <p style="margin-top:8px;font-size:11px;color:#64748b">Lien valable 60 jours</p>
                </div>`
              : `<p style="margin-top:16px;color:#94a3b8;font-size:13px">Aucun CV joint.</p>`
          }
          <p style="margin-top:20px">
            <a href="mailto:${email}" style="color:#f97316">Répondre à ${name}</a>
          </p>
        </div>
      </div>
    `;

    // Email to candidate: confirmation with their application details
    const candidateHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:#1e3a8a;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
          <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0">Bonjour ${name},</h2>
          <p>Nous avons bien reçu votre candidature pour le poste de <strong>${position}</strong>.</p>
          <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Récapitulatif :</p>
            <p style="margin:4px 0;font-size:14px"><strong>Poste :</strong> ${position}</p>
            <p style="margin:4px 0;font-size:14px"><strong>Nom :</strong> ${name}</p>
            <p style="margin:4px 0;font-size:14px"><strong>Email :</strong> ${email}</p>
            ${phone ? `<p style="margin:4px 0;font-size:14px"><strong>Téléphone :</strong> ${phone}</p>` : ""}
          </div>
          <p>Merci de l'intérêt que vous portez à Crazy Toasty ! Nous étudierons votre profil avec attention et reviendrons vers vous si votre candidature est retenue.</p>
          <p style="margin-top:20px;padding:16px;background:#1e293b;border-radius:8px;font-size:13px;color:#94a3b8">
            À bientôt peut-être dans notre équipe !<br><br>
            <strong style="color:#f1f5f9">Crazy Toasty</strong><br>
            2 rue Paul Mériel, 31000 Toulouse
          </p>
        </div>
      </div>
    `;

    await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Crazy Toasty <${fromEmail}>`,
          to: [restaurantEmail],
          reply_to: email,
          subject: `👤 Candidature : ${position} — ${name}`,
          html: restaurantHtml,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Crazy Toasty <${fromEmail}>`,
          to: [email],
          subject: `Candidature reçue — Crazy Toasty`,
          html: candidateHtml,
        }),
      }),
    ]);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
