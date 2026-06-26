"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/events", label: "Current Events" },
  { href: "/portfolio", label: "Previous Events" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

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

  // Focus management: move focus into drawer on open, return to hamburger on close
  useEffect(() => {
    if (open) {
      const firstLink = drawerRef.current?.querySelector("a");
      firstLink?.focus();
    } else {
      hamburgerRef.current?.focus();
    }
  }, [open]);

  // Trap focus inside drawer while open
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
        <Link href="/" aria-label="Kayal Events — home" className="flex items-center">
          <Image
            src="/kayal-events-logo.svg"
            alt="Kayal Events"
            width={160}
            height={86}
            priority
            className="h-9 w-auto md:h-10"
          />
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
            className="gradient-border coral-glow rounded-full bg-coral px-5 py-2 text-sm font-semibold tracking-wide text-sand transition-all duration-200 hover:scale-[1.04] hover:bg-coral-bright"
          >
            Buy Tickets
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
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
          id="mobile-nav"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="flex h-[calc(100dvh-4rem)] flex-col gap-2 bg-marine-black/95 backdrop-blur-xl px-5 pt-8 md:hidden"
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
            className="gradient-border coral-glow mt-6 rounded-full bg-coral px-6 py-3.5 text-center font-semibold tracking-wide text-sand"
          >
            Buy Tickets
          </Link>
        </nav>
      )}
    </header>
  );
}
