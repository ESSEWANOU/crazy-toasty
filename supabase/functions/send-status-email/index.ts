const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_email, customer_name, order_id, status } = await req.json();

    if (!customer_email) {
      return new Response(
        JSON.stringify({ success: false, error: "No customer_email provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@crazytoasty.fr";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const shortRef = (order_id as string).split("-")[0].toUpperCase();

    const isReady = status === "ready";

    const subject = isReady
      ? `🎉 Ta commande est prête ! #${shortRef} — Crazy Toasty`
      : `✅ Merci pour ta visite ! #${shortRef} — Crazy Toasty`;

    const headline = isReady ? "Ta commande est prête !" : "Commande récupérée — Merci !";
    const headlineColor = isReady ? "#f97316" : "#34d399";

    const body = isReady
      ? `<p>Bonjour <strong>${customer_name}</strong>,</p>
         <p>Bonne nouvelle ! Ta commande <strong>#${shortRef}</strong> est prête et t'attend au comptoir.</p>
         <p>Viens la récupérer dès maintenant !</p>
         <div style="margin-top:24px;padding:16px;background:#1e293b;border-radius:12px">
           <p style="margin:0;font-size:14px"><strong>📍 Adresse de retrait</strong></p>
           <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">2 rue Paul Mériel, 31000 Toulouse</p>
         </div>`
      : `<p>Bonjour <strong>${customer_name}</strong>,</p>
         <p>Tu as bien récupéré ta commande <strong>#${shortRef}</strong>.</p>
         <p>Merci d'avoir choisi Crazy Toasty, on espère te revoir très vite ! 🍗</p>`;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:#1e3a8a;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
          <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0;color:${headlineColor}">${headline}</h2>
          ${body}
          <p style="margin-top:24px;font-size:12px;color:#94a3b8">Crazy Toasty — 2 rue Paul Mériel, 31000 Toulouse</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Crazy Toasty <${fromEmail}>`,
        to: [customer_email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend error: ${errBody}`);
    }

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
