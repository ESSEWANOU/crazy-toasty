import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id, session_id } = Route.useSearch();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    session_id ? "loading" : "success",
  );
  const [orderId, setOrderId] = useState<string | undefined>(id);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!session_id) return;

    async function verifyStripePayment() {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { session_id },
        });

        if (error || !data?.success) {
          setErrorMsg(data?.error ?? "Erreur de vérification du paiement.");
          setStatus("error");
          return;
        }

        setOrderId(data.order.id);
        setStatus("success");
      } catch {
        setErrorMsg("Une erreur est survenue. Veuillez contacter le restaurant.");
        setStatus("error");
      }
    }

    verifyStripePayment();
  }, [session_id]);

  const shortRef = orderId ? orderId.split("-")[0].toUpperCase() : "—";

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Vérification du paiement…</p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
        <div className="w-full max-w-md text-center">
          <div className="mb-5 text-5xl">⚠️</div>
          <h1 className="mb-2 font-display text-3xl">Erreur de paiement</h1>
          <p className="mb-6 text-sm text-muted-foreground">{errorMsg}</p>
          <button
            onClick={() => navigate({ to: "/commander" })}
            className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-6xl">🎉</div>
        <h1 className="mb-2 font-display text-4xl md:text-5xl">{t("confirmation.title")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{t("confirmation.subtitle")}</p>

        <div className="mb-8 rounded-3xl border border-border/70 bg-card/90 p-7 shadow-card">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("confirmation.ref")}
          </p>
          <p className="font-display text-3xl text-primary">{shortRef}</p>

          <div className="my-5 border-t border-border/40" />

          <p className="text-sm font-semibold text-emerald-300">
            ⏱ {t("confirmation.readyIn")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            📍 {t("confirmation.address")}
          </p>
        </div>

        <button
          onClick={() => navigate({ to: "/" })}
          className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:opacity-90 active:scale-95"
        >
          {t("confirmation.backHome")}
        </button>
      </div>

      <Toaster />
    </main>
  );
}
