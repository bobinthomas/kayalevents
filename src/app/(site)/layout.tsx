import { Analytics, ConsentBanner } from "@/components/analytics";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SiteMotion } from "@/components/site-motion";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSiteSettings, getKeystaticReader } from "@/lib/content";
import { ReaderRefresh } from "@keystatic/next/reader-refresh";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const reader = getKeystaticReader();
  const localReader =
    reader &&
    "repoPath" in reader &&
    typeof reader.repoPath === "string"
      ? reader
      : null;

  return (
    <>
      {localReader ? <ReaderRefresh reader={localReader} /> : null}
      <SiteMotion />
      <Header />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton number={settings.whatsapp} />
      <ConsentBanner />
      <Analytics />
    </>
  );
}
