import type { Metadata } from "next";
import Script from "next/script";
import "allo-font/allo.css";
import "./globals.css";

const siteTitle = "UniLocate · Concept case study";
const siteDescription =
  "UniLocate: Activation design for an indoor campus navigator. Concept case study for a Type C new product focused on first-visit Activation.";

const PRODUCTION_URL = "https://unilocate-case-study.vercel.app";

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  /* Not VERCEL_URL: that is a per-deployment address, often behind Vercel's
     login wall, so link previews could not fetch the image from it. */
  if (process.env.NODE_ENV === "production") {
    return new URL(PRODUCTION_URL);
  }
  return new URL("http://localhost:3001");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName: "UniLocate",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1280,
        height: 720,
        type: "image/jpeg",
        alt: "UniLocate: Activation design for an indoor campus navigator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/sticker-cursor.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
