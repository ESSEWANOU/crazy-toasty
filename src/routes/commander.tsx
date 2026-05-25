import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/orders.functions";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, X, Truck, Store } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/commander")({
  head: () => ({
    meta: [
      { title: "Commander en ligne — Crazy Toasty" },
      {
        name: "description",
        content:
          "Commande tes plats préférés en livraison ou Click & Collect chez Crazy Toasty Toulouse.",
      },
    ],
  }),
  component: CommanderPage,
});

type Restaurant = {
  id: string;
  name: string;
  address: string;
  city: string;
  delivery_fee_cents: number;
  min_order_cents: number;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  badge: string | null;
  image_url: string | null;
  sort_order: number;
};

type CartLine = { item: MenuItem; quantity: number };

function CommanderPage() {
  const navigate = useNavigate();
  const createOrderFn = useServerFn(createOrder);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("pickup");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [activeCat, setActiveCat] = useState<string>("Tout");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    payment: "on_site" as "on_site" | "online",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load restaurants
  useEffect(() => {
    supabase
      .from("restaurants")
      .select("*")
      .eq("active", true)
      .then(({ data }) => {
        const list = (data ?? []) as Restaurant[];
        setRestaurants(list);
        if (list.length === 1) setRestaurantId(list[0].id);
      });
  }, []);

  // Load menu for selected restaurant
  useEffect(() => {
    if (!restaurantId) return;
    supabase
      .from("menu_items")
      .select("*")
      .eq("available", true)
      .or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`)
      .order("sort_order")
      .then(({ data }) => setMenu((data ?? []) as MenuItem[]));
  }, [restaurantId]);

  const restaurant = restaurants.find((r) => r.id === restaurantId);
  const categories = useMemo(
    () => ["Tout", ...Array.from(new Set(menu.map((m) => m.category)))],
    [menu],
  );
  const filtered = activeCat === "Tout" ? menu : menu.filter((m) => m.category === activeCat);
  const sauces = useMemo(() => menu.filter((m) => /sauce/i.test(m.category)), [menu]);

  const cartLines = Object.values(cart);
  const subtotal = cartLines.reduce((s, l) => s + l.item.price_cents * l.quantity, 0);
  const deliveryFee = orderType === "delivery" && restaurant ? restaurant.delivery_fee_cents : 0;
  const total = subtotal + deliveryFee;
  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);

  const addItem = (item: MenuItem) => {
    setCart((c) => ({ ...c, [item.id]: { item, quantity: (c[item.id]?.quantity ?? 0) + 1 } }));
    toast.success(`${item.name} ajouté`);
  };
  const removeOne = (id: string) => {
    setCart((c) => {
      const line = c[id];
      if (!line) return c;
      const q = line.quantity - 1;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = { ...line, quantity: q };
      return next;
    });
  };
  const removeAll = (id: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  };

  const submitOrder = async () => {
    if (!restaurant) return;
    if (!form.name || !form.email || !form.phone) {
      toast.error("Renseigne nom, email et téléphone");
      return;
    }
    if (orderType === "delivery" && !form.address) {
      toast.error("Adresse requise pour la livraison");
      return;
    }
    if (subtotal < restaurant.min_order_cents) {
      toast.error(`Commande minimum ${formatPrice(restaurant.min_order_cents)}`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrderFn({
        data: {
          restaurant_id: restaurant.id,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          order_type: orderType,
          delivery_address: orderType === "delivery" ? form.address : undefined,
          delivery_notes: form.notes || undefined,
          payment_method: form.payment,
          items: cartLines.map((l) => ({ menu_item_id: l.item.id, quantity: l.quantity })),
        },
      });
      setCart({});
      setCheckoutOpen(false);
      setCartOpen(false);
      navigate({ to: "/ma-commande/$token", params: { token: result.access_token } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurantId) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Toaster richColors position="top-center" />
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Retour au site
          </Link>
          <h1 className="font-display text-4xl md:text-6xl mt-6 mb-8">Où veux-tu commander ?</h1>
          <div className="space-y-3">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => setRestaurantId(r.id)}
                className="w-full text-left glass rounded-2xl p-6 hover:bg-white/10 transition"
              >
                <div className="font-display text-xl">{r.name}</div>
                <div className="text-muted-foreground text-sm mt-1">
                  {r.address}, {r.city}
                </div>
              </button>
            ))}
            {restaurants.length === 0 && (
              <p className="text-muted-foreground">Aucun restaurant disponible pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-32">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-lg md:text-xl">
            Crazy Toasty
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrderType("pickup")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${orderType === "pickup" ? "bg-primary text-primary-foreground" : "glass"}`}
            >
              <Store className="h-3.5 w-3.5" /> Click & Collect
            </button>
            <button
              onClick={() => setOrderType("delivery")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${orderType === "delivery" ? "bg-primary text-primary-foreground" : "glass"}`}
            >
              <Truck className="h-3.5 w-3.5" /> Livraison
            </button>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-display uppercase tracking-wide transition ${activeCat === c ? "bg-primary text-primary-foreground" : "glass hover:bg-white/10"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const inCart = cart[item.id]?.quantity ?? 0;
            return (
              <article key={item.id} className="glass rounded-2xl p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg">{item.name}</h3>
                  <div className="font-display text-primary shrink-0">
                    {formatPrice(item.price_cents)}
                  </div>
                </div>
                {item.badge && (
                  <span className="text-xs font-bold text-primary mb-1">{item.badge}</span>
                )}
                {item.description && (
                  <p className="text-sm text-muted-foreground flex-1 mb-3">{item.description}</p>
                )}
                <div className="mt-auto flex items-center justify-end gap-2">
                  {inCart > 0 && (
                    <>
                      <button
                        onClick={() => removeOne(item.id)}
                        className="rounded-full glass p-2 hover:bg-white/10"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-bold w-6 text-center">{inCart}</span>
                    </>
                  )}
                  <button
                    onClick={() => addItem(item)}
                    className="rounded-full bg-primary text-primary-foreground p-2 hover:scale-105 transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Cart floating button */}
      {cartCount > 0 && !cartOpen && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-primary-foreground font-bold shadow-glow"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>
            {cartCount} • {formatPrice(total)}
          </span>
        </motion.button>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-40 bg-black/50"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-xl">Ta commande</h2>
                <button onClick={() => setCartOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartLines.length === 0 && (
                  <p className="text-muted-foreground text-center py-12">Panier vide</p>
                )}
                {cartLines.length > 0 && (
                  <div className="space-y-3">
                    {cartLines.map((l) => (
                      <div key={l.item.id} className="flex items-center gap-3 glass rounded-xl p-3">
                        <div className="flex-1">
                          <div className="font-medium">{l.item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(l.item.price_cents)} × {l.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeOne(l.item.id)}
                            className="p-1.5 rounded glass"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{l.quantity}</span>
                          <button
                            onClick={() => addItem(l.item)}
                            className="p-1.5 rounded bg-primary text-primary-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeAll(l.item.id)}
                            className="ml-2 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sauce selection step — before delivery / click & collect */}
                {cartLines.length > 0 && sauces.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg">🥫 Ajoute tes sauces</h3>
                      <span className="text-xs text-muted-foreground">avant la livraison</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Choisis les sauces qui accompagnent ta commande.
                    </p>
                    <div className="space-y-2">
                      {sauces.map((s) => {
                        const qty = cart[s.id]?.quantity ?? 0;
                        return (
                          <div
                            key={s.id}
                            className="flex items-center gap-3 glass rounded-xl p-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{s.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatPrice(s.price_cents)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {qty > 0 && (
                                <>
                                  <button
                                    onClick={() => removeOne(s.id)}
                                    className="p-1.5 rounded glass"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-5 text-center text-sm font-bold">{qty}</span>
                                </>
                              )}
                              <button
                                onClick={() => addItem(s)}
                                className="p-1.5 rounded bg-primary text-primary-foreground"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {cartLines.length > 0 && (
                <div className="border-t border-border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Livraison</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full mt-3 rounded-full bg-primary text-primary-foreground py-3 font-bold hover:scale-[1.02] transition"
                  >
                    Continuer vers la livraison
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Checkout modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70"
              onClick={() => setCheckoutOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-background border border-border rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-2xl">Tes infos</h2>
                  <button onClick={() => setCheckoutOpen(false)}>
                    <X />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    className="w-full glass rounded-xl px-4 py-3"
                    placeholder="Nom *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    className="w-full glass rounded-xl px-4 py-3"
                    placeholder="Email *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <input
                    className="w-full glass rounded-xl px-4 py-3"
                    placeholder="Téléphone *"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  {orderType === "delivery" && (
                    <input
                      className="w-full glass rounded-xl px-4 py-3"
                      placeholder="Adresse de livraison *"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  )}
                  <textarea
                    className="w-full glass rounded-xl px-4 py-3"
                    placeholder="Notes (allergies, instructions...)"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setForm({ ...form, payment: "on_site" })}
                      className={`rounded-xl py-3 text-sm font-bold ${form.payment === "on_site" ? "bg-primary text-primary-foreground" : "glass"}`}
                    >
                      Sur place / Livraison
                    </button>
                    <button
                      disabled
                      className="rounded-xl py-3 text-sm font-bold glass opacity-50 cursor-not-allowed"
                      title="Bientôt disponible"
                    >
                      CB en ligne (bientôt)
                    </button>
                  </div>
                  <div className="flex justify-between font-display text-xl py-3 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <button
                    onClick={submitOrder}
                    disabled={submitting}
                    className="w-full rounded-full bg-primary text-primary-foreground py-3 font-bold disabled:opacity-50"
                  >
                    {submitting ? "Envoi..." : "Confirmer la commande"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
