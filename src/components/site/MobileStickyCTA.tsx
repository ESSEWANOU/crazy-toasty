import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

export function MobileStickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="md:hidden fixed bottom-4 left-4 right-4 z-40"
        >
          <a
            href="/commander"
            className="flex items-center justify-center gap-2 w-full rounded-full bg-gradient-sunset px-6 py-4 font-display text-base uppercase tracking-wide text-white shadow-[0_10px_40px_-5px_oklch(0.7_0.19_48/0.6)] active:scale-95 transition-transform"
          >
            <ShoppingBag className="h-5 w-5" />
            Commander maintenant
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
