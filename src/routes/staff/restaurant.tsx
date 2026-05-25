import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAuth } from "@/hooks/use-staff-auth";
import { formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { toast, Toaster } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/staff/restaurant")({
  component: RestaurantPortal,
});

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  order_type: "delivery" | "pickup";
  delivery_address: string | null;
  total_cents: number;
  status: string;
  payment_method: string;
  paid: boolean;
  created_at: string;
  restaurant_id: string;
};

const NEXT: Record<string, { label: string; next: string }[]> = {
  pending: [{ label: "Confirmer", next: "confirmed" }, { label: "Refuser", next: "cancelled" }],
  confirmed: [{ label: "En préparation", next: "preparing" }],
  preparing: [{ label: "Prête", next: "ready" }],
  ready: [{ label: "Livrée", next: "delivered" }, { label: "Retirée", next: "picked_up" }],
};

function RestaurantPortal() {
  const { loading, roles, signOut } = useStaffAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"live" | "history">("live");

  const restaurantIds = roles.filter((r) => r.role === "restaurant_staff" || r.role === "manager").map((r) => r.restaurant_id).filter(Boolean) as string[];

  const load = async () => {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (restaurantIds.length > 0 && !roles.some((r) => r.role === "manager")) {
      q = q.in("restaurant_id", restaurantIds);
    }
    if (tab === "live") q = q.in("status", ["pending", "confirmed", "preparing", "ready"]);
    else q = q.in("status", ["delivered", "picked_up", "cancelled"]).limit(100);
    const { data } = await q;
    setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    if (loading) return;
    load();
    const channel = supabase
      .channel("orders-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loading, tab]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Statut mis à jour");
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-background text-foreground">Chargement…</main>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs text-muted-foreground">← Site</Link>
            <h1 className="font-display text-xl">Portail Restaurant</h1>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
        <div className="container mx-auto px-4 pb-3 flex gap-2">
          <button onClick={() => setTab("live")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === "live" ? "bg-primary text-primary-foreground" : "glass"}`}>Commandes en cours</button>
          <button onClick={() => setTab("history")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === "history" ? "bg-primary text-primary-foreground" : "glass"}`}>Historique</button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Aucune commande</p>}
        {orders.map((o) => (
          <article key={o.id} className="glass rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg">#{o.order_number}</div>
              <div className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-bold">{ORDER_STATUS_LABEL[o.status]}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(o.created_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
              {" • "}{o.order_type === "delivery" ? "🛵 Livraison" : "🏪 Click & Collect"}
            </div>
            <div className="text-sm">
              <div className="font-medium">{o.customer_name}</div>
              <a href={`tel:${o.customer_phone}`} className="text-primary">{o.customer_phone}</a>
              {o.delivery_address && <div className="text-muted-foreground text-xs mt-1">{o.delivery_address}</div>}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-display">{formatPrice(o.total_cents)}</span>
              <span className="text-xs text-muted-foreground">{o.paid ? "✓ Payée" : o.payment_method === "online" ? "CB en attente" : "Sur place"}</span>
            </div>
            {NEXT[o.status]?.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2">
                {NEXT[o.status].map((a) => (
                  <button key={a.next} onClick={() => updateStatus(o.id, a.next)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${a.next === "cancelled" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
