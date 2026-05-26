import { motion } from "framer-motion";
import bg from "@/assets/menu-tenders.png";
import { useI18n } from "@/lib/i18n";

export function Concept() {
  const { t } = useI18n();
  return (
    <section id="concept" className="relative py-32 overflow-hidden">
      {/* BG image w/ overlays */}
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl text-center mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display mb-8 leading-[0.95]"
          >
            {t("concept.titleLine1")}
            <br />
            <span className="text-gradient-sunset">{t("concept.titleHighlight")}</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4 text-lg text-foreground/80"
          >
            <p>
              {t("concept.p1_start")}
              <span className="text-foreground font-bold">{t("concept.p1_bold")}</span>
              {t("concept.p1_end")}
            </p>
            <p className="text-foreground font-bold">{t("concept.p2")}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
