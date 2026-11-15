import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StorySites",
  description: "Your story deserves more.",
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
