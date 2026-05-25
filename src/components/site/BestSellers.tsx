import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import burgerClassicMaster from "@/assets/burger-classic-master.png";
import bowlOg from "@/assets/bowl-og.jpeg";
import bowlSpicy from "@/assets/bowl-spicy.jpeg";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";
import burgerBaconAttack from "@/assets/burger-bacon-attack.png";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  badge: string | null;
};

const ITEMS: Item[] = [
  {
    id: "classic-master",
    name: "Classic Master",
    description: "Le burger Crazy Toasty culte, généreux et croustillant.",
    price_cents: 990,
    image_url: burgerClassicMaster,
    badge: "Best-seller",
  },
  {
    id: "crousty-original",
    name: "Crousty Original — Douceur Thaï",
    description: "Riz parfumé, poulet croustillant et sauce maison.",
    price_cents: 1190,
    image_url: bowlOg,
    badge: "Signature ⭐",
  },
  {
    id: "korean-fusion",
    name: "Korean Fusion",
    description: "La version spicy, sucrée-salée, ultra addictive.",
    price_cents: 1290,
    image_url: bowlSpicy,
    badge: "Best-seller",
  },
  {
    id: "crazy-caesar",
    name: "Crazy Caesar Crousty ⭐",
    description: "Caesar façon street-food, croustillante et fraîche.",
    price_cents: 1190,
    image_url: crazyCaesarCrousty,
    badge: "Chef",
  },
  {
    id: "bacon-attack",
    name: "Bacon Attack 🥓",
    description: "Le burger bien costaud avec bacon et sauce signature.",
    price_cents: 1090,
    image_url: burgerBaconAttack,
    badge: "Best-seller",
  },
];

export function BestSellers() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
  }, [index]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + ITEMS.length) % ITEMS.length);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-3">
              ⭐ BEST-SELLERS
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[0.95]">
              CE QUE LES <span className="text-gradient-sunset">TOULOUSAINS</span>
              <br /> S'ARRACHENT
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => go(-1)}
              className="h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
              aria-label="Suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {ITEMS.map((item, i) => {
            const img = item.image_url;
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
                      <img
                        src={img}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-sunset px-3 py-1.5 text-xs font-bold text-white shadow-sunset">
                      ⭐ Best-seller
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-3 flex flex-wrap items-baseline gap-2 font-display text-xl md:text-2xl">
                      <span className="inline-flex shrink-0 rounded-full border border-primary/20 bg-primary/15 px-3 py-1 text-base leading-none text-primary">
                        {formatPrice(item.price_cents)}
                      </span>
                      <span>{item.name}</span>
                    </h3>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {ITEMS.map((_, i) => (
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
