import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";

import "./globals.css";

const arcadeDisplay = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-arcade",
  weight: "400",
});

const arcadeText = VT323({
  subsets: ["latin"],
  variable: "--font-arcade-text",
  weight: "400",
});

export const metadata: Metadata = {
  description:
    "An online arcade controlled by a connected smartcube or deterministic simulator.",
  title: "Cube Arcade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${arcadeDisplay.variable} ${arcadeText.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
