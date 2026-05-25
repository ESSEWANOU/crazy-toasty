import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Zap, Heart, Target } from "lucide-react";
import story1 from "@/assets/story-1.png";
import story2 from "@/assets/story-2.png";
import story3 from "@/assets/story-3.png";
import story4 from "@/assets/story-4.png";
import story5 from "@/assets/story-5.png";

const storyImages = [story1, story2, story3, story4, story5];

const pillars = [
  {
    icon: Heart,
    title: "Obsession du goût",
    text: "Chaque recette est testée, retestée, affinée. Rien ne sort tant que ce n'est pas parfaitement croustillant.",
  },
  {
    icon: Zap,
    title: "Audace créative",
    text: "On mélange les cultures, les saveurs, les textures. Korean fusion, sauce verde, cheddar lava — on ose tout.",
  },
  {
    icon: Target,
    title: "Excellence locale",
    text: "Né à Toulouse, fait à Toulouse. On travaille avec des fournisseurs locaux et une équipe passionnée.",
  },
];

export function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const [imgIndex, setImgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setImgIndex((i) => (i + 1) % storyImages.length), 2800);
    return () => clearInterval(t);
  }, []);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);
  const quoteOpacity = useTransform(scrollYProgress, [1, 0], [1, 0]);

  return (
    <section ref={sectionRef} id="histoire" className="relative py-24 md:py-40 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4">
        {/* Split layout: image + quote */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          {/* Image with parallax */}
          <motion.div
            style={{ y: imageY }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden">
              <AnimatePresence mode="sync">
                <motion.img
                  key={imgIndex}
                  src={storyImages[imgIndex]}
                  alt="Crazy Toasty — toasté gourmand"
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1, scale: 1.08 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
              {/* Decorative border glow */}
              <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10 pointer-events-none" />
              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {storyImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === imgIndex ? "w-6 bg-primary" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            </div>
            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-4 md:bottom-8 md:-right-8 glass rounded-2xl px-5 py-3 border border-primary/30 shadow-glow"
            >
              <div className="font-display text-2xl md:text-3xl text-gradient-flame leading-none">2019</div>
              <div className="text-xs text-muted-foreground mt-1">Naissance à Toulouse</div>
            </motion.div>
          </motion.div>

          {/* Text content */}
          <motion.div
            style={{ y: textY }}
            initial={{ opacity: 3, x: 40 }}
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
                  <svg className="absolute -bottom-2 left-1 w-full h-3 text-primary/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 10, 50 5 T 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                  </svg>
                </span>{" "}
                et{" "}
                <span className="relative inline-block">
                  <span className="text-gradient-flame">croustillant.</span>
                  <svg className="absolute -bottom-2 left-1 w-full h-3 text-primary/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 10, 50 5 T 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
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
                <span className="text-foreground font-semibold">ce que tu manges doit te rendre heureux.</span>
              </p>
              <p>
                Depuis 2019, on a servi plus de{" "}
                <span className="text-primary font-bold">10 000 toastés</span> à Toulouse. Et on ne s'arrête pas là.
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

        {/* 3 pillars */}
        <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="group relative glass rounded-3xl p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_50px_-15px_oklch(0.7_0.19_48/0.35)]"
            >
              <div className="h-12 w-12 rounded-2xl bg-gradient-sunset grid place-items-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <p.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-xl mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
