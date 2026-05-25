import { motion } from "framer-motion";
import { useEffect, useState, lazy, Suspense } from "react";
import { MapPin, ShoppingBag, Truck, Store, Navigation } from "lucide-react";
import type { StoreLocation } from "./StoresMap";

const StoresMap = lazy(() => import("./StoresMap").then((m) => ({ default: m.StoresMap })));

const platforms: { name: string; url: string }[] = [
  { name: "Uber Eats", url: "https://www.ubereats.com/fr/search?q=crazy%20toasty%20toulouse" },
  { name: "Deliveroo", url: "https://deliveroo.fr/fr/search?query=crazy+toasty+toulouse" },
  { name: "Just Eat", url: "https://www.just-eat.fr/search?q=crazy+toasty+toulouse" },
];
const PHONE = "+33500000000"; // TODO: remplacer par le vrai numéro
const stores: StoreLocation[] = [
  { city: "Toulouse — Jean Jaurès", addr: "2 rue Paul Mériel, 31000 Toulouse (à 2 min du métro Jean Jaurès)", lat: 43.6064, lng: 1.4505 },
];

export function Order() {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <section id="commander" className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="font-display text-sm tracking-[0.4em] text-sunset-pink mb-4">COMMANDER</div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-display leading-[0.95]">
            T'AS FAIM ? <span className="text-gradient-sunset">ON GÈRE.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            className="glass rounded-3xl p-8"
          >
            <ShoppingBag className="h-12 w-12 text-primary mb-6" />
            <h3 className="text-2xl font-display mb-3">🏪 Click & Collect</h3>
            <p className="text-muted-foreground mb-6">Commande par téléphone, viens chercher, repars heureux.</p>
            <a href={`tel:${PHONE}`} className="inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:scale-105 transition-transform">
              Appeler pour commander
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="glass rounded-3xl p-8"
          >
            <Truck className="h-12 w-12 text-secondary mb-6" />
            <h3 className="text-2xl font-display mb-3">🛵 Livraison</h3>
            <p className="text-muted-foreground mb-6">On vient jusqu'à toi. Toulouse et environs.</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full glass px-4 py-2 text-sm font-bold hover:bg-white/10 hover:text-primary transition-colors"
                >
                  {p.name}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -6 }}
            className="glass rounded-3xl p-8"
          >
            <Store className="h-12 w-12 text-destructive mb-6" />
            <h3 className="text-2xl font-display mb-3">📍 Sur place</h3>
            <p className="text-muted-foreground mb-6">Viens kiffer dans nos restos toulousains.</p>
            <a href="#stores" className="inline-block rounded-full glass px-6 py-3 font-bold hover:bg-white/10">
              Voir les adresses
            </a>
          </motion.div>
        </div>

        <div id="stores" className="glass rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-display">Retrouve-nous dans la ville rose 🟣</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              {stores.map((s, i) => (
                <motion.div
                  key={s.city}
                  whileHover={{ x: 6 }}
                  onClick={() => setActive(i)}
                  className={`cursor-pointer rounded-2xl p-4 transition-colors border ${
                    active === i
                      ? "bg-primary/15 border-primary/40"
                      : "bg-background/40 hover:bg-background/60 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-lg">{s.city}</div>
                      <div className="text-sm text-muted-foreground">{s.addr}</div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.addr + ", Toulouse")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
                    >
                      <Navigation className="h-3 w-3" />
                      Itinéraire
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="relative aspect-video md:aspect-auto rounded-2xl overflow-hidden border border-border min-h-[360px]">
              {mounted ? (
                <Suspense fallback={<div className="absolute inset-0 bg-background/40" />}>
                  <StoresMap stores={stores} activeIndex={active} onSelect={setActive} />
                </Suspense>
              ) : (
                <div className="absolute inset-0 bg-background/40" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
