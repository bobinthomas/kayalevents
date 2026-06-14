import { Analytics, ConsentBanner } from "@/components/analytics";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import LoadingScreen from "@/components/LoadingScreen";
import { SmoothScroll } from "@/components/smooth-scroll";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSiteSettings } from "@/lib/content";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  return (
    <SmoothScroll>
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
