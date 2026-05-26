import React, { createContext, useContext, useEffect, useState } from "react";

type Lang = "fr" | "en";

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const translations: Record<Lang, Record<string, any>> = {
  fr: {
    nav: { concept: "Concept", menu: "Menu", where: "Où nous trouver" },
    game: {
      tag: "CRAZY GAME",
      title: "Jouer en attendant la commande",
      modeArcade: "Mode arcade",
      play: "Jouer",
      retry: "Refaire",
      over: "Partie terminée",
    },
    hero: {
      subtitle: "Le toasté le plus gourmand de la ville.",
      cta: "Voir la carte",
      address: "2 rue Paul Mériel, Toulouse · à 2 min du métro Jean Jaurès",
    },
    concept: {
      titleLine1: "ON VIENT D'OÙ ?",
      titleHighlight: "DE TOULOUSE, FRÈRE.",
      p1_start: "Crazy Toasty, c'est avant tout ",
      p1_bold: "le Croustille Bowl",
      p1_end:
        " : une base généreuse (riz parfumé ou frites maison), du poulet pané croustillant à mort, des toppings frais et nos sauces signature. Le tout dans un bowl, prêt à dévorer.",
      p2: "Pas de surgelé. Pas de bullshit. Juste du vrai, créé ici, à Toulouse.",
    },
    bestsellers: {
      tag: "⭐ BEST-SELLERS",
      title_prefix: "CE QUE LES ",
      title_highlight: "TOULOUSAINS",
      title_suffix: " S'ARRACHENT",
    },
    menu: {
      tag: "NOS BEST-SELLERS",
      title: "LE MENU QUI REND FOU",
      description:
        "Les préférés de l'équipage. Poulet croustillant cuit à la commande, sauces maison, bowls qui défoncent.",
      categories: {
        crousty_rice: "Crousty Rice",
        sides: "Accompagnements",
        crousty_bowl_salade: "Bowl & Salades",
        tasty_burgers: "Burgers",
        wings: "Wings",
        sauces: "Sauces",
        boissons: "Boissons",
        desserts: "Desserts",
        kids: "Kids",
      },
      photoSoon: "Photo bientôt",
      mostOrdered: "Le plus commandé",
      spicy: "Épicé",
      ultraCheesy: "Ultra cheesy",
    },
    footer: {
      navigation: "Navigation",
      legal: "Légal",
      followUs: "Suis-nous",
      legal_notice: "Mentions légales",
      terms: "CGV",
      privacy: "Politique de confidentialité",
      cookies: "Cookies",
      address: "2 rue Paul Mériel, 31000 Toulouse",
      copyright: "© {year} Crazy Toasty · Toulous'hein. Tous droits réservés.",
    },
    order: {
      title: "Retrouve-nous dans la ville rose 🟣",
      directions: "Itinéraire",
      directions_label: "🧭 Itinéraire",
    },
    scroll: {
      toTopAria: "Remonter en haut de la page",
    },
  },
  en: {
    nav: { concept: "Concept", menu: "Menu", where: "Where to find us" },
    game: {
      tag: "CRAZY GAME",
      title: "Play while you wait for your order",
      modeArcade: "Arcade mode",
      play: "Play",
      retry: "Retry",
      over: "Game over",
    },
    hero: {
      subtitle: "The city's most indulgent toasted sandwich.",
      cta: "See the menu",
      address: "2 rue Paul Mériel, Toulouse · 2 min from Jean Jaurès metro",
    },
    concept: {
      titleLine1: "WHERE DO WE COME FROM?",
      titleHighlight: "FROM TOULOUSE, BRO.",
      p1_start: "Crazy Toasty is above all ",
      p1_bold: "the Croustille Bowl",
      p1_end:
        ": a generous base (fragrant rice or house fries), crispy breaded chicken, fresh toppings and our signature sauces. All in a bowl, ready to devour.",
      p2: "No frozen food. No bullshit. Just real food, made here in Toulouse.",
    },
    bestsellers: {
      tag: "⭐ BEST-SELLERS",
      title_prefix: "WHAT ",
      title_highlight: "TOULOUSANS",
      title_suffix: " CAN'T GET ENOUGH OF",
    },
    menu: {
      tag: "OUR BEST-SELLERS",
      title: "THE MENU THAT MAKES YOU CRAZY",
      description: "Crew favorites. Crispy chicken cooked to order, house sauces, bowls that slap.",
      categories: {
        crousty_rice: "Crousty Rice",
        sides: "Sides",
        crousty_bowl_salade: "Bowls & Salads",
        tasty_burgers: "Tasty Burgers",
        wings: "Wings",
        sauces: "Sauces",
        boissons: "Drinks",
        desserts: "Desserts",
        kids: "Kids",
      },
      photoSoon: "Photo coming soon",
      mostOrdered: "Most ordered",
      spicy: "Spicy",
      ultraCheesy: "Ultra cheesy",
    },
    footer: {
      navigation: "Navigation",
      legal: "Legal",
      followUs: "Follow us",
      legal_notice: "Legal notice",
      terms: "Terms",
      privacy: "Privacy policy",
      cookies: "Cookies",
      address: "2 rue Paul Mériel, 31000 Toulouse",
      copyright: "© {year} Crazy Toasty · Toulous'hein. All rights reserved.",
    },
    order: {
      title: "Find us in the pink city 🟣",
      directions: "Directions",
      directions_label: "🧭 Directions",
    },
    scroll: {
      toTopAria: "Scroll to top",
    },
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("lang");
      return stored === "en" ? "en" : "fr";
    } catch {
      return "fr";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  const t = (key: string) => {
    const parts = key.split(".");
    let cur: any = translations[lang];
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else return key;
    }
    return typeof cur === "string" ? cur : key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
