import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { MapPin, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { StoreLocation } from "./StoresMap";

const StoresMap = lazy(() => import("./StoresMap").then((m) => ({ default: m.StoresMap })));

export function Order() {
  const [active, setActive] = useState(0);
  const [mapVisible, setMapVisible] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();
  const stores: StoreLocation[] = [
    {
      city: t("order.storeCity"),
      addr: t("order.storeAddress"),
      directionsQuery: "2 rue Paul Mériel, 31000 Toulouse",
      lat: 43.6064,
      lng: 1.4505,
    },
  ];

  useEffect(() => {
    const element = mapWrapperRef.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setMapVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "220px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section id="adresses" className="relative py-16 md:py-24 content-auto">
      <div className="container mx-auto px-4">
        <div
          id="stores"
          className="rounded-3xl border border-border/70 bg-card/90 p-4 sm:p-6 md:p-12 overflow-hidden shadow-card"
        >
          <div className="flex items-center gap-3 mb-8 min-w-0">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-display">{t("order.title")}</h3>
          </div>
          <div className="grid min-w-0 md:grid-cols-2 gap-6 md:gap-8">
            <div className="min-w-0 space-y-3">
              {stores.map((s, i) => (
                <div
                  key={s.city}
                  onClick={() => setActive(i)}
                  className={`cursor-pointer rounded-2xl p-4 transition-colors border ${
                    active === i
                      ? "bg-primary/15 border-primary/40"
                      : "bg-background/40 border-border/40 hover:border-primary/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-lg">{s.city}</div>
                      <div className="text-sm text-muted-foreground">{s.addr}</div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.directionsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="self-start shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Navigation className="h-3 w-3" />
                      {t("order.directions")}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div
              ref={mapWrapperRef}
              className="relative h-[320px] w-full min-w-0 max-w-full md:h-auto md:min-h-[360px] rounded-2xl overflow-hidden border border-border isolate"
            >
              {mapVisible ? (
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
