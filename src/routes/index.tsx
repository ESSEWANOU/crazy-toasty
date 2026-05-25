import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Concept } from "@/components/site/Concept";
import { Story } from "@/components/site/Story";
import { Puns } from "@/components/site/Puns";
import { Menu } from "@/components/site/Menu";
import { BestSellers } from "@/components/site/BestSellers";
import { Reviews } from "@/components/site/Reviews";
import { Social } from "@/components/site/Social";
import { Order } from "@/components/site/Order";
import { Franchise } from "@/components/site/Franchise";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { MobileStickyCTA } from "@/components/site/MobileStickyCTA";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      {/* 1. Hero vidéo immersive */}
      <Hero />
      {/* 2. Best sellers */}
      <BestSellers />
      {/* 3. Menu dynamique */}
      <Menu />
      {/* 4. Storytelling */}
      <Story />
      {/* 5. Avis clients */}
      <Reviews />
      {/* 6. Réseaux sociaux */}
      <Social />
      {/* 7. Expérience Crazy Toasty */}
      <Concept />
      <Puns />
      {/* 8. CTA final ultra visible */}
      <Order />
      <Franchise />
      <Footer />
      <ScrollToTop />
      <MobileStickyCTA />
      <Toaster />
    </main>
  );
}
