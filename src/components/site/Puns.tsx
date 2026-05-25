import { motion } from "framer-motion";

const puns = [
  { title: "Cocorico'hein !", text: "Notre poulet, il a l'accent du Sud-Ouest." },
  { title: "Crouss'tilleur", text: "Plus croustillant qu'une cassoulet'tière oubliée." },
  { title: "Toulous'haine zéro", text: "Que de l'amour dans nos bowls, peuchère." },
  { title: "Sauce Garon'naise", text: "Maison, ça coule de source (de la Garonne)." },
  { title: "Pané Capitole", text: "Le poulet star de la place, té !" },
  { title: "Bowl rosé", text: "Comme la ville, comme tes joues après la sauce piquante." },
  { title: "Tchin Toasty", text: "On trinque au poulet, con !" },
  { title: "Riz pitchoun", text: "Petit grain, gros goût." },
];

export function Puns() {
  return (
    <section className="relative py-4 md:py-8 my-4 md:my-8 overflow-hidden bg-[#1e3a8a] rounded-2xl max-w-5xl mx-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,120,40,1.12),transparent_60%)] pointer-events-none" />
      <div className="mx-auto px-3 md:px-4 relative">
        <div className="text-center mb-2 md:mb-4">
          <div className="font-display text-[9px] md:text-[11px] tracking-[0.3em] md:tracking-[0.4em] text-primary mb-0.5 md:mb-1">
            DICO TOULOUS'HEIN
          </div>
          <h2 className="font-display text-lg md:text-2xl lg:text-3xl text-white leading-[0.95]">
            DES JEUX DE MOTS{" "}
            <span className="text-gradient-flame">À LA SAUCE TOULOUS'HEIN</span>
          </h2>
        </div>

        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]">
          <motion.div
            className="flex gap-1.5 md:gap-3 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          >
            {[...puns, ...puns].map((p, i) => (
              <div
                key={i}
                className="w-[200px] md:w-[240px] shrink-0 rounded-lg md:rounded-xl bg-white/5 backdrop-blur border border-white/15 p-2.5 md:p-4 hover:border-primary/60 transition-colors"
              >
                <div className="font-display text-sm md:text-lg text-primary mb-0.5 md:mb-1 uppercase tracking-wide">
                  {p.title}
                </div>
                <p className="text-[11px] md:text-sm text-white/80">{p.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
