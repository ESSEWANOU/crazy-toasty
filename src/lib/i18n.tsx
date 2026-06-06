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
    nav: {
      concept: "Concept",
      menu: "Menu",
      where: "Où nous trouver",
      french: "Français",
      english: "English",
      toggleMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      contact: "Contact",
      recrut: "Recrutement",
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
        " : une base généreuse (riz parfumé), du poulet pané croustillant à mort, des toppings frais et nos sauces signature. Le tout dans un bowl, prêt à dévorer.",
      p2: "Pas de surgelé. Pas de bullshit. Juste du vrai, créé ici, à Toulouse.",
    },
    menu: {
      tag: "",
      title: "LE MENU QUI REND FOU",
      description: "",
      photoSoon: "Photo bientôt",
      orderTitle: "Commande",
      emptyOrder: "Veuillez sélectionner les plats à sauvegarder.",
      quantity: "Quantité",
      price: "Prix",
      total: "Total",
      remove: "Supprimer",
      savedNote:
        "Récapitulatif de votre commande. Cliquez sur « Commander » pour finaliser et transmettre au restaurant.",
      commander: "Commander →",
      chooseFormat: "Choisir un format",
      chooseItemFormat: "Choisir le format de {item}",
      addItem: "Ajouter {item}",
      collapseDescription: "Réduire la description de {item}",
      expandDescription: "Afficher la description de {item}",
      showMore: "Voir plus",
      showLess: "Réduire",
      categories: {
        rizCrousty: "Riz Crousty",
        sides: "Accompagnements",
        salad: "Crousty Bowl Salade",
        burgers: "Burgers",
        wings: "Wings",
        sauces: "Sauces",
        box: "Box",
        drinks: "Boissons",
        desserts: "Desserts",
        kids: "Kids",
      },
    },
    footer: {
      navigation: "Navigation",
      legal: "Légal",
      followUs: "Suis-nous",
      legal_notice: "Mentions légales",
      privacy: "Politique de confidentialité",
      address: "2 rue Paul Mériel, 31000 Toulouse",
      copyright: "© {year} Crazy Toasty · Toulous'hein. Tous droits réservés.",
    },
    checkout: {
      title: "Finaliser ma commande",
      subtitle: "Retrait au restaurant · Jean Jaurès, Toulouse",
      orderSummary: "Récapitulatif",
      customerInfo: "Vos informations",
      name: "Prénom et nom",
      namePlaceholder: "Ex : Marie Dupont",
      phone: "Téléphone",
      phonePlaceholder: "06 12 34 56 78",
      notes: "Remarques",
      notesPlaceholder: "Allergie, demande spéciale... (facultatif)",
      submit: "Commander",
      submitting: "Envoi en cours...",
      emptyCart: "Votre panier est vide",
      emptyCartNote: "Retournez au menu pour ajouter des plats à votre commande.",
      backToMenu: "← Retour au menu",
      total: "Total",
      pickupNote: "Retrait sur place · ~15-20 min",
      pickupAddress: "2 rue Paul Mériel, 31000 Toulouse",
      errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
      nameRequired: "Veuillez entrer votre prénom et nom.",
      phoneRequired: "Veuillez entrer votre numéro de téléphone.",
      payOnline: "Payer en ligne",
      payOnsite: "Commander (paiement sur place)",
    },
    confirmation: {
      title: "Commande envoyée !",
      subtitle: "Nous préparons votre commande.",
      readyIn: "Prête dans ~15-20 min",
      ref: "Référence commande",
      address: "2 rue Paul Mériel, 31000 Toulouse",
      backHome: "Retour à l'accueil",
    },
    order: {
      title: "Retrouve-nous dans la ville rose",
      directions: "Itinéraire",
      directions_label: "🧭 Itinéraire",
      storeCity: "Toulouse — Jean Jaurès",
      storeAddress: "2 rue Paul Mériel, 31000 Toulouse (à 2 min du métro Jean Jaurès)",
    },
    contact: {
      tag: "CONTACT",
      title: "Écrivez-nous",
      subtitle: "Une question, un partenariat ou juste l'envie de dire bonjour ? On est là.",
      successTitle: "Message envoyé !",
      successText: "Merci pour votre message. Nous vous répondrons dans les meilleurs délais.",
    },
    recrut: {
      tag: "ON RECRUTE",
      title: "Rejoins l'équipe",
      subtitle: "Passionné·e de bonne bouffe et d'ambiance folle ? On cherche des gens comme toi.",
      benefitsTitle: "Pourquoi nous rejoindre ?",
      applyTitle: "Postuler",
      successTitle: "Candidature envoyée !",
      successText: "Merci pour votre candidature. Nous vous contacterons si votre profil nous intéresse.",
      nameLabel: "Prénom et nom",
      emailLabel: "Email",
      phoneLabel: "Téléphone",
      positionLabel: "Poste souhaité",
      motivationLabel: "Lettre de motivation",
      motivationPlaceholder: "Parlez-nous de vous et de votre motivation pour rejoindre l'équipe...",
      cvLabel: "CV (PDF, max 5 Mo)",
      submit: "Envoyer ma candidature",
      submitting: "Envoi en cours...",
      errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    },
    scroll: {
      toTopAria: "Remonter en haut de la page",
    },
    errors: {
      notFoundTitle: "Page introuvable",
      notFoundText: "La page que vous cherchez n'existe pas ou a été déplacée.",
      goHome: "Retour à l'accueil",
      loadTitle: "Cette page n'a pas chargé",
      loadText:
        "Un problème est survenu de notre côté. Vous pouvez réessayer ou revenir à l'accueil.",
      tryAgain: "Réessayer",
    },
  },
  en: {
    nav: {
      concept: "Concept",
      menu: "Menu",
      where: "Where to find us",
      french: "French",
      english: "English",
      toggleMenu: "Open menu",
      closeMenu: "Close menu",
      contact: "Contact",
      recrut: "Jobs",
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
        ": a generous base (fragrant rice), crispy breaded chicken, fresh toppings and our signature sauces. All in a bowl, ready to devour.",
      p2: "No frozen food. No bullshit. Just real food, made here in Toulouse.",
    },
    menu: {
      tag: "",
      title: "THE MENU THAT MAKES YOU CRAZY",
      description: "",
      photoSoon: "Photo coming soon",
      orderTitle: "Order",
      emptyOrder: "Select dishes to save them here.",
      quantity: "Qty",
      price: "Price",
      total: "Total",
      remove: "Remove",
      savedNote:
        "Your order summary. Click “Order” to finalise and send to the restaurant.",
      commander: "Order →",
      chooseFormat: "Choose a size",
      chooseItemFormat: "Choose the size for {item}",
      addItem: "Add {item}",
      collapseDescription: "Collapse the description for {item}",
      expandDescription: "Show the description for {item}",
      showMore: "See more",
      showLess: "Show less",
      categories: {
        rizCrousty: "Crousty Rice",
        sides: "Sides",
        salad: "Crousty Salad Bowl",
        burgers: "Burgers",
        wings: "Wings",
        sauces: "Sauces",
        box: "Boxes",
        drinks: "Drinks",
        desserts: "Desserts",
        kids: "Kids",
      },
    },
    footer: {
      navigation: "Navigation",
      legal: "Legal",
      followUs: "Follow us",
      legal_notice: "Legal notice",
      privacy: "Privacy policy",
      address: "2 rue Paul Mériel, 31000 Toulouse",
      copyright: "© {year} Crazy Toasty · Toulous'hein. All rights reserved.",
    },
    checkout: {
      title: "Checkout",
      subtitle: "Restaurant pickup · Jean Jaurès, Toulouse",
      orderSummary: "Order summary",
      customerInfo: "Your details",
      name: "First and last name",
      namePlaceholder: "e.g. Marie Dupont",
      phone: "Phone number",
      phonePlaceholder: "+33 6 12 34 56 78",
      notes: "Notes",
      notesPlaceholder: "Allergy, special request... (optional)",
      submit: "Place order",
      submitting: "Sending...",
      emptyCart: "Your cart is empty",
      emptyCartNote: "Go back to the menu to add items to your order.",
      backToMenu: "← Back to menu",
      total: "Total",
      pickupNote: "Pickup in-store · ~15-20 min",
      pickupAddress: "2 rue Paul Mériel, 31000 Toulouse",
      errorGeneric: "An error occurred. Please try again.",
      nameRequired: "Please enter your name.",
      phoneRequired: "Please enter your phone number.",
      payOnline: "Pay online",
      payOnsite: "Order (pay at restaurant)",
    },
    confirmation: {
      title: "Order placed!",
      subtitle: "We are preparing your order.",
      readyIn: "Ready in ~15-20 min",
      ref: "Order reference",
      address: "2 rue Paul Mériel, 31000 Toulouse",
      backHome: "Back to home",
    },
    order: {
      title: "Find us in the pink city",
      directions: "Directions",
      directions_label: "🧭 Directions",
      storeCity: "Toulouse — Jean Jaurès",
      storeAddress: "2 rue Paul Mériel, 31000 Toulouse (2 min from Jean Jaurès metro)",
    },
    contact: {
      tag: "CONTACT",
      title: "Get in touch",
      subtitle: "A question, a partnership idea or just want to say hi? We're here.",
      successTitle: "Message sent!",
      successText: "Thanks for reaching out. We'll get back to you as soon as possible.",
    },
    recrut: {
      tag: "WE'RE HIRING",
      title: "Join the team",
      subtitle: "Passionate about great food and wild vibes? We're looking for people like you.",
      benefitsTitle: "Why join us?",
      applyTitle: "Apply",
      successTitle: "Application submitted!",
      successText: "Thanks for applying. We'll be in touch if your profile is a match.",
      nameLabel: "First and last name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      positionLabel: "Position",
      motivationLabel: "Cover letter",
      motivationPlaceholder: "Tell us about yourself and why you want to join the team...",
      cvLabel: "CV / Resume (PDF, max 5 MB)",
      submit: "Submit application",
      submitting: "Sending...",
      errorGeneric: "An error occurred. Please try again.",
    },
    scroll: {
      toTopAria: "Scroll to top",
    },
    errors: {
      notFoundTitle: "Page not found",
      notFoundText: "The page you're looking for doesn't exist or has been moved.",
      goHome: "Go home",
      loadTitle: "This page didn't load",
      loadText: "Something went wrong on our end. You can try again or head back home.",
      tryAgain: "Try again",
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

    document.documentElement.lang = lang;
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
