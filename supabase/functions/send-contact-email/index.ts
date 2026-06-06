const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message } = await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const restaurantEmail = Deno.env.get("RESTAURANT_EMAIL") ?? "blackpearltoulouse@gmail.com";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@crazytoasty.fr";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Notification to restaurant
    const notifHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:#1e3a8a;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
          <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">Nouveau message</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0">Message via le formulaire de contact</h2>
          <p><strong>De :</strong> ${name} &lt;${email}&gt;</p>
          ${phone ? `<p><strong>Téléphone :</strong> ${phone}</p>` : ""}
          <p><strong>Sujet :</strong> ${subject}</p>
          <div style="background:#1e293b;border-radius:8px;padding:16px;margin-top:12px">
            <p style="margin:0;white-space:pre-wrap">${message}</p>
          </div>
          <p style="margin-top:20px">
            <a href="mailto:${email}" style="color:#f97316">Répondre à ${name}</a>
          </p>
        </div>
      </div>
    `;

    // Auto-reply to sender
    const autoReplyHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:#1e3a8a;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
          <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0">Bonjour ${name},</h2>
          <p>Merci pour votre message ! Nous l'avons bien reçu et vous répondrons dans les meilleurs délais.</p>
          <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Votre message :</p>
            <p style="margin:0;white-space:pre-wrap;font-size:14px;color:#cbd5e1">${message}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px">À bientôt chez Crazy Toasty !<br>2 rue Paul Mériel, 31000 Toulouse</p>
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
          subject: `📩 Nouveau message : ${subject} — ${name}`,
          html: notifHtml,
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
          subject: `Votre message a bien été reçu — Crazy Toasty`,
          html: autoReplyHtml,
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
