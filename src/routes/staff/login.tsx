import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/staff/login")({
  component: StaffLogin,
});

function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirectByRole();
    });
  }, []);

  const redirectByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (roles?.some((r) => r.role === "manager")) {
      navigate({ to: "/staff/manager" });
    } else if (roles?.some((r) => r.role === "restaurant_staff")) {
      navigate({ to: "/staff/restaurant" });
    } else {
      toast.error("Ton compte n'a aucun rôle assigné. Contacte le manager.");
      await supabase.auth.signOut();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    redirectByRole();
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Retour au site</Link>
        <h1 className="font-display text-3xl mt-6 mb-2">Espace Staff</h1>
        <p className="text-muted-foreground text-sm mb-6">Connexion réservée aux équipes Crazy Toasty</p>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full glass rounded-xl px-4 py-3" />
          <input type="password" required placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full glass rounded-xl px-4 py-3" />
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-primary text-primary-foreground py-3 font-bold disabled:opacity-50">
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
