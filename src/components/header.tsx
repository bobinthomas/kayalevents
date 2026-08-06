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
  const [visible, setVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current < 80) {
        setVisible(true);
      } else if (current > lastScrollYRef.current) {
        setVisible(false);
        setOpen(false);
      } else {
        setVisible(true);
      }
      lastScrollYRef.current = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (open) {
      const firstLink = drawerRef.current?.querySelector("a");
      firstLink?.focus();
    } else {
      hamburgerRef.current?.focus();
    }
  }, [open]);

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
    <>
      <header
        className={`fixed inset-x-0 top-4 z-40 flex justify-center px-4 pointer-events-none transition-[transform,opacity] duration-300 ease-in-out ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
        }`}
      >
        <div className="w-full max-w-6xl flex items-center gap-3">

          {/* Logo pill — white bg */}
          <Link
            href="/"
            aria-label="Kayal Events — home"
            className="pointer-events-auto flex items-center flex-shrink-0 px-6 h-16 rounded-full bg-white/95 border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.8)]"
          >
            <Image
              src="/kayal-events-logo.svg"
              alt="Kayal Events"
              width={160}
              height={86}
              priority
              className="h-9 w-auto"
            />
          </Link>

          {/* Nav pill — dark glass */}
          <div className="pointer-events-auto ml-auto flex items-center h-16 rounded-full border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] md:ml-0 md:flex-1">

            {/* Desktop nav */}
            <nav className="hidden md:flex flex-1 items-center justify-end gap-6 px-8" aria-label="Primary">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm tracking-wide transition duration-200 hover:text-lagoon whitespace-nowrap ${
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
              className="flex md:hidden h-10 w-10 mx-3 flex-col items-center justify-center gap-[5px]"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className={`block h-px w-6 bg-sand origin-center transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`block h-px w-6 bg-sand transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`block h-px w-6 bg-sand origin-center transition-transform duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </button>

          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <nav
          id="mobile-nav"
          ref={drawerRef as React.RefObject<HTMLElement>}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-30 flex flex-col gap-2 bg-marine-black/95 backdrop-blur-xl px-5 pt-24 md:hidden"
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
    </>
  );
}
