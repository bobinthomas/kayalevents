import { Analytics, ConsentBanner } from "@/components/analytics";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import LoadingScreen from "@/components/LoadingScreen";
import { SmoothScroll } from "@/components/smooth-scroll";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSiteSettings, keystaticReader } from "@/lib/content";
import { ReaderRefresh } from "@keystatic/next/reader-refresh";

/** ReaderRefresh only works with the local filesystem reader (needs repoPath). */
const localReader =
  keystaticReader &&
  "repoPath" in keystaticReader &&
  typeof keystaticReader.repoPath === "string"
    ? keystaticReader
    : null;

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  return (
    <SmoothScroll>
      {localReader ? <ReaderRefresh reader={localReader} /> : null}
      <LoadingScreen />
      <Header />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton number={settings.whatsapp} />
      <ConsentBanner />
      <Analytics />
    </SmoothScroll>
  );
}
