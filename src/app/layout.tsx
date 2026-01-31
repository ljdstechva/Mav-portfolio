import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import SmoothScrolling from "@/components/SmoothScrolling";
import FluidCursor from "@/components/FluidCursor";
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
  title: "Mav Studio | Social Media + Graphic Design",
  description:
    "Portfolio for a social media manager and graphic design creator crafting intentional content and brand visuals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <FluidCursor />
        <SmoothScrolling />
        {children}
      </body>
    </html>
  );
}
