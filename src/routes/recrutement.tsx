import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { ScrollToTop } from "@/components/site/ScrollToTop";

export const Route = createFileRoute("/recrutement")({
  component: RecrutementPage,
});

const POSITIONS = [
  "Équipier polyvalent",
  "Manager de shift",
  "Préparateur cuisine",
  "Caissier / Hôte d'accueil",
  "Candidature spontanée",
];

const BENEFITS = [
  { icon: "🔥", title: "Ambiance de dingue", desc: "Une équipe soudée qui bosse et rigole au quotidien." },
  { icon: "🍗", title: "Repas inclus", desc: "Tu manges notre cuisine chaque jour — et c'est vraiment bon." },
  { icon: "📈", title: "Évolution rapide", desc: "On grandit vite. Les opportunités de progresser aussi." },
  { icon: "🎓", title: "Formation assurée", desc: "On te forme de A à Z, peu importe ton niveau de départ." },
];

const JOB_OFFERS = [
  {
    title: "Équipier polyvalent",
    type: "CDI / CDD",
    schedule: "Temps plein ou partiel",
    desc: "Tu participes à la préparation des commandes, l'accueil clients et le maintien de la salle. Aucune expérience requise — on forme !",
  },
  {
    title: "Manager de shift",
    type: "CDI",
    schedule: "Temps plein",
    desc: "Tu supervises l'équipe pendant ton service, gères les flux et garantis la qualité du service. Expérience en restauration souhaitée.",
  },
  {
    title: "Préparateur cuisine",
    type: "CDI / CDD",
    schedule: "Temps plein",
    desc: "Tu assures la préparation des bowls et burgers dans le respect de nos recettes et standards de qualité. Passion pour la cuisine bienvenue.",
  },
];

function RecrutementPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState(POSITIONS[0]);
  const [message, setMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (cvFile && cvFile.size > 5 * 1024 * 1024) {
      setError("Le CV doit faire moins de 5 Mo.");
      return;
    }

    setSubmitting(true);

    try {
      let cvUrl: string | null = null;

      if (cvFile) {
        const ext = cvFile.name.split(".").pop() ?? "pdf";
        const path = `cvs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("cv-uploads")
          .upload(path, cvFile, { contentType: cvFile.type });
        if (uploadError) throw uploadError;
        cvUrl = path;
      }

      const { error: dbError } = await supabase.from("applications").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position,
        message: message.trim(),
        cv_url: cvUrl,
        status: "new",
      });

      if (dbError) throw dbError;

      // Notify via email (best-effort)
      await supabase.functions.invoke("send-application-email", {
        body: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          position,
          message: message.trim(),
          cv_url: cvUrl,
        },
      });

      setSent(true);
      toast.success("Candidature envoyée !");
    } catch {
      setError(t("recrut.errorGeneric"));
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar compact />

      <main className="container mx-auto max-w-5xl px-4 pt-32 pb-20">
        {/* Page Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 font-display text-sm tracking-[0.4em] text-sunset-pink">
            {t("recrut.tag")}
          </p>
          <h1 className="font-display text-5xl leading-tight md:text-7xl">
            {t("recrut.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            {t("recrut.subtitle")}
          </p>
        </div>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="mb-8 text-center font-display text-3xl">{t("recrut.benefitsTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-card"
              >
                <div className="mb-3 text-3xl">{b.icon}</div>
                <p className="mb-1 text-sm font-bold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Offers */}
        <section className="mb-16">
          <h2 className="mb-8 font-display text-3xl">Nos offres en cours</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {JOB_OFFERS.map((job) => (
              <div
                key={job.title}
                className="rounded-3xl border border-primary/20 bg-card/90 p-6 shadow-card"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl leading-snug">{job.title}</h3>
                  <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {job.type}
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">🕐 {job.schedule}</p>
                <p className="text-sm text-muted-foreground/80">{job.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Application Form */}
        <section>
          {sent ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-16 text-center shadow-card">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="mb-2 font-display text-3xl">{t("recrut.successTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("recrut.successText")}</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-card/90 p-7 shadow-card">
              <h2 className="mb-6 font-display text-3xl">{t("recrut.applyTitle")}</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("recrut.nameLabel")} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Marie Dupont"
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("recrut.emailLabel")} *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="marie@email.com"
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("recrut.phoneLabel")} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="06 12 34 56 78"
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    />
                  </div>

                  {/* Position */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("recrut.positionLabel")} *
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full rounded-xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Motivation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("recrut.motivationLabel")} *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder={t("recrut.motivationPlaceholder")}
                    className="w-full resize-none rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
                  />
                </div>

                {/* CV upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("recrut.cvLabel")}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-bold file:text-primary hover:file:bg-primary/30"
                  />
                  {cvFile && (
                    <p className="text-xs text-emerald-400">✓ {cvFile.name}</p>
                  )}
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  {submitting ? t("recrut.submitting") : t("recrut.submit")}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <ScrollToTop />
      <Toaster />
    </div>
  );
}
