import type { Metadata } from "next";

import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
