import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  Users,
  MessageSquare,
  LogOut,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderItem, OrderStatus } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/staff/")({
  component: StaffDashboardPage,
});

function StaffDashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

// ─── Types ──────────────────────────────────────────────────────

type Tab = "kitchen" | "orders" | "applications" | "messages";

type Application = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  message: string;
  cv_url: string | null;
  status: "new" | "reviewed" | "contacted" | "rejected";
};

type Contact = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
};

// ─── Helpers ────────────────────────────────────────────────────

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  preparing: "En préparation",
  ready: "Prêt",
  completed: "Terminé",
  cancelled: "Annulé",
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  draft: "border-gray-500/30 bg-gray-500/10 text-gray-400",
  pending: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
  preparing: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  ready: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  completed: "border-gray-500/30 bg-gray-500/10 text-gray-400",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
};

const APP_STATUS_LABEL: Record<Application["status"], string> = {
  new: "Nouveau",
  reviewed: "Vu",
  contacted: "Contacté",
  rejected: "Refusé",
};

const APP_STATUS_BADGE: Record<Application["status"], string> = {
  new: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
  reviewed: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  contacted: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400",
};

// ─── Main Dashboard ─────────────────────────────────────────────

function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("kitchen");
  const [pendingCount, setPendingCount] = useState(0);
  const [newMessages, setNewMessages] = useState(0);
  const [newApplications, setNewApplications] = useState(0);

  const refreshCounts = useCallback(async () => {
    const [{ count: pc }, { count: mc }, { count: ac }] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "preparing"]),
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("status", "unread"),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
    ]);
    setPendingCount(pc ?? 0);
    setNewMessages(mc ?? 0);
    setNewApplications(ac ?? 0);
  }, []);

  useEffect(() => {
    refreshCounts();
    const ch = supabase
      .channel("dashboard-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refreshCounts)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts" }, refreshCounts)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "applications" }, refreshCounts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshCounts]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "kitchen", label: "Cuisine", icon: <ChefHat size={18} />, badge: pendingCount },
    { id: "orders", label: "Commandes", icon: <ClipboardList size={18} /> },
    { id: "applications", label: "Candidatures", icon: <Users size={18} />, badge: newApplications },
    { id: "messages", label: "Messages", icon: <MessageSquare size={18} />, badge: newMessages },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-5 py-3">
        <Link to="/" className="font-display text-lg tracking-widest opacity-80 hover:opacity-100">
          CRAZY TOASTY
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
          <button
            onClick={() => signOut()}
            title="Déconnexion"
            className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-red-500/30 hover:text-red-400"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="flex overflow-x-auto border-b border-border/40 bg-card/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge != null && tab.badge > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-glow">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === "kitchen" && <KitchenView onCountChange={refreshCounts} />}
        {activeTab === "orders" && <OrdersView />}
        {activeTab === "applications" && <ApplicationsView onRead={refreshCounts} />}
        {activeTab === "messages" && <MessagesView onRead={refreshCounts} />}
      </main>

      <Toaster />
    </div>
  );
}

// ─── Kitchen View ────────────────────────────────────────────────

function KitchenView({ onCountChange }: { onCountChange: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: true });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const ch = supabase
      .channel("kitchen-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
        onCountChange();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadOrders, onCountChange]);

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Erreur lors de la mise à jour.");
    else loadOrders();
  }

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  if (loading) return <LoadingState />;

  return (
    <div className="p-4 md:p-6">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ChefHat size={48} className="mb-4 text-muted-foreground/30" />
          <p className="text-lg font-semibold text-muted-foreground">Aucune commande active</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Les nouvelles commandes apparaîtront ici en temps réel.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <KitchenColumn
            title="En attente"
            color="yellow"
            orders={pending}
            onSetStatus={setStatus}
          />
          <KitchenColumn
            title="En préparation"
            color="blue"
            orders={preparing}
            onSetStatus={setStatus}
          />
          <KitchenColumn
            title="Prêt à servir"
            color="green"
            orders={ready}
            onSetStatus={setStatus}
          />
        </div>
      )}
    </div>
  );
}

function KitchenColumn({
  title,
  color,
  orders,
  onSetStatus,
}: {
  title: string;
  color: "yellow" | "blue" | "green";
  orders: Order[];
  onSetStatus: (id: string, status: OrderStatus) => void;
}) {
  const borderColor = {
    yellow: "border-yellow-500/30",
    blue: "border-blue-500/30",
    green: "border-emerald-500/30",
  }[color];

  const headerColor = {
    yellow: "text-yellow-300",
    blue: "text-blue-300",
    green: "text-emerald-300",
  }[color];

  return (
    <div className={`rounded-2xl border ${borderColor} bg-card/40 p-4`}>
      <div className={`mb-4 flex items-center justify-between font-display text-base ${headerColor}`}>
        <span>{title}</span>
        {orders.length > 0 && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-foreground/70">
            {orders.length}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground/50">Vide</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <KitchenCard key={order.id} order={order} onSetStatus={onSetStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenCard({
  order,
  onSetStatus,
}: {
  order: Order;
  onSetStatus: (id: string, status: OrderStatus) => void;
}) {
  const status = order.status as OrderStatus;
  return (
    <div className="rounded-xl border border-border/50 bg-background/70 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold leading-snug">{order.customer_name}</p>
          <p className="text-xs text-muted-foreground">{fmtTime(order.created_at)}</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground/60">
          #{order.id.split("-")[0].toUpperCase()}
        </span>
      </div>

      <ul className="mb-3 space-y-1 text-sm">
        {(order.items as OrderItem[]).map((item) => (
          <li key={item.id} className="flex gap-1.5">
            <span className="text-muted-foreground/60">×{item.quantity}</span>
            <span className="text-foreground/90">{item.name}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mb-3 rounded-lg border border-border/40 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
          💬 {order.notes}
        </p>
      )}

      <div className="flex gap-2">
        {status === "pending" && (
          <>
            <button
              onClick={() => onSetStatus(order.id, "preparing")}
              className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/15 py-1.5 text-xs font-bold text-blue-300 transition hover:bg-blue-500/25"
            >
              → Préparer
            </button>
            <button
              onClick={() => onSetStatus(order.id, "cancelled")}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
            >
              ✕
            </button>
          </>
        )}
        {status === "preparing" && (
          <button
            onClick={() => onSetStatus(order.id, "ready")}
            className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
          >
            ✓ Prêt à servir
          </button>
        )}
        {status === "ready" && (
          <button
            onClick={() => onSetStatus(order.id, "completed")}
            className="flex-1 rounded-lg border border-gray-500/30 bg-gray-500/15 py-1.5 text-xs font-bold text-gray-300 transition hover:bg-gray-500/25"
          >
            ✓ Récupérée
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Orders View ─────────────────────────────────────────────────

function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from("orders")
      .select("*")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data } = await query;
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusOptions: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "preparing", label: "En préparation" },
    { value: "ready", label: "Prêt" },
    { value: "completed", label: "Terminé" },
    { value: "cancelled", label: "Annulé" },
  ];

  async function setStatus(id: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", id);
    loadOrders();
  }

  return (
    <div className="p-4 md:p-6">
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou tél…"
          className="w-full rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/40 sm:w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
          className="rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm outline-none transition focus:border-primary/40"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Aucune commande trouvée.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onSetStatus={setStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onSetStatus,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onSetStatus: (id: string, status: OrderStatus) => void;
}) {
  const status = order.status as OrderStatus;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/3"
      >
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-semibold">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm">{fmtDate(order.created_at)} · {fmtTime(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold text-emerald-300">{formatEuro(order.total_cents)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Statut</p>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>
        <Eye size={16} className="shrink-0 text-muted-foreground/50" />
      </button>

      {expanded && (
        <div className="border-t border-border/40 p-4">
          <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p>{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paiement</p>
              <p className="capitalize">{order.payment_status === "paid" ? "✓ Payé en ligne" : "À la caisse"}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Remarques</p>
                <p>{order.notes}</p>
              </div>
            )}
          </div>

          <ul className="mb-4 space-y-1.5 rounded-xl border border-border/40 bg-background/50 p-3 text-sm">
            {(order.items as OrderItem[]).map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                <span className="font-semibold text-emerald-300">{formatEuro(item.priceCents * item.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border/40 pt-2 font-bold">
              <span>Total</span>
              <span className="text-emerald-300">{formatEuro(order.total_cents)}</span>
            </li>
          </ul>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {status === "pending" && (
              <>
                <button onClick={() => onSetStatus(order.id, "preparing")} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20">→ Préparer</button>
                <button onClick={() => onSetStatus(order.id, "cancelled")} className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20">✕ Annuler</button>
              </>
            )}
            {status === "preparing" && (
              <button onClick={() => onSetStatus(order.id, "ready")} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20">✓ Prêt à servir</button>
            )}
            {status === "ready" && (
              <button onClick={() => onSetStatus(order.id, "completed")} className="rounded-lg border border-gray-500/30 bg-gray-500/10 px-4 py-1.5 text-xs font-bold text-gray-300 transition hover:bg-gray-500/20">✓ Récupérée</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Applications View ──────────────────────────────────────────

function ApplicationsView({ onRead }: { onRead: () => void }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: Application["status"]) {
    await supabase.from("applications").update({ status }).eq("id", id);
    load();
    onRead();
  }

  return (
    <div className="p-4 md:p-6">
      {loading ? (
        <LoadingState />
      ) : apps.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Aucune candidature pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
              <button
                onClick={() => {
                  setExpandedId(expandedId === app.id ? null : app.id);
                  if (app.status === "new") setStatus(app.id, "reviewed");
                }}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/3"
              >
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className="text-sm font-semibold">{app.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Poste</p>
                    <p className="text-sm">{app.position}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm">{fmtDate(app.created_at)}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${APP_STATUS_BADGE[app.status]}`}>
                      {APP_STATUS_LABEL[app.status]}
                    </span>
                  </div>
                </div>
                <Eye size={16} className="shrink-0 text-muted-foreground/50" />
              </button>

              {expandedId === app.id && (
                <div className="border-t border-border/40 p-4 text-sm">
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div><p className="text-xs text-muted-foreground">Email</p><p>{app.email}</p></div>
                    <div><p className="text-xs text-muted-foreground">Téléphone</p><p>{app.phone}</p></div>
                  </div>
                  <div className="mb-4">
                    <p className="mb-1 text-xs text-muted-foreground">Lettre de motivation</p>
                    <p className="rounded-xl border border-border/40 bg-background/50 p-3 leading-relaxed">{app.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.cv_url && (
                      <a
                        href={app.cv_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/80 px-4 py-1.5 text-xs font-semibold transition hover:border-primary/40"
                      >
                        <Download size={13} /> CV
                      </a>
                    )}
                    <button onClick={() => setStatus(app.id, "contacted")} className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20">
                      <CheckCircle size={13} /> Contacté
                    </button>
                    <button onClick={() => setStatus(app.id, "rejected")} className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20">
                      <XCircle size={13} /> Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Messages View ───────────────────────────────────────────────

function MessagesView({ onRead }: { onRead: () => void }) {
  const [messages, setMessages] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMessages(data as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    await supabase.from("contacts").update({ status: "read" }).eq("id", id).eq("status", "unread");
    load();
    onRead();
  }

  async function markReplied(id: string) {
    await supabase.from("contacts").update({ status: "replied" }).eq("id", id);
    load();
    onRead();
  }

  const contactStatusBadge: Record<Contact["status"], string> = {
    unread: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
    read: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    replied: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };
  const contactStatusLabel: Record<Contact["status"], string> = {
    unread: "Non lu",
    read: "Lu",
    replied: "Répondu",
  };

  return (
    <div className="p-4 md:p-6">
      {loading ? (
        <LoadingState />
      ) : messages.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Aucun message pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
              <button
                onClick={() => {
                  setExpandedId(expandedId === msg.id ? null : msg.id);
                  if (msg.status === "unread") markRead(msg.id);
                }}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/3"
              >
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className={`text-sm font-semibold ${msg.status === "unread" ? "text-foreground" : ""}`}>{msg.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sujet</p>
                    <p className="text-sm">{msg.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm">{fmtDate(msg.created_at)}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${contactStatusBadge[msg.status]}`}>
                      {contactStatusLabel[msg.status]}
                    </span>
                  </div>
                </div>
                <Eye size={16} className="shrink-0 text-muted-foreground/50" />
              </button>

              {expandedId === msg.id && (
                <div className="border-t border-border/40 p-4 text-sm">
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div><p className="text-xs text-muted-foreground">Email</p><a href={`mailto:${msg.email}`} className="text-primary hover:underline">{msg.email}</a></div>
                    {msg.phone && <div><p className="text-xs text-muted-foreground">Téléphone</p><p>{msg.phone}</p></div>}
                  </div>
                  <div className="mb-4">
                    <p className="mb-1 text-xs text-muted-foreground">Message</p>
                    <p className="rounded-xl border border-border/40 bg-background/50 p-3 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                      onClick={() => markReplied(msg.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      ✉ Répondre
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
