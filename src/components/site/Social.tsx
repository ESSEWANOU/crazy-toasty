import { motion } from "framer-motion";
import { Instagram, Heart, MessageCircle } from "lucide-react";
import bowlOg from "@/assets/bowl-og.jpeg";
import bowlSpicy from "@/assets/bowl-spicy.jpeg";
import burgerClassicMaster from "@/assets/burger-classic-master.png";
import burgerBaconAttack from "@/assets/burger-bacon-attack.png";
import crazyCaesarCrousty from "@/assets/crazy-caesar-crousty.webp";
import fritesCheddarImg from "@/assets/frites-cheddar.png";
import wingsBbq from "@/assets/wings-bbq.webp";
import tendersImg from "@/assets/tenders.png";

const posts = [
  { img: bowlOg, likes: "2.4k", comments: 87, caption: "Le bowl qui rend fou 🤯" },
  { img: burgerBaconAttack, likes: "3.1k", comments: 142, caption: "Bacon Attack incoming 🥓" },
  { img: bowlSpicy, likes: "1.8k", comments: 64, caption: "Korean fire 🔥🔥" },
  { img: fritesCheddarImg, likes: "4.2k", comments: 211, caption: "Cheddar pull 🧀" },
  { img: crazyCaesarCrousty, likes: "2.9k", comments: 98, caption: "Crousty Caesar ⭐" },
  { img: wingsBbq, likes: "2.1k", comments: 73, caption: "Wings BBQ session" },
  { img: burgerClassicMaster, likes: "3.6k", comments: 158, caption: "Le classique qui claque" },
  { img: tendersImg, likes: "1.5k", comments: 49, caption: "Tenders croustillants" },
];

export function Social() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-sm mb-5"
          >
            <Instagram className="h-4 w-4 text-primary" />
            <span className="font-medium">@crazytoasty · Toulouse</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-display leading-[0.95]"
          >
            ILS EN ONT FAIT <span className="text-gradient-sunset">DU CONTENU</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-foreground/70"
          >
            Réels, stories, plats fumants — la communauté Crazy Toasty en mode dégoulinage.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {posts.map((p, i) => (
            <motion.a
              key={i}
              href="https://instagram.com/crazytoasty"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/5 hover:border-primary/40 transition-all"
            >
              <img src={p.img} alt={p.caption} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-95 transition-opacity" />
              <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs md:text-sm font-medium mb-2 line-clamp-2">{p.caption}</p>
                <div className="flex items-center gap-3 text-white text-xs">
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 fill-white" /> {p.likes}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {p.comments}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Instagram className="h-3.5 w-3.5 text-primary" />
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="https://instagram.com/crazytoasty"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-7 py-3.5 font-display text-sm uppercase tracking-wide text-white shadow-sunset hover:scale-105 transition-transform"
          >
            <Instagram className="h-4 w-4" /> Suivre @crazytoasty
          </a>
        </div>
      </div>
    </section>
  );
}
