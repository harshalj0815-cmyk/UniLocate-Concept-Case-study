import type { Metadata } from "next";
import "allo-font/allo.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniLocate · Concept case study",
  description:
    "UniLocate: Activation design for an indoor campus navigator — concept case study for a Type C new product focused on first-visit Activation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
