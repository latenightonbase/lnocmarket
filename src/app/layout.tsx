import type { Metadata } from "next";
import "./globals.css";
import { WalletProviders } from "@/components/WalletProviders";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LNOC Marketplace",
  description: "Book media placements directly from creators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Permanent+Marker&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WalletProviders>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </WalletProviders>
      </body>
    </html>
  );
}
