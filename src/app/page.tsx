import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import NavigationDock from "@/components/NavigationDock";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-sand text-ink font-sans selection:bg-terracotta/30 pb-32">
      <Header />

      <Hero />
      <About />
      <Portfolio />
      <Testimonials />
      <Footer />
      
      <NavigationDock />
    </main>
  );
}
