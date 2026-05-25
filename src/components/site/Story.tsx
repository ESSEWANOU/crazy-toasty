import { motion } from "framer-motion";
import story1 from "@/assets/story-1.png";

export function Story() {
  return (
    <section id="histoire" className="relative py-24 md:py-40 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4">
        {/* Split layout: image + quote */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden">
              <img
                src={story1}
                alt="Crazy Toasty — toasté gourmand"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
              {/* Decorative border glow */}
              <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10 pointer-events-none" />
            </div>
            <div className="absolute -bottom-6 -right-4 md:bottom-8 md:-right-8 glass rounded-2xl px-5 py-3 border border-primary/30 shadow-glow">
              <div className="font-display text-2xl md:text-3xl text-gradient-flame leading-none">
                2019
              </div>
              <div className="text-xs text-muted-foreground mt-1">Naissance à Toulouse</div>
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-6">
              NOTRE HISTOIRE
            </div>

            {/* THE quote — massive, iconic */}
            <blockquote className="mb-10">
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-7xl leading-[0.95] mb-6">
                <span className="text-foreground">Crazy Toasty est né d'une</span>{" "}
                <span className="text-gradient-sunset">obsession :</span>
              </h2>
              <p className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.05] text-foreground/90">
                créer le toasté le plus{" "}
                <span className="relative inline-block">
                  <span className="text-gradient-flame">gourmand</span>
                  <svg
                    className="absolute -bottom-2 left-1 w-full h-3 text-primary/40"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 5 Q 25 10, 50 5 T 100 5"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>
                </span>{" "}
                et{" "}
                <span className="relative inline-block">
                  <span className="text-gradient-flame">croustillant.</span>
                  <svg
                    className="absolute -bottom-2 left-1 w-full h-3 text-primary/40"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 5 Q 25 10, 50 5 T 100 5"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>
                </span>
              </p>
            </blockquote>

            {/* Supporting paragraph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4 text-lg text-foreground/75 max-w-lg"
            >
              <p>
                Pas de compromis. Pas de raccourcis. Juste une idée simple, poussée à l'extrême :{" "}
                <span className="text-foreground font-semibold">
                  ce que tu manges doit te rendre heureux.
                </span>
              </p>
              <p>
                Depuis 2019, on fait grandir Crazy Toasty à Toulouse, une recette après l'autre.
              </p>
            </motion.div>

            {/* Signature / tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center gap-4"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <span className="font-display text-sm tracking-[0.3em] text-primary uppercase whitespace-nowrap">
                Le toasté qui dégouline
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
