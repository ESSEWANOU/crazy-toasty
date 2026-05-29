import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "blackpearltoulouse@gmail.com";

const PRIVACY_CONTENT = {
  fr: {
    title: "Politique de confidentialité",
    sections: [
      {
        title: "Responsable du traitement",
        paragraphs: [
          "Le responsable du traitement des données personnelles est MEXICANFOOD31, société à responsabilité limitée, immatriculée sous le SIREN 900 453 648.",
          "Siège social : 2 rue Paul Mériel, 31000 Toulouse, France",
          "Le site est exploité sous l’enseigne commerciale Crazy Toasty.",
        ],
        emailPrefix: "Contact :",
      },
      {
        title: "Données personnelles",
        paragraphs: [
          "Le site Crazy Toasty ne collecte pas de données personnelles via un formulaire, un compte client ou un système de commande en ligne.",
          "Aucune donnée nominative, adresse email, numéro de téléphone ou adresse de livraison n’est demandée ni enregistrée sur le site.",
        ],
      },
      {
        title: "Utilisation des données",
        paragraphs: [
          "Puisque le site ne collecte pas de données personnelles, aucune donnée personnelle n’est utilisée à des fins commerciales, de suivi, de prospection ou de commande.",
        ],
      },
      {
        title: "Durée de conservation",
        paragraphs: [
          "Aucune donnée personnelle n’étant collectée par le site, aucune durée de conservation de données personnelles n’est applicable.",
        ],
      },
      {
        title: "Destinataires des données",
        paragraphs: [
          "Aucune donnée personnelle collectée par le site n’est transmise à MEXICANFOOD31, à des prestataires ou à des tiers.",
          "Les données personnelles ne sont ni vendues, ni louées, ni partagées à des fins commerciales.",
        ],
      },
      {
        title: "Cookies et stockage local",
        paragraphs: [
          "Le site utilise uniquement le stockage local du navigateur pour mémoriser la langue choisie par l’utilisateur.",
          "Aucun cookie publicitaire, traceur marketing ou outil d’analyse publicitaire n’est utilisé.",
        ],
      },
      {
        title: "Droits des utilisateurs",
        paragraphs: [
          "Le site ne collectant pas de données personnelles, aucune demande d’accès, de rectification ou de suppression de données collectées via le site n’est en principe nécessaire.",
          "Pour toute question concernant la confidentialité ou le fonctionnement du site, vous pouvez nous contacter.",
        ],
        emailPrefix: "Contact :",
        footerParagraphs: ["Vous pouvez également introduire une réclamation auprès de la CNIL."],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      {
        title: "Data Controller",
        paragraphs: [
          "The controller of personal data processing is MEXICANFOOD31, a limited liability company registered under SIREN 900 453 648.",
          "Registered office: 2 rue Paul Mériel, 31000 Toulouse, France",
          "The website is operated under the Crazy Toasty trade name.",
        ],
        emailPrefix: "Contact:",
      },
      {
        title: "Personal Data",
        paragraphs: [
          "The Crazy Toasty website does not collect personal data through a form, customer account, or online ordering system.",
          "No nominative data, email address, phone number, or delivery address is requested or stored on the website.",
        ],
      },
      {
        title: "Use of Data",
        paragraphs: [
          "Because the website does not collect personal data, no personal data is used for commercial, tracking, marketing, or ordering purposes.",
        ],
      },
      {
        title: "Retention Period",
        paragraphs: [
          "Since no personal data is collected by the website, no personal data retention period applies.",
        ],
      },
      {
        title: "Data Recipients",
        paragraphs: [
          "No personal data collected by the website is transmitted to MEXICANFOOD31, service providers, or third parties.",
          "Personal data is not sold, rented, or shared for commercial purposes.",
        ],
      },
      {
        title: "Cookies and Local Storage",
        paragraphs: [
          "The website only uses browser local storage to remember the user's selected language.",
          "No advertising cookies, marketing trackers, or advertising analytics tools are used.",
        ],
      },
      {
        title: "User Rights",
        paragraphs: [
          "Because the website does not collect personal data, requests to access, rectify, or delete data collected through the website are generally not necessary.",
          "For any question about privacy or how the website works, you can contact us.",
        ],
        emailPrefix: "Contact:",
        footerParagraphs: ["You may also file a complaint with the CNIL."],
      },
    ],
  },
} as const;

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
        <h1 className="font-display text-4xl md:text-5xl mb-8">{content.title}</h1>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          {content.sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-semibold text-foreground mb-3">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {"items" in section && (
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {"emailPrefix" in section && (
                <p>
                  {section.emailPrefix}{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              )}
              {"footerParagraphs" in section &&
                section.footerParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
