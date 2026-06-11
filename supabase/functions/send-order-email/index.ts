const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, customer_name, customer_phone, customer_email, notes, total_cents, items, payment_type } =
      await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const restaurantEmail = Deno.env.get("RESTAURANT_EMAIL") ?? "blackpearltoulouse@gmail.com";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@crazytoasty.fr";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const shortRef = (order_id as string).split("-")[0].toUpperCase();
    const totalEur = (total_cents / 100).toFixed(2);
    const paymentLabel = payment_type === "online" ? "Payé en ligne (carte)" : "Paiement sur place";

    const itemsHtml = (
      items as Array<{ name: string; quantity: number; priceCents: number }>
    )
      .map(
        (i) =>
          `<tr><td style="padding:6px 12px">${i.name} ×${i.quantity}</td><td style="padding:6px 12px;text-align:right;color:#34d399">${((i.priceCents * i.quantity) / 100).toFixed(2)} €</td></tr>`,
      )
      .join("");

    // ── Restaurant notification ──────────────────────────────────────
    const restaurantHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:#1e3a8a;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
          <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0">Nouvelle commande — REF ${shortRef}</h2>
          <p><strong>Client :</strong> ${customer_name}</p>
          <p><strong>Téléphone :</strong> ${customer_phone}</p>
          <p><strong>Paiement :</strong> ${paymentLabel}</p>
          ${notes ? `<p><strong>Remarques :</strong> ${notes}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            ${itemsHtml}
            <tr style="border-top:1px solid #334155">
              <td style="padding:10px 12px;font-weight:bold">Total</td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#34d399">${totalEur} €</td>
            </tr>
          </table>
          <p style="margin-top:20px;font-size:12px;color:#94a3b8">Retrait : 2 rue Paul Mériel, 31000 Toulouse</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Crazy Toasty <${fromEmail}>`,
        to: [restaurantEmail],
        subject: `🍗 Commande REF ${shortRef} — ${totalEur} € (${paymentLabel})`,
        html: restaurantHtml,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error: ${body}`);
    }

    // ── Customer confirmation (if email provided) ────────────────────
    if (customer_email) {
      const customerHtml = `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
          <div style="background:#1e3a8a;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
            <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
          </div>
          <div style="padding:24px">
            <h2 style="margin-top:0;color:#34d399">Ta commande est confirmée !</h2>
            <p>Bonjour ${customer_name}, nous avons bien reçu ta commande.</p>
            <p><strong>Référence :</strong> #${shortRef}</p>
            <p><strong>Paiement :</strong> ${paymentLabel}</p>
            ${notes ? `<p><strong>Tes remarques :</strong> ${notes}</p>` : ""}
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
              ${itemsHtml}
              <tr style="border-top:1px solid #334155">
                <td style="padding:10px 12px;font-weight:bold">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#34d399">${totalEur} €</td>
              </tr>
            </table>
            <div style="margin-top:24px;padding:16px;background:#1e293b;border-radius:12px">
              <p style="margin:0;font-size:14px"><strong>📍 Adresse de retrait</strong></p>
              <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">2 rue Paul Mériel, 31000 Toulouse</p>
            </div>
            <p style="margin-top:20px;font-size:12px;color:#94a3b8">À tout à l'heure chez Crazy Toasty !</p>
          </div>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Crazy Toasty <${fromEmail}>`,
          to: [customer_email],
          subject: `✅ Commande confirmée #${shortRef} — Crazy Toasty`,
          html: customerHtml,
        }),
      });
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
