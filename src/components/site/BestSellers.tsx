import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import burgerClassicMaster from "@/assets/burger-classic-master.webp";
import bowlOg from "@/assets/bowl-og.webp";
import bowlSpicy from "@/assets/bowl-spicy.webp";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";
import burgerBaconAttack from "@/assets/burger-bacon-attack.webp";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

const ITEMS: Item[] = [
  {
    id: "classic-master",
    name: "Classic Master",
    description: "Le burger Crazy Toasty culte, généreux et croustillant.",
    price_cents: 990,
    image_url: burgerClassicMaster,
  },
  {
    id: "crousty-original",
    name: "Crousty Original — Douceur Thaï",
    description: "Riz parfumé, poulet croustillant et sauce maison.",
    price_cents: 1190,
    image_url: bowlOg,
  },
  {
    id: "korean-fusion",
    name: "Korean Fusion",
    description: "La version spicy, sucrée-salée, ultra addictive.",
    price_cents: 1290,
    image_url: bowlSpicy,
  },
  {
    id: "crazy-caesar",
    name: "Crazy Caesar Crousty ⭐",
    description: "Caesar façon street-food, croustillante et fraîche.",
    price_cents: 1190,
    image_url: crazyCaesarCrousty,
  },
  {
    id: "bacon-attack",
    name: "Bacon Attack",
    description: "Le burger bien costaud avec bacon et sauce signature.",
    price_cents: 1090,
    image_url: burgerBaconAttack,
  },
];

export function BestSellers() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden py-16 md:py-24 content-auto">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="container mx-auto px-4">
        <div className="mb-10">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-3">
            {t("bestsellers.tag")}
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[0.95]">
            {t("bestsellers.title_prefix")}
            <span className="text-gradient-sunset">{t("bestsellers.title_highlight")}</span>
            <br />
            {t("bestsellers.title_suffix")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {ITEMS.map((item, i) => {
            const img = item.image_url;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.04 }}
                className="min-w-0"
              >
                <div className="h-full overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-card transition-colors duration-200 hover:border-primary/35">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={item.name}
                        width={768}
                        height={576}
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 flex items-start justify-between gap-3 font-display text-xl md:text-2xl">
                      <span className="min-w-0 flex-1">{item.name}</span>
                      <span className="inline-flex shrink-0 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-sans text-sm font-extrabold leading-none text-emerald-300">
                        {formatPrice(item.price_cents)}
                      </span>
                    </h3>
                    {item.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
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
