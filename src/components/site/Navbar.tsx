import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.webp";
import { useI18n } from "@/lib/i18n";

export function Navbar({ compact = false }: { compact?: boolean } = {}) {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const logoOffsetClass = compact ? "translate-y-0" : "translate-y-[1cm]";
  const logoSizeClass = compact
    ? "h-[2.625rem] md:h-[3.75rem]"
    : scrolled
      ? "h-[5.25rem] md:h-[7.5rem]"
      : "h-[7.5rem] md:h-[11.25rem]";
  const sectionHref = (id: string) => `${compact ? "/" : ""}#${id}`;

  const navLinkCls =
    "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        compact ? "py-2" : scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between px-5 py-3 relative">
          {/* Left: Concept + Recrutement */}
          <nav className="hidden md:flex items-center gap-1">
            <a href={sectionHref("concept")} className={navLinkCls}>
              {t("nav.concept")}
            </a>
            <Link to="/recrutement" className={navLinkCls}>
              {t("nav.recrut")}
            </Link>
          </nav>

          {/* Mobile left spacer */}
          <div className="md:hidden w-10" />

          {/* Center: logo */}
          <motion.a
            href={compact ? "/" : "#hero"}
            initial={{ rotate: 20, opacity: 0, scale: 0.96 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.04, duration: 0.3, ease: [0.2, 1, 0.3, 1] }}
            className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center border-0 outline-none transition-transform duration-500 ${logoOffsetClass}`}
          >
            <img
              src={logo}
              alt="Crazy Toasty Toulouse"
              width={420}
              height={375}
              decoding="async"
              className={`w-auto border-0 outline-none transition-all duration-500 ${logoSizeClass}`}
            />
          </motion.a>

          {/* Right: Menu + Contact + FR/EN */}
          <div className="hidden md:flex items-center gap-1">
            <a href={sectionHref("menu")} className={navLinkCls}>
              {t("nav.menu")}
            </a>
            <Link to="/contact" className={navLinkCls}>
              {t("nav.contact")}
            </Link>

            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={() => setLang("fr")}
                className={`px-2 py-1 rounded text-sm ${
                  lang === "fr" ? "bg-white/10" : "hover:bg-white/5"
                }`}
                aria-label={t("nav.french")}
              >
                FR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded text-sm ${
                  lang === "en" ? "bg-white/10" : "hover:bg-white/5"
                }`}
                aria-label={t("nav.english")}
              >
                EN
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2"
            aria-label={t(open ? "nav.closeMenu" : "nav.toggleMenu")}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-2"
          >
            <a
              href={sectionHref("menu")}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg hover:bg-white/5"
            >
              {t("nav.menu")}
            </a>
            <a
              href={sectionHref("concept")}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg hover:bg-white/5"
            >
              {t("nav.concept")}
            </a>
            <a
              href={sectionHref("adresses")}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg hover:bg-white/5"
            >
              {t("nav.where")}
            </a>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg hover:bg-white/5"
            >
              {t("nav.contact")}
            </Link>
            <Link
              to="/recrutement"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg hover:bg-white/5"
            >
              {t("nav.recrut")}
            </Link>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setLang("fr")}
                className={`px-3 py-2 rounded ${lang === "fr" ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                FR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-2 rounded ${lang === "en" ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                EN
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
