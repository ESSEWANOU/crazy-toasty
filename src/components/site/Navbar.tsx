import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const links = [
  { href: "#concept", label: "Concept" },
  { href: "#menu", label: "Menu" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between px-5 py-3 relative">
          {/* Left: nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.slice(0, 1).map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Mobile left spacer */}
          <div className="md:hidden w-10" />

          {/* Center: logo */}
          <a
            href="#hero"
            className="absolute left-1/2 -translate-x-1/2 translate-y-[1cm] flex items-center justify-center border-0 outline-none"
          >
            <img
              src={logo}
              alt="Crazy Toasty Toulouse"
              className="w-auto h-[7.5rem] md:h-[11.25rem] border-0 outline-none"
            />
          </a>

          {/* Right: nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.slice(1).map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-2"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
