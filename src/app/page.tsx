import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { About } from "@/components/About";
import NavigationDock from "@/components/NavigationDock";

export default function Home() {
  return (
    <main className="min-h-screen bg-sand text-ink font-sans selection:bg-terracotta/30 pb-32">
      <div className="absolute top-6 left-6 z-50">
        <div className="font-bold text-xl tracking-wider text-ink">MAV<span className="font-normal opacity-60">STUDIO</span></div>
      </div>

      <Hero />
      <About />
      <Portfolio />
      
      <footer className="bg-white py-12 border-t border-ink/5" id="contact">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-6">Let's create something amazing together.</h3>
          <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="text-ink/60 hover:text-ink transition-colors">Instagram</a>
            <a href="#" className="text-ink/60 hover:text-ink transition-colors">Dribbble</a>
            <a href="#" className="text-ink/60 hover:text-ink transition-colors">LinkedIn</a>
          </div>
          <p className="text-ink/40 text-sm">© {new Date().getFullYear()} Mav Studio. All rights reserved.</p>
        </div>
      </footer>

      <NavigationDock />
    </main>
  );
}
