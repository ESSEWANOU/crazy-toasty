import { MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import story1 from "@/assets/story-1.webp";

export function Hero() {
  const { t } = useI18n();

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={story1}
          alt=""
          width={960}
          height={960}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute h-full w-full object-cover object-[50%_30%]"
        />

        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-28 pb-16 text-center">
        <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-8xl lg:text-9xl leading-[0.9] mb-6 md:mb-8 break-words">
          <span className="text-gradient-flame">TASTE THE CRAZY</span>
        </h1>

        <p className="text-base md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8 md:mb-10 px-2">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <a
            href="#menu"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/30 backdrop-blur px-6 py-3 md:px-8 md:py-4 font-display text-base md:text-lg uppercase tracking-wide hover:bg-white/10 transition-colors"
          >
            {t("hero.cta")}
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            {t("hero.address")}
          </span>
        </div>
      </div>
    </section>
  );
}
