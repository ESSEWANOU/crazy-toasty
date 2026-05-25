import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import story1 from "@/assets/story-1.png";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden grain"
    >
      <div className="absolute inset-2 flex items-center justify-center">
        <img
          src={story1}
          alt=""
          className="absolute w-full h-full object-cover object-[50%_30%] rounded-3xl"
        />

        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black/60 rounded-3xl" />
      </div>

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
          className="flex flex-wrap gap-4 justify-center mb-10"
        >
          <a
            href="#menu"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/30 backdrop-blur px-6 py-3 md:px-8 md:py-4 font-display text-base md:text-lg uppercase tracking-wide hover:bg-white/10 transition-colors"
          >
            Voir la carte
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/70"
        >
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />2 rue Paul Mériel, Toulouse · à 2 min du
            métro Jean Jaurès
          </span>
        </motion.div>
      </div>
    </section>
  );
}
