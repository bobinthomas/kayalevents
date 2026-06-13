"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/events", label: "Events" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/50 bg-marine-black/88 shadow-[0_1px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-5 md:px-8 transition-all duration-500 ${
          scrolled ? "h-14 md:h-16" : "h-16 md:h-20"
        }`}
      >
        <Link
          href="/"
          className="font-display text-xl tracking-wide text-sand md:text-2xl"
          aria-label="Kayal Events — home"
        >
          KAYAL<span className="text-lagoon"> EVENTS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm tracking-wide transition duration-200 hover:text-lagoon ${
                pathname.startsWith(l.href) ? "text-lagoon" : "text-sand/65"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/events"
            className="coral-glow rounded-full bg-coral px-5 py-2 text-sm font-semibold tracking-wide text-sand transition-all duration-200 hover:scale-[1.04] hover:bg-coral-bright"
          >
            Buy Tickets
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span
            className={`block h-px w-6 bg-sand origin-center transition-transform duration-300 ${
              open ? "translate-y-[5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-6 bg-sand transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-6 bg-sand origin-center transition-transform duration-300 ${
              open ? "-translate-y-[5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          className="flex h-[calc(100dvh-4rem)] flex-col gap-2 bg-marine-black/95 backdrop-blur-xl px-5 pt-8 md:hidden"
          aria-label="Mobile"
        >
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="headline border-b border-border py-4 text-3xl text-sand transition-colors hover:text-lagoon"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/events"
            onClick={() => setOpen(false)}
            className="coral-glow mt-6 rounded-full bg-coral px-6 py-3.5 text-center font-semibold tracking-wide text-sand"
          >
            Buy Tickets
          </Link>
        </nav>
      )}
    </header>
  );
}
