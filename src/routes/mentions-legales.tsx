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
};

const LEGAL_CONTENT: Record<"fr" | "en", { title: string; updated: string; sections: Section[] }> =
  {
    fr: {
      title: "Mentions légales",
      updated: "Dernière mise à jour : juin 2025",
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
            "Le site est exploité sous l'enseigne commerciale Crazy Toasty.",
            "Téléphone : 05 23 26 24 58",
            "Directeur de la publication : Yahyaoui Ahmed",
          ],
          emailPrefix: "Email :",
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Le site web (interface utilisateur) est hébergé par :",
            "Cloudflare, Inc. — 101 Townsend Street, San Francisco, CA 94107, États-Unis",
            "La base de données et les fichiers (CV) sont hébergés par :",
            "Supabase, Inc. — Data center : Europe de l'Ouest (Paris, France)",
            "Les emails transactionnels sont acheminés par :",
            "Resend, Inc. — Data center : Europe de l'Ouest (Irlande)",
            "Les paiements en ligne (lorsqu'ils sont activés) sont traités par :",
            "Stripe, Inc. — 185 Berry Street, Suite 550, San Francisco, CA 94107, États-Unis",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "L'ensemble des contenus présents sur ce site (textes, images, photographies, logos, graphismes, icônes, noms de produits et éléments de design) est protégé par le droit de la propriété intellectuelle.",
            "Toute reproduction, représentation, modification, publication, adaptation ou exploitation, totale ou partielle, du contenu du site, est interdite sans autorisation écrite préalable de MEXICANFOOD31.",
          ],
        },
        {
          title: "Responsabilité",
          paragraphs: [
            "MEXICANFOOD31 s'efforce de fournir des informations exactes et à jour. Toutefois, des erreurs ou omissions peuvent apparaître concernant les prix, horaires, disponibilités ou informations produits.",
            "Les images des plats ont pour but de donner un aperçu visuel. Le plat servi peut différer de l'image affichée. Il est conseillé de lire les descriptions avant de commander.",
            "Les informations présentes sur le site sont données à titre indicatif et peuvent être modifiées à tout moment.",
          ],
        },
        {
          title: "Médiation",
          paragraphs: [
            "En cas de litige non résolu amiablement, le client peut recourir gratuitement à un médiateur de la consommation. Coordonnées disponibles sur demande.",
          ],
        },
        {
          title: "Contact",
          emailPrefix:
            "Pour toute question concernant le site, vous pouvez nous contacter à l'adresse suivante :",
        },
      ],
    },
    en: {
      title: "Legal Notice",
      updated: "Last updated: June 2025",
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
            "The website (user interface) is hosted by:",
            "Cloudflare, Inc. — 101 Townsend Street, San Francisco, CA 94107, United States",
            "The database and files (CVs) are hosted by:",
            "Supabase, Inc. — Data center: Western Europe (Paris, France)",
            "Transactional emails are delivered by:",
            "Resend, Inc. — Data center: Western Europe (Ireland)",
            "Online payments (when enabled) are processed by:",
            "Stripe, Inc. — 185 Berry Street, Suite 550, San Francisco, CA 94107, United States",
          ],
        },
        {
          title: "Intellectual Property",
          paragraphs: [
            "All content on this website (texts, images, photographs, logos, graphics, icons, product names, and design elements) is protected by intellectual property law.",
            "Any reproduction, representation, modification, publication, adaptation, or use, whether total or partial, of the website content is prohibited without prior written authorization from MEXICANFOOD31.",
          ],
        },
        {
          title: "Liability",
          paragraphs: [
            "MEXICANFOOD31 makes every effort to provide accurate and up-to-date information. However, errors or omissions may occur regarding prices, opening hours, availability, or product information.",
            "Dish images are intended to provide a visual preview. The dish served may differ from the displayed image. Customers are advised to read product descriptions before ordering.",
            "Information on this website is provided for informational purposes only and may be changed at any time.",
          ],
        },
        {
          title: "Mediation",
          paragraphs: [
            "In the event of an unresolved dispute, customers may seek free recourse from a consumer mediator. Contact details available upon request.",
          ],
        },
        {
          title: "Contact",
          emailPrefix: "For any question about this website, you can contact us at:",
        },
      ],
    },
  };

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
        <p className="mb-2 font-display text-sm tracking-[0.3em] text-sunset-pink uppercase">
          {lang === "fr" ? "Informations légales" : "Legal information"}
        </p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">{content.title}</h1>
        <p className="text-xs text-muted-foreground mb-10">{content.updated}</p>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          {content.sections.map((section) => (
            <div key={section.title} className="border-t border-border/40 pt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">{section.title}</h2>
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
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
