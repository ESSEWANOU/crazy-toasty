import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "blackpearltoulouse@gmail.com";

const LEGAL_CONTENT = {
  fr: {
    title: "Mentions légales",
    sections: [
      {
        title: "Éditeur du site",
        paragraphs: [
          "Le présent site est édité par la société MEXICANFOOD31, société à responsabilité limitée au capital de 1 000,00 €.",
          "SIREN : 900 453 648",
          "SIRET du siège social : 900 453 648 00017",
          "N° TVA intracommunautaire : FR02 900 453 648",
          "Code NAF/APE : 56.10C — Restauration de type rapide",
          "Siège social : 2 rue Paul Mériel, 31000 Toulouse, France",
          "Le site est exploité sous l’enseigne commerciale Crazy Toasty.",
          "Téléphone : 05 23 26 24 58",
          "Directeur de la publication : Yahyaoui Ahmed",
        ],
        emailPrefix: "Email :",
      },
      {
        title: "Hébergement",
        paragraphs: [
          "Le site est hébergé par :",
          "Cloudflare, Inc.",
          "101 Townsend Street",
          "San Francisco, CA 94107",
          "États-Unis",
        ],
      },
      {
        title: "Propriété intellectuelle",
        paragraphs: [
          "L’ensemble des contenus présents sur ce site, notamment les textes, images, photographies, logos, graphismes, icônes, menus, noms de produits et éléments de design, est protégé par le droit de la propriété intellectuelle.",
          "Toute reproduction, représentation, modification, publication, adaptation ou exploitation, totale ou partielle, du contenu du site, est interdite sans autorisation écrite préalable de MEXICANFOOD31.",
        ],
      },
      {
        title: "Responsabilité",
        paragraphs: [
          "MEXICANFOOD31 s’efforce de fournir sur ce site des informations exactes et mises à jour. Toutefois, des erreurs ou omissions peuvent apparaître, notamment concernant les prix, les horaires, les disponibilités ou les informations relatives aux produits.",
          "Les images des plats présentes sur le site ont pour but de donner un aperçu visuel des produits. Le plat commandé peut être différent de l’image affichée. Il est conseillé de lire les descriptions des produits avant de commander.",
          "Les informations présentes sur le site sont données à titre indicatif et peuvent être modifiées à tout moment.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [],
        emailPrefix:
          "Pour toute question concernant le site, vous pouvez nous contacter à l’adresse suivante :",
      },
    ],
  },
  en: {
    title: "Legal Notice",
    sections: [
      {
        title: "Website Publisher",
        paragraphs: [
          "This website is published by MEXICANFOOD31, a limited liability company with share capital of €1,000.00.",
          "SIREN: 900 453 648",
          "SIRET of the registered office: 900 453 648 00017",
          "Intra-community VAT number: FR02 900 453 648",
          "NAF/APE code: 56.10C — Fast-food restaurant services",
          "Registered office: 2 rue Paul Mériel, 31000 Toulouse, France",
          "The website is operated under the Crazy Toasty trade name.",
          "Phone: +33 5 23 26 24 58",
          "Publication director: Yahyaoui Ahmed",
        ],
        emailPrefix: "Email:",
      },
      {
        title: "Hosting",
        paragraphs: [
          "This website is hosted by:",
          "Cloudflare, Inc.",
          "101 Townsend Street",
          "San Francisco, CA 94107",
          "United States",
        ],
      },
      {
        title: "Intellectual Property",
        paragraphs: [
          "All content on this website, including text, images, photographs, logos, graphics, icons, menus, product names, and design elements, is protected by intellectual property law.",
          "Any reproduction, representation, modification, publication, adaptation, or use, whether total or partial, of the website content is prohibited without prior written authorization from MEXICANFOOD31.",
        ],
      },
      {
        title: "Liability",
        paragraphs: [
          "MEXICANFOOD31 makes every effort to provide accurate and up-to-date information on this website. However, errors or omissions may occur, especially regarding prices, opening hours, availability, or product information.",
          "The dish images shown on the website are intended to provide a visual preview of the products. The ordered dish may differ from the displayed image. Customers are advised to read the product descriptions before ordering.",
          "The information on this website is provided for informational purposes only and may be changed at any time.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [],
        emailPrefix: "For any question about this website, you can contact us at:",
      },
    ],
  },
} as const;

export const Route = createFileRoute("/mentions-legales")({
  component: MentionsLegales,
});

function MentionsLegales() {
  const { lang } = useI18n();
  const content = LEGAL_CONTENT[lang];

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
              {"emailPrefix" in section && (
                <p>
                  {section.emailPrefix}{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
