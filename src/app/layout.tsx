import type { Metadata } from "next";
import { DM_Sans, Fraunces, Montserrat } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/content";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(settings.baseUrl),
    title: {
      default: `${settings.siteName} — ${settings.tagline}`,
      template: `%s | ${settings.siteName}`,
    },
    description:
      "Kayal Events promotes large-scale South Indian live entertainment across Australia — concerts, national tours, corporate galas and community festivals in Melbourne, Sydney, Brisbane, Perth and Adelaide.",
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      locale: "en_AU",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
