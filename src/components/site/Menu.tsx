import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Flame, Crown, Sparkles, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

// Local image fallbacks (par nom de plat)
import bowlOg from "@/assets/bowl-og.jpeg";
import bowlSpicy from "@/assets/bowl-spicy.jpeg";
import bowlCordon from "@/assets/royal-cordon.png";
import bowlUpload from "@/assets/bowl-upload.jpeg";
import fritesCrazy from "@/assets/frites-crazy.webp";
import wingsBbq from "@/assets/wings-bbq.webp";
import cookieImg from "@/assets/cookie.jpg";
import brownieImg from "@/assets/brownie.jpg";
import cheesecakeImg from "@/assets/cheesecake.jpg";
import glaceImg from "@/assets/glace.jpg";
import eauImg from "@/assets/eau.jpg";
import sodaImg from "@/assets/soda.jpg";
import citronnadeImg from "@/assets/citronnade.jpg";
import theGlaceImg from "@/assets/the-glace.jpg";
import milkshakeClassic from "@/assets/milkshake-classic.jpg";
import milkshakeCaramel from "@/assets/milkshake-caramel.jpg";
import tendersImg from "@/assets/tenders.png";
import fritesMaisonImg from "@/assets/frites-maison.png";
import kidsComboImg from "@/assets/kids-combo.png";
import verdeBombImg from "@/assets/verde-bomb.png";
import fritesCheddarImg from "@/assets/frites-cheddar.png";
import wingsNatureNew from "@/assets/wings-nature-new.png";
import onionRingsImg from "@/assets/onion-rings.png";
import nuggetsCroustiImg from "@/assets/nuggets-new.webp";
import crazyPopImg from "@/assets/crazy-pop.jpeg";
import burgerClassicMaster from "@/assets/burger-classic-master.png";
import burgerSpicyDevil from "@/assets/burger-spicy-devil.png";
import burgerBaconAttack from "@/assets/burger-bacon-attack.png";
import sauceRanch from "@/assets/sauce-ranch.webp";
import sauceBbq from "@/assets/sauce-bbq.webp";
import sauceCheddar from "@/assets/sauce-cheddar.webp";
import sauceCrazyBurger from "@/assets/sauce-crazy-burger.webp";
import sauceCrazyCroustille from "@/assets/sauce-crazy-croustille.webp";
import saucesAll from "@/assets/sauces-all.webp";
import sauceVerde from "@/assets/sauce-verde.webp";
import sauceKorean from "@/assets/sauce-korean.png";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";

const FALLBACK: Record<string, string> = {
  "Crousty Original — Douceur Thaï": bowlOg,
  "Korean Fusion": bowlSpicy,
  "Cheesy King": bowlUpload,
  "Verde Bomb — Sauce du Chef": verdeBombImg,
  "Royal Cordon Bleu": bowlCordon,
  "Crazy Caesar Crousty ⭐": crazyCaesarCrousty,
  "Classic Master": burgerClassicMaster,
  "Spicy Devil": burgerSpicyDevil,
  "Bacon Attack 🥓": burgerBaconAttack,
  "Wings Nature Classic": wingsNatureNew,
  "Wings Firestorm 🔥": wingsBbq,
  "Wings Smoky BBQ": wingsBbq,
  "Frites Maison": fritesMaisonImg,
  "Frites Cheddar Crazy": fritesCheddarImg,
  "Frites Crazy Style": fritesCrazy,
  "Onion Rings ×4": onionRingsImg,
  "Tenders Croustillants ×3": tendersImg,
  "Nuggets Crousti ×4": nuggetsCroustiImg,
  "Crazy Pop ×6": crazyPopImg,
  "Sauce Crazy Croustille": sauceCrazyCroustille,
  "Sauce Crazy Burger": sauceCrazyBurger,
  "Sauce Cheddar": sauceCheddar,
  "Sauce BBQ Smoky": sauceBbq,
  "Sauce Ranch": sauceRanch,
  "Sauce Korean Spicy 🔥": sauceKorean,
  "Sauce African Verde 🌿": sauceVerde,
  "Sauce Algérienne": saucesAll,
  "Ketchup": saucesAll,
  "Mayonnaise": saucesAll,
  "Le Kids Combo": kidsComboImg,
  "Eau (50cl)": eauImg,
  "Soda (33cl)": sodaImg,
  "Citronnade Maison": citronnadeImg,
  "Thé glacé pêche": theGlaceImg,
  "Milkshake Classic": milkshakeClassic,
  "Milkshake Speculoos Dream": milkshakeClassic,
  "Milkshake Caramel Beurre Salé": milkshakeCaramel,
  "Cookie Noisette Chocolat Maison": cookieImg,
  "Brownie Maison": brownieImg,
  "Speculoos Cheesecake": cheesecakeImg,
  "Glace 2 Boules": glaceImg,
};

type Item = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  badge: string | null;
  image_url: string | null;
  sort_order: number;
};

const badgeColor: Record<string, string> = {
  "Spicy 🔥": "bg-destructive text-destructive-foreground",
  "Nouveau": "bg-secondary text-secondary-foreground",
  "Best-seller": "bg-primary text-primary-foreground",
  "Signature ⭐": "bg-purple-600 text-white",
  "Chef 👨‍🍳": "bg-amber-600 text-white",
};

const CATEGORY_ORDER = ["Crousty Rice", "Sides", "Crousty Bowl Salade", "Tasty Burgers", "Wings", "Sauces", "Box", "Boissons", "Desserts", "Kids"];

export function Menu() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string>("Tout");

  useEffect(() => {
    const load = () =>
      supabase
        .from("menu_items")
        .select("id,name,description,price_cents,category,badge,image_url,sort_order")
        .eq("available", true)
        .order("sort_order")
        .then(({ data }) => {
          const loaded = (data ?? []) as Item[];
          loaded.sort((a, b) => {
            const aCat = CATEGORY_ORDER.indexOf(a.category);
            const bCat = CATEGORY_ORDER.indexOf(b.category);
            if (aCat !== -1 && bCat !== -1 && aCat !== bCat) return aCat - bCat;
            if (aCat !== -1 && bCat === -1) return -1;
            if (aCat === -1 && bCat !== -1) return 1;
            return a.sort_order - b.sort_order;
          });
          setItems(loaded);
        });
    load();
    const channel = supabase
      .channel("menu-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const cats = ["Tout", ...CATEGORY_ORDER.filter((c) => items.some((i) => i.category === c)), ...Array.from(new Set(items.map((i) => i.category).filter((c) => !CATEGORY_ORDER.includes(c))))];
  const filtered = active === "Tout" ? items : items.filter((i) => i.category === active);

  return (
    <section id="menu" className="relative py-20 md:py-32 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4">NOS BEST-SELLERS</div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-display leading-[0.95]">
            LE MENU <span className="text-gradient-sunset">QUI REND FOU</span>
          </h2>
          <p className="mt-6 text-foreground/70">
            Les préférés de l'équipage. Poulet croustillant cuit à la commande, sauces maison, bowls qui défoncent.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 mb-12 justify-center">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-3.5 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3.5 text-xs sm:text-sm md:text-base font-display uppercase tracking-wide transition-all ${
                active === c ? "bg-primary text-primary-foreground shadow-glow" : "glass hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <motion.div layout className="grid sm:grid-cols-2 gap-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function MenuCard({ item, index }: { item: Item; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const img = item.image_url || FALLBACK[item.name];
  const lower = `${item.name} ${item.description ?? ""}`.toLowerCase();
  const isSpicy = /spicy|firestorm|korean|devil|🔥|piment/.test(lower);
  const isCheesy = /cheddar|cheese|cheesy|fromage|mozza/.test(lower);
  const isTopSeller = item.badge === "Best-seller" || item.badge === "Signature ⭐";

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -10 }}
      className="group relative overflow-hidden rounded-3xl glass border border-white/5 hover:border-primary/40 hover:shadow-[0_25px_60px_-15px_oklch(0.7_0.19_48/0.45)] transition-all duration-500"
    >
      {/* XXL Image with parallax */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {img ? (
          <motion.img
            src={img}
            alt={item.name}
            width={900}
            height={1125}
            loading="lazy"
            style={{ y: imgY }}
            className="absolute inset-0 h-[130%] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-125"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 text-center px-4">
            <div className="font-display text-5xl mb-2">📸</div>
            <div className="font-display text-sm tracking-[0.3em] text-primary uppercase">Photo bientôt</div>
          </div>
        )}

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/0 group-hover:to-primary/20 transition-all duration-500" />

        {/* Top-left badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
          {isTopSeller && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-sunset px-3 py-1.5 text-xs font-bold text-white shadow-sunset">
              <Crown className="h-3.5 w-3.5" /> Le plus commandé
            </span>
          )}
          {item.badge && !isTopSeller && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeColor[item.badge] ?? "bg-primary text-primary-foreground"}`}>
              {item.badge}
            </span>
          )}
        </div>

        {/* Price chip */}
        <div className="absolute top-4 right-4 rounded-full bg-background/95 backdrop-blur-xl px-4 py-1.5 font-display text-base shadow-lg border border-white/10">
          {formatPrice(item.price_cents)}
        </div>

        {/* Tags overlay bottom */}
        <div className="absolute left-4 right-4 bottom-4 flex flex-wrap gap-2">
          {isSpicy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/90 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-destructive-foreground">
              <Flame className="h-3 w-3" /> Spicy
            </span>
          )}
          {isCheesy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-black">
              <Sparkles className="h-3 w-3" /> Ultra cheesy
            </span>
          )}
        </div>
      </div>

      {/* Text block */}
      <div className="relative p-6">
        <h3 className="text-xl md:text-2xl font-display mb-2 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{item.description}</p>
        )}
        <a
          href="/commander"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-sunset px-5 py-3 font-display text-sm uppercase tracking-wide text-white shadow-sunset hover:scale-[1.02] hover:shadow-[0_0_30px_oklch(0.7_0.19_48/0.6)] transition-all duration-300"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </a>
      </div>
    </motion.article>
  );
}
