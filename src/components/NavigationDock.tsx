"use client";

import { Home, User, Briefcase, Mail } from "lucide-react";
import Dock from "./Dock";

export default function NavigationDock() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const items = [
    {
      icon: <Home size={20} />,
      label: 'Home',
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      icon: <User size={20} />,
      label: 'About',
      onClick: () => scrollToSection('about')
    },
    {
      icon: <Briefcase size={20} />,
      label: 'Work',
      onClick: () => scrollToSection('portfolio')
    },
    {
      icon: <Mail size={20} />,
      label: 'Contact',
      onClick: () => scrollToSection('contact')
    },
  ];

  return (
    <Dock
      items={items}
      panelHeight={68}
      baseItemSize={50}
      magnification={70}
      dockHeight={80}
    />
  );
}
