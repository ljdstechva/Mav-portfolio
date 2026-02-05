import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import SmoothScrolling from "@/components/SmoothScrolling";
import FluidCursor from "@/components/FluidCursor";
import Preloader from "@/components/Preloader";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Space_Grotesk({
  variable: "--font-body-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <Preloader />
        <ServiceWorker />
        <FluidCursor />
        <SmoothScrolling />
        {children}
      </body>
    </html>
  );
}
