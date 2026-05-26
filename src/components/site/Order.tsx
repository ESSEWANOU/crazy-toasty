import { motion } from "framer-motion";
import { useEffect, useState, lazy, Suspense } from "react";
import { MapPin, Navigation } from "lucide-react";
import type { StoreLocation } from "./StoresMap";

const StoresMap = lazy(() => import("./StoresMap").then((m) => ({ default: m.StoresMap })));

const stores: StoreLocation[] = [
  {
    city: "Toulouse — Jean Jaurès",
    addr: "2 rue Paul Mériel, 31000 Toulouse (à 2 min du métro Jean Jaurès)",
    lat: 43.6064,
    lng: 1.4505,
  },
];

export function Order() {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <section id="adresses" className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div id="stores" className="glass rounded-3xl p-4 sm:p-6 md:p-12 overflow-hidden">
          <div className="flex items-center gap-3 mb-8 min-w-0">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-display">Retrouve-nous dans la ville rose 🟣</h3>
          </div>
          <div className="grid min-w-0 md:grid-cols-2 gap-6 md:gap-8">
            <div className="min-w-0 space-y-3">
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-lg">{s.city}</div>
                      <div className="text-sm text-muted-foreground">{s.addr}</div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.addr + ", Toulouse")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="self-start shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
                    >
                      <Navigation className="h-3 w-3" />
                      Itinéraire
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="relative h-[320px] w-full min-w-0 max-w-full md:h-auto md:min-h-[360px] rounded-2xl overflow-hidden border border-border isolate">
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
