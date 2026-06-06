import { Instagram, Facebook } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative border-t border-border pb-12 overflow-hidden">
      {/* Wordmark on blue background - top */}
      <div className="relative w-full flex justify-center items-center py-8 md:py-12 px-4 bg-[#1e3a8a] overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] max-w-[800px] aspect-square bg-primary/25 blur-3xl rounded-full pointer-events-none"
          aria-hidden
        />
        <div className="relative text-center">
          <div className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[0.9] drop-shadow-[0_0_40px_rgba(245,120,40,0.6)]">
            CRAZY TOASTY
          </div>
          <div className="font-display text-sm sm:text-base md:text-xl text-primary tracking-[0.25em] mt-2 md:mt-3">
            TOULOUS'HEIN&nbsp;!
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-16">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="font-display mb-3 uppercase tracking-wide">
              {t("footer.navigation")}
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#concept" className="hover:text-primary transition-colors">
                  {t("nav.concept")}
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-primary transition-colors">
                  {t("nav.menu")}
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link to="/recrutement" className="hover:text-primary transition-colors">
                  {t("nav.recrut")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-display mb-3 uppercase tracking-wide">{t("footer.legal")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/mentions-legales" className="hover:text-primary transition-colors">
                  {t("footer.legal_notice")}
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="hover:text-primary transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-display mb-3 uppercase tracking-wide">{t("footer.followUs")}</div>
            <div className="flex gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="h-11 w-11 rounded-xl bg-card grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="h-11 w-11 rounded-xl bg-card grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="TikTok"
                className="h-11 w-11 rounded-xl bg-card grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors font-display"
              >
                TT
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{t("footer.address")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="pt-6 border-t border-border text-center text-xs text-muted-foreground">
          {t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}
        </div>
      </div>
    </footer>
  );
}
