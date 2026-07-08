import Image from "next/image";

export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-marine-black">
      <header className="shrink-0 border-b border-border px-5 py-4 md:px-8 flex justify-center">
        <Image
          src="/kayal-events-logo-white.svg"
          alt="Kayal Events"
          width={110}
          height={30}
          priority
        />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
