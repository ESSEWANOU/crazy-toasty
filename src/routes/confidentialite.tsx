import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "blackpearltoulouse@gmail.com";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
  emailPrefix?: string;
  footerParagraphs?: string[];
};

const PRIVACY_CONTENT: Record<
  "fr" | "en",
  { title: string; updated: string; intro: string; sections: Section[] }
> = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : juin 2025",
    intro:
      "La présente politique décrit la façon dont MEXICANFOOD31 (Crazy Toasty) collecte, utilise et protège vos données personnelles lorsque vous utilisez le site crazytoasty.fr.",
    sections: [
      {
        title: "1. Responsable du traitement",
        paragraphs: [
          "MEXICANFOOD31 — SARL au capital de 1 000 €, SIREN 900 453 648",
          "Siège social : 2 rue Paul Mériel, 31000 Toulouse, France",
        ],
        emailPrefix: "Contact :",
      },
      {
        title: "2. Données collectées et finalités",
        paragraphs: [
          "Nous collectons uniquement les données que vous nous transmettez volontairement via les formulaires du site :",
          "Formulaire de contact (page /contact) :",
        ],
        items: [
          "Nom et prénom, adresse email, téléphone (optionnel), sujet, message",
          "Finalité : répondre à votre demande et vous recontacter",
          "Base légale : consentement (soumission volontaire du formulaire)",
          "Conservation : 1 an à compter de la réception, puis suppression",
        ],
      },
      {
        title: "",
        paragraphs: ["Formulaire de candidature (page /recrutement) :"],
        items: [
          "Nom et prénom, adresse email, téléphone, poste souhaité, lettre de motivation, CV (fichier PDF, optionnel)",
          "Finalité : traitement de votre candidature et prise de contact",
          "Base légale : consentement (soumission volontaire du formulaire)",
          "Conservation : 2 ans à compter du dépôt de candidature, conformément à la réglementation",
        ],
      },
      {
        title: "",
        paragraphs: ["Formulaire de commande (page /commander, temporairement désactivé) :"],
        items: [
          "Nom et prénom, numéro de téléphone, détail de la commande, notes éventuelles",
          "Finalité : traitement et préparation de la commande de restauration",
          "Base légale : exécution d'un contrat",
          "Conservation : 3 ans à compter de la commande (obligations comptables)",
        ],
      },
      {
        title: "3. Paiements en ligne",
        paragraphs: [
          "Lorsque le paiement en ligne est activé, les transactions sont traitées par Stripe, Inc. Crazy Toasty ne stocke jamais les données bancaires (numéro de carte, cryptogramme). Ces données transitent directement sur les serveurs sécurisés de Stripe, certifiés PCI-DSS.",
          "Pour en savoir plus : stripe.com/fr/privacy",
        ],
      },
      {
        title: "4. Sous-traitants et destinataires",
        paragraphs: [
          "Vos données peuvent être transmises aux sous-traitants suivants, dans le strict cadre de l'exécution de leur service :",
        ],
        items: [
          "Supabase, Inc. — hébergement de la base de données (data center : Paris, France, UE)",
          "Resend, Inc. — envoi d'emails transactionnels (confirmation, notifications)",
          "Stripe, Inc. — traitement des paiements en ligne (lorsqu'activé)",
          "Cloudflare, Inc. — hébergement du site web",
        ],
        footerParagraphs: [
          "Aucune donnée n'est vendue, louée ou partagée à des fins commerciales.",
        ],
      },
      {
        title: "5. Transferts hors Union européenne",
        paragraphs: [
          "Supabase héberge les données en France (UE). Resend utilise un data center en Irlande (UE). Stripe et Cloudflare sont basés aux États-Unis ; des mécanismes de transfert appropriés (clauses contractuelles types) sont en place conformément au RGPD.",
        ],
      },
      {
        title: "6. Stockage local (localStorage)",
        paragraphs: [
          "Le site utilise le stockage local du navigateur (localStorage) pour les éléments suivants :",
        ],
        items: [
          "Langue sélectionnée (fr/en) — non transmise à des tiers",
          "Panier en cours (articles sélectionnés) — non transmis à des tiers, effacé après validation de commande",
        ],
        footerParagraphs: [
          "Aucun cookie publicitaire, traceur marketing ou outil d'analyse publicitaire tiers n'est utilisé.",
        ],
      },
      {
        title: "7. Sécurité",
        paragraphs: [
          "Les données sont stockées dans une base de données Supabase protégée par Row Level Security (RLS). Les connexions sont chiffrées via TLS. L'accès au tableau de bord de gestion est protégé par authentification.",
        ],
      },
      {
        title: "8. Vos droits",
        paragraphs: [
          "Conformément au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés, vous disposez des droits suivants :",
        ],
        items: [
          "Droit d'accès : obtenir une copie des données vous concernant",
          "Droit de rectification : corriger des données inexactes",
          "Droit à l'effacement : demander la suppression de vos données",
          "Droit à la portabilité : recevoir vos données dans un format structuré",
          "Droit d'opposition : vous opposer à un traitement",
          "Droit de retirer votre consentement à tout moment",
        ],
        emailPrefix: "Pour exercer ces droits, contactez-nous :",
        footerParagraphs: [
          "Vous pouvez également introduire une réclamation auprès de la CNIL : cnil.fr",
        ],
      },
      {
        title: "9. Modifications",
        paragraphs: [
          "Nous nous réservons le droit de modifier cette politique à tout moment. La date de dernière mise à jour figure en haut de page. En continuant à utiliser le site après modification, vous acceptez la politique mise à jour.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: June 2025",
    intro:
      "This policy describes how MEXICANFOOD31 (Crazy Toasty) collects, uses, and protects your personal data when you use the crazytoasty.fr website.",
    sections: [
      {
        title: "1. Data Controller",
        paragraphs: [
          "MEXICANFOOD31 — Limited liability company, share capital €1,000, SIREN 900 453 648",
          "Registered office: 2 rue Paul Mériel, 31000 Toulouse, France",
        ],
        emailPrefix: "Contact:",
      },
      {
        title: "2. Data Collected and Purposes",
        paragraphs: [
          "We only collect data you voluntarily submit through the website's forms:",
          "Contact form (/contact page):",
        ],
        items: [
          "First and last name, email address, phone (optional), subject, message",
          "Purpose: responding to your request and following up",
          "Legal basis: consent (voluntary form submission)",
          "Retention: 1 year from receipt, then deletion",
        ],
      },
      {
        title: "",
        paragraphs: ["Job application form (/recrutement page):"],
        items: [
          "First and last name, email address, phone number, desired position, cover letter, CV (PDF file, optional)",
          "Purpose: processing your application and getting in touch",
          "Legal basis: consent (voluntary form submission)",
          "Retention: 2 years from application date, as required by regulations",
        ],
      },
      {
        title: "",
        paragraphs: ["Order form (/commander page, temporarily disabled):"],
        items: [
          "First and last name, phone number, order details, optional notes",
          "Purpose: processing and preparing the restaurant order",
          "Legal basis: performance of a contract",
          "Retention: 3 years from the order date (accounting obligations)",
        ],
      },
      {
        title: "3. Online Payments",
        paragraphs: [
          "When online payment is enabled, transactions are processed by Stripe, Inc. Crazy Toasty never stores banking data (card number, security code). This data is transmitted directly to Stripe's PCI-DSS certified secure servers.",
          "Learn more at: stripe.com/privacy",
        ],
      },
      {
        title: "4. Sub-processors and Recipients",
        paragraphs: [
          "Your data may be shared with the following sub-processors, strictly for the purpose of providing their service:",
        ],
        items: [
          "Supabase, Inc. — database hosting (data center: Paris, France, EU)",
          "Resend, Inc. — transactional email delivery (confirmations, notifications)",
          "Stripe, Inc. — online payment processing (when enabled)",
          "Cloudflare, Inc. — website hosting",
        ],
        footerParagraphs: ["No data is sold, rented, or shared for commercial purposes."],
      },
      {
        title: "5. International Transfers",
        paragraphs: [
          "Supabase hosts data in France (EU). Resend uses a data center in Ireland (EU). Stripe and Cloudflare are based in the United States; appropriate transfer mechanisms (standard contractual clauses) are in place in compliance with the GDPR.",
        ],
      },
      {
        title: "6. Local Storage",
        paragraphs: [
          "The website uses browser local storage (localStorage) for the following:",
        ],
        items: [
          "Selected language (fr/en) — not shared with third parties",
          "Current cart (selected items) — not shared with third parties, cleared after order completion",
        ],
        footerParagraphs: [
          "No advertising cookies, marketing trackers, or third-party analytics tools are used.",
        ],
      },
      {
        title: "7. Security",
        paragraphs: [
          "Data is stored in a Supabase database protected by Row Level Security (RLS). Connections are encrypted via TLS. Access to the management dashboard is protected by authentication.",
        ],
      },
      {
        title: "8. Your Rights",
        paragraphs: [
          "Under the GDPR (EU Regulation 2016/679), you have the following rights:",
        ],
        items: [
          "Right of access: obtain a copy of data held about you",
          "Right to rectification: correct inaccurate data",
          "Right to erasure: request deletion of your data",
          "Right to data portability: receive your data in a structured format",
          "Right to object: object to processing",
          "Right to withdraw consent at any time",
        ],
        emailPrefix: "To exercise these rights, contact us:",
        footerParagraphs: [
          "You may also lodge a complaint with the CNIL (French data protection authority): cnil.fr",
        ],
      },
      {
        title: "9. Changes",
        paragraphs: [
          "We reserve the right to update this policy at any time. The date of the last update is shown at the top of the page. By continuing to use the site after an update, you accept the revised policy.",
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/confidentialite")({
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  const { lang } = useI18n();
  const content = PRIVACY_CONTENT[lang];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar compact />

      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <p className="mb-2 font-display text-sm tracking-[0.3em] text-sunset-pink uppercase">
          {lang === "fr" ? "Vos données" : "Your data"}
        </p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">{content.title}</h1>
        <p className="text-xs text-muted-foreground mb-4">{content.updated}</p>
        <p className="text-sm text-muted-foreground mb-10 border-l-2 border-primary/40 pl-4">
          {content.intro}
        </p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          {content.sections.map((section, i) => (
            <div key={i} className={section.title ? "border-t border-border/40 pt-8" : "pt-2"}>
              {section.title && (
                <h2 className="text-xl font-semibold text-foreground mb-4">{section.title}</h2>
              )}
              <div className="space-y-2">
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.emailPrefix && (
                  <p>
                    {section.emailPrefix}{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                )}
                {section.footerParagraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
