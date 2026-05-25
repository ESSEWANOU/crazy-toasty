import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Léa M.",
    city: "Toulouse",
    rating: 5,
    text: "Le meilleur toasté que j'ai mangé. Le fromage déborde, la sauce est folle, je rêve d'y retourner.",
  },
  {
    name: "Karim B.",
    city: "Blagnac",
    rating: 5,
    text: "Crousty rice + sando poulet : j'ai cru que j'allais pleurer. Ultra généreux, ultra croustillant.",
  },
  {
    name: "Sofia R.",
    city: "Toulouse",
    rating: 5,
    text: "Concept au top, équipe au top, produits au top. Mon nouveau spot favori, sans hésiter.",
  },
  {
    name: "Mathieu D.",
    city: "Colomiers",
    rating: 5,
    text: "Les wings sont une tuerie. Le milkshake aussi. Crazy Toasty c'est devenu une addiction.",
  },
  {
    name: "Inès T.",
    city: "Toulouse",
    rating: 5,
    text: "Le toasté qui dégouline c'est pas du marketing, c'est la réalité. Foodporn validé.",
  },
  {
    name: "Yanis K.",
    city: "Tournefeuille",
    rating: 5,
    text: "Service rapide, portion énorme, prix correct. Que demander de plus ? Encore un toasté.",
  },
];

export function Reviews() {
  return (
    <section id="avis" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-sunset opacity-[0.06] pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
            <Star className="w-4 h-4 text-[var(--mustard)] fill-[var(--mustard)]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              4.9 / 5 · +1200 avis
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-display">
            Ils ont <span className="text-gradient-sunset">craqué.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            La voix de ceux qui dégoulinent déjà.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative p-7 rounded-3xl glass border border-white/10 hover:border-[var(--flame)]/40 transition-all hover:shadow-sunset"
            >
              <Quote className="absolute top-5 right-5 w-10 h-10 text-[var(--flame)]/20 group-hover:text-[var(--flame)]/50 transition-colors" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }).map((_, idx) => (
                  <Star
                    key={idx}
                    className="w-4 h-4 fill-[var(--mustard)] text-[var(--mustard)]"
                  />
                ))}
              </div>
              <p className="text-base leading-relaxed text-foreground/90 mb-6">
                « {r.text} »
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-sunset flex items-center justify-center font-display text-lg">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
