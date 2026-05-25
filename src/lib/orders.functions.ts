import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CartItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  options: z.string().max(500).optional(),
});

const CreateOrderSchema = z.object({
  restaurant_id: z.string().uuid(),
  customer_name: z.string().trim().min(1).max(100),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(6).max(30),
  order_type: z.enum(["delivery", "pickup"]),
  delivery_address: z.string().trim().max(500).optional(),
  delivery_notes: z.string().trim().max(500).optional(),
  payment_method: z.enum(["online", "on_site"]),
  items: z.array(CartItemSchema).min(1).max(50),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateOrderSchema.parse(input))
  .handler(async ({ data }) => {
    // Load restaurant
    const { data: restaurant, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .select("id, active, accepts_delivery, accepts_pickup, delivery_fee_cents, min_order_cents")
      .eq("id", data.restaurant_id)
      .maybeSingle();
    if (rErr || !restaurant || !restaurant.active) throw new Error("Restaurant indisponible");
    if (data.order_type === "delivery" && !restaurant.accepts_delivery) throw new Error("Livraison non disponible");
    if (data.order_type === "pickup" && !restaurant.accepts_pickup) throw new Error("Click & Collect non disponible");
    if (data.order_type === "delivery" && !data.delivery_address) throw new Error("Adresse de livraison requise");

    // Load menu items to compute server-trusted prices
    const ids = data.items.map((i) => i.menu_item_id);
    const { data: menuItems, error: mErr } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, price_cents, available, restaurant_id")
      .in("id", ids);
    if (mErr || !menuItems) throw new Error("Erreur menu");

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    const orderItemsToInsert: { name: string; unit_price_cents: number; quantity: number; menu_item_id: string; options?: string }[] = [];
    for (const it of data.items) {
      const m = itemMap.get(it.menu_item_id);
      if (!m) throw new Error("Plat introuvable");
      if (!m.available) throw new Error(`"${m.name}" n'est plus disponible`);
      if (m.restaurant_id && m.restaurant_id !== data.restaurant_id) throw new Error("Plat invalide pour ce restaurant");
      subtotal += m.price_cents * it.quantity;
      orderItemsToInsert.push({
        menu_item_id: m.id,
        name: m.name,
        unit_price_cents: m.price_cents,
        quantity: it.quantity,
        options: it.options,
      });
    }

    if (subtotal < restaurant.min_order_cents) {
      throw new Error(`Commande minimum : ${(restaurant.min_order_cents / 100).toFixed(2)}€`);
    }

    const deliveryFee = data.order_type === "delivery" ? restaurant.delivery_fee_cents : 0;
    const total = subtotal + deliveryFee;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        restaurant_id: data.restaurant_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        order_type: data.order_type,
        delivery_address: data.delivery_address,
        delivery_notes: data.delivery_notes,
        subtotal_cents: subtotal,
        delivery_fee_cents: deliveryFee,
        total_cents: total,
        payment_method: data.payment_method,
        paid: false,
        status: "pending",
      })
      .select("id, order_number, access_token")
      .single();
    if (oErr || !order) throw new Error("Impossible de créer la commande");

    const { error: oiErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsToInsert.map((oi) => ({ ...oi, order_id: order.id })));
    if (oiErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Impossible d'enregistrer les plats");
    }

    return {
      id: order.id,
      order_number: order.order_number,
      access_token: order.access_token,
    };
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin.rpc("get_order_by_token", { _token: data.token });
    if (!order || order.length === 0) throw new Error("Commande introuvable");
    const { data: items } = await supabaseAdmin.rpc("get_order_items_by_token", { _token: data.token });
    return { order: order[0], items: items ?? [] };
  });
