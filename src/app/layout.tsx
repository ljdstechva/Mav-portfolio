import type { Metadata } from "next";
import SmoothScrolling from "@/components/SmoothScrolling";
import FluidCursor from "@/components/FluidCursor";
import Preloader from "@/components/Preloader";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAV STUDIO",
  description:
    "Portfolio for a social media manager and graphic design creator crafting intentional content and brand visuals.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Preloader />
        <ServiceWorker />
        <FluidCursor />
        <SmoothScrolling />
        {children}
      </body>
    </html>
  );
}
