import type { Metadata } from "next";
import { headers } from "next/headers";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: {
      default: "California Road Trip — Journey Dossier",
      template: "%s · California Road Trip",
    },
    description: "Seventeen days from the Golden Gate to the Las Vegas lights — an interactive California anniversary itinerary for two.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "From the Golden Gate to the Las Vegas lights",
      description: "17 days · 10 bases · Dec 10–26, 2026",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1733, height: 907, alt: "California anniversary road-trip poster" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "From the Golden Gate to the Las Vegas lights",
      description: "17 days · 10 bases · Dec 10–26, 2026",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
