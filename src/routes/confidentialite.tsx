import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

const CONTACT_EMAIL = "blackpearltoulouse@gmail.com";

export const Route = createFileRoute("/confidentialite")({
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar compact />

      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl mb-8">
          Politique de confidentialité
        </h1>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Responsable du traitement
            </h2>
            <p>
              Le responsable du traitement des données personnelles est
              MEXICANFOOD31, société à responsabilité limitée, immatriculée sous le
              SIREN 900 453 648.
            </p>
            <p>Siège social : 2 rue Paul Mériel, 31000 Toulouse, France</p>
            <p>Le site est exploité sous l’enseigne commerciale Crazy Toasty.</p>
            <p>
              Contact :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Données collectées
            </h2>
            <p>
              Dans le cadre de l’utilisation du site, Crazy Toasty peut être amené
              à collecter certaines données personnelles, notamment :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>nom et prénom ;</li>
              <li>numéro de téléphone ;</li>
              <li>adresse email ;</li>
              <li>informations liées à une demande de contact ou à une commande ;</li>
              <li>adresse de livraison, si une fonctionnalité de livraison est proposée ;</li>
              <li>
                informations techniques nécessaires au fonctionnement et à la
                sécurité du site, comme l’adresse IP, le type de navigateur ou les
                journaux techniques.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Utilisation des données
            </h2>
            <p>Les données collectées peuvent être utilisées pour :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>répondre à une demande envoyée depuis le site ;</li>
              <li>traiter une commande ou une demande liée au restaurant ;</li>
              <li>organiser le retrait ou la livraison d’une commande ;</li>
              <li>contacter un client en cas de problème avec une commande ;</li>
              <li>assurer le bon fonctionnement, la sécurité et l’amélioration du site ;</li>
              <li>respecter les obligations légales applicables.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Durée de conservation
            </h2>
            <p>
              Les données personnelles sont conservées uniquement pendant la durée
              nécessaire aux finalités pour lesquelles elles ont été collectées,
              sauf obligation légale imposant une durée de conservation plus longue.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Destinataires des données
            </h2>
            <p>
              Les données collectées sont destinées à MEXICANFOOD31 et aux
              personnes autorisées à les traiter dans le cadre de l’activité de
              Crazy Toasty.
            </p>
            <p>
              Elles peuvent également être transmises à des prestataires techniques
              nécessaires au fonctionnement du site, notamment l’hébergeur.
            </p>
            <p>Les données personnelles ne sont pas vendues à des tiers.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Cookies et stockage local
            </h2>
            <p>
              Le site peut utiliser des technologies nécessaires à son bon
              fonctionnement, notamment le stockage local du navigateur pour
              mémoriser certaines préférences, comme la langue choisie.
            </p>
            <p>
              Aucun cookie publicitaire ou traceur marketing n’est utilisé sans
              information préalable de l’utilisateur et, lorsque la réglementation
              l’exige, sans son consentement.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Droits des utilisateurs
            </h2>
            <p>
              Conformément à la réglementation applicable en matière de protection
              des données personnelles, vous disposez notamment d’un droit d’accès,
              de rectification, d’effacement, d’opposition et de limitation du
              traitement.
            </p>
            <p>
              Pour exercer vos droits, vous pouvez nous contacter à l’adresse
              suivante :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>Vous pouvez également introduire une réclamation auprès de la CNIL.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
