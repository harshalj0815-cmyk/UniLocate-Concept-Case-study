import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/components/prototype.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "UniLocate · Prototype",
  description: "UniLocate interactive prototype",
};

/* First screen: map background and polaroids, fetched with the HTML instead of after hydration */
const FIRST_SCREEN_IMAGES = [
  "/images/Background.webp",
  "/images/image-2.webp",
  "/images/image-3.webp",
  "/images/image-5.webp",
  "/images/image-6.webp",
  "/images/image-7.webp",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/AlloVariable.woff2"
          crossOrigin="anonymous"
        />
        {FIRST_SCREEN_IMAGES.map((href) => (
          <link key={href} rel="preload" as="image" type="image/webp" href={href} />
        ))}
      </head>
      <body className={`${plusJakarta.variable} ${plusJakarta.className}`}>
        {children}
      </body>
    </html>
  );
}
