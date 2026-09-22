import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "not4recon — Open Source Intelligence Terminal",
  description:
    "not4recon is a browser-based OSINT terminal that aggregates public intelligence from multiple open sources. Investigate domains, IPs, emails, and digital footprints — no installation, no bloat, no compromises.",
  keywords: ["OSINT", "reconnaissance", "security", "domain lookup", "IP geolocation", "breach check", "google dorking"],
  openGraph: {
    title: "not4recon",
    description: "Browser-based OSINT terminal. Investigate domains, IPs, emails, usernames — from any browser.",
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
      <body>{children}</body>
    </html>
  );
}
