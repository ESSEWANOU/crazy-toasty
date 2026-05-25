import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { Check, Clock } from "lucide-react";

export const Route = createFileRoute("/ma-commande/$token")({
  component: OrderTrackingPage,
});

type OrderData = {
  id: string;
  order_number: number;
  restaurant_name: string;
  customer_name: string;
  customer_phone: string;
  order_type: "delivery" | "pickup";
  delivery_address: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  status: string;
  payment_method: string;
  paid: boolean;
};

const STATUSES = ["pending", "confirmed", "preparing", "ready"];

function OrderTrackingPage() {
  const { token } = Route.useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<
    { id: string; name: string; unit_price_cents: number; quantity: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: orderRows } = await supabase.rpc("get_order_by_token", { _token: token });
      const { data: itemRows } = await supabase.rpc("get_order_items_by_token", { _token: token });
      if (orderRows && orderRows.length > 0) setOrder(orderRows[0] as OrderData);
      setItems(
        (itemRows ?? []) as {
          id: string;
          name: string;
          unit_price_cents: number;
          quantity: number;
        }[],
      );
      setLoading(false);
    };

    load();
    const id = setInterval(load, 10000); // polling every 10s
    return () => clearInterval(id);
  }, [token]);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Chargement…
      </main>
    );
  if (!order)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <p>Commande introuvable</p>
        <Link to="/" className="text-primary underline">
          Retour à l'accueil
        </Link>
      </main>
    );

  const statusIndex = STATUSES.indexOf(order.status);
  const finalStatus = ["delivered", "picked_up", "cancelled"].includes(order.status);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl">Commande #{order.order_number}</h1>
          <p className="text-muted-foreground mt-2">{order.restaurant_name}</p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <div className="text-sm text-muted-foreground mb-2">Statut</div>
          <div className="font-display text-2xl text-primary mb-4">
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </div>
          {!finalStatus && (
            <div className="space-y-2">
              {STATUSES.map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-3 ${i <= statusIndex ? "text-foreground" : "text-muted-foreground opacity-50"}`}
                >
                  {i <= statusIndex ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {ORDER_STATUS_LABEL[s]}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 mb-6 space-y-3">
          <h2 className="font-display text-lg mb-2">Récap</h2>
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>
                {it.quantity} × {it.name}
              </span>
              <span>{formatPrice(it.unit_price_cents * it.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal_cents)}</span>
            </div>
            {order.delivery_fee_cents > 0 && (
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>{formatPrice(order.delivery_fee_cents)}</span>
              </div>
            )}
            <div className="flex justify-between font-display text-lg pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-border text-sm text-muted-foreground">
            {order.order_type === "delivery"
              ? `Livraison • ${order.delivery_address}`
              : "À retirer en restaurant"}
            {" • "}
            {order.paid
              ? "Payée"
              : order.payment_method === "online"
                ? "Paiement en attente"
                : "Paiement sur place"}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Garde cette page ouverte pour suivre ta commande en temps réel.
        </div>
      </div>
    </main>
  );
}
