import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useStaffAuth } from "@/hooks/use-staff-auth";
import { formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { toast, Toaster } from "sonner";
import { LogOut, Plus, Trash2, Pencil, Upload, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/staff/manager")({
  component: ManagerPortal,
});

type Restaurant = {
  id: string;
  name: string;
  address: string;
  city: string;
  active: boolean;
  delivery_fee_cents: number;
  min_order_cents: number;
};
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  restaurant_id: string | null;
  available: boolean;
  badge: string | null;
  sort_order: number;
  image_url: string | null;
};
type OrderStatus = Database["public"]["Enums"]["order_status"];
type OrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  delivery_address: string | null;
  restaurant_id: string;
  payment_method: string;
  paid: boolean;
};
type OrderItemSummary = { name: string; quantity: number; unit_price_cents: number };

const NEXT_STATUS: Record<OrderStatus, { label: string; next: OrderStatus; danger?: boolean }[]> = {
  pending: [
    { label: "Confirmer", next: "confirmed" },
    { label: "Refuser", next: "cancelled", danger: true },
  ],
  confirmed: [{ label: "En préparation", next: "preparing" }],
  preparing: [{ label: "Prête", next: "ready" }],
  ready: [
    { label: "Livrée", next: "delivered" },
    { label: "Retirée", next: "picked_up" },
  ],
  out_for_delivery: [],
  delivered: [],
  picked_up: [],
  cancelled: [],
  en_preparation: [],
  prete: [],
  en_livraison: [],
  terminee: [],
  annulee: [],
};

function ManagerPortal() {
  const { loading, signOut } = useStaffAuth("manager");
  const [tab, setTab] = useState<"orders" | "menu" | "restaurants">("orders");

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Chargement…
      </main>
    );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs text-muted-foreground">
              ← Site
            </Link>
            <h1 className="font-display text-xl">Portail Manager</h1>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
        <div className="container mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(["orders", "menu", "restaurants"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold whitespace-nowrap ${tab === t ? "bg-primary text-primary-foreground" : "glass"}`}
            >
              {t === "orders" ? "Commandes" : t === "menu" ? "Menu" : "Restaurants"}
            </button>
          ))}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {tab === "orders" && <OrdersLive />}
        {tab === "menu" && <MenuManager />}
        {tab === "restaurants" && <RestaurantsManager />}
      </div>
    </main>
  );
}

function OrdersLive() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<"live" | "today" | "history">("live");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, OrderItemSummary[]>>({});

  const load = async () => {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filter === "live") q = q.in("status", ["pending", "confirmed", "preparing", "ready"]);
    else if (filter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      q = q.gte("created_at", start.toISOString());
    } else q = q.limit(100);
    const { data } = await q;
    setOrders((data ?? []) as OrderRow[]);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("manager-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todays = orders.filter((o) => new Date(o.created_at) >= today);
  const revenue = todays
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total_cents, 0);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Statut mis à jour");
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!items[id]) {
      const { data } = await supabase
        .from("order_items")
        .select("name,quantity,unit_price_cents")
        .eq("order_id", id);
      setItems((m) => ({ ...m, [id]: (data ?? []) as OrderItemSummary[] }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Commandes du jour</div>
          <div className="font-display text-3xl">{todays.length}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">CA du jour</div>
          <div className="font-display text-3xl">{formatPrice(revenue)}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">En cours</div>
          <div className="font-display text-3xl">
            {
              orders.filter((o) =>
                ["pending", "confirmed", "preparing", "ready"].includes(o.status),
              ).length
            }
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["live", "today", "history"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === f ? "bg-primary text-primary-foreground" : "glass"}`}
          >
            {f === "live" ? "En cours" : f === "today" ? "Aujourd'hui" : "Historique"}
          </button>
        ))}
        <button onClick={load} className="ml-auto glass rounded-full p-2">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucune commande</p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="glass rounded-2xl p-4">
            <button
              onClick={() => toggleExpand(o.id)}
              className="w-full flex items-center justify-between text-left gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="font-mono text-lg">#{o.order_number}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    • {o.order_type === "delivery" ? "🛵" : "🏪"} •{" "}
                    {o.paid ? "✓" : o.payment_method === "online" ? "CB ⏳" : "Sur place"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-bold whitespace-nowrap">
                  {ORDER_STATUS_LABEL[o.status] ?? o.status}
                </span>
                <span className="font-display">{formatPrice(o.total_cents)}</span>
              </div>
            </button>
            {expanded === o.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-3 text-sm">
                <div>
                  <a href={`tel:${o.customer_phone}`} className="text-primary">
                    {o.customer_phone}
                  </a>
                  {o.delivery_address && (
                    <div className="text-muted-foreground text-xs mt-1">
                      📍 {o.delivery_address}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {(items[o.id] ?? []).map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {it.quantity}× {it.name}
                      </span>
                      <span className="font-mono">
                        {formatPrice(it.unit_price_cents * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                {NEXT_STATUS[o.status]?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {NEXT_STATUS[o.status].map((a) => (
                      <button
                        key={a.next}
                        onClick={() => updateStatus(o.id, a.next)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${a.danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantsManager() {
  const [list, setList] = useState<Restaurant[]>([]);
  const [editing, setEditing] = useState<Partial<Restaurant> | null>(null);

  const load = () =>
    supabase
      .from("restaurants")
      .select("*")
      .order("name")
      .then(({ data }) => setList((data ?? []) as Restaurant[]));
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.name || !editing.address || !editing.city) {
      toast.error("Nom, adresse et ville requis");
      return;
    }
    const payload = {
      name: editing.name,
      address: editing.address,
      city: editing.city,
      delivery_fee_cents: editing.delivery_fee_cents ?? 0,
      min_order_cents: editing.min_order_cents ?? 0,
      active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("restaurants").update(payload).eq("id", editing.id)
      : await supabase.from("restaurants").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Sauvegardé");
      setEditing(null);
      load();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ce restaurant ?")) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Supprimé");
      load();
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditing({})}
        className="rounded-full bg-primary text-primary-foreground px-4 py-2 font-bold flex items-center gap-2"
      >
        <Plus className="h-4 w-4" /> Ajouter un restaurant
      </button>
      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-display text-lg">{r.name}</div>
                <div className="text-sm text-muted-foreground">
                  {r.address}, {r.city}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Livraison {formatPrice(r.delivery_fee_cents)} • Min{" "}
                  {formatPrice(r.min_order_cents)}
                </div>
                {!r.active && <span className="text-xs text-destructive">Désactivé</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(r)} className="p-2 hover:text-primary">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => del(r.id)} className="p-2 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-background border border-border rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl mb-4">
              {editing.id ? "Modifier" : "Nouveau"} restaurant
            </h3>
            <div className="space-y-3">
              <input
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Nom"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <input
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Adresse"
                value={editing.address ?? ""}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
              <input
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Ville"
                value={editing.city ?? ""}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="w-full glass rounded-xl px-4 py-3"
                  placeholder="Frais livraison (cts)"
                  value={editing.delivery_fee_cents ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, delivery_fee_cents: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  className="w-full glass rounded-xl px-4 py-3"
                  placeholder="Min commande (cts)"
                  value={editing.min_order_cents ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, min_order_cents: Number(e.target.value) })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />{" "}
                Actif
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={save}
                  className="flex-1 rounded-full bg-primary text-primary-foreground py-2 font-bold"
                >
                  Sauvegarder
                </button>
                <button onClick={() => setEditing(null)} className="px-4 py-2 glass rounded-full">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [editing, setEditing] = useState<Partial<MenuItem> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [catFilter, setCatFilter] = useState<string>("Tout");

  const load = async () => {
    const [{ data: it }, { data: rs }] = await Promise.all([
      supabase.from("menu_items").select("*").order("category").order("sort_order"),
      supabase.from("restaurants").select("*").order("name"),
    ]);
    setItems((it ?? []) as MenuItem[]);
    setRestaurants((rs ?? []) as Restaurant[]);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.name || editing.price_cents == null || !editing.category) {
      toast.error("Nom, prix et catégorie requis");
      return;
    }
    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      price_cents: editing.price_cents,
      category: editing.category,
      restaurant_id: editing.restaurant_id ?? null,
      available: editing.available ?? true,
      badge: editing.badge || null,
      sort_order: editing.sort_order ?? 0,
      image_url: editing.image_url ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Sauvegardé");
      setEditing(null);
      load();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ce plat ?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Supprimé");
      load();
    }
  };

  const toggleAvailable = async (id: string, available: boolean) => {
    await supabase.from("menu_items").update({ available }).eq("id", id);
    load();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setEditing((e) => ({ ...(e ?? {}), image_url: data.publicUrl }));
      toast.success("Image téléchargée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec upload");
    } finally {
      setUploading(false);
    }
  };

  const categories = Array.from(new Set(items.map((m) => m.category)));
  const visibleItems = catFilter === "Tout" ? items : items.filter((m) => m.category === catFilter);
  const grouped = visibleItems.reduce<Record<string, MenuItem[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setEditing({ available: true, sort_order: 0 })}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 font-bold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Ajouter un plat
        </button>
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setCatFilter("Tout")}
            className={`rounded-full px-3 py-1.5 text-xs whitespace-nowrap ${catFilter === "Tout" ? "bg-primary text-primary-foreground" : "glass"}`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`rounded-full px-3 py-1.5 text-xs whitespace-nowrap ${catFilter === c ? "bg-primary text-primary-foreground" : "glass"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <h3 className="font-display text-lg mb-2 text-primary">{cat}</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {list.map((m) => (
              <div key={m.id} className="glass rounded-xl p-3 flex gap-3 items-start">
                {m.image_url ? (
                  <img
                    src={m.image_url}
                    alt={m.name}
                    className="h-14 w-14 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-2xl">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(m.price_cents)}
                    {m.badge && ` • ${m.badge}`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={m.available}
                      onChange={(e) => toggleAvailable(m.id, e.target.checked)}
                    />{" "}
                    Dispo
                  </label>
                  <button onClick={() => setEditing(m)} className="p-2 hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(m.id)} className="p-2 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-background border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl mb-4">
              {editing.id ? "Modifier" : "Nouveau"} plat
            </h3>
            <div className="space-y-3">
              {/* Image */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Photo</label>
                {editing.image_url ? (
                  <div className="relative">
                    <img
                      src={editing.image_url}
                      className="w-full aspect-[4/3] object-cover rounded-xl"
                      alt=""
                    />
                    <button
                      onClick={() => setEditing({ ...editing, image_url: null })}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-[4/3] glass rounded-xl cursor-pointer hover:bg-white/10">
                    {uploading ? (
                      <span className="text-sm">Envoi…</span>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mb-2" />
                        <span className="text-sm">Choisir une image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(f);
                      }}
                    />
                  </label>
                )}
              </div>
              <input
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Nom"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <textarea
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Description"
                rows={3}
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="w-full glass rounded-xl px-4 py-3"
                  placeholder="Prix (centimes)"
                  value={editing.price_cents ?? ""}
                  onChange={(e) => setEditing({ ...editing, price_cents: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="w-full glass rounded-xl px-4 py-3"
                  placeholder="Ordre"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
              <input
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Catégorie"
                list="cats"
                value={editing.category ?? ""}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              />
              <datalist id="cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <input
                className="w-full glass rounded-xl px-4 py-3"
                placeholder="Badge (ex: Nouveau, Spicy 🔥)"
                value={editing.badge ?? ""}
                onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
              />
              <select
                className="w-full glass rounded-xl px-4 py-3 bg-background"
                value={editing.restaurant_id ?? ""}
                onChange={(e) => setEditing({ ...editing, restaurant_id: e.target.value || null })}
              >
                <option value="">Tous les restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.available ?? true}
                  onChange={(e) => setEditing({ ...editing, available: e.target.checked })}
                />{" "}
                Disponible
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={save}
                  className="flex-1 rounded-full bg-primary text-primary-foreground py-2 font-bold"
                >
                  Sauvegarder
                </button>
                <button onClick={() => setEditing(null)} className="px-4 py-2 glass rounded-full">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
