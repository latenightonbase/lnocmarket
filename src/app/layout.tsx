import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LNOC Marketplace",
  description: "Book media placements directly from creators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
