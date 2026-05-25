import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import burgerClassicMaster from "@/assets/burger-classic-master.png";
import bowlOg from "@/assets/bowl-og.jpeg";
import bowlSpicy from "@/assets/bowl-spicy.jpeg";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";
import burgerBaconAttack from "@/assets/burger-bacon-attack.png";

const FALLBACK: Record<string, string> = {
  "Classic Master": burgerClassicMaster,
  "Crousty Original — Douceur Thaï": bowlOg,
  "Korean Fusion": bowlSpicy,
  "Crazy Caesar Crousty ⭐": crazyCaesarCrousty,
  "Bacon Attack 🥓": burgerBaconAttack,
};

const REVIEWS = [
  { rating: 4.9, text: "Le meilleur toasté que j'ai mangé.", author: "Léa M." },
  { rating: 5.0, text: "Croustillant à mort, sauce de ouf.", author: "Karim B." },
  { rating: 4.8, text: "Mon guilty pleasure officiel. 🔥", author: "Sofia D." },
  { rating: 5.0, text: "J'y retourne toutes les semaines.", author: "Tom L." },
  { rating: 4.9, text: "Le bowl est ULTRA généreux.", author: "Mehdi K." },
];

type Item = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  badge: string | null;
};

export function BestSellers() {
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("menu_items")
      .select("id,name,description,price_cents,image_url,badge")
      .eq("available", true)
      .in("badge", ["Best-seller", "Signature ⭐", "Chef 👨‍🍳"])
      .limit(8)
      .then(({ data }) => setItems((data ?? []) as Item[]));
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
  }, [index]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + items.length) % items.length);

  if (items.length === 0) return null;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-card/30 to-background" />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl -z-10"
      />

      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-3">⭐ BEST-SELLERS</div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[0.95]">
              CE QUE LES <span className="text-gradient-sunset">TOULOUSAINS</span><br /> S'ARRACHENT
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button onClick={() => go(-1)} className="h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Précédent">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} className="h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Suivant">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item, i) => {
            const img = item.image_url || FALLBACK[item.name];
            const review = REVIEWS[i % REVIEWS.length];
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="snap-start shrink-0 w-[85%] sm:w-[55%] md:w-[42%] lg:w-[32%] group"
              >
                <div className="relative overflow-hidden rounded-3xl glass border border-white/10 hover:border-primary/50 hover:shadow-[0_25px_60px_-15px_oklch(0.7_0.19_48/0.5)] transition-all duration-500">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {img ? (
                      <img src={img} alt={item.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-sunset px-3 py-1.5 text-xs font-bold text-white shadow-sunset">
                      ⭐ Best-seller
                    </span>
                    <span className="absolute top-4 right-4 rounded-full bg-background/95 backdrop-blur-xl px-4 py-1.5 font-display text-base border border-white/10">
                      {formatPrice(item.price_cents)}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl md:text-2xl font-display mb-3">{item.name}</h3>

                    {/* Avis client */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, k) => (
                          <Star key={k} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ml-2 font-display text-sm">{review.rating}/5</span>
                      </div>
                      <p className="text-sm italic text-foreground/80 leading-snug">"{review.text}"</p>
                      <p className="text-xs text-muted-foreground mt-1.5">— {review.author}</p>
                    </div>

                    <a
                      href="/commander"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-display text-sm uppercase tracking-wide text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform"
                    >
                      <Plus className="h-4 w-4" /> Ajouter
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Aller au produit ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
