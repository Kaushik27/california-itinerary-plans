import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function absoluteAssetUrl(path: `/${string}`): string {
  return new URL(`${basePath}${path}`, siteUrl).toString();
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "California Road Trip — Cinematic Editorial",
    template: "%s · California Road Trip",
  },
  description: "Seventeen days from the Golden Gate to the Las Vegas lights — an interactive California anniversary itinerary for two.",
  icons: {
    icon: absoluteAssetUrl("/favicon.svg"),
    shortcut: absoluteAssetUrl("/favicon.svg"),
  },
  openGraph: {
    title: "From the Golden Gate to the Las Vegas lights",
    description: "17 days · 10 bases · Dec 10–26, 2026",
    type: "website",
    images: [{ url: absoluteAssetUrl("/og.png"), width: 1733, height: 907, alt: "California anniversary road-trip poster" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "From the Golden Gate to the Las Vegas lights",
    description: "17 days · 10 bases · Dec 10–26, 2026",
    images: [absoluteAssetUrl("/og.png")],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
