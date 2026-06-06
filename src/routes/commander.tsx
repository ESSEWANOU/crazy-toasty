import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import type { OrderItem } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/commander")({
  component: CommanderPage,
});

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function CommanderPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState<"online" | "onsite" | null>(null);
  const [error, setError] = useState("");

  const totalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("crazy-toasty-cart");
      if (raw) setItems(JSON.parse(raw) as OrderItem[]);
    } catch {
      // ignore
    }
    setItemsLoaded(true);
  }, []);

  function validate(): boolean {
    setError("");
    if (!name.trim()) { setError(t("checkout.nameRequired")); return false; }
    if (!phone.trim()) { setError(t("checkout.phoneRequired")); return false; }
    return true;
  }

  // ── Payer sur place ────────────────────────────────────────────
  async function handleOnsiteOrder() {
    if (!validate()) return;
    setSubmitting("onsite");

    try {
      const { data, error: dbError } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          notes: notes.trim() || null,
          status: "pending",
          total_cents: totalCents,
          items,
          payment_status: "none",
        })
        .select("id")
        .single();

      if (dbError) throw dbError;

      // Send confirmation email (best-effort, don't block on failure)
      supabase.functions.invoke("send-order-email", {
        body: {
          order_id: data.id,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          notes: notes.trim() || null,
          total_cents: totalCents,
          items,
          payment_type: "onsite",
        },
      }).catch(() => {/* silent */});

      localStorage.removeItem("crazy-toasty-cart");
      navigate({ to: "/confirmation", search: { id: data.id } });
    } catch {
      setError(t("checkout.errorGeneric"));
      toast.error(t("checkout.errorGeneric"));
    } finally {
      setSubmitting(null);
    }
  }

  // ── Payer en ligne (Stripe) ────────────────────────────────────
  async function handleOnlinePayment() {
    if (!validate()) return;
    setSubmitting("online");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-payment", {
        body: {
          items,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          notes: notes.trim() || null,
          total_cents: totalCents,
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
      setSubmitting(null);
    }
  }

  if (!itemsLoaded) return null;

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center border-b border-border/50 px-5 py-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-foreground"
        >
          {t("checkout.backToMenu")}
        </button>
        <span className="mx-auto font-display text-lg tracking-widest">CRAZY TOASTY</span>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Title */}
        <div className="mb-8">
          <p className="mb-2 font-display text-sm tracking-[0.4em] text-sunset-pink">
            {t("checkout.subtitle")}
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            {t("checkout.title")}
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order summary */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-card">
            <h2 className="mb-4 font-sans text-base font-extrabold">
              {t("checkout.orderSummary")}
            </h2>

            <ul className="mb-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="leading-snug text-foreground/90">
                    {item.name}{" "}
                    <span className="text-muted-foreground">×{item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-bold text-emerald-300">
                    {formatEuro(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm font-extrabold">
              <span>{t("checkout.total")}</span>
              <span className="text-emerald-300">{formatEuro(totalCents)}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-border/50 bg-background/50 p-4">
              <p className="text-xs font-semibold text-foreground/80">
                📍 {t("checkout.pickupNote")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("checkout.pickupAddress")}</p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-card">
            <h2 className="mb-5 font-sans text-base font-extrabold">
              {t("checkout.customerInfo")}
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("checkout.name")}
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
                  {t("checkout.phone")}
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
                  {t("checkout.notes")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("checkout.notesPlaceholder")}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </p>
              )}

              {/* Pay online */}
              <button
                type="button"
                onClick={handleOnlinePayment}
                disabled={submitting !== null}
                className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              >
                {submitting === "online"
                  ? "Redirection vers le paiement..."
                  : `💳 ${t("checkout.payOnline")} · ${formatEuro(totalCents)}`}
              </button>

              {/* Pay on site */}
              <button
                type="button"
                onClick={handleOnsiteOrder}
                disabled={submitting !== null}
                className="w-full rounded-full border border-border/60 bg-card/80 py-3.5 text-sm font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting === "onsite"
                  ? t("checkout.submitting")
                  : t("checkout.payOnsite")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </main>
  );
}
