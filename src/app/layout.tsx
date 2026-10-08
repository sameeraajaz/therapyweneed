import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SteadyTalk: an hour of steady company",
  description:
    "Paid non-psychiatric consultation you can rent. A signed NDA and a grounding aid with every session. Not therapy, not diagnosis, just calm company for the thoughts that linger.",
  openGraph: {
    title: "SteadyTalk: an hour of steady company",
    description: "Rent time with someone steady. NDA-protected. Not healthcare.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1317",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
      <body className="min-h-screen bg-night-deep font-sans text-mist">
        <a
          href="#hero"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-mist focus:px-4 focus:py-2 focus:text-night"
        >
          Skip to content
        </a>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
