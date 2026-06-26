import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSiteSettings } from "@/lib/content";

// Keep in sync with src/components/LoadingScreen.tsx (SESSION_KEY / PENDING_CLASS).
// Runs before paint so the intro never flashes already-rendered content: hides
// everything except the loader until LoadingScreen finishes (or skips itself
// on inner pages / repeat visits, in which case this never adds the class).
//
// Also resets scroll position on a fresh load: the browser's default
// scroll-restoration replays the scroll offset from the last visit/reload,
// which (combined with Lenis taking over native scroll on mount) made the
// page appear to load already scrolled to the bottom. Skipped when the URL
// has a real hash, since that's an intentional in-page anchor link.
const INTRO_BOOT_SCRIPT = `
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  if (!location.hash) {
    window.scrollTo(0, 0);
  }
  if (location.pathname === "/" && sessionStorage.getItem("kayalIntroPlayed") !== "1") {
    document.documentElement.classList.add("intro-pending");
  }
`;

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
    <html lang="en-AU" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Script id="kayal-intro-boot" strategy="beforeInteractive">
          {INTRO_BOOT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
