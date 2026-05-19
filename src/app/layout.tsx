import type { Metadata } from "next";
import SmoothScrolling from "@/components/SmoothScrolling";
import FluidCursor from "@/components/FluidCursor";
import Preloader from "@/components/Preloader";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

const siteDescription =
  "MAV STUDIO is a social media management and graphic design portfolio for strategic content, AI visuals, reels, carousels, and brand campaigns.";
const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000";
const siteUrl = /^https?:\/\//.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MAV STUDIO | Social Media Manager & Graphic Design Portfolio",
    template: "%s | MAV STUDIO",
  },
  description: siteDescription,
  applicationName: "MAV STUDIO",
  keywords: [
    "MAV STUDIO",
    "social media manager",
    "graphic designer",
    "content creator",
    "AI images",
    "AI videos",
    "reels editing",
    "carousel design",
    "brand visuals",
    "social media portfolio",
  ],
  authors: [{ name: "MAV STUDIO" }],
  creator: "MAV STUDIO",
  publisher: "MAV STUDIO",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MAV STUDIO | Social Media Manager & Graphic Design Portfolio",
    description: siteDescription,
    siteName: "MAV STUDIO",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/Hero.png",
        width: 1200,
        height: 630,
        alt: "MAV STUDIO creative portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAV STUDIO | Social Media Manager & Graphic Design Portfolio",
    description: siteDescription,
    images: ["/Hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
