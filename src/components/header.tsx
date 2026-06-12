"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
// Mobile menu closes via onClick on each link (not a pathname effect)
// to satisfy react-hooks/set-state-in-effect.

const links = [
  { href: "/events", label: "Events" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ink-border/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link
          href="/"
          className="font-display text-xl tracking-wide text-ivory md:text-2xl"
          aria-label="Kayal Events — home"
        >
          KAYAL<span className="text-gold"> EVENTS</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm tracking-wide transition hover:text-gold ${
                pathname.startsWith(l.href) ? "text-gold" : "text-ivory-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/events"
            className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-bright"
          >
            Buy Tickets
          </Link>
        </nav>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span
            className={`block h-px w-6 bg-ivory transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-ivory transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <nav
          className="flex h-[calc(100dvh-4rem)] flex-col gap-2 bg-ink px-5 pt-8 md:hidden"
          aria-label="Mobile"
        >
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="headline border-b border-ink-border py-4 text-3xl text-ivory"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/events"
            onClick={() => setOpen(false)}
            className="mt-6 rounded-full bg-gold px-6 py-3.5 text-center font-semibold text-ink"
          >
            Buy Tickets
          </Link>
        </nav>
      )}
    </header>
  );
}
