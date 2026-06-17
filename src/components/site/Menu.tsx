import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { LOCAL_IMAGES as PRODUCT_LOCAL_IMAGES } from "@/lib/product-images";
import bowlOg from "@/assets/bowl-og.webp";
import bowlSpicy from "@/assets/bowl-spicy.webp";
import bowlCordon from "@/assets/royal-cordon.webp";
import bowlUpload from "@/assets/bowl-upload.webp";
import fritesCrazy from "@/assets/frites-crazy.webp";
import boxAImg from "@/assets/box-a.webp";
import boxBImg from "@/assets/box-b.webp";
import boxCImg from "@/assets/box-c.webp";
import boxDImg from "@/assets/box-d.webp";
import wingsFirestorm from "@/assets/wings-firestorm.webp";
import wingsSmokyBbq from "@/assets/wings-smoky-bbq.webp";
import cookieNoisetteChocolat from "@/assets/cookie-noisette-chocolat-maison.webp";
import brownieImg from "@/assets/brownie.webp";
import cheesecakeImg from "@/assets/cheesecake.webp";
import glaceImg from "@/assets/glace.webp";
import eauImg from "@/assets/eau.webp";
import sodaImg from "@/assets/soda.webp";
import citronnadeImg from "@/assets/citronnade.webp";
import theGlaceImg from "@/assets/the-glace.webp";
import milkshakeClassic from "@/assets/milkshake-classic.webp";
import milkshakeSpeculoos from "@/assets/milkshake-speculoos.webp";
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
import baconAttackImg from "@/assets/bacon-attack.webp";
import sauceBbq from "@/assets/sauce-bbq.webp";
import sauceCheddar from "@/assets/sauce-cheddar.webp";
import sauceCrazyBurger from "@/assets/sauce-crazy-burger.webp";
import sauceCrazyCroustille from "@/assets/sauce-crazy-croustille.webp";
import sauceSpicy from "@/assets/sauce-spicy.webp";
import sauceVerde from "@/assets/sauce-verde.webp";
import sauceKorean from "@/assets/sauce-korean.webp";
import ranchImg from "@/assets/ranch.webp";
import ketchupImg from "@/assets/ketchup.webp";
import mayonnaiseImg from "@/assets/mayonnaise.webp";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";

type DBProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_new: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  display_order: number;
  options: { id: string; name: string; price: number; type?: string }[];
};

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
  return label.trim();
}

function SavedOrderPanel({
  items,
  totalCents,
  onRemoveItem,
  onCommander,
}: {
  items: SavedItem[];
  totalCents: number;
  onRemoveItem: (id: string) => void;
  onCommander: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-base font-extrabold tracking-normal text-foreground sm:text-lg">
          {t("menu.orderTitle")}
        </h2>
        <span className="font-sans text-sm font-bold text-foreground/70">
          {formatEuro(totalCents)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("menu.emptyOrder")}</p>
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
                    {t("menu.quantity")} : {item.quantity}
                  </span>
                  <span className="rounded-full border border-border/70 bg-card/80 px-2 py-1">
                    {t("menu.price")} : {item.priceLabel}
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    {t("menu.total")} : {formatEuro(getSavedItemTotal(item))}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-sm font-semibold text-sunset-pink transition hover:border-primary/50 hover:text-primary"
                onClick={() => onRemoveItem(item.id)}
              >
                {t("menu.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onCommander}
            className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            {t("menu.commander")}
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/70">
        {t("menu.savedNote")}
      </p>
    </div>
  );
}

/////////////////////////////////////////////

const CATEGORY_ORDER = [
  "Riz Crousty",
  "Accompagnements",
  "Crousty Bowl Salade",
  "Sauces",
  "Box",
  "Boissons",
  "Desserts",
  "Kids",
] as const;

type Category = (typeof CATEGORY_ORDER)[number];

const CATEGORY_EMOJI: Record<Category, string> = {
  "Riz Crousty": "🥘",
  Accompagnements: "🍟",
  "Crousty Bowl Salade": "🥬",
  Sauces: "🥣",
  Box: "🍱",
  Boissons: "🥤",
  Desserts: "🍰",
  Kids: "🧒",
};

type PriceOption = {
  id: string;
  label: string;
  value: string;
};

type Item = {
  id: string;
  name: string;
  nameEn?: string;
  description: string | null;
  descriptionEn?: string | null;
  price?: string;
  prices?: PriceOption[];
  category: Category;
  imageUrl: string | null;
  sortOrder: number;
};

type MenuLang = "fr" | "en";

const CATEGORY_LABEL_KEY: Record<Category, string> = {
  "Riz Crousty": "menu.categories.rizCrousty",
  Accompagnements: "menu.categories.sides",
  "Crousty Bowl Salade": "menu.categories.salad",
  Sauces: "menu.categories.sauces",
  Box: "menu.categories.box",
  Boissons: "menu.categories.drinks",
  Desserts: "menu.categories.desserts",
  Kids: "menu.categories.kids",
};

function getMenuItemName(item: Item, lang: MenuLang) {
  return lang === "en" && item.nameEn ? item.nameEn : item.name;
}

function getMenuItemDescription(item: Item, lang: MenuLang) {
  if (lang === "en" && item.descriptionEn !== undefined) {
    return item.descriptionEn;
  }

  return item.description;
}

const MENU_ITEMS: Item[] = [
  {
    id: "crousty-original",
    name: "Crousty Original — Douceur Thaï",
    nameEn: "Crousty Original — Sweet Thai",
    description:
      "Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender de poulet ultra croustillant, touche de sauce Thaï douce et sucrée — sans piquant, la valeur sûre.",
    descriptionEn:
      "Fragrant Thai rice, ultra-creamy house Croustille sauce, crispy onions, an ultra-crispy chicken tender, a touch of sweet Thai sauce — mild and always a safe bet.",
    price: "9,90 €",
    category: "Riz Crousty",
    imageUrl: bowlOg,
    sortOrder: 1,
  },
  {
    id: "korean-fusion",
    name: "Korean Fusion",
    nameEn: "Korean Fusion",
    description:
      "Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender croustillant, twist Mayo Chili Korean-Samouraï — la star !",
    descriptionEn:
      "Fragrant Thai rice, ultra-creamy house Croustille sauce, crispy onions, crispy tender, and a Korean-Samourai chili mayo twist — the star of the menu!",
    price: "9,90 €",
    category: "Riz Crousty",
    imageUrl: bowlSpicy,
    sortOrder: 2,
  },
  {
    id: "cheesy-king",
    name: "Cheesy King",
    nameEn: "Cheesy King",
    description:
      "Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender croustillant, cheddar fondu coulant — pour les vrais amateurs de fromage.",
    descriptionEn:
      "Fragrant Thai rice, ultra-creamy house Croustille sauce, crispy onions, crispy tender, and melting cheddar — made for true cheese lovers.",
    price: "9,90 €",
    category: "Riz Crousty",
    imageUrl: bowlUpload,
    sortOrder: 3,
  },
  {
    id: "verde-bomb",
    name: "Verde Bomb — Sauce du Chef",
    nameEn: "Verde Bomb — Chef's Sauce",
    description:
      "Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender croustillant, nappé de notre fameuse African Verde — création signature du chef.",
    descriptionEn:
      "Fragrant Thai rice, ultra-creamy house Croustille sauce, crispy onions, crispy tender, topped with our famous African Verde — the chef's signature creation.",
    price: "10,90 €",
    category: "Riz Crousty",
    imageUrl: verdeBombImg,
    sortOrder: 4,
  },
  {
    id: "royal-cordon-bleu",
    name: "Royal Cordon Bleu",
    nameEn: "Royal Cordon Bleu",
    description:
      "Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, cordon bleu maison ultra fondant (poulet + jambon + fromage qui coule). Sauce au choix : Thaï, Ranch, Cheddar ou Verde.",
    descriptionEn:
      "Fragrant Thai rice, ultra-creamy house Croustille sauce, crispy onions, and a melting house cordon bleu (chicken, ham, and cheese). Sauce of your choice: Thai, Ranch, Cheddar, or Verde.",
    price: "11,90 €",
    category: "Riz Crousty",
    imageUrl: bowlCordon,
    sortOrder: 5,
  },

  {
    id: "frites",
    name: "Frites",
    nameEn: "Fries",
    description: null,
    descriptionEn: null,
    price: "4,00 €",
    category: "Accompagnements",
    imageUrl: fritesMaisonImg,
    sortOrder: 10,
  },
  {
    id: "frites-cheddar-crazy",
    name: "Frites Cheddar Crazy",
    nameEn: "Cheddar Crazy Fries",
    description: "Frites nappées de cheddar fondu coulant et oignons frits croustillants.",
    descriptionEn: "Fries topped with melting cheddar and crispy fried onions.",
    price: "4,50 €",
    category: "Accompagnements",
    imageUrl: fritesCheddarImg,
    sortOrder: 11,
  },
  {
    id: "frites-crazy-style",
    name: "Frites Crazy Style",
    nameEn: "Crazy Style Fries",
    description:
      "La signature : poulet croustillant effiloché, sauce Korean crémeuse, oignons frits.",
    descriptionEn:
      "The signature side: shredded crispy chicken, creamy Korean sauce, and crispy onions.",
    price: "7,90 €",
    category: "Accompagnements",
    imageUrl: fritesCrazy,
    sortOrder: 12,
  },
  {
    id: "onion-rings-x4",
    name: "Onion Rings ×4",
    nameEn: "Onion Rings ×4",
    description: "4 anneaux d'oignons panés.",
    descriptionEn: "4 breaded onion rings.",
    price: "4,50 €",
    category: "Accompagnements",
    imageUrl: onionRingsImg,
    sortOrder: 13,
  },
  {
    id: "tenders-croustillants-x3",
    name: "Tenders Croustillants ×3",
    nameEn: "Crispy Tenders ×3",
    description: "3 filets de poulet panés dorés, ultra croustillants dehors, juteux dedans.",
    descriptionEn: "3 golden breaded chicken strips, ultra-crispy outside and juicy inside.",
    price: "5,50 €",
    category: "Accompagnements",
    imageUrl: tendersImg,
    sortOrder: 14,
  },
  {
    id: "nuggets-crousti-x4",
    name: "Nuggets Crousti ×4",
    nameEn: "Crousty Nuggets ×4",
    description: "4 nuggets de poulet dorés et croustillants.",
    descriptionEn: "4 golden, crispy chicken nuggets.",
    price: "4,50 €",
    category: "Accompagnements",
    imageUrl: nuggetsCroustiImg,
    sortOrder: 15,
  },
  {
    id: "crazy-pop-x6",
    name: "Crazy Pop ×6",
    nameEn: "Crazy Pop ×6",
    description: "Bouchées de poulet pop-corn ultra croustillantes. 1 sauce au choix offerte.",
    descriptionEn: "Ultra-crispy popcorn chicken bites. 1 sauce of your choice included.",
    price: "5,90 €",
    category: "Accompagnements",
    imageUrl: crazyPopImg,
    sortOrder: 16,
  },

  {
    id: "crazy-caesar-crousty",
    name: "Crazy Caesar Crousty",
    nameEn: "Crazy Caesar Crousty",
    description:
      "Salade fraîche, tomate, tomates cerises, concombre, oignons rouges, croûtons dorés, poulet ultra croustillant, parmesan râpé et sauce Caesar maison.",
    descriptionEn:
      "Fresh salad, tomato, cherry tomatoes, cucumber, red onions, golden croutons, ultra-crispy chicken, grated parmesan, and house Caesar sauce.",
    price: "10,90 €",
    category: "Crousty Bowl Salade",
    imageUrl: crazyCaesarCrousty,
    sortOrder: 20,
  },

  {
    id: "wings-nature-classic",
    name: "Wings Nature Classic",
    nameEn: "Wings Nature Classic",
    description: "Wings croustillantes dorées, sauce au choix à part.",
    descriptionEn: "Golden crispy wings, sauce of your choice on the side.",
    prices: [
      { id: "x6", label: "×6", value: "7,90 €" },
      { id: "x10", label: "×10", value: "11,90 €" },
      { id: "x16", label: "×16", value: "17,90 €" },
    ],
    category: "Accompagnements",
    imageUrl: wingsNatureNew,
    sortOrder: 40,
  },
  {
    id: "wings-firestorm",
    name: "Wings Firestorm",
    nameEn: "Wings Firestorm",
    description: "Wings croustillantes nappées de notre sauce piquante maison qui claque.",
    descriptionEn: "Crispy wings coated in our bold house hot sauce.",
    prices: [
      { id: "x6", label: "×6", value: "8,50 €" },
      { id: "x10", label: "×10", value: "12,90 €" },
      { id: "x16", label: "×16", value: "18,90 €" },
    ],
    category: "Accompagnements",
    imageUrl: wingsFirestorm,
    sortOrder: 41,
  },
  {
    id: "wings-smoky-bbq",
    name: "Wings Smoky BBQ",
    nameEn: "Wings Smoky BBQ",
    description: "Wings croustillantes glacées à notre sauce BBQ fumée maison.",
    descriptionEn: "Crispy wings glazed with our smoky house BBQ sauce.",
    prices: [
      { id: "x6", label: "×6", value: "8,50 €" },
      { id: "x10", label: "×10", value: "12,90 €" },
      { id: "x16", label: "×16", value: "18,90 €" },
    ],
    category: "Accompagnements",
    imageUrl: wingsSmokyBbq,
    sortOrder: 42,
  },

  {
    id: "sauce-crazy-croustille",
    name: "Sauce Crazy Croustille",
    nameEn: "Crazy Croustille Sauce",
    description:
      "Notre sauce signature maison ultra crémeuse, douce et parfumée — la star qui nappe nos bowls.",
    descriptionEn:
      "Our ultra-creamy, mild, fragrant house signature sauce — the star sauce on our bowls.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceCrazyCroustille,
    sortOrder: 50,
  },
  {
    id: "sauce-crazy-burger",
    name: "Sauce Crazy Burger",
    nameEn: "Crazy Burger Sauce",
    description: "Sauce maison rosée légèrement relevée, parfaite pour vos burgers et frites.",
    descriptionEn: "A lightly spiced pink house sauce, perfect with burgers and fries.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceCrazyBurger,
    sortOrder: 51,
  },
  {
    id: "sauce-cheddar",
    name: "Sauce Cheddar",
    nameEn: "Cheddar Sauce",
    description: "Cheddar fondu coulant, riche et onctueux.",
    descriptionEn: "Melting cheddar, rich and creamy.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceCheddar,
    sortOrder: 52,
  },
  {
    id: "sauce-bbq-smoky",
    name: "Sauce BBQ Smoky",
    nameEn: "Smoky BBQ Sauce",
    description: "Sauce BBQ fumée maison, sucrée-salée.",
    descriptionEn: "House smoky BBQ sauce, sweet and savory.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceBbq,
    sortOrder: 53,
  },
  {
    id: "sauce-ranch",
    name: "Sauce Ranch",
    nameEn: "Ranch Sauce",
    description: "Sauce ranch crémeuse aux herbes fraîches, douce et rafraîchissante.",
    descriptionEn: "Creamy ranch sauce with fresh herbs, mild and refreshing.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: ranchImg,
    sortOrder: 54,
  },
  {
    id: "sauce-korean-spicy",
    name: "Sauce Korean Spicy",
    nameEn: "Korean Spicy Sauce",
    description: "Sauce coréenne rouge intense, sucrée-légèrement piquante.",
    descriptionEn: "Intense red Korean sauce, sweet and lightly spicy.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceKorean,
    sortOrder: 55,
  },
  {
    id: "sauce-african-verde",
    name: "Sauce African Verde",
    nameEn: "African Verde Sauce",
    description: "Notre sauce signature du chef, herbes fraîches, piment doux et coriandre.",
    descriptionEn: "The chef's signature sauce with fresh herbs, mild chili, and coriander.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceVerde,
    sortOrder: 56,
  },
  {
    id: "sauce-algerienne",
    name: "Sauce Algérienne",
    nameEn: "Algerian Sauce",
    description: "Sauce épicée légèrement piquante, parfumée aux légumes et épices.",
    descriptionEn: "A lightly spicy sauce flavored with vegetables and spices.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: sauceSpicy,
    sortOrder: 57,
  },
  {
    id: "ketchup",
    name: "Ketchup",
    nameEn: "Ketchup",
    description: "Ketchup classique pour les puristes.",
    descriptionEn: "Classic ketchup for the purists.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: ketchupImg,
    sortOrder: 58,
  },
  {
    id: "mayonnaise",
    name: "Mayonnaise",
    nameEn: "Mayonnaise",
    description: "Mayo onctueuse.",
    descriptionEn: "Smooth mayo.",
    price: "1,00 €",
    category: "Sauces",
    imageUrl: mayonnaiseImg,
    sortOrder: 59,
  },

  {
    id: "box-a-combo-solo",
    name: "Box A · Combo Solo",
    nameEn: "Box A · Solo Combo",
    description: "1 Croustille au choix + 1 Boisson 33cl + 1 Sauce offerte.",
    descriptionEn: "1 Croustille of your choice + 1 33cl drink + 1 free sauce.",
    price: "11,90 €",
    category: "Box",
    imageUrl: boxAImg,
    sortOrder: 60,
  },
  {
    id: "box-b-combo-express",
    name: "Box B · Combo Express",
    nameEn: "Box B · Express Combo",
    description: "3 Tenders OU 6 Nuggets Crousti + 2 Wings + 1 Boisson 33cl.",
    descriptionEn: "3 tenders OR 6 Crousty Nuggets + 2 wings + 1 33cl drink.",
    price: "9,90 €",
    category: "Box",
    imageUrl: boxBImg,
    sortOrder: 61,
  },
  {
    id: "box-c-crazy-box",
    name: "Box C · Crazy Box",
    nameEn: "Box C · Crazy Box",
    description:
      "1 Croustille au choix + 3 Wings (sauce au choix) + 3 Tenders + 1 Boisson 33cl + 1 Sauce offerte.",
    descriptionEn:
      "1 Croustille of your choice + 3 wings (sauce of your choice) + 3 tenders + 1 33cl drink + 1 free sauce.",
    price: "16,90 €",
    category: "Box",
    imageUrl: boxCImg,
    sortOrder: 62,
  },
  {
    id: "box-d-discovery-box",
    name: "Box D · Discovery Box",
    nameEn: "Box D · Discovery Box",
    description:
      "2 Crousty Rice au choix + 6 Wings + 1 Onion Rings ×6 + 2 Boissons 33cl + 2 Sauces offertes.",
    descriptionEn:
      "2 Crousty Rice bowls of your choice + 6 wings + 1 Onion Rings ×6 + 2 33cl drinks + 2 free sauces.",
    price: "34,90 €",
    category: "Box",
    imageUrl: boxDImg,
    sortOrder: 63,
  },

  {
    id: "eau",
    name: "Eau (50cl)",
    nameEn: "Water (50cl)",
    description: "Plate ou pétillante.",
    descriptionEn: "Still or sparkling.",
    price: "1,50 €",
    category: "Boissons",
    imageUrl: eauImg,
    sortOrder: 70,
  },
  {
    id: "soda",
    name: "Soda (33cl)",
    nameEn: "Soda (33cl)",
    description: "Coca, Coca Zero, Sprite, Fanta, Oasis.",
    descriptionEn: "Coke, Coke Zero, Sprite, Fanta, Oasis.",
    price: "2,00 €",
    category: "Boissons",
    imageUrl: sodaImg,
    sortOrder: 71,
  },
  {
    id: "citronnade-maison",
    name: "Citronnade Maison",
    nameEn: "House Lemonade",
    description: "Pressée, faite maison chaque jour, fraîche et désaltérante.",
    descriptionEn: "Freshly squeezed, made in-house every day, fresh and thirst-quenching.",
    price: "3,50 €",
    category: "Boissons",
    imageUrl: citronnadeImg,
    sortOrder: 72,
  },
  {
    id: "the-glace-peche",
    name: "Thé glacé pêche",
    nameEn: "Peach Iced Tea",
    description: "Bouteille 33cl.",
    descriptionEn: "33cl bottle.",
    price: "2,50 €",
    category: "Boissons",
    imageUrl: theGlaceImg,
    sortOrder: 73,
  },
  {
    id: "milkshake-classic",
    name: "Milkshake Classic",
    nameEn: "Classic Milkshake",
    description: "Milkshake onctueux au choix : vanille, chocolat, fraise ou Oreo.",
    descriptionEn:
      "Smooth milkshake, flavor of your choice: vanilla, chocolate, strawberry, or Oreo.",
    price: "5,80 €",
    category: "Boissons",
    imageUrl: milkshakeClassic,
    sortOrder: 74,
  },
  {
    id: "milkshake-speculoos-dream",
    name: "Milkshake Speculoos Dream",
    nameEn: "Speculoos Dream Milkshake",
    description: "Milkshake ultra crémeux au biscuit speculoos qui fond en bouche.",
    descriptionEn: "Ultra-creamy speculoos biscuit milkshake that melts in your mouth.",
    price: "5,80 €",
    category: "Boissons",
    imageUrl: milkshakeSpeculoos,
    sortOrder: 75,
  },
  {
    id: "milkshake-caramel-beurre-sale",
    name: "Milkshake Caramel Beurre Salé",
    nameEn: "Salted Butter Caramel Milkshake",
    description: "Milkshake onctueux au caramel beurre salé maison, gourmandise absolue.",
    descriptionEn: "Smooth milkshake with house salted butter caramel, pure indulgence.",
    price: "5,80 €",
    category: "Boissons",
    imageUrl: milkshakeCaramel,
    sortOrder: 76,
  },

  {
    id: "cookie-noisette-chocolat",
    name: "Cookie Noisette Chocolat Maison",
    nameEn: "House Hazelnut Chocolate Cookie",
    description:
      "Cookie XXL maison aux pépites de chocolat fondant et éclats de noisettes torréfiées.",
    descriptionEn: "House XXL cookie with melting chocolate chips and roasted hazelnut pieces.",
    price: "3,90 €",
    category: "Desserts",
    imageUrl: cookieNoisetteChocolat,
    sortOrder: 80,
  },
  {
    id: "brownie-maison",
    name: "Brownie Maison",
    nameEn: "House Brownie",
    description: "Brownie maison ultra fondant au chocolat noir intense.",
    descriptionEn: "Ultra-melting house brownie with intense dark chocolate.",
    price: "3,50 €",
    category: "Desserts",
    imageUrl: brownieImg,
    sortOrder: 81,
  },
  {
    id: "speculoos-cheesecake",
    name: "Speculoos Cheesecake",
    nameEn: "Speculoos Cheesecake",
    description: "Cheesecake maison crémeux sur lit de biscuit speculoos croustillant.",
    descriptionEn: "Creamy house cheesecake on a crunchy speculoos biscuit base.",
    price: "4,50 €",
    category: "Desserts",
    imageUrl: cheesecakeImg,
    sortOrder: 82,
  },
  {
    id: "glace-2-boules",
    name: "Glace 2 Boules",
    nameEn: "2-Scoop Ice Cream",
    description: "Vanille · Chocolat · Fraise.",
    descriptionEn: "Vanilla · Chocolate · Strawberry.",
    price: "3,50 €",
    category: "Desserts",
    imageUrl: glaceImg,
    sortOrder: 83,
  },

  {
    id: "kids-combo",
    name: "Le Kids Combo",
    nameEn: "Kids Combo",
    description: "Mini croustille ou 4 nuggets + Capri-Sun, frites maison.",
    descriptionEn: "Mini Croustille or 4 nuggets + Capri-Sun and house fries.",
    price: "6,90 €",
    category: "Kids",
    imageUrl: kidsComboImg,
    sortOrder: 90,
  },
];

const LOCAL_IMAGES: Record<string, string | null> = PRODUCT_LOCAL_IMAGES;

// English name/description fallback for i18n (DB only stores French)
const STATIC_META: Record<string, { nameEn?: string; descriptionEn?: string | null }> =
  Object.fromEntries(
    MENU_ITEMS.map((item) => [item.name, { nameEn: item.nameEn, descriptionEn: item.descriptionEn }]),
  );

function dbProductToItem(p: DBProduct): Item {
  const meta = STATIC_META[p.name] ?? {};
  const sizeOpts = p.options.filter((o) => o.type === "size");
  const base: Omit<Item, "price" | "prices"> = {
    id: p.id,
    name: p.name,
    nameEn: meta.nameEn,
    description: p.description,
    descriptionEn: meta.descriptionEn,
    category: p.category as Category,
    imageUrl: p.image_url || LOCAL_IMAGES[p.name] || null,
    sortOrder: p.display_order,
  };
  if (sizeOpts.length > 0) {
    return {
      ...base,
      prices: sizeOpts.map((o) => ({
        id: o.id,
        label: o.name,
        value: `${o.price.toFixed(2).replace(".", ",")} €`,
      })),
    };
  }
  return { ...base, price: `${p.price.toFixed(2).replace(".", ",")} €` };
}

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
  const [active, setActive] = useState<string>(filterCategories[0]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [liveItems, setLiveItems] = useState<Item[]>(sortedMenuItems);
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("products")
      .select("id,name,description,price,image_url,category,is_new,is_best_seller,display_order,options")
      .eq("is_available", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const converted = (data as DBProduct[]).map(dbProductToItem);
          converted.sort((a, b) => {
            const rA = categoryRank.get(a.category as Category) ?? 99;
            const rB = categoryRank.get(b.category as Category) ?? 99;
            return rA !== rB ? rA - rB : a.sortOrder - b.sortOrder;
          });
          setLiveItems(converted);
        }
      });
  }, []);

  const liveFilterCategories: string[] = CATEGORY_ORDER.filter((cat) =>
    liveItems.some((item) => item.category === cat),
  );

  const filtered = liveItems.filter((item) => item.category === active);

  const totalCents = savedItems.reduce((total, item) => total + item.priceCents * item.quantity, 0);

  function handleSaveItem(item: Item, selectedPrice?: PriceOption) {
    const displayName = getMenuItemName(item, lang);
    const itemName = selectedPrice
      ? `${displayName.trim()} (${formatOptionPieces(selectedPrice.label)})`
      : displayName.trim();
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

  function handleCommander() {
    localStorage.setItem("crazy-toasty-cart", JSON.stringify(savedItems));
    navigate({ to: "/commander" });
  }

  return (
    <section id="menu" className="relative bg-card/30 py-16 md:py-24 content-auto">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-3xl">
          <SavedOrderPanel
            items={savedItems}
            totalCents={totalCents}
            onRemoveItem={handleRemoveItem}
            onCommander={handleCommander}
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

        <div className="mb-12 flex max-w-full gap-2 overflow-x-auto scrollbar-hide px-4 md:mx-auto md:max-w-5xl md:flex-wrap md:justify-center md:gap-3 md:overflow-visible md:px-0">
          {liveFilterCategories.map((category) => {
            const labelKey = CATEGORY_LABEL_KEY[category as Category];
            const categoryLabel = labelKey ? t(labelKey) : category;
            const emoji = CATEGORY_EMOJI[category as Category] ?? "🍽️";

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                aria-pressed={active === category}
                aria-label={categoryLabel}
                className={`inline-flex min-h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-center font-sans text-xs font-semibold leading-tight tracking-normal whitespace-nowrap transition-all sm:px-5 sm:text-sm md:px-6 md:py-3 md:text-base ${
                  active === category
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "border border-border/70 bg-card/90 text-foreground/85 hover:border-primary/35 hover:bg-card"
                }`}
              >
                <span aria-hidden="true">{emoji}</span>
                <span>{categoryLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} onSave={handleSaveItem} />
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground/70">
          Ces images ont pour but de donner un aperçu des plats. Le plat commandé peut être
          différent de l’image. Nous vous conseillons de lire les descriptions avant de commander.
        </p>
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
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const { t, lang } = useI18n();
  const img = item.imageUrl;
  const priceOptions = item.prices ?? [];
  const hasPriceOptions = priceOptions.length > 0;
  const displayName = getMenuItemName(item, lang);
  const description = getMenuItemDescription(item, lang);
  const isExpandableDescription =
    item.category === "Riz Crousty" && (description?.length ?? 0) > 45;

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
            alt={displayName}
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
          <h3 className="font-display text-xl leading-tight md:text-2xl">{displayName}</h3>

          <button
            type="button"
            onClick={handleAddClick}
            aria-expanded={hasPriceOptions ? priceOptionsOpen : undefined}
            aria-label={
              hasPriceOptions
                ? t("menu.chooseItemFormat").replace("{item}", displayName)
                : t("menu.addItem").replace("{item}", displayName)
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
                {t("menu.chooseFormat")}
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
                          <span className="text-xs uppercase text-muted-foreground">
                            {t("menu.quantity")}
                          </span>
                          <span>{price.label}</span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1 text-right font-sans text-sm font-extrabold text-emerald-300">
                          <span className="text-xs uppercase text-muted-foreground">
                            {t("menu.price")}
                          </span>
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

        {description &&
          (isExpandableDescription ? (
            <button
              type="button"
              onClick={() => setDescriptionOpen((open) => !open)}
              aria-expanded={descriptionOpen}
              aria-label={t(
                descriptionOpen ? "menu.collapseDescription" : "menu.expandDescription",
              ).replace("{item}", displayName)}
              className="group w-full text-left text-sm leading-relaxed text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span
                className={`block overflow-hidden transition-[max-height] duration-300 ease-out ${
                  descriptionOpen ? "max-h-48" : "max-h-[2.85rem] line-clamp-2"
                }`}
              >
                {description}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-extrabold text-sunset-pink">
                {descriptionOpen ? t("menu.showLess") : t("menu.showMore")}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 transition-transform ${
                    descriptionOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ))}
      </div>
    </article>
  );
}
