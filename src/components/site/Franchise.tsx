import { motion } from "framer-motion";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

const stats = [
  { n: "1", l: "Restaurant ouvert (Toulouse)" },
  { n: "🇫🇷", l: "Bientôt partout en France" },
  { n: "6 mois", l: "Délai d'ouverture" },
  { n: "+95%", l: "Satisfaction client" },
];

const advantages = [
  "Concept clé en main — Tout est prêt, t'as plus qu'à lancer",
  "Recettes & sauces exclusives — Notre savoir-faire, ton avantage",
  "Formation complète — On te forme à fond avant l'ouverture",
  "Accompagnement continu — Marketing, achats, opérations",
  "Marque qui buzz — Une identité forte qui parle aux jeunes",
];

const steps = [
  { t: "Tu candidates", d: "Remplis le formulaire" },
  { t: "On échange", d: "Premier appel pour faire connaissance" },
  { t: "Étude du projet", d: "Localisation, business plan" },
  { t: "Formation", d: "On te forme dans nos restos" },
  { t: "Ouverture", d: "Let's go, ton Crazy Toasty ouvre 🚀" },
];

export function Franchise() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Candidature reçue ! On te recontacte sous 48h.");
    setForm({ name: "", email: "", phone: "", city: "", message: "" });
  };

  return (
    <section id="franchise" className="relative py-32 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <div className="font-display text-sm tracking-[0.4em] text-primary mb-4">FRANCHISE</div>
          <h2 className="text-5xl md:text-7xl font-display mb-6 leading-[0.95]">
            REJOINS LE <span className="text-gradient-flame">CREW</span>
          </h2>
          <p className="text-lg text-foreground/80 mb-4">
            Toulouse c'était le début. Maintenant on étend le game partout en France.
          </p>
          <p className="text-foreground/70">
            Crazy Toasty te file les clés : un concept testé et approuvé, des recettes signature, et tout l'accompagnement pour tout déchirer dans ta ville.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <div className="font-display text-3xl md:text-5xl text-gradient-flame mb-1">{s.n}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="glass rounded-3xl p-8">
            <h3 className="font-display text-2xl mb-6">Les avantages</h3>
            <ul className="space-y-4">
              {advantages.map((a, i) => (
                <motion.li
                  key={a}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-flame grid place-items-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-background" />
                  </div>
                  <span className="text-sm">{a}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-3xl p-8">
            <h3 className="font-display text-2xl mb-6">Les étapes</h3>
            <ol className="space-y-5">
              {steps.map((s, i) => (
                <motion.li
                  key={s.t}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-4"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-flame grid place-items-center font-display text-background">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-display">{s.t}</div>
                    <div className="text-sm text-muted-foreground">{s.d}</div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-8 md:p-12 max-w-3xl mx-auto"
        >
          <h3 className="font-display text-3xl mb-2">Je dépose ma candidature</h3>
          <p className="text-sm text-muted-foreground mb-6">Réponse sous 48h. Promis.</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
            <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
            <input required maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
            <input required maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville d'implantation" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
          </div>
          <textarea maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Parle-nous de ton projet..." rows={4} className="w-full rounded-xl bg-background/60 border border-border px-4 py-3 mb-6 focus:outline-none focus:border-primary" />
          <button type="submit" className="w-full rounded-full bg-primary py-4 font-bold text-primary-foreground hover:scale-[1.02] transition-transform shadow-glow">
            Envoyer ma candidature 🚀
          </button>
        </motion.form>
      </div>
    </section>
  );
}
