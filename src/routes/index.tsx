import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Concept } from "@/components/site/Concept";
import { Menu } from "@/components/site/Menu";
import { CrazyChickenGame } from "@/components/site/CrazyChickenGame";
import { BestSellers } from "@/components/site/BestSellers";
import { Order } from "@/components/site/Order";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <BestSellers />
      <Menu />
      <CrazyChickenGame />
      <Concept />
      <Order />
      <Footer />
      <ScrollToTop />
      <Toaster />
    </main>
  );
}
