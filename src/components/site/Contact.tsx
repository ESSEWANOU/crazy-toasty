import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Rocket } from "lucide-react";
import { toast } from "sonner";

const subjects = ["Question", "Franchise", "Presse", "Autre"];

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "Question", message: "" });
  const [news, setNews] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message envoyé ⚡ On te répond vite.");
    setForm({ name: "", email: "", phone: "", subject: "Question", message: "" });
  };

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Welcome dans le game 🔥");
    setNews("");
  };

  return (
    <section id="contact" className="relative py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <div className="font-display text-sm tracking-[0.4em] text-primary mb-4">CONTACT</div>
          <h2 className="text-5xl md:text-7xl font-display leading-[0.95]">
            ON <span className="text-gradient-flame">PARLE ?</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8"
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
              <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
              <input maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary" />
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-xl bg-background/60 border border-border px-4 py-3 focus:outline-none focus:border-primary">
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <textarea required maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Ton message" rows={5} className="w-full rounded-xl bg-background/60 border border-border px-4 py-3 mb-6 focus:outline-none focus:border-primary" />
            <button type="submit" className="w-full rounded-full bg-primary py-4 font-bold text-primary-foreground hover:scale-[1.02] transition-transform shadow-glow">
              Envoyer le message ⚡
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              { icon: Mail, l: "Email général", v: "contact@crazytoasty.fr", href: "mailto:contact@crazytoasty.fr" },
              { icon: Rocket, l: "Franchise", v: "contact@crazytoasty.fr", href: "mailto:contact@crazytoasty.fr?subject=Franchise" },
              { icon: Phone, l: "Téléphone", v: "05 XX XX XX XX", href: "tel:+33500000000" },
              { icon: MapPin, l: "Adresse", v: "2 rue Paul Mériel, 31000 Toulouse", href: "https://www.google.com/maps/search/?api=1&query=2+rue+Paul+M%C3%A9riel+Toulouse" },
            ].map((c) => (
              <a key={c.l} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="glass rounded-2xl p-5 flex items-start gap-4 hover:bg-white/5 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-gradient-flame grid place-items-center shrink-0">
                  <c.icon className="h-5 w-5 text-background" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.l}</div>
                  <div className="font-bold">{c.v}</div>
                </div>
              </a>
            ))}

            <div className="glass rounded-2xl p-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Suis-nous</div>
              <div className="flex gap-3">
                <motion.a href="https://instagram.com/crazytoasty" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1, rotate: 6 }} className="h-12 w-12 rounded-xl bg-background/60 grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Instagram @crazytoasty">
                  <Instagram className="h-5 w-5" />
                </motion.a>
                <motion.a href="https://tiktok.com/@crazytoasty" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1, rotate: -6 }} className="h-12 w-12 rounded-xl bg-background/60 grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors font-display" aria-label="TikTok @crazytoasty">
                  TT
                </motion.a>
                <motion.a href="https://facebook.com/crazytoasty" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1, rotate: 6 }} className="h-12 w-12 rounded-xl bg-background/60 grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Facebook Crazy Toasty">
                  <Facebook className="h-5 w-5" />
                </motion.a>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">@crazytoasty</div>
            </div>

            <form onSubmit={subscribe} className="glass rounded-2xl p-6">
              <div className="font-display text-lg mb-1">Reste dans le game</div>
              <p className="text-sm text-muted-foreground mb-4">Nouveautés, promos et avant-premières direct dans ta boîte mail.</p>
              <div className="flex gap-2">
                <input required type="email" maxLength={255} value={news} onChange={(e) => setNews(e.target.value)} placeholder="ton@email.com" className="flex-1 rounded-full bg-background/60 border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <button type="submit" className="rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground hover:scale-105 transition-transform">
                  Je m'inscris
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
