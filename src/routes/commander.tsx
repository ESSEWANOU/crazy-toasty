import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import type { OrderItem } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ArrowLeft, CreditCard, Clock, MessageSquare, Tag, Check, X,
  Plus, Minus, Trash2, MapPin, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/commander")({
  component: CommanderPage,
});

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const now = new Date();
  const buffer = 15 * 60 * 1000;

  const ranges: [number, number, number, number][] = [
    [11, 30, 14, 30],
    [18, 0,  22, 0 ],
  ];

  for (const [sh, sm, eh, em] of ranges) {
    const cur = new Date();
    cur.setHours(sh, sm, 0, 0);
    const end = new Date();
    end.setHours(eh, em, 0, 0);
    while (cur < end) {
      if (cur.getTime() > now.getTime() + buffer) {
        slots.push(`${String(cur.getHours()).padStart(2, "0")}:${String(cur.getMinutes()).padStart(2, "0")}`);
      }
      cur.setMinutes(cur.getMinutes() + 15);
    }
  }

  return slots;
}

function CommanderPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [ccEnabled, setCcEnabled] = useState<boolean | null>(null);

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [timeSlot, setTimeSlot]           = useState("");
  const [isEditingTime, setIsEditingTime] = useState(false);

  const [promoCode, setPromoCode]       = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError]     = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const timeSlots   = generateTimeSlots();
  const totalCents  = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const promoDiscount = promoApplied ? Math.floor(totalCents * 0.1) : 0;
  const finalCents  = Math.max(0, totalCents - promoDiscount);

  // Load cart + check CC status in parallel
  useEffect(() => {
    try {
      const raw = localStorage.getItem("crazy-toasty-cart");
      if (raw) setItems(JSON.parse(raw) as OrderItem[]);
    } catch { /* ignore */ }
    setItemsLoaded(true);

    supabase
      .from("restaurant_settings")
      .select("click_collect_enabled")
      .limit(1)
      .single()
      .then(({ data }) => {
        setCcEnabled(data?.click_collect_enabled ?? true);
      });
  }, []);

  // Handle Stripe cancel redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "true") {
      toast.error("Paiement annulé. Tu peux réessayer quand tu veux.");
    }
  }, []);

  function syncItems(next: OrderItem[]) {
    setItems(next);
    localStorage.setItem("crazy-toasty-cart", JSON.stringify(next));
  }

  function updateQty(id: string, qty: number) {
    syncItems(qty <= 0 ? items.filter(i => i.id !== id) : items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }

  function removeItem(id: string) {
    syncItems(items.filter(i => i.id !== id));
  }

  function validate(): boolean {
    setError("");
    if (!name.trim())  { setError(t("checkout.nameRequired"));  return false; }
    if (!phone.trim()) { setError(t("checkout.phoneRequired")); return false; }
    if (!timeSlot)     { setError("Choisis un créneau horaire avant de payer."); return false; }
    return true;
  }

  function buildNotes() {
    const slot = timeSlot ? `Retrait: ${timeSlot}` : "";
    const user = notes.trim();
    return [slot, user].filter(Boolean).join(" · ") || null;
  }

  async function handleOnsiteOrder() {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { data, error: dbError } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || null,
          notes: buildNotes(),
          status: "pending",
          total_cents: finalCents,
          items,
          payment_status: "none",
        })
        .select("id")
        .single();

      if (dbError) throw dbError;

      supabase.functions.invoke("send-order-email", {
        body: { order_id: data.id, customer_name: name.trim(), customer_phone: phone.trim(), customer_email: email.trim() || undefined, notes: buildNotes(), total_cents: finalCents, items, payment_type: "onsite" },
      }).catch(() => {});

      localStorage.removeItem("crazy-toasty-cart");
      navigate({ to: "/confirmation", search: { id: data.id, session_id: undefined } });
    } catch {
      setError(t("checkout.errorGeneric"));
      toast.error(t("checkout.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOnlinePayment() {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-payment", {
        body: {
          items,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || undefined,
          notes: buildNotes(),
          total_cents: finalCents,
          site_url: window.location.origin,
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.url) throw new Error("URL de paiement manquante");
      localStorage.removeItem("crazy-toasty-cart");
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("checkout.errorGeneric");
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  }

  function handleApplyPromo() {
    if (promoCode.trim().toUpperCase() === "CRAZYTOASTY10") {
      setPromoApplied(true);
      setPromoError("");
      toast.success("Code promo appliqué ! -10%");
    } else {
      setPromoApplied(false);
      setPromoError("Code promo invalide");
    }
  }

  function handleRemovePromo() {
    setPromoCode("");
    setPromoApplied(false);
    setPromoError("");
  }

  if (!itemsLoaded) return null;

  // ── Click & Collect closed ────────────────────────────────────────
  if (ccEnabled === false) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-8 text-foreground text-center">
        <div className="text-5xl">🔒</div>
        <p className="font-display text-3xl">Commandes fermées</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Le Click &amp; Collect est temporairement indisponible. Reviens bientôt !
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full border border-border/70 bg-card/90 px-6 py-3 text-sm font-semibold text-foreground/80 transition hover:border-primary/40 hover:text-foreground"
        >
          Retour au menu
        </button>
        <Toaster />
      </main>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-8 text-foreground">
        <p className="font-display text-3xl">{t("checkout.emptyCart")}</p>
        <p className="text-sm text-muted-foreground">{t("checkout.emptyCartNote")}</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full border border-border/70 bg-card/90 px-6 py-3 text-sm font-semibold text-foreground/80 transition hover:border-primary/40 hover:text-foreground"
        >
          {t("checkout.backToMenu")}
        </button>
        <Toaster />
      </main>
    );
  }

  // ── Main checkout ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* Full-screen redirect overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <CreditCard className="absolute inset-0 m-auto h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 mb-2 font-display text-2xl text-foreground">
            Redirection vers le paiement...
          </h2>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Tu vas être redirigé vers notre page de paiement sécurisé
          </p>
          <div className="mt-4 flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      <div className="min-h-screen py-6 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">

          {/* Back button */}
          <button
            onClick={() => navigate({ to: "/" })}
            className="mb-4 sm:mb-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au menu
          </button>

          {/* Time slot display card — shown when a slot is selected */}
          {timeSlot && !isEditingTime && (
            <div className="mb-6 rounded-xl border border-primary/30 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Créneau de retrait</p>
                    <p className="font-medium text-foreground">{timeSlot}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingTime(true)}
                  className="rounded-full p-2 text-primary transition hover:bg-primary/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:gap-8 lg:grid-cols-2">

            {/* ── Left column — form ─────────────────────────────── */}
            <div>
              <h1 className="mb-4 sm:mb-8 font-display text-2xl sm:text-4xl text-foreground">
                FINALISER LA{" "}
                <span className="text-primary">COMMANDE</span>
              </h1>

              <form
                onSubmit={(e) => { e.preventDefault(); handleOnlinePayment(); }}
                className="space-y-4 sm:space-y-6"
              >

                {/* Time slot picker */}
                {(!timeSlot || isEditingTime) && (
                  <div className="space-y-3 rounded-3xl border border-border/70 bg-card/90 p-4 sm:p-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h2 className="font-display text-lg sm:text-xl text-foreground">
                        CRÉNEAU DE RETRAIT
                      </h2>
                    </div>
                    {timeSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucun créneau disponible pour le moment. Reviens plus tard !
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => { setTimeSlot(slot); setIsEditingTime(false); }}
                            className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                              timeSlot === slot
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/70 bg-background/80 text-foreground hover:border-primary/40 hover:bg-primary/10"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contact info */}
                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/90 p-4 sm:p-6 sm:space-y-4">
                  <h2 className="font-display text-lg sm:text-xl text-foreground">TES COORDONNÉES</h2>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("checkout.name")} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("checkout.namePlaceholder")}
                      autoComplete="name"
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("checkout.phone")} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("checkout.phonePlaceholder")}
                      autoComplete="tel"
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ton@email.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/90 p-4 sm:p-6 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg sm:text-xl text-foreground">UN MESSAGE ?</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allergie, demande spéciale, ou juste un petit mot pour l'équipe ?
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Sans oignon svp, allergie aux noix..."
                    maxLength={300}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                  />
                  <p className="text-right text-xs text-muted-foreground">{notes.length}/300 caractères</p>
                </div>

                {/* Payment method */}
                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/90 p-4 sm:p-6 sm:space-y-4">
                  <h2 className="font-display text-lg sm:text-xl text-foreground">MODE DE PAIEMENT</h2>
                  <div className="rounded-xl border-2 border-primary bg-primary/10 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-primary" />
                      <div>
                        <p className="text-sm sm:text-base font-medium text-foreground">Paiement en ligne</p>
                        <p className="text-xs text-muted-foreground">Carte bancaire, Apple Pay</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo code */}
                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/90 p-4 sm:p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg sm:text-xl text-foreground">
                    <Tag className="h-5 w-5 text-primary" />
                    CODE PROMO
                  </h2>
                  {promoApplied ? (
                    <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">CRAZYTOASTY10 • -10%</span>
                        <span className="text-sm font-bold text-primary">-{formatEuro(promoDiscount)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                        placeholder="Entre ton code promo"
                        className="flex-1 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm uppercase text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim()}
                        className="rounded-xl border border-border/70 bg-card/80 px-4 py-2.5 text-sm font-semibold transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Appliquer
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-xs text-red-400">{promoError}</p>}
                </div>

                {/* Error */}
                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                {/* Submit buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !timeSlot}
                    className="flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm sm:text-base font-bold text-primary-foreground shadow-glow transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Redirection...
                      </span>
                    ) : !timeSlot
                      ? "Sélectionne un créneau horaire"
                      : `💳 ${t("checkout.payOnline")} · ${formatEuro(finalCents)}`}
                  </button>

                  <button
                    type="button"
                    onClick={handleOnsiteOrder}
                    disabled={isSubmitting || !timeSlot}
                    className="w-full rounded-full border border-border/60 bg-card/80 py-3.5 text-sm font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? t("checkout.submitting") : t("checkout.payOnsite")}
                  </button>
                </div>

              </form>
            </div>

            {/* ── Right column — sticky summary (desktop only) ───── */}
            <div className="hidden lg:block">
              <div className="sticky top-6 overflow-hidden rounded-3xl border border-border/70 bg-card/90">

                {/* Header */}
                <div className="border-b border-border/50 bg-background/50 p-4 sm:p-6">
                  <h2 className="font-display text-lg sm:text-xl text-foreground">RÉCAPITULATIF</h2>
                </div>

                {/* Location + time */}
                <div className="space-y-2 border-b border-border/50 p-4 sm:p-6 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 text-foreground">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm sm:text-base font-medium">Crazy Toasty</p>
                      <p className="truncate text-xs sm:text-sm text-muted-foreground">
                        {t("checkout.pickupAddress")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-foreground">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                    <p className="text-sm sm:text-base">
                      Retrait à{" "}
                      <span className="font-medium">{timeSlot || "—"}</span>
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="max-h-64 overflow-y-auto border-b border-border/50 p-4 sm:p-6">
                  {items.map((item) => (
                    <div key={item.id} className="group flex items-start justify-between py-1.5 sm:py-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm sm:text-base font-medium text-foreground">
                            {item.quantity}x {item.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:bg-destructive/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-sm sm:text-base font-medium text-primary">
                        {formatEuro(item.priceCents * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 bg-background/50 p-4 sm:p-6">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{formatEuro(totalCents)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-sm text-primary">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Code CRAZYTOASTY10 (-10%)
                      </span>
                      <span>-{formatEuro(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border/50 pt-2">
                    <span className="text-base sm:text-lg font-medium text-foreground">Total</span>
                    <span className="font-display text-2xl sm:text-3xl text-primary">
                      {formatEuro(finalCents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile summary — shown above form ─────────────── */}
            <div className="-order-1 overflow-hidden rounded-3xl border border-border/70 bg-card/90 lg:hidden">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 bg-background/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {items.length} article{items.length > 1 ? "s" : ""}
                  </p>
                  <p className="font-display text-xl text-primary">{formatEuro(finalCents)}</p>
                </div>
                {timeSlot && (
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Crazy Toasty</p>
                    <p className="font-medium text-foreground">{timeSlot}</p>
                  </div>
                )}
              </div>

              {/* Items with quantity controls */}
              <div className="max-h-64 space-y-3 overflow-y-auto p-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-sm font-medium text-primary">
                        {formatEuro(item.priceCents * item.quantity)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-0 rounded-lg border border-border/70 bg-background">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="rounded-l-lg p-2 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[24px] text-center text-sm font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="rounded-r-lg p-2 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg p-2 text-destructive transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <Toaster />
    </main>
  );
}
