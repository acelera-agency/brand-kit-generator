import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Brand Kit Generator — by Acelera",
  description:
    "Brand kits that decide for you. Not decorate for you. An opinionated 8-stage interview that produces a kit you can actually use to make daily decisions. Open source methodology, hosted product coming soon.",
  metadataBase: new URL("https://brandkitgenerator.com"),
  openGraph: {
    title: "Brand Kit Generator — by Acelera",
    description:
      "Brand kits that decide for you. Not decorate for you. An opinionated 8-stage interview.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${interTight.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
