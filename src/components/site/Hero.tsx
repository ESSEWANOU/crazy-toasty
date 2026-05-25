import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import story1 from "@/assets/story-1.png";
import story2 from "@/assets/story-2.png";
import story3 from "@/assets/story-3.png";
import story4 from "@/assets/story-4.png";
import story5 from "@/assets/story-5.png";

const heroImages = [story1, story2, story3, story4, story5];

export function Hero() {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setImgIndex((i) => (i + 1) % heroImages.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden grain"
    >
      <div className="absolute inset-2 flex items-center justify-center">
        <AnimatePresence mode="sync">
          <motion.img
            key={imgIndex}
            src={heroImages[imgIndex]}
            alt=""
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute w-full h-full object-cover object-[50%_30%] rounded-3xl"
          />
        </AnimatePresence>

        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black/60 rounded-3xl" />
      </div>


      {/* Floating glow blobs */}
      <motion.div
        animate={{ y: [0, -30, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
      />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-28 pb-16 text-center">

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="font-display text-[2.75rem] sm:text-6xl md:text-8xl lg:text-9xl leading-[0.9] mb-6 md:mb-8 break-words drop-shadow-[0_0_30px_oklch(0.72_0.2_48/0.6)]"
        >
          <span className="text-gradient-flame">TASTE THE CRAZY</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9 }}
          className="text-base md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8 md:mb-10 px-2"
        >
          Le toasté le plus gourmand de la ville.
        </motion.p>

        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-wrap gap-4 justify-center mb-16"
        >
          <a
            href="#commander"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/30 backdrop-blur px-6 py-3 md:px-8 md:py-4 font-display text-base md:text-lg uppercase tracking-wide hover:bg-white/10 transition-colors"
          >
            Voir la carte
          </a>
        </motion.div>

        {/* Stat boxes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="grid grid-cols-3 max-w-2xl mx-auto gap-3 sm:gap-6 mb-10"
        >
          {[
            { n: "15 min", l: "Prêt à retirer" },
            { n: "4.8/5", l: "Avis clients" },
            { n: "+10K", l: "Commandes" },
          ].map((s) => (
            <div
              key={s.l}
              className="glass rounded-2xl px-4 py-5 border border-primary/20"
            >
              <div className="font-display text-2xl sm:text-4xl text-primary leading-none mb-2">
                {s.n}
              </div>
              <div className="text-xs sm:text-sm text-foreground/70 uppercase tracking-wider">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/70"
        >
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            2 rue Paul Mériel, Toulouse · à 2 min du métro Jean Jaurès
          </span>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 border-y border-primary/20 bg-background/80 backdrop-blur overflow-hidden py-4 z-10">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap font-display text-xl md:text-2xl"
        >
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex gap-12 shrink-0 px-6">
              <span>TOULOUS'HEIN ! 🐔</span>
              <span className="text-primary">CROUSTILLANT À MORT 🔥</span>
              <span>SAUCES MAISON ⚡</span>
              <span className="text-primary">MADE IN TOULOUSE 🟣</span>
              <span>15 MIN CHRONO ⏱️</span>
              <span className="text-primary">CRAZY TASTE 🌶️</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
