import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import burgerClassicMaster from "@/assets/burger-classic-master.png";
import bowlOg from "@/assets/bowl-og.jpeg";
import bowlSpicy from "@/assets/bowl-spicy.jpeg";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.png";
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
    name: "Bacon Attack",
    description: "Le burger bien costaud avec bacon et sauce signature.",
    price_cents: 1090,
    image_url: burgerBaconAttack,
    badge: "Best-seller",
  },
];

export function BestSellers() {
  const { t } = useI18n();
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="container mx-auto px-4">
        <div className="mb-10">
          <div>
            <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-3">
              {t("bestsellers.tag")}
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[0.95]">
              {t("bestsellers.title_prefix")}
              <span className="text-gradient-sunset">{t("bestsellers.title_highlight")}</span>
              <br />{t("bestsellers.title_suffix")}
            </h2>
          </div>
        </div>

        <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-6 snap-x snap-mandatory">
          {ITEMS.map((item, i) => {
            const img = item.image_url;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="w-[82vw] max-w-[24rem] shrink-0 snap-start sm:w-[22rem] lg:w-[24rem]"
              >
                <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-card transition-colors duration-200 hover:border-primary/35">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover"
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
                    <h3 className="mb-3 flex items-start justify-between gap-4 font-display text-xl md:text-2xl">
                      <span className="min-w-0 flex-1">{item.name}</span>
                      <span className="inline-flex shrink-0 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-sans text-base font-extrabold leading-none text-emerald-300">
                        {formatPrice(item.price_cents)}
                      </span>
                    </h3>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
