/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";

type Lang = "fr" | "en";

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

type TranslationNode = string | { [key: string]: TranslationNode };

const translations: Record<Lang, Record<string, TranslationNode>> = {
  fr: {
    nav: { concept: "Concept", menu: "Menu", where: "Où nous trouver" },
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
    menu: {
      tag: "",
      title: "LE MENU QUI REND FOU",
      description: "",
      photoSoon: "Photo bientôt",
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
      title: "Retrouve-nous dans la ville rose",
      directions: "Itinéraire",
      directions_label: "🧭 Itinéraire",
    },
    scroll: {
      toTopAria: "Remonter en haut de la page",
    },
  },
  en: {
    nav: { concept: "Concept", menu: "Menu", where: "Where to find us" },
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
    menu: {
      tag: "",
      title: "THE MENU THAT MAKES YOU CRAZY",
      description: "",
      photoSoon: "Photo coming soon",
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
      title: "Find us in the pink city",
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
    } catch {
      // Ignore localStorage errors.
    }
  }, [lang]);

  const t = (key: string) => {
    const parts = key.split(".");
    let cur: TranslationNode | undefined = translations[lang];
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
