import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

const CONTACT_EMAIL = "blackpearltoulouse@gmail.com";

export const Route = createFileRoute("/mentions-legales")({
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar compact />

      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl mb-8">
          Mentions légales
        </h1>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Éditeur du site
            </h2>
            <p>
              Le présent site est édité par la société <strong>MEXICANFOOD31</strong>,
              société à responsabilité limitée au capital de 1 000,00 €.
            </p>
            <p>SIREN : 900 453 648</p>
            <p>SIRET du siège social : 900 453 648 00017</p>
            <p>N° TVA intracommunautaire : FR02 900 453 648</p>
            <p>Code NAF/APE : 56.10C — Restauration de type rapide</p>
            <p>Siège social : 2 rue Paul Mériel, 31000 Toulouse, France</p>
            <p>Le site est exploité sous l’enseigne commerciale Crazy Toasty.</p>
            <p>Téléphone : 05 23 26 24 58</p>
            <p>
              Email :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>Directeur de la publication : [nom du responsable à compléter]</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Hébergement
            </h2>
            <p>Le site est hébergé par :</p>
            <p>Cloudflare, Inc.</p>
            <p>101 Townsend Street</p>
            <p>San Francisco, CA 94107</p>
            <p>États-Unis</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Propriété intellectuelle
            </h2>
            <p>
              L’ensemble des contenus présents sur ce site, notamment les textes,
              images, photographies, logos, graphismes, icônes, menus, noms de
              produits et éléments de design, est protégé par le droit de la
              propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication,
              adaptation ou exploitation, totale ou partielle, du contenu du site,
              est interdite sans autorisation écrite préalable de MEXICANFOOD31.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Responsabilité
            </h2>
            <p>
              MEXICANFOOD31 s’efforce de fournir sur ce site des informations
              exactes et mises à jour. Toutefois, des erreurs ou omissions peuvent
              apparaître, notamment concernant les prix, les horaires, les
              disponibilités ou les informations relatives aux produits.
            </p>
            <p>
              Les informations présentes sur le site sont données à titre indicatif
              et peuvent être modifiées à tout moment.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Contact
            </h2>
            <p>
              Pour toute question concernant le site, vous pouvez nous contacter à
              l’adresse suivante :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
