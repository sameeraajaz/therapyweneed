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
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SteadyTalk — An hour of steady company",
  description:
    "Paid non-psychiatric consultation you can rent. Signed NDA. A grounding aid. Not therapy, not diagnosis — calm company for the thoughts that linger.",
  openGraph: {
    title: "SteadyTalk — An hour of steady company",
    description:
      "Rent time with someone steady. NDA-protected. Not healthcare.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-warmwhite font-sans text-charcoal">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
