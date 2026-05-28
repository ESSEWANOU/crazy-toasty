import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import bowlOg from "@/assets/bowl-og.webp";
import bowlSpicy from "@/assets/bowl-spicy.webp";
import bowlCordon from "@/assets/royal-cordon.webp";
import bowlUpload from "@/assets/bowl-upload.webp";
import fritesCrazy from "@/assets/frites-crazy.webp";
import boxASoloCrazy from "@/assets/Box A · Solo Crazy.png";
import boxBCrazyMaster from "@/assets/Box B · Crazy Master.png";
import boxCCrazyDuo from "@/assets/Box C.png";
import wingsFirestorm from "@/assets/Wings Firestorm.png";
import wingsSmokyBbq from "@/assets/Wings Smoky BBQ.png";
import cookieNoisetteChocolat from "@/assets/Cookie Noisette Chocolat Maison.png";
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
import sauceBbq from "@/assets/sauce-bbq.webp";
import sauceCheddar from "@/assets/sauce-cheddar.webp";
import sauceCrazyBurger from "@/assets/sauce-crazy-burger.webp";
import sauceCrazyCroustille from "@/assets/sauce-crazy-croustille.webp";
import sauceSpicy from "@/assets/sauce-spicy.png";
import sauceVerde from "@/assets/sauce-verde.webp";
import sauceKorean from "@/assets/sauce-korean.webp";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";

// liste de sauvegarde pour le panier, à stocker dans le localStorage
type SavedItem = {
  id: string;
  name: string;
  priceLabel: string;
  priceCents: number;
  quantity: number;
};

function priceToCents(price: string) {
  const match = price.match(/(\d+[,.]\d{2})\s*€/);

  if (!match) {
    return 0;
  }

  return Math.round(Number(match[1].replace(",", ".")) * 100);
}

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function getSavedItemTotal(item: SavedItem) {
  return item.priceCents * item.quantity;
}

function formatOptionPieces(label: string) {
  const count = label.match(/\d+/)?.[0];
  return count ? `${count} pieces` : label.trim();
}

function SavedOrderPanel({
  items,
  totalCents,
  onRemoveItem,
}: {
  items: SavedItem[];
  totalCents: number;
  onRemoveItem: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-base font-extrabold tracking-normal text-foreground sm:text-lg">
          Commande
        </h2>
        <span className="font-sans text-sm font-bold text-foreground/70">
          {formatEuro(totalCents)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun article pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 p-3"
            >
              <div className="min-w-0">
                <p className="font-semibold">{item.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 font-sans text-xs font-bold text-muted-foreground">
                  <span className="rounded-full border border-border/70 bg-card/80 px-2 py-1">
                    Quantité : {item.quantity}
                  </span>
                  <span className="rounded-full border border-border/70 bg-card/80 px-2 py-1">
                    Prix : {item.priceLabel}
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    Total : {formatEuro(getSavedItemTotal(item))}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-sm font-semibold text-sunset-pink transition hover:border-primary/50 hover:text-primary"
                onClick={() => onRemoveItem(item.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/////////////////////////////////////////////

const CATEGORY_ORDER = [
  "Riz Crousty",
  "Salades",
  "Burgers",
  "Wings",
  "Accompagnements",
  "Kids",
  "Sauces",
  "Boissons",
  "Desserts",
  "Box & Menus",
] as const;

type Category = (typeof CATEGORY_ORDER)[number];

const CATEGORY_EMOJI: Record<Category, string> = {
  "Riz Crousty": "🥘",
  Salades: "🥬",
  Burgers: "🍔",
  Wings: "🍗",
  Accompagnements: "🍟",
  Kids: "🧒",
  Sauces: "🥣",
  Boissons: "🥤",
  Desserts: "🍰",
  "Box & Menus": "🍱",
};

type PriceOption = {
  id: string;
  label: string;
  value: string;
};

type Item = {
  id: string;
  name: string;
  description: string | null;
  price?: string;
  prices?: PriceOption[];
  category: Category;
  imageUrl: string | null;
  sortOrder: number;
};

const MENU_ITEMS: Item[] = [
  {
    id: "crousty-original",
    name: "Crousty Original — Douceur Thaï",
    description:
      "Base de riz parfumé, sauce Croustille Maison, oignons frits maison et tender de poulet ultra croustillant.",
    price: "9,90 €",
    category: "Riz Crousty",
    imageUrl: bowlOg,
    sortOrder: 1,
  },
  {
    id: "korean-fusion",
    name: "Korean Fusion  ",
    description: "Sauce signature Mayo Chili Thaï-Samouraï, crémeuse et savoureuse sans piquer.",
    price: "9,90 €",
    category: "Riz Crousty",
    imageUrl: bowlSpicy,
    sortOrder: 2,
  },
  {
    id: "cheesy-king",
    name: "Cheesy King",
    description: "Sauce cheddar fondue ultra crémeuse, gourmande à souhait.",
    price: "9,90 €",
    category: "Riz Crousty",
    imageUrl: bowlUpload,
    sortOrder: 3,
  },
  {
    id: "verde-bomb",
    name: "Verde Bomb — Sauce du Chef  ",
    description: "African Verde, création signature exclusive du chef.",
    price: "10,90 €",
    category: "Riz Crousty",
    imageUrl: verdeBombImg,
    sortOrder: 4,
  },
  {
    id: "royal-cordon-bleu",
    name: "Royal Cordon Bleu  ",
    description: "Cordon bleu maison ultra fondant, poulet, jambon, fromage et sauce au choix.",
    price: "11,90 €",
    category: "Riz Crousty",
    imageUrl: bowlCordon,
    sortOrder: 5,
  },

  {
    id: "crazy-caesar-crousty",
    name: "Crazy Caesar Crousty  ",
    description:
      "Salade fraîche, tomate, tomates cerises, concombre, oignons rouges, croûtons, poulet croustillant, parmesan et sauce Caesar maison.",
    price: "10,90 €",
    category: "Salades",
    imageUrl: crazyCaesarCrousty,
    sortOrder: 10,
  },

  {
    id: "original-tasty-burger",
    name: "Original Tasty Burger",
    description:
      "Pain brioché toasté, filet de poulet ultra croustillant, salade, tomate, cornichons et sauce Tasty signature.",
    price: "9,90 €",
    category: "Burgers",
    imageUrl: burgerClassicMaster,
    sortOrder: 20,
  },
  {
    id: "spicy-tasty-burger",
    name: "Spicy Tasty Burger",
    description:
      "Pain brioché toasté, filet de poulet ultra croustillant, salade, tomate, cornichons et sauce piquante maison.",
    price: "10,50 €",
    category: "Burgers",
    imageUrl: burgerSpicyDevil,
    sortOrder: 21,
  },

  {
    id: "wings-nature-classic",
    name: "Wings Nature Classic",
    description: "Ailes croustillantes dorées, sauce au choix à part.",
    prices: [
      { id: "x6", label: "×6", value: " 7,90 €" },
      { id: "x10", label: "×10", value: " 11,90 €" },
      { id: "x16", label: "×16", value: " 17,90 €" },
    ],
    category: "Wings",
    imageUrl: wingsNatureNew,
    sortOrder: 30,
  },
  {
    id: "wings-firestorm",
    name: "Wings Firestorm ",
    description: "Ailes croustillantes nappées de sauce piquante maison.",
    prices: [
      { id: "x6", label: "×6", value: " 8,50 €" },
      { id: "x10", label: "×10", value: " 12,90 €" },
      { id: "x16", label: "×16", value: " 18,90 €" },
    ],
    category: "Wings",
    imageUrl: wingsFirestorm,
    sortOrder: 31,
  },
  {
    id: "wings-smoky-bbq",
    name: "Wings Smoky BBQ",
    description: "Ailes croustillantes glacées à la sauce BBQ fumée maison.",
    prices: [
      { id: "x6", label: "×6", value: " 8,50 €" },
      { id: "x10", label: "×10", value: " 12,90 €" },
      { id: "x16", label: "×16", value: " 18,90 €" },
    ],
    category: "Wings",
    imageUrl: wingsSmokyBbq,
    sortOrder: 32,
  },

  {
    id: "frites-maison",
    name: "Frites Maison",
    description: "Frites épaisses dorées, croustillantes dehors, fondantes dedans, sel marin.",
    price: "4,00 €",
    category: "Accompagnements",
    imageUrl: fritesMaisonImg,
    sortOrder: 40,
  },
  {
    id: "frites-cheddar-crazy",
    name: "Frites Cheddar Crazy",
    description: "Frites épaisses nappées de cheddar fondu et d'oignons frits croustillants.",
    price: "5,50 €",
    category: "Accompagnements",
    imageUrl: fritesCheddarImg,
    sortOrder: 41,
  },
  {
    id: "frites-crazy-style",
    name: "Frites Crazy Style  ",
    description:
      "Frites épaisses, poulet croustillant effiloché, sauce Korean crémeuse et oignons frits.",
    price: "7,90 €",
    category: "Accompagnements",
    imageUrl: fritesCrazy,
    sortOrder: 42,
  },
  {
    id: "onion-rings",
    name: "Onion Rings ×4",
    description: "4 anneaux d'oignons panés dorés à la panure ultra croustillante.",
    price: "3,50 €",
    category: "Accompagnements",
    imageUrl: onionRingsImg,
    sortOrder: 43,
  },
  {
    id: "tenders-croustillants",
    name: "Tenders Croustillants ×3",
    description: "3 filets de poulet panés dorés, croustillants dehors et juteux dedans.",
    price: "6,90 €",
    category: "Accompagnements",
    imageUrl: tendersImg,
    sortOrder: 44,
  },
  {
    id: "pickin-chicken",
    name: "Pickin' Chicken ×6  ",
    description:
      "6 morceaux de poulet à la chapelure ultra croustillante, 1 sauce au choix offerte.",
    price: "6,90 €",
    category: "Accompagnements",
    imageUrl: crazyPopImg,
    sortOrder: 45,
  },
  {
    id: "nuggets-crousti-6",
    name: "Nuggets Crousti ×6",
    description: "6 nuggets de poulet dorés et croustillants.",
    price: "4,50 €",
    category: "Accompagnements",
    imageUrl: nuggetsCroustiImg,
    sortOrder: 46,
  },
  {
    id: "nuggets-crousti-10",
    name: "Nuggets Crousti ×10",
    description: "10 nuggets dorés et croustillants, 1 sauce au choix.",
    price: "6,90 €",
    category: "Accompagnements",
    imageUrl: nuggetsCroustiImg,
    sortOrder: 47,
  },

  {
    id: "kids-combo",
    name: "Menu Crazy Kids",
    description: "4 Nuggets Crousti ou Mini Crousty Rice, petites frites maison et 1 Capri-Sun.",
    price: "7,90 €",
    category: "Kids",
    imageUrl: kidsComboImg,
    sortOrder: 50,
  },

  {
    id: "sauce-croustille-maison",
    name: "Sauce Croustille Maison  ",
    description: "La signature de la maison.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceCrazyCroustille,
    sortOrder: 60,
  },
  {
    id: "sauce-spicy",
    name: "Sauce Spicy   ",
    description: "Sauce piquante à base de chili.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceSpicy,
    sortOrder: 61,
  },
  {
    id: "sauce-bbq-fumee",
    name: "Sauce BBQ Fumée",
    description: "Sauce BBQ maison aux notes fumées.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceBbq,
    sortOrder: 62,
  },
  {
    id: "sauce-cheddar",
    name: "Sauce Cheddar",
    description: "Cheddar fondu crémeux.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceCheddar,
    sortOrder: 63,
  },
  {
    id: "sauce-verde",
    name: "Sauce Verde",
    description: "African Verde, signature du chef.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceVerde,
    sortOrder: 64,
  },
  {
    id: "sauce-korean",
    name: "Sauce Korean",
    description: "Sauce à base de mayonnaise.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceKorean,
    sortOrder: 65,
  },
  {
    id: "sauce-burger-crazy",
    name: "Sauce Burger Crazy",
    description: "Sauce signature burger.",
    price: "0,80 €",
    category: "Sauces",
    imageUrl: sauceCrazyBurger,
    sortOrder: 66,
  },

  {
    id: "eau",
    name: "Eau (50cl)",
    description: "Plate ou pétillante.",
    price: "1,50 €",
    category: "Boissons",
    imageUrl: eauImg,
    sortOrder: 70,
  },
  {
    id: "soda",
    name: "Soda (33cl)",
    description: "Coca, Coca Zero, Sprite, Fanta ou Oasis.",
    price: "2,00 €",
    category: "Boissons",
    imageUrl: sodaImg,
    sortOrder: 71,
  },
  {
    id: "milkshake-classic",
    name: "Milkshake Classic",
    description: "Vanille, chocolat, fraise ou Oreo.",
    price: "5,80 €",
    category: "Boissons",
    imageUrl: milkshakeClassic,
    sortOrder: 72,
  },
  {
    id: "speculoos-dream",
    name: "Speculoos Dream  ",
    description: "Milkshake crémeux au biscuit speculoos.",
    price: "5,80 €",
    category: "Boissons",
    imageUrl: milkshakeClassic,
    sortOrder: 73,
  },
  {
    id: "caramel-beurre-sale",
    name: "Caramel Beurre Salé  ",
    description: "Milkshake au caramel beurre salé maison.",
    price: "5,80 €",
    category: "Boissons",
    imageUrl: milkshakeCaramel,
    sortOrder: 74,
  },
  {
    id: "citronnade-maison",
    name: "Citronnade Maison",
    description: "Pressée, faite maison chaque jour, fraîche et désaltérante.",
    price: "3,50 €",
    category: "Boissons",
    imageUrl: citronnadeImg,
    sortOrder: 75,
  },
  {
    id: "the-glace-peche",
    name: "Thé glacé pêche",
    description: "Bouteille 33cl.",
    price: "2,50 €",
    category: "Boissons",
    imageUrl: theGlaceImg,
    sortOrder: 76,
  },

  {
    id: "cookie-noisette-chocolat",
    name: "Cookie Noisette Chocolat Maison",
    description: "Cookie XXL maison aux pépites de chocolat et éclats de noisettes torréfiées.",
    price: "3,90 €",
    category: "Desserts",
    imageUrl: cookieNoisetteChocolat,
    sortOrder: 80,
  },
  {
    id: "brownie-maison",
    name: "Brownie Maison",
    description: "Brownie maison ultra fondant au chocolat noir intense.",
    price: "3,50 €",
    category: "Desserts",
    imageUrl: brownieImg,
    sortOrder: 81,
  },
  {
    id: "speculoos-cheesecake",
    name: "Speculoos Cheesecake  ",
    description: "Cheesecake maison crémeux sur lit de biscuit speculoos croustillant.",
    price: "4,50 €",
    category: "Desserts",
    imageUrl: cheesecakeImg,
    sortOrder: 82,
  },
  {
    id: "glace-2-boules",
    name: "Glace 2 Boules",
    description: "Vanille, chocolat ou fraise.",
    price: "3,50 €",
    category: "Desserts",
    imageUrl: glaceImg,
    sortOrder: 83,
  },

  {
    id: "option-menu",
    name: "Option Menu",
    description: "Frites Maison + Boisson 33cl.",
    price: "+2,50 €",
    category: "Box & Menus",
    imageUrl: fritesMaisonImg,
    sortOrder: 90,
  },
  {
    id: "box-a-solo-crazy",
    name: "Box A · Solo Crazy",
    description:
      "1 Croustille au choix, 2 Tenders Croustillants, 1 Boisson 33cl et 1 Sauce au choix.",
    price: "13,90 €",
    category: "Box & Menus",
    imageUrl: boxASoloCrazy,
    sortOrder: 91,
  },
  {
    id: "box-b-crazy-master",
    name: "Box B · Crazy Master",
    description:
      "1 Croustille au choix, 3 Wings, 2 Tenders Croustillants, 1 Boisson 33cl et 2 Sauces offertes.",
    price: "16,90 €",
    category: "Box & Menus",
    imageUrl: boxBCrazyMaster,
    sortOrder: 92,
  },
  {
    id: "box-c-crazy-duo",
    name: "Box C · Crazy Duo",
    description:
      "2 Croustilles au choix, 6 Wings, 3 Onion Rings, 2 Boissons 33cl et 2 Sauces offertes.",
    price: "29,90 €",
    category: "Box & Menus",
    imageUrl: boxCCrazyDuo,
    sortOrder: 93,
  },
];

const categoryRank = new Map<Category, number>(
  CATEGORY_ORDER.map((category, index) => [category, index]),
);

const sortedMenuItems = [...MENU_ITEMS].sort((a, b) => {
  const byCategory = categoryRank.get(a.category)! - categoryRank.get(b.category)!;
  if (byCategory !== 0) return byCategory;

  const bySortOrder = a.sortOrder - b.sortOrder;
  if (bySortOrder !== 0) return bySortOrder;

  return a.name.localeCompare(b.name);
});

const filterCategories: Category[] = CATEGORY_ORDER.filter((category) =>
  sortedMenuItems.some((item) => item.category === category),
);

function getFilteredItems(category: Category) {
  return sortedMenuItems.filter((item) => item.category === category);
}

export function Menu() {
  const [active, setActive] = useState<Category>(filterCategories[0]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { t } = useI18n();
  const filtered = getFilteredItems(active);

  const totalCents = savedItems.reduce((total, item) => total + item.priceCents * item.quantity, 0);

  function handleSaveItem(item: Item, selectedPrice?: PriceOption) {
    const itemName = selectedPrice
      ? `${item.name.trim()} (${formatOptionPieces(selectedPrice.label)})`
      : item.name.trim();
    const priceLabel = selectedPrice ? selectedPrice.value.trim() : (item.price ?? "");

    const priceCents = priceToCents(priceLabel);

    const savedId = selectedPrice ? `${item.id}-${selectedPrice.id}` : item.id;

    setSavedItems((currentItems) => {
      const existingItem = currentItems.find((savedItem) => savedItem.id === savedId);

      if (existingItem) {
        return currentItems.map((savedItem) =>
          savedItem.id === savedId ? { ...savedItem, quantity: savedItem.quantity + 1 } : savedItem,
        );
      }

      return [
        ...currentItems,
        {
          id: savedId,
          name: itemName,
          priceLabel,
          priceCents,
          quantity: 1,
        },
      ];
    });
  }

  function handleRemoveItem(id: string) {
    setSavedItems((currentItems) =>
      currentItems
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  return (
    <section id="menu" className="relative bg-card/30 py-16 md:py-24 content-auto">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-3xl">
          <SavedOrderPanel
            items={savedItems}
            totalCents={totalCents}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4">
            {t("menu.tag")}
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-display leading-[0.95]">
            {t("menu.title")}
          </h2>
        </div>

        <div className="mx-auto mb-12 flex max-w-5xl flex-wrap justify-center gap-2 md:gap-3">
          {filterCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              aria-pressed={active === category}
              aria-label={category}
              className={`inline-flex min-h-10 max-w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-center font-sans text-xs font-semibold leading-tight tracking-normal whitespace-normal break-words transition-all sm:px-5 sm:text-sm md:px-6 md:py-3 md:text-base ${
                active === category
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "border border-border/70 bg-card/90 text-foreground/85 hover:border-primary/35 hover:bg-card"
              }`}
            >
              <span aria-hidden="true">{CATEGORY_EMOJI[category]}</span>
              <span>{category}</span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} onSave={handleSaveItem} />
          ))}
        </div>
      </div>
    </section>
  );
}
function MenuCard({
  item,
  onSave,
}: {
  item: Item;
  onSave: (item: Item, selectedPrice?: PriceOption) => void;
}) {
  const [priceOptionsOpen, setPriceOptionsOpen] = useState(false);
  const { t } = useI18n();
  const img = item.imageUrl;
  const priceOptions = item.prices ?? [];
  const hasPriceOptions = priceOptions.length > 0;

  function handleAddClick() {
    if (hasPriceOptions) {
      setPriceOptionsOpen((open) => !open);
      return;
    }

    onSave(item);
  }

  function handlePriceOptionClick(price: PriceOption) {
    onSave(item, price);
    setPriceOptionsOpen(false);
  }

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

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10" />
      </div>

      <div className="relative p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-tight md:text-2xl">{item.name}</h3>

          <button
            type="button"
            onClick={handleAddClick}
            aria-expanded={hasPriceOptions ? priceOptionsOpen : undefined}
            aria-label={
              hasPriceOptions ? `Choisir le format de ${item.name}` : `Ajouter ${item.name}`
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-black leading-none text-primary-foreground shadow-glow transition-transform active:scale-95"
          >
            +
          </button>
        </div>
        <div className="mb-4">
          {hasPriceOptions ? (
            <>
              <div className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 font-sans text-sm font-extrabold leading-snug text-emerald-300">
                Choisir un format
              </div>

              {priceOptionsOpen && (
                <ul className="mt-3 space-y-2 rounded-2xl border border-border/70 bg-background/80 p-3">
                  {priceOptions.map((price) => (
                    <li key={price.id}>
                      <button
                        type="button"
                        onClick={() => handlePriceOptionClick(price)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-card"
                      >
                        <span className="flex min-w-0 flex-col gap-1 font-sans text-sm font-bold text-foreground">
                          <span className="text-xs uppercase text-muted-foreground">Quantité</span>
                          <span>{price.label}</span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1 text-right font-sans text-sm font-extrabold text-emerald-300">
                          <span className="text-xs uppercase text-muted-foreground">Prix</span>
                          <span>{price.value.trim()}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 font-sans text-sm font-extrabold leading-snug text-emerald-300">
              {item.price}
            </div>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}
      </div>
    </article>
  );
}
