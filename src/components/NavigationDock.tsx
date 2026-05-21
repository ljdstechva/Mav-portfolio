"use client";

import { Home, User, Briefcase, Mail } from "lucide-react";
import Dock from "./Dock";
import { scrollToTarget } from "@/lib/smoothScroll";

export default function NavigationDock() {
  const scrollToSection = (id: string) => {
    scrollToTarget(`#${id}`);
  };

  const items = [
    {
      icon: <Home size={20} />,
      label: 'Home',
      onClick: () => scrollToTarget("top")
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
      panelHeight={62}
      baseItemSize={46}
      magnification={60}
      dockHeight={70}
    />
  );
}
