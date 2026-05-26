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
