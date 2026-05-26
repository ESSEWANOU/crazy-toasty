import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

// Local image fallbacks (par nom de plat)
import bowlOg from "@/assets/bowl-og.webp";
import bowlSpicy from "@/assets/bowl-spicy.webp";
import bowlCordon from "@/assets/royal-cordon.webp";
import bowlUpload from "@/assets/bowl-upload.webp";
import fritesCrazy from "@/assets/frites-crazy.webp";
import wingsBbq from "@/assets/wings-bbq.webp";
import cookieImg from "@/assets/cookie.webp";
import brownieImg from "@/assets/brownie.webp";
import cheesecakeImg from "@/assets/cheesecake.webp";
import glaceImg from "@/assets/glace.webp";
import eauImg from "@/assets/eau.webp";
import sodaImg from "@/assets/soda.webp";
import citronnadeImg from "@/assets/citronnade.webp";
import theGlaceImg from "@/assets/the-glace.webp";
import milkshakeClassic from "@/assets/milkshake-classic.webp";
import milkshakeCaramel from "@/assets/milkshake-caramel.webp";
import tendersImg from "@/assets/tenders.webp";
import fritesMaisonImg from "@/assets/frites-maison.webp";
import kidsComboImg from "@/assets/kids-combo.webp";
import verdeBombImg from "@/assets/verde-bomb.webp";
import fritesCheddarImg from "@/assets/frites-cheddar.webp";
import wingsNatureNew from "@/assets/wings-nature-new.webp";
import onionRingsImg from "@/assets/onion-rings.webp";
import nuggetsCroustiImg from "@/assets/nuggets-new.webp";
import crazyPopImg from "@/assets/crazy-pop.webp";
import burgerClassicMaster from "@/assets/burger-classic-master.webp";
import burgerSpicyDevil from "@/assets/burger-spicy-devil.webp";
import burgerBaconAttack from "@/assets/burger-bacon-attack.webp";
import sauceRanch from "@/assets/sauce-ranch.webp";
import sauceBbq from "@/assets/sauce-bbq.webp";
import sauceCheddar from "@/assets/sauce-cheddar.webp";
import sauceCrazyBurger from "@/assets/sauce-crazy-burger.webp";
import sauceCrazyCroustille from "@/assets/sauce-crazy-croustille.webp";
import saucesAll from "@/assets/sauces-all.webp";
import sauceVerde from "@/assets/sauce-verde.webp";
import sauceKorean from "@/assets/sauce-korean.webp";
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
  "Bacon Attack": burgerBaconAttack,
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
  Ketchup: saucesAll,
  Mayonnaise: saucesAll,
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

const ALL_CATEGORY = "Tout" as const;

const CATEGORY_ORDER = [
  "Crousty Rice",
  "Sides",
  "Crousty Bowl Salade",
  "Tasty Burgers",
  "Wings",
  "Sauces",
  "Boissons",
  "Desserts",
  "Kids",
] as const;

type Category = (typeof CATEGORY_ORDER)[number];
type ActiveCategory = typeof ALL_CATEGORY | Category;

type Item = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: Category;
  image_url: string | null;
  sort_order: number;
};

const MENU_ITEMS: Item[] = [
  {
    id: "crousty-original",
    name: "Crousty Original — Douceur Thaï",
    description: "Riz parfumé, poulet croustillant, toppings frais et sauce douceur thaï.",
    price_cents: 1190,
    category: "Crousty Rice",
    image_url: bowlOg,
    sort_order: 1,
  },
  {
    id: "korean-fusion",
    name: "Korean Fusion",
    description: "La version spicy avec sauce coréenne, croustillant et gros caractère.",
    price_cents: 1290,
    category: "Crousty Rice",
    image_url: bowlSpicy,
    sort_order: 2,
  },
  {
    id: "royal-cordon",
    name: "Royal Cordon Bleu",
    description: "Poulet croustillant, cordon bleu royal et sauce signature.",
    price_cents: 1290,
    category: "Crousty Rice",
    image_url: bowlCordon,
    sort_order: 3,
  },
  {
    id: "cheesy-king",
    name: "Cheesy King",
    description: "Bowl ultra cheesy avec cheddar fondant et croustillant maison.",
    price_cents: 1190,
    category: "Crousty Rice",
    image_url: bowlUpload,
    sort_order: 4,
  },
  {
    id: "classic-master",
    name: "Classic Master",
    description: "Burger généreux, poulet croustillant et sauce Crazy Burger.",
    price_cents: 990,
    category: "Tasty Burgers",
    image_url: burgerClassicMaster,
    sort_order: 10,
  },
  {
    id: "spicy-devil",
    name: "Spicy Devil",
    description: "Le burger qui chauffe avec sauce spicy et poulet croustillant.",
    price_cents: 1090,
    category: "Tasty Burgers",
    image_url: burgerSpicyDevil,
    sort_order: 11,
  },
  {
    id: "bacon-attack",
    name: "Bacon Attack",
    description: "Bacon, fromage, poulet croustillant et sauce signature.",
    price_cents: 1090,
    category: "Tasty Burgers",
    image_url: burgerBaconAttack,
    sort_order: 12,
  },
  {
    id: "crazy-caesar",
    name: "Crazy Caesar Crousty ⭐",
    description: "Une Caesar street-food, fraîche, généreuse et croustillante.",
    price_cents: 1190,
    category: "Crousty Bowl Salade",
    image_url: crazyCaesarCrousty,
    sort_order: 20,
  },
  {
    id: "frites-maison",
    name: "Frites Maison",
    description: "Frites croustillantes, simples et efficaces.",
    price_cents: 390,
    category: "Sides",
    image_url: fritesMaisonImg,
    sort_order: 30,
  },
  {
    id: "frites-cheddar",
    name: "Frites Cheddar Crazy",
    description: "Frites maison avec cheddar fondant façon Crazy.",
    price_cents: 490,
    category: "Sides",
    image_url: fritesCheddarImg,
    sort_order: 31,
  },
  {
    id: "wings-bbq",
    name: "Wings Smoky BBQ",
    description: "Wings croustillantes, nappées de sauce BBQ smoky.",
    price_cents: 690,
    category: "Wings",
    image_url: wingsBbq,
    sort_order: 40,
  },
  {
    id: "wings-nature",
    name: "Wings Nature Classic",
    description: "Wings croustillantes à tremper dans ta sauce préférée.",
    price_cents: 650,
    category: "Wings",
    image_url: wingsNatureNew,
    sort_order: 41,
  },
  {
    id: "tenders",
    name: "Tenders Croustillants ×3",
    description: "Trois tenders dorés, généreux et ultra croustillants.",
    price_cents: 590,
    category: "Sides",
    image_url: tendersImg,
    sort_order: 50,
  },
  {
    id: "nuggets",
    name: "Nuggets Crousti ×4",
    description: "Nuggets croustillants, parfaits avec une sauce maison.",
    price_cents: 490,
    category: "Sides",
    image_url: nuggetsCroustiImg,
    sort_order: 51,
  },
  {
    id: "onion-rings",
    name: "Onion Rings ×4",
    description: "Anneaux d'oignons dorés et bien croustillants.",
    price_cents: 390,
    category: "Sides",
    image_url: onionRingsImg,
    sort_order: 52,
  },
  {
    id: "kids-combo",
    name: "Le Kids Combo",
    description: "La formule enfant simple, croustillante et gourmande.",
    price_cents: 790,
    category: "Kids",
    image_url: kidsComboImg,
    sort_order: 60,
  },
  {
    id: "sauce-crazy",
    name: "Sauce Crazy Croustille",
    description: "La sauce maison signature pour accompagner tes sides.",
    price_cents: 90,
    category: "Sauces",
    image_url: sauceCrazyCroustille,
    sort_order: 70,
  },
  {
    id: "sauce-burger",
    name: "Sauce Crazy Burger",
    description: "Onctueuse, gourmande, pensée pour burgers et frites.",
    price_cents: 90,
    category: "Sauces",
    image_url: sauceCrazyBurger,
    sort_order: 71,
  },
  {
    id: "sauce-korean",
    name: "Sauce Korean Spicy 🔥",
    description: "La sauce qui réveille ton plat.",
    price_cents: 90,
    category: "Sauces",
    image_url: sauceKorean,
    sort_order: 72,
  },
  {
    id: "citronnade",
    name: "Citronnade Maison",
    description: "Fraîche, acidulée et parfaite avec du croustillant.",
    price_cents: 350,
    category: "Boissons",
    image_url: citronnadeImg,
    sort_order: 80,
  },
  {
    id: "the-glace",
    name: "Thé glacé pêche",
    description: "La boisson fraîche et fruitée.",
    price_cents: 290,
    category: "Boissons",
    image_url: theGlaceImg,
    sort_order: 81,
  },
  {
    id: "milkshake-caramel",
    name: "Milkshake Caramel Beurre Salé",
    description: "Milkshake gourmand au caramel beurre salé.",
    price_cents: 490,
    category: "Boissons",
    image_url: milkshakeCaramel,
    sort_order: 82,
  },
  {
    id: "cookie",
    name: "Cookie Noisette Chocolat Maison",
    description: "Cookie maison, fondant et croustillant.",
    price_cents: 350,
    category: "Desserts",
    image_url: cookieImg,
    sort_order: 90,
  },
  {
    id: "brownie",
    name: "Brownie Maison",
    description: "Brownie chocolat, dense et généreux.",
    price_cents: 390,
    category: "Desserts",
    image_url: brownieImg,
    sort_order: 91,
  },
  {
    id: "cheesecake",
    name: "Speculoos Cheesecake",
    description: "Cheesecake gourmand au speculoos.",
    price_cents: 450,
    category: "Desserts",
    image_url: cheesecakeImg,
    sort_order: 92,
  },
];

const categoryRank = new Map<Category, number>(
  CATEGORY_ORDER.map((category, index) => [category, index]),
);

const sortedMenuItems = [...MENU_ITEMS].sort((a, b) => {
  const byCategory = categoryRank.get(a.category)! - categoryRank.get(b.category)!;
  if (byCategory !== 0) return byCategory;

  const bySortOrder = a.sort_order - b.sort_order;
  if (bySortOrder !== 0) return bySortOrder;

  return a.name.localeCompare(b.name);
});

const filterCategories: ActiveCategory[] = [
  ALL_CATEGORY,
  ...CATEGORY_ORDER.filter((category) =>
    sortedMenuItems.some((item) => item.category === category),
  ),
];

function getFilteredItems(category: ActiveCategory) {
  if (category === ALL_CATEGORY) return sortedMenuItems;
  return sortedMenuItems.filter((item) => item.category === category);
}

export function Menu() {
  const [active, setActive] = useState<ActiveCategory>(ALL_CATEGORY);
  const { t } = useI18n();
  const filtered = getFilteredItems(active);

  const slugKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return (
    <section id="menu" className="relative bg-card/30 py-16 md:py-24 content-auto">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4">
            {t("menu.tag")}
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-display leading-[0.95]">
            {t("menu.title")}
          </h2>
          <p className="mt-6 text-foreground/70">{t("menu.description")}</p>
        </div>

        <div className="mx-auto mb-12 flex max-w-5xl flex-wrap justify-center gap-2 md:gap-3">
          {filterCategories.map((c) => {
            const label = t(`menu.categories.${slugKey(c)}`);
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                aria-pressed={active === c}
                className={`min-h-10 max-w-full rounded-full px-4 py-2.5 text-center font-sans text-xs font-semibold leading-tight tracking-normal whitespace-normal break-words transition-all sm:px-5 sm:text-sm md:px-6 md:py-3 md:text-base ${
                  active === c
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "border border-border/70 bg-card/90 text-foreground/85 hover:border-primary/35 hover:bg-card"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuCard({ item }: { item: Item }) {
  const { t } = useI18n();
  const img = item.image_url || FALLBACK[item.name];
  return (
    <article className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-card transition-colors duration-200 hover:border-primary/35">
      <div className="relative aspect-[4/3] overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={item.name}
            width={960}
            height={960}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 640px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 text-center px-4">
            <div className="font-display text-5xl mb-2">📸</div>
            <div className="font-display text-sm tracking-[0.3em] text-primary uppercase">
              {t("menu.photoSoon")}
            </div>
          </div>
        )}

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10" />
      </div>

      {/* Text block */}
      <div className="relative p-6">
        <h3 className="mb-2 flex items-start justify-between gap-4 font-display text-xl md:text-2xl">
          <span className="min-w-0 flex-1">{item.name}</span>
          <span className="inline-flex shrink-0 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-sans text-base font-extrabold leading-none text-emerald-300">
            {formatPrice(item.price_cents)}
          </span>
        </h3>
        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {item.description}
          </p>
        )}
      </div>
    </article>
  );
}
