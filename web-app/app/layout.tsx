import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-body",
});

const geistDisplay = Geist({
  subsets: ["latin"],
  variable: "--font-display",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Brand Kit Generator by Acelera",
  description:
    "A chat-first brand workspace where each founder answer sharpens the kit and updates a live v0 draft.",
  metadataBase: new URL("https://brandkitgenerator.com"),
  openGraph: {
    title: "Brand Kit Generator by Acelera",
    description:
      "A chat-first brand workspace where each founder answer sharpens the kit and updates a live v0 draft.",
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
      <body className={`${geist.variable} ${geistDisplay.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
