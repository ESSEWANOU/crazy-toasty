import { motion } from "framer-motion";
import { Home, Flame, MapPin } from "lucide-react";
import bg from "@/assets/menu-tenders.jpg";

const values = [
  { icon: Home, title: "Fait maison", text: "Tout est préparé sur place, chaque jour. Pas de raccourcis, que du vrai." },
  { icon: Flame, title: "Sauces signature", text: "Nos sauces, on les a créées de A à Z. Tu les trouveras nulle part ailleurs." },
  { icon: MapPin, title: "100% Toulouse", text: "Né dans la ville rose, par des Toulousains, pour ceux qui kiffent le bon goût." },
];

export function Concept() {
  return (
    <section id="concept" className="relative py-32 overflow-hidden">
      {/* BG image w/ overlays */}
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-20 text-center mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4"
          >
            NOTRE CONCEPT
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display mb-8 leading-[0.95]"
          >
            ON VIENT D'OÙ ?
            <br />
            <span className="text-gradient-sunset">DE TOULOUSE, FRÈRE.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4 text-lg text-foreground/80"
          >
            <p>
              Crazy Toasty, c'est avant tout <span className="text-foreground font-bold">le Croustille Bowl</span> : une base généreuse (riz parfumé ou frites maison), du poulet pané croustillant à mort, des toppings frais et nos sauces signature. Le tout dans un bowl, prêt à dévorer.
            </p>
            <p className="text-foreground font-bold">
              Pas de surgelé. Pas de bullshit. Juste du vrai, créé ici, à Toulouse.
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group glass rounded-3xl p-8 border border-sunset-pink/20 hover:border-sunset-pink/60 transition-colors hover:shadow-sunset"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-sunset grid place-items-center mb-6 group-hover:rotate-12 transition-transform">
                <v.icon className="h-7 w-7 text-background" />
              </div>
              <h3 className="text-xl font-display mb-2 uppercase tracking-wide">{v.title}</h3>
              <p className="text-sm text-foreground/70">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
