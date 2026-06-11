import Stripe from "npm:stripe@14";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendOrderNotification(order: Record<string, unknown>) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const restaurantEmail = Deno.env.get("RESTAURANT_EMAIL") ?? "blackpearltoulouse@gmail.com";
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@crazytoasty.fr";

  if (!resendKey) return;

  const items = order.items as Array<{ name: string; quantity: number; priceCents: number }>;
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px">${i.name} ×${i.quantity}</td><td style="padding:6px 12px;text-align:right;color:#34d399">${((i.priceCents * i.quantity) / 100).toFixed(2)} €</td></tr>`,
    )
    .join("");

  const totalEur = ((order.total_cents as number) / 100).toFixed(2);
  const shortRef = (order.id as string).split("-")[0].toUpperCase();

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
      <div style="background:#1e3a8a;padding:24px;text-align:center">
        <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
        <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin-top:0">Nouvelle commande en ligne — REF ${shortRef}</h2>
        <p><strong>Client :</strong> ${order.customer_name}</p>
        <p><strong>Téléphone :</strong> ${order.customer_phone}</p>
        ${order.notes ? `<p><strong>Remarques :</strong> ${order.notes}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          ${itemsHtml}
          <tr style="border-top:1px solid #334155">
            <td style="padding:10px 12px;font-weight:bold">Total payé en ligne</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#34d399">${totalEur} €</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Crazy Toasty <${fromEmail}>`,
      to: [restaurantEmail],
      subject: `🔔 Commande en ligne REF ${shortRef} — ${totalEur} €`,
      html,
    }),
  });
}

async function sendCustomerConfirmation(order: Record<string, unknown>, customerEmail: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@crazytoasty.fr";

  if (!resendKey) return;

  const items = order.items as Array<{ name: string; quantity: number; priceCents: number }>;
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px">${i.name} ×${i.quantity}</td><td style="padding:6px 12px;text-align:right;color:#34d399">${((i.priceCents * i.quantity) / 100).toFixed(2)} €</td></tr>`,
    )
    .join("");

  const totalEur = ((order.total_cents as number) / 100).toFixed(2);
  const shortRef = (order.id as string).split("-")[0].toUpperCase();

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
      <div style="background:#1e3a8a;padding:24px;text-align:center">
        <h1 style="margin:0;font-size:24px;letter-spacing:2px">CRAZY TOASTY</h1>
        <p style="margin:4px 0 0;color:#f97316;font-size:13px;letter-spacing:4px">TOULOUS'HEIN !</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin-top:0;color:#34d399">Paiement confirmé !</h2>
        <p>Bonjour ${order.customer_name}, ton paiement a bien été reçu.</p>
        <p><strong>Référence :</strong> #${shortRef}</p>
        <p><strong>Paiement :</strong> Payé en ligne (carte)</p>
        ${order.notes ? `<p><strong>Tes remarques :</strong> ${order.notes}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          ${itemsHtml}
          <tr style="border-top:1px solid #334155">
            <td style="padding:10px 12px;font-weight:bold">Total payé</td>
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
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Crazy Toasty <${fromEmail}>`,
      to: [customerEmail],
      subject: `✅ Paiement confirmé #${shortRef} — Crazy Toasty`,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, error: "Paiement non complété." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find order by stripe_session_id
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", session_id)
      .single();

    if (findError || !order) {
      throw new Error("Commande introuvable pour cette session.");
    }

    // Idempotency: already confirmed
    if (order.status === "pending" && order.payment_status === "paid") {
      return new Response(
        JSON.stringify({ success: true, order }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: "pending", payment_status: "paid" })
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Send notification email (best-effort)
    sendOrderNotification(updated).catch(() => {/* silent */});

    // Send customer confirmation if we have their email
    const customerEmail =
      session.customer_details?.email ||
      (session.metadata?.customer_email as string | undefined) ||
      null;
    if (customerEmail) {
      sendCustomerConfirmation(updated, customerEmail).catch(() => {/* silent */});
    }

    return new Response(
      JSON.stringify({ success: true, order: updated }),
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
