import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { About } from "@/components/About";
import NavigationDock from "@/components/NavigationDock";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-sand text-ink font-sans selection:bg-terracotta/30 pb-32">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="font-bold text-3xl md:text-4xl tracking-wider text-ink">MAV<span className="font-normal opacity-60">STUDIO</span></div>
      </div>

      <Hero />
      <About />
      <Portfolio />
      <Footer />
      
      <NavigationDock />
    </main>
  );
}
