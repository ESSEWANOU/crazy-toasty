import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/staff/login")({
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/staff/" });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      toast.error("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      return;
    }

    navigate({ to: "/staff/" });
  }

  if (loading) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <p className="font-display text-2xl tracking-widest">CRAZY TOASTY</p>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Espace personnel</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border/70 bg-card/90 p-7 shadow-card">
          <h1 className="mb-6 font-sans text-base font-extrabold">Connexion</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Les comptes sont créés par l'administrateur.
        </p>
      </div>
      <Toaster />
    </main>
  );
}
