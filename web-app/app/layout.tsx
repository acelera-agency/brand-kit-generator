import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
