import Stripe from "npm:stripe@14";
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
    const { items, customer_name, customer_phone, notes, total_cents, site_url } =
      await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create draft order in DB
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name,
        customer_phone,
        notes: notes ?? null,
        status: "draft",
        total_cents,
        items,
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (dbError) throw dbError;

    // Build Stripe line items
    const lineItems = (
      items as Array<{ name: string; priceCents: number; quantity: number }>
    ).map((item) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: item.priceCents,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${site_url}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site_url}/commander`,
      metadata: { order_id: order.id },
    });

    // Store session ID on the order
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
