import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChefHat, History, LogOut, User, Users, Maximize2, Minimize2, Menu, X,
  ChevronDown, ChevronLeft, ChevronRight, Sparkles, Lock, MessageSquare,
  Shield, ShieldCheck, RefreshCw, Eye, CheckCircle, XCircle, Download,
  Palette, KeyRound, Package, LayoutDashboard, Euro, ShoppingBag,
  SlidersHorizontal, Percent, CalendarDays, Clock, FileText, Mail,
  Building2, Bike, Gamepad2,
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
      <StaffPinProvider>
        <StaffPageInner />
      </StaffPinProvider>
    </ProtectedRoute>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TabValue =
  | "kitchen" | "orders" | "timetracking"
  | "messages" | "applications" | "dashboard" | "sales"
  | "products" | "options" | "promotions" | "planning"
  | "pointage-history" | "invoices" | "email" | "users"
  | "delivery" | "inventory" | "settings-restaurants"
  | "theme" | "settings-password" | "game";

type StaffTheme = "light" | "dark" | "auto";

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

interface NavItem {
  value: TabValue;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  badge?: number;
  disabled?: boolean;
  disabledLabel?: string;
  category: "cuisine" | "gestion" | "parametres";
}

// ─── Staff PIN Context ────────────────────────────────────────────────────────

const SESSION_KEY = "ct_staff_admin_session";

interface PinCtx {
  isAdminUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const PinContext = createContext<PinCtx>({
  isAdminUnlocked: false,
  unlock: () => {},
  lock: () => {},
});

function StaffPinProvider({ children }: { children: ReactNode }) {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const unlock = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsAdminUnlocked(true);
  }, []);
  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAdminUnlocked(false);
  }, []);
  return (
    <PinContext.Provider value={{ isAdminUnlocked, unlock, lock }}>
      {children}
    </PinContext.Provider>
  );
}

function useStaffPin() {
  return useContext(PinContext);
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const getSystemPrefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const DARK_VARS: CSSProperties = {
  colorScheme: "dark",
  "--background": "oklch(0.16 0.06 270)",
  "--foreground": "oklch(0.98 0.005 80)",
  "--card": "oklch(0.21 0.07 270)",
  "--card-foreground": "oklch(0.98 0.005 80)",
  "--popover": "oklch(0.21 0.07 270)",
  "--popover-foreground": "oklch(0.98 0.005 80)",
  "--muted": "oklch(0.26 0.06 270)",
  "--muted-foreground": "oklch(0.78 0.02 270)",
  "--border": "oklch(0.30 0.06 270)",
  "--input": "oklch(0.26 0.06 270)",
  "--primary": "oklch(0.72 0.2 48)",
  "--primary-foreground": "oklch(0.16 0.06 270)",
  "--destructive": "oklch(0.6 0.24 27)",
  "--destructive-foreground": "oklch(0.98 0.005 80)",
} as CSSProperties;

const LIGHT_VARS: CSSProperties = {
  colorScheme: "light",
  "--background": "oklch(0.97 0.005 80)",
  "--foreground": "oklch(0.18 0.03 250)",
  "--card": "oklch(0.94 0.005 80)",
  "--card-foreground": "oklch(0.18 0.03 250)",
  "--popover": "oklch(0.94 0.005 80)",
  "--popover-foreground": "oklch(0.18 0.03 250)",
  "--muted": "oklch(0.90 0.01 250)",
  "--muted-foreground": "oklch(0.50 0.03 250)",
  "--border": "oklch(0.84 0.02 250)",
  "--input": "oklch(0.90 0.01 250)",
  "--primary": "oklch(0.72 0.2 48)",
  "--primary-foreground": "oklch(0.97 0.005 80)",
  "--destructive": "oklch(0.55 0.22 27)",
  "--destructive-foreground": "oklch(0.97 0.005 80)",
} as CSSProperties;

// ─── PIN Modal ────────────────────────────────────────────────────────────────

const ADMIN_PIN = "3132";

function PinModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);

  function press(digit: string) {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        onSuccess();
        onClose();
      } else {
        setShake(true);
        setTimeout(() => { setInput(""); setShake(false); }, 600);
      }
    }
  }

  function backspace() { setInput((p) => p.slice(0, -1)); }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-3xl border border-border/60 bg-card p-7 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              Accès Manager
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Entrez votre code PIN</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className={`flex justify-center gap-3 mb-6 ${shake ? "animate-bounce" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < input.length
                ? shake ? "bg-destructive border-destructive" : "bg-primary border-primary"
                : "border-border bg-transparent"
            }`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {keys.map((key, idx) =>
            key === "" ? (
              <div key={idx} />
            ) : (
              <button
                key={idx}
                type="button"
                onClick={() => (key === "⌫" ? backspace() : press(key))}
                className={`rounded-xl border py-3.5 text-base font-semibold transition-all active:scale-95 ${
                  key === "⌫"
                    ? "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    : "border-border/40 bg-card hover:bg-muted/50 hover:border-primary/30 text-foreground"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {key}
              </button>
            )
          )}
        </div>

        {shake && <p className="mt-4 text-center text-xs text-destructive">Code incorrect</p>}
      </div>
    </div>
  );
}

// ─── Staff Page Inner ─────────────────────────────────────────────────────────

function StaffPageInner() {
  const { user, signOut } = useAuth();
  const { isAdminUnlocked, unlock, lock } = useStaffPin();
  const navigate = useNavigate();

  // Theme
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  const [currentTheme, setCurrentTheme] = useState<StaffTheme>(() => {
    const s = localStorage.getItem("ct-staff-theme");
    return s === "light" || s === "dark" || s === "auto" ? s : "auto";
  });
  const resolved: "light" | "dark" =
    currentTheme === "auto" ? (systemPrefersDark ? "dark" : "light") : currentTheme;
  const themeVars = resolved === "dark" ? DARK_VARS : LIGHT_VARS;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => setSystemPrefersDark(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => { localStorage.setItem("ct-staff-theme", currentTheme); }, [currentTheme]);

  // Layout
  const [activeTab, setActiveTab] = useState<TabValue>("kitchen");
  const [sidebarVisible, setSidebarVisible] = useState(
    () => localStorage.getItem("ct-staff-sidebar") !== "false"
  );
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    { cuisine: true, gestion: true, parametres: false }
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabValue | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Badges
  const [pendingOrders, setPendingOrders] = useState(0);
  const [newMessages, setNewMessages] = useState(0);
  const [newApplications, setNewApplications] = useState(0);

  const fetchBadges = useCallback(async () => {
    const [{ count: pc }, { count: mc }, { count: ac }] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["pending", "preparing"]),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "unread"),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "new"),
    ]);
    setPendingOrders(pc ?? 0);
    setNewMessages(mc ?? 0);
    setNewApplications(ac ?? 0);
  }, []);

  useEffect(() => {
    fetchBadges();
    const ch = supabase
      .channel("ct-staff-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchBadges)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, fetchBadges)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, fetchBadges)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBadges]);

  useEffect(() => { localStorage.setItem("ct-staff-sidebar", String(sidebarVisible)); }, [sidebarVisible]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const notifBadge = newMessages + newApplications;

  const navItems: NavItem[] = [
    // ── Cuisine ──
    { value: "kitchen",          label: "Commandes",          icon: ChefHat,          category: "cuisine", badge: pendingOrders },
    { value: "orders",           label: "Historique",         icon: History,          category: "cuisine" },
    { value: "timetracking",     label: "Pointage",           icon: Clock,            category: "cuisine", disabled: true, disabledLabel: "Bientôt" },
    // ── Gestion ──
    { value: "messages",         label: "Messages",           icon: MessageSquare,    category: "gestion", adminOnly: true, badge: newMessages },
    { value: "applications",     label: "Candidatures",       icon: Users,            category: "gestion", adminOnly: true, badge: newApplications },
    { value: "dashboard",        label: "Dashboard",          icon: LayoutDashboard,  category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "sales",            label: "Ventes",             icon: Euro,             category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "products",         label: "Produits & Tarifs",  icon: ShoppingBag,      category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "options",          label: "Options produits",   icon: SlidersHorizontal,category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "promotions",       label: "Promos",             icon: Percent,          category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "invoices",         label: "Factures",           icon: FileText,         category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "planning",         label: "Planning",           icon: CalendarDays,     category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "pointage-history", label: "Historique pointage",icon: Clock,            category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "inventory",        label: "Inventaire",         icon: Package,          category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "users",            label: "Équipe",             icon: Users,            category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "delivery",         label: "Livraisons",         icon: Bike,             category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "email",            label: "Campagnes email",    icon: Mail,             category: "gestion", adminOnly: true, disabled: true, disabledLabel: "Bientôt" },
    { value: "settings-restaurants", label: "Restaurant",    icon: Building2,        category: "gestion", adminOnly: true },
    // ── Paramètres ──
    { value: "theme",            label: "Thème",              icon: Palette,          category: "parametres" },
    { value: "settings-password",label: "Mot de passe",      icon: KeyRound,         category: "parametres", adminOnly: true },
    { value: "game",             label: "Jeu",                icon: Gamepad2,         category: "parametres" },
  ];

  const currentTabInfo = navItems.find((i) => i.value === activeTab);

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function handleTabChange(value: TabValue) {
    const item = navItems.find((i) => i.value === value);
    if (item?.disabled) { setMobileMenuOpen(false); return; }
    if (item?.adminOnly && !isAdminUnlocked) {
      setPendingTab(value);
      setShowPinModal(true);
      return;
    }
    setActiveTab(value);
    setMobileMenuOpen(false);
  }

  function handlePinSuccess() {
    unlock();
    if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null); }
  }

  async function handleSignOut() {
    lock();
    await signOut();
    navigate({ to: "/staff/login" });
  }

  function handleLock() {
    lock();
    setActiveTab("kitchen");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }

  // ── Nav item ────────────────────────────────────────────────────────────────

  function renderNavItem(item: NavItem, size: "sm" | "lg" = "sm") {
    const Icon = item.icon;
    const isActive = activeTab === item.value;
    const isDisabled = !!item.disabled;
    const base =
      size === "sm"
        ? "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
        : "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all";
    return (
      <button
        key={item.value}
        type="button"
        disabled={isDisabled}
        onClick={() => handleTabChange(item.value)}
        className={`${base} ${
          isDisabled
            ? "cursor-not-allowed text-muted-foreground/40 opacity-60"
            : isActive
            ? "bg-primary/15 text-foreground shadow-sm ring-1 ring-primary/20"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Icon size={size === "sm" ? 15 : 18} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.disabledLabel && (
          <span className="ml-auto rounded-full border border-border/50 bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {item.disabledLabel}
          </span>
        )}
        {!item.disabledLabel && item.badge != null && item.badge > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
      </button>
    );
  }

  // ── Nav category ────────────────────────────────────────────────────────────

  function renderNavCategory(
    category: "cuisine" | "gestion" | "parametres",
    emoji: string,
    label: string,
    size: "sm" | "lg" = "sm"
  ) {
    const items = navItems.filter(
      (i) => i.category === category && (!i.adminOnly || isAdminUnlocked)
    );
    if (items.length === 0) return null;
    const open = openCategories[category];
    const totalBadge = items.reduce((acc, i) => acc + (i.badge ?? 0), 0);

    return (
      <div key={category}>
        <button
          type="button"
          onClick={() => toggleCategory(category)}
          className={`flex items-center justify-between w-full rounded-xl bg-muted/40 hover:bg-muted/60 transition-all group ${
            size === "sm" ? "px-3 py-2.5" : "px-4 py-3"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={size === "sm" ? "text-lg" : "text-xl"}>{emoji}</span>
            <span
              className={`font-semibold text-foreground ${size === "sm" ? "text-sm" : "text-base"}`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {label}
            </span>
            {totalBadge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground animate-pulse">
                {totalBadge}
              </span>
            )}
          </div>
          <ChevronDown
            size={size === "sm" ? 15 : 18}
            className={`text-muted-foreground group-hover:text-foreground transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </button>

        {open && (
          <div className="mt-1.5 pl-2">
            <div className="space-y-0.5 border-l-2 border-primary/20 pl-2">
              {items.map((item) => renderNavItem(item, size))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Tab content ─────────────────────────────────────────────────────────────

  function renderContent() {
    switch (activeTab) {
      case "kitchen":       return <KitchenView onCountChange={fetchBadges} />;
      case "orders":        return <OrdersView />;
      case "messages":      return isAdminUnlocked ? <MessagesView onRead={fetchBadges} /> : null;
      case "applications":  return isAdminUnlocked ? <ApplicationsView onRead={fetchBadges} /> : null;
      case "settings-restaurants": return isAdminUnlocked ? <RestaurantPage /> : null;
      case "settings-password":    return isAdminUnlocked ? <PasswordPage /> : null;
      case "theme":         return <ThemePage currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />;
      case "game":          return <GamePage />;
      default:              return null;
    }
  }

  const cardBg = resolved === "dark" ? "oklch(0.21 0.07 270)" : "oklch(0.94 0.005 80)";
  const pageBg = resolved === "dark" ? "oklch(0.16 0.06 270)" : "oklch(0.97 0.005 80)";

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen text-foreground flex flex-col md:flex-row"
      style={{ ...themeVars, backgroundColor: pageBg }}
    >
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col border-r border-border sticky top-0 h-screen transition-all duration-300 overflow-hidden shrink-0"
        style={{ width: sidebarVisible ? "18rem" : "4rem", backgroundColor: cardBg }}
      >
        {/* Sidebar header */}
        <div className="border-b border-border shrink-0" style={{ padding: sidebarVisible ? "1.25rem" : "0.75rem" }}>
          {sidebarVisible ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-foreground tracking-widest leading-none">CRAZY TOASTY</p>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "var(--font-sans)" }}>Espace Staff</p>
              </div>
              {isAdminUnlocked ? (
                <button
                  onClick={handleLock}
                  className="shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 bg-amber-500/15 border border-amber-500/35 rounded-xl text-amber-400 hover:bg-amber-500/25 transition-all"
                >
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-bold leading-none" style={{ fontFamily: "var(--font-sans)" }}>Manager</span>
                </button>
              ) : (
                <button
                  onClick={() => { setPendingTab(null); setShowPinModal(true); }}
                  className="shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 border border-dashed border-muted-foreground/25 rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group"
                >
                  <Shield size={14} />
                  <span className="text-[9px] font-medium leading-none group-hover:font-semibold" style={{ fontFamily: "var(--font-sans)" }}>Staff</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles size={15} className="text-primary" />
              </div>
              {isAdminUnlocked ? (
                <button onClick={handleLock} title="Verrouiller Manager" className="p-1.5 bg-amber-500/15 border border-amber-500/35 rounded-lg text-amber-400 hover:bg-amber-500/25 transition-all">
                  <ShieldCheck size={14} />
                </button>
              ) : (
                <button onClick={() => { setPendingTab(null); setShowPinModal(true); }} title="Déverrouiller Manager" className="p-1.5 border border-dashed border-muted-foreground/25 rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
                  <Shield size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar nav */}
        {sidebarVisible ? (
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-3">
              {renderNavCategory("cuisine", "🍳", "Cuisine")}
              {renderNavCategory("gestion", "📊", "Gestion")}
              {renderNavCategory("parametres", "⚙️", "Paramètres")}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3">
            <div className="flex flex-col items-center gap-1 px-1.5">
              {navItems
                .filter((i) => !i.disabled && (!i.adminOnly || isAdminUnlocked))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      title={item.label}
                      onClick={() => handleTabChange(item.value)}
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-primary/15 text-foreground ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon size={15} />
                      {item.badge != null && item.badge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Sidebar footer */}
        <div
          className="border-t border-border shrink-0"
          style={
            sidebarVisible
              ? { padding: "0.625rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.375rem" }
              : { padding: "0.375rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }
          }
        >
          {sidebarVisible ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={11} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate leading-tight" style={{ fontFamily: "var(--font-sans)" }}>{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight" style={{ fontFamily: "var(--font-sans)" }}>Espace Staff</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 w-full h-7 rounded-lg border border-border/50 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <LogOut size={12} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <button title={user?.email ?? "Profil"} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={13} className="text-primary" />
              </button>
              <button title="Déconnexion" onClick={handleSignOut} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
                <LogOut size={13} />
              </button>
            </>
          )}

          <button
            onClick={() => setSidebarVisible((v) => !v)}
            title={sidebarVisible ? "Réduire" : "Agrandir"}
            className="flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            style={
              sidebarVisible
                ? { width: "100%", height: "1.5rem", gap: "0.375rem", fontSize: "0.6875rem", fontFamily: "var(--font-sans)" }
                : { width: "2rem", height: "2rem" }
            }
          >
            {sidebarVisible ? (<><ChevronLeft size={13} /><span>Réduire</span></>) : <ChevronRight size={13} />}
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen md:min-h-0">

        {/* Desktop header */}
        <header
          className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-10 backdrop-blur-sm"
          style={{ backgroundColor: resolved === "dark" ? "oklch(0.21 0.07 270 / 0.8)" : "oklch(0.94 0.005 80 / 0.85)" }}
        >
          <div className="flex items-center gap-3">
            {currentTabInfo && (
              <>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <currentTabInfo.icon size={17} className="text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                    {currentTabInfo.label}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                    {activeTab === "kitchen" && "Gérez les commandes en cours"}
                    {activeTab === "orders" && "Consultez l'historique des commandes"}
                    {activeTab === "messages" && "Messages des clients"}
                    {activeTab === "applications" && "Candidatures reçues"}
                    {activeTab === "theme" && "Personnalisez l'apparence"}
                    {activeTab === "settings-password" && "Modifier votre mot de passe"}
                    {activeTab === "settings-restaurants" && "Configuration du restaurant"}
                    {activeTab === "game" && "Détendez-vous un peu"}
                  </p>
                </div>
              </>
            )}
          </div>
          {/* Theme toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/40 bg-muted/20">
            {(["light", "dark", "auto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCurrentTheme(t)}
                title={t === "light" ? "Clair" : t === "dark" ? "Sombre" : "Auto"}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  currentTheme === t
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "light" ? "☀️" : t === "dark" ? "🌙" : "🌗"}
              </button>
            ))}
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden border-b border-border sticky top-0 z-50" style={{ backgroundColor: cardBg }}>
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <span className="font-display text-lg text-foreground tracking-widest leading-none">CRAZY TOASTY</span>
            </div>
            <div className="flex items-center gap-2">
              {isAdminUnlocked ? (
                <button
                  onClick={handleLock}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full text-[11px] font-semibold text-amber-400 hover:bg-amber-500/25 transition-all"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <ShieldCheck size={13} /> Manager <Lock size={10} className="opacity-70" />
                </button>
              ) : (
                <button
                  onClick={() => { setPendingTab(null); setShowPinModal(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-dashed border-muted-foreground/30 rounded-full text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <Shield size={13} /> Staff <Lock size={10} />
                </button>
              )}
              <button onClick={handleSignOut} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile nav overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-[57px] z-40 overflow-auto"
            style={{
              backgroundColor: resolved === "dark" ? "oklch(0.16 0.06 270 / 0.98)" : "oklch(0.97 0.005 80 / 0.98)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="p-4 space-y-3">
              {renderNavCategory("cuisine", "🍳", "Cuisine", "lg")}
              {renderNavCategory("gestion", "📊", "Gestion", "lg")}
              {renderNavCategory("parametres", "⚙️", "Paramètres", "lg")}

              <hr className="border-border/40 my-4" />

              <div className="px-4 py-3 bg-muted/20 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{user?.email}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Espace Staff</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                {(["light", "dark", "auto"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCurrentTheme(t)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      currentTheme === t
                        ? "bg-primary/15 border-primary/30 text-foreground"
                        : "border-border/50 text-muted-foreground"
                    }`}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {t === "light" ? "☀️ Clair" : t === "dark" ? "🌙 Sombre" : "🌗 Auto"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom tab bar */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border z-40"
          style={{
            backgroundColor: resolved === "dark" ? "oklch(0.21 0.07 270 / 0.95)" : "oklch(0.94 0.005 80 / 0.95)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex justify-around items-center py-2 px-1">
            {navItems
              .filter((i) => !i.disabled && (!i.adminOnly || isAdminUnlocked))
              .slice(0, 4)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTabChange(item.value)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] transition-all ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div className="relative">
                      <Icon size={20} className={isActive ? "scale-110" : ""} />
                      {item.badge != null && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`} style={{ fontFamily: "var(--font-sans)" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] text-muted-foreground"
            >
              <Menu size={20} />
              <span className="text-[10px] font-medium" style={{ fontFamily: "var(--font-sans)" }}>Plus</span>
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-8 py-6 pb-24 md:pb-8">
          {/* Notification badge summary if gestion section has badge */}
          {notifBadge > 0 && activeTab === "kitchen" && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{notifBadge}</span>
              {notifBadge === 1 ? "1 nouveau message ou candidature en attente" : `${notifBadge} nouveaux messages ou candidatures en attente`}
            </div>
          )}
          {renderContent()}
        </main>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full border border-border/50 shadow-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          style={{ backgroundColor: cardBg }}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <PinModal
          onClose={() => { setShowPinModal(false); setPendingTab(null); }}
          onSuccess={handlePinSuccess}
        />
      )}

      <Toaster />
    </div>
  );
}

// ─── Theme Page ───────────────────────────────────────────────────────────────

function ThemePage({ currentTheme, setCurrentTheme }: { currentTheme: StaffTheme; setCurrentTheme: (t: StaffTheme) => void }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 space-y-4">
        <p className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>Apparence</p>
        <div className="grid grid-cols-3 gap-4">
          {([
            { value: "light" as const, label: "Clair",  preview: "bg-white border-gray-200" },
            { value: "dark"  as const, label: "Sombre", preview: "bg-gray-900 border-gray-700" },
            { value: "auto"  as const, label: "Auto",   preview: "bg-gradient-to-br from-white to-gray-900 border-gray-400" },
          ]).map(({ value, label, preview }) => (
            <button
              key={value}
              onClick={() => setCurrentTheme(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                currentTheme === value ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <div className={`w-12 h-12 rounded-full border-2 shadow-inner ${preview}`} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center pt-2" style={{ fontFamily: "var(--font-sans)" }}>
          Le thème s'applique uniquement à l'interface du portail staff
        </p>
      </div>
    </div>
  );
}

// ─── Password Page ────────────────────────────────────────────────────────────

function PasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error("Les mots de passe ne correspondent pas."); return; }
    if (newPassword.length < 8) { toast.error("Minimum 8 caractères."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe mis à jour.");
    setNewPassword(""); setConfirm("");
  }

  return (
    <div className="max-w-md">
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
        <p className="mb-5 text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>Changer le mot de passe</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40"
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              Confirmer
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40"
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Restaurant Page ──────────────────────────────────────────────────────────

function RestaurantPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>Crazy Toasty</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Restaurant</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Email de contact", value: "blackpearltoulouse@gmail.com" },
            { label: "Type", value: "Food truck / Snack" },
            { label: "Statut", value: "En activité" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>{label}</p>
              <p className="text-foreground font-medium" style={{ fontFamily: "var(--font-sans)" }}>{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground/60 border-t border-border/40 pt-4" style={{ fontFamily: "var(--font-sans)" }}>
          La configuration avancée du restaurant sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}

// ─── Game Page ────────────────────────────────────────────────────────────────

function GamePage() {
  const [score, setScore] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); setRunning(false); setActive(null); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const show = () => setActive(Math.floor(Math.random() * 9));
    show();
    const t = setInterval(show, 900);
    return () => clearInterval(t);
  }, [running]);

  function start() { setScore(0); setTimeLeft(30); setRunning(true); }

  function hit(i: number) {
    if (i === active) { setScore((s) => s + 1); setActive(null); }
  }

  return (
    <div className="flex flex-col items-center py-10 gap-6">
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>🍞 Attrape le Toast !</p>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "var(--font-sans)" }}>Un mini-jeu pour se détendre entre deux services</p>
      </div>

      <div className="flex items-center gap-8 text-center">
        <div>
          <p className="text-3xl font-bold text-primary">{score}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Score</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-foreground">{timeLeft}s</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Temps</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            onClick={() => hit(i)}
            className={`w-20 h-20 rounded-2xl border-2 text-3xl transition-all active:scale-90 ${
              active === i
                ? "border-primary bg-primary/20 scale-105"
                : "border-border/40 bg-card/40 hover:bg-muted/30"
            }`}
          >
            {active === i ? "🍞" : ""}
          </button>
        ))}
      </div>

      {!running && (
        <button
          onClick={start}
          className="rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground transition hover:opacity-90"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {timeLeft === 0 ? `Rejouer (score: ${score})` : "Commencer"}
        </button>
      )}
    </div>
  );
}

// ─── Kitchen View ─────────────────────────────────────────────────────────────

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
      .channel("ct-kitchen")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { loadOrders(); onCountChange(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadOrders, onCountChange]);

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Erreur lors de la mise à jour.");
    else loadOrders();
  }

  const pending  = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready    = orders.filter((o) => o.status === "ready");

  if (loading) return <Spinner />;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ChefHat size={48} className="mb-4 text-muted-foreground/30" />
        <p className="text-lg font-semibold text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Aucune commande active</p>
        <p className="mt-1 text-sm text-muted-foreground/60" style={{ fontFamily: "var(--font-sans)" }}>Les nouvelles commandes apparaîtront ici en temps réel.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <KitchenColumn title="En attente"    color="yellow" orders={pending}   onSetStatus={setStatus} />
      <KitchenColumn title="En préparation" color="blue"   orders={preparing} onSetStatus={setStatus} />
      <KitchenColumn title="Prêt à servir" color="green"  orders={ready}     onSetStatus={setStatus} />
    </div>
  );
}

function KitchenColumn({ title, color, orders, onSetStatus }: {
  title: string; color: "yellow" | "blue" | "green";
  orders: Order[]; onSetStatus: (id: string, status: OrderStatus) => void;
}) {
  const borderColor = { yellow: "border-yellow-500/30", blue: "border-blue-500/30", green: "border-emerald-500/30" }[color];
  const headerColor = { yellow: "text-yellow-400", blue: "text-blue-400", green: "text-emerald-400" }[color];
  return (
    <div className={`rounded-2xl border ${borderColor} bg-card/40 p-4`}>
      <div className={`mb-4 flex items-center justify-between ${headerColor}`} style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem" }}>
        <span>{title}</span>
        {orders.length > 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-foreground/70">{orders.length}</span>}
      </div>
      {orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground/50" style={{ fontFamily: "var(--font-sans)" }}>Vide</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => <KitchenCard key={order.id} order={order} onSetStatus={onSetStatus} />)}
        </div>
      )}
    </div>
  );
}

function KitchenCard({ order, onSetStatus }: { order: Order; onSetStatus: (id: string, status: OrderStatus) => void }) {
  const status = order.status as OrderStatus;
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground leading-snug" style={{ fontFamily: "var(--font-sans)" }}>{order.customer_name}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>{fmtTime(order.created_at)}</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground/60">#{order.id.split("-")[0].toUpperCase()}</span>
      </div>
      <ul className="mb-3 space-y-1 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
        {(order.items as OrderItem[]).map((item) => (
          <li key={item.id} className="flex gap-1.5">
            <span className="text-muted-foreground/60">×{item.quantity}</span>
            <span className="text-foreground/90">{item.name}</span>
          </li>
        ))}
      </ul>
      {order.notes && (
        <p className="mb-3 rounded-lg border border-border/40 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          💬 {order.notes}
        </p>
      )}
      <div className="flex gap-2">
        {status === "pending" && (
          <>
            <button onClick={() => onSetStatus(order.id, "preparing")} className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/15 py-1.5 text-xs font-bold text-blue-400 transition hover:bg-blue-500/25" style={{ fontFamily: "var(--font-sans)" }}>→ Préparer</button>
            <button onClick={() => onSetStatus(order.id, "cancelled")} className="rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive transition hover:bg-destructive/20">✕</button>
          </>
        )}
        {status === "preparing" && (
          <button onClick={() => onSetStatus(order.id, "ready")} className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/25" style={{ fontFamily: "var(--font-sans)" }}>✓ Prêt à servir</button>
        )}
        {status === "ready" && (
          <button onClick={() => onSetStatus(order.id, "completed")} className="flex-1 rounded-lg border border-border/40 bg-muted/30 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted/60" style={{ fontFamily: "var(--font-sans)" }}>✓ Récupérée</button>
        )}
      </div>
    </div>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon", pending: "En attente", preparing: "En préparation",
  ready: "Prêt", completed: "Terminé", cancelled: "Annulé",
};

const STATUS_BADGE: Record<string, string> = {
  draft:     "border-border/30 bg-muted/20 text-muted-foreground",
  pending:   "border-yellow-500/40 bg-yellow-500/15 text-yellow-400",
  preparing: "border-blue-500/40 bg-blue-500/15 text-blue-400",
  ready:     "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  completed: "border-border/30 bg-muted/20 text-muted-foreground",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").neq("status", "draft").order("created_at", { ascending: false }).limit(100);
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_phone.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function setStatus(id: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", id);
    loadOrders();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou tél…"
          className="w-full rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 sm:w-72"
          style={{ fontFamily: "var(--font-sans)" }}
        />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
          className="rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/40"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <option value="all">Tous les statuts</option>
          {(["pending", "preparing", "ready", "completed", "cancelled"] as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button onClick={loadOrders} className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Aucune commande trouvée.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} expanded={expandedId === order.id} onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)} onSetStatus={setStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, expanded, onToggle, onSetStatus }: {
  order: Order; expanded: boolean; onToggle: () => void; onSetStatus: (id: string, status: OrderStatus) => void;
}) {
  const status = order.status as OrderStatus;
  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/3">
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Client</p><p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{order.customer_name}</p></div>
          <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Date</p><p className="text-sm text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{fmtDate(order.created_at)} · {fmtTime(order.created_at)}</p></div>
          <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Total</p><p className="text-sm font-bold text-emerald-400" style={{ fontFamily: "var(--font-sans)" }}>{formatEuro(order.total_cents)}</p></div>
          <div><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[status]}`} style={{ fontFamily: "var(--font-sans)" }}>{STATUS_LABEL[status]}</span></div>
        </div>
        <Eye size={16} className="shrink-0 text-muted-foreground/50" />
      </button>
      {expanded && (
        <div className="border-t border-border/40 p-4">
          <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Téléphone</p><p className="text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{order.customer_phone}</p></div>
            {order.notes && <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Remarques</p><p className="text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{order.notes}</p></div>}
          </div>
          <ul className="mb-4 space-y-1.5 rounded-xl border border-border/40 bg-background/40 p-3 text-sm">
            {(order.items as OrderItem[]).map((item) => (
              <li key={item.id} className="flex justify-between" style={{ fontFamily: "var(--font-sans)" }}>
                <span className="text-foreground">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                <span className="font-semibold text-emerald-400">{formatEuro(item.priceCents * item.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border/40 pt-2 font-bold" style={{ fontFamily: "var(--font-sans)" }}>
              <span className="text-foreground">Total</span><span className="text-emerald-400">{formatEuro(order.total_cents)}</span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-2">
            {status === "pending" && (<><button onClick={() => onSetStatus(order.id, "preparing")} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 transition hover:bg-blue-500/20" style={{ fontFamily: "var(--font-sans)" }}>→ Préparer</button><button onClick={() => onSetStatus(order.id, "cancelled")} className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-1.5 text-xs font-bold text-destructive transition hover:bg-destructive/20" style={{ fontFamily: "var(--font-sans)" }}>✕ Annuler</button></>)}
            {status === "preparing" && <button onClick={() => onSetStatus(order.id, "ready")} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20" style={{ fontFamily: "var(--font-sans)" }}>✓ Prêt à servir</button>}
            {status === "ready"     && <button onClick={() => onSetStatus(order.id, "completed")} className="rounded-lg border border-border/40 bg-muted/30 px-4 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted/60" style={{ fontFamily: "var(--font-sans)" }}>✓ Récupérée</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Applications View ────────────────────────────────────────────────────────

const APP_STATUS_LABEL: Record<Application["status"], string> = { new: "Nouveau", reviewed: "Vu", contacted: "Contacté", rejected: "Refusé" };
const APP_STATUS_BADGE: Record<Application["status"], string> = {
  new:      "border-yellow-500/40 bg-yellow-500/15 text-yellow-400",
  reviewed: "border-blue-500/40 bg-blue-500/15 text-blue-400",
  contacted:"border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

function ApplicationsView({ onRead }: { onRead: () => void }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: Application["status"]) {
    await supabase.from("applications").update({ status }).eq("id", id);
    load(); onRead();
  }

  if (loading) return <Spinner />;
  if (apps.length === 0) return <p className="py-12 text-center text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Aucune candidature pour l'instant.</p>;

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <div key={app.id} className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
          <button
            onClick={() => { setExpandedId(expandedId === app.id ? null : app.id); if (app.status === "new") setStatus(app.id, "reviewed"); }}
            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/3"
          >
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Nom</p><p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{app.name}</p></div>
              <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Poste</p><p className="text-sm text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{app.position}</p></div>
              <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Date</p><p className="text-sm text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{fmtDate(app.created_at)}</p></div>
              <div><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${APP_STATUS_BADGE[app.status]}`} style={{ fontFamily: "var(--font-sans)" }}>{APP_STATUS_LABEL[app.status]}</span></div>
            </div>
            <Eye size={16} className="shrink-0 text-muted-foreground/50" />
          </button>
          {expandedId === app.id && (
            <div className="border-t border-border/40 p-4 text-sm">
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Email</p><p className="text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{app.email}</p></div>
                <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Téléphone</p><p className="text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{app.phone}</p></div>
              </div>
              <div className="mb-4"><p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Lettre de motivation</p><p className="rounded-xl border border-border/40 bg-background/40 p-3 leading-relaxed text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{app.message}</p></div>
              <div className="flex flex-wrap gap-2">
                {app.cv_url && <a href={app.cv_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-4 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40" style={{ fontFamily: "var(--font-sans)" }}><Download size={13} /> CV</a>}
                <button onClick={() => setStatus(app.id, "contacted")} className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20" style={{ fontFamily: "var(--font-sans)" }}><CheckCircle size={13} /> Contacté</button>
                <button onClick={() => setStatus(app.id, "rejected")}  className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-1.5 text-xs font-bold text-destructive transition hover:bg-destructive/20" style={{ fontFamily: "var(--font-sans)" }}><XCircle size={13} /> Refuser</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Messages View ────────────────────────────────────────────────────────────

const CONTACT_STATUS_BADGE: Record<Contact["status"], string> = {
  unread:  "border-yellow-500/40 bg-yellow-500/15 text-yellow-400",
  read:    "border-blue-500/30 bg-blue-500/10 text-blue-400",
  replied: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};
const CONTACT_STATUS_LABEL: Record<Contact["status"], string> = { unread: "Non lu", read: "Lu", replied: "Répondu" };

function MessagesView({ onRead }: { onRead: () => void }) {
  const [messages, setMessages] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
    if (data) setMessages(data as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) { await supabase.from("contacts").update({ status: "read" }).eq("id", id).eq("status", "unread"); load(); onRead(); }
  async function markReplied(id: string) { await supabase.from("contacts").update({ status: "replied" }).eq("id", id); load(); onRead(); }

  if (loading) return <Spinner />;
  if (messages.length === 0) return <p className="py-12 text-center text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Aucun message pour l'instant.</p>;

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
          <button
            onClick={() => { setExpandedId(expandedId === msg.id ? null : msg.id); if (msg.status === "unread") markRead(msg.id); }}
            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/3"
          >
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Nom</p><p className={`text-sm text-foreground ${msg.status === "unread" ? "font-bold" : "font-semibold"}`} style={{ fontFamily: "var(--font-sans)" }}>{msg.name}</p></div>
              <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Sujet</p><p className="text-sm text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{msg.subject}</p></div>
              <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Date</p><p className="text-sm text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{fmtDate(msg.created_at)}</p></div>
              <div><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${CONTACT_STATUS_BADGE[msg.status]}`} style={{ fontFamily: "var(--font-sans)" }}>{CONTACT_STATUS_LABEL[msg.status]}</span></div>
            </div>
            <Eye size={16} className="shrink-0 text-muted-foreground/50" />
          </button>
          {expandedId === msg.id && (
            <div className="border-t border-border/40 p-4 text-sm">
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Email</p><a href={`mailto:${msg.email}`} className="text-primary hover:underline" style={{ fontFamily: "var(--font-sans)" }}>{msg.email}</a></div>
                {msg.phone && <div><p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Téléphone</p><p className="text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{msg.phone}</p></div>}
              </div>
              <div className="mb-4"><p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Message</p><p className="rounded-xl border border-border/40 bg-background/40 p-3 leading-relaxed whitespace-pre-wrap text-foreground" style={{ fontFamily: "var(--font-sans)" }}>{msg.message}</p></div>
              <div className="flex gap-2">
                <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`} onClick={() => markReplied(msg.id)} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20" style={{ fontFamily: "var(--font-sans)" }}>✉ Répondre</a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Spinner() {
  return <div className="flex justify-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" /></div>;
}

function formatEuro(cents: number) { return `${(cents / 100).toFixed(2).replace(".", ",")} €`; }
function fmtTime(dt: string) { return new Date(dt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(dt: string) { return new Date(dt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
