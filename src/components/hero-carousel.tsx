"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Countdown } from "@/components/countdown";
import { Poster } from "@/components/poster";
import { StatusBadge } from "@/components/status-badge";
import { track } from "@/lib/analytics";
import { resolveMediaUrl } from "@/lib/media-url";
import type { HeroSlide } from "@/lib/types";

const INTERVAL_MS = 7000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Hero carousel — cycles through active event slides.
 * Auto-advances every 7 s; pauses on hover/focus.
 * Under prefers-reduced-motion: no auto-advance, no video, manual navigation only.
 * ARIA: region + roledescription carousel, live region announces slide changes.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const announcerRef = useRef<HTMLParagraphElement>(null);

  const shouldReduce = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true
  );

  const count = slides.length;

  const goTo = useCallback(
    (i: number) => setCurrent(((i % count) + count) % count),
    [count]
  );

  // Auto-advance — disabled under prefers-reduced-motion
  useEffect(() => {
    if (paused || shouldReduce || count <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, shouldReduce, count]);

  // Announce slide change to screen readers
  useEffect(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = `Slide ${current + 1} of ${count}: ${slides[current].heroHeadline}`;
    }
  }, [current, count, slides]);

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // Touch swipe (≥40 px horizontal movement)
  const onTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) >= 40) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
  };

  // Arrow key navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
  };

  if (count === 0) return null;

  const slide = slides[current];
  const showVideo = Boolean(slide.heroVideo) && !shouldReduce;
  const isTicketCta = slide.isTicketUrl;

  const shouldLoadSlideImage = (index: number) => {
    if (count <= 2) return true;
    const prev = (current - 1 + count) % count;
    const next = (current + 1) % count;
    return index === current || index === prev || index === next;
  };

  return (
    <section
      className="relative -mt-16 overflow-hidden md:-mt-20"
      aria-label="Featured events"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      {/* Screen reader live region */}
      <p ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Media block — capped height, in normal flow on mobile; full-bleed overlay from md up */}
      <div className="relative h-[400px] w-full overflow-hidden md:absolute md:inset-0 md:h-auto">
        {/* Background images — all pre-rendered, CSS cross-fade via opacity */}
        {slides.map((s, i) => (
          <div
            key={`bg-${s.id}`}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            {shouldLoadSlideImage(i) ? (
              <Poster
                src={s.heroImage}
                alt=""
                className="absolute inset-0"
                sizes="100vw"
                priority={i === 0}
              />
            ) : (
              <div className="poster-placeholder absolute inset-0" aria-hidden="true" />
            )}
          </div>
        ))}

        {/* Current slide video (remount when slide changes) */}
        {showVideo && (
          <video
            key={`video-${slide.id}`}
            className="absolute inset-0 h-full w-full object-cover"
            src={slide.heroVideo}
            poster={resolveMediaUrl(slide.heroImage)}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        )}

        {/* Gradient scrim */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-marine-black via-marine-black/45 to-transparent"
          aria-hidden="true"
        />
        {/* Lagoon ambient ripple */}
        <div className="hero-ripple pointer-events-none absolute inset-0" aria-hidden="true" />

        {/* Pause control + slide dots — right edge, vertically centered on the media block */}
        {count > 1 && (
          <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-4 md:right-6">
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
              className="gradient-border flex h-7 w-7 items-center justify-center rounded-full border border-sand/20 text-sand/60 transition hover:border-lagoon hover:text-lagoon"
            >
              {paused ? (
                // Play icon
                <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor" aria-hidden="true">
                  <path d="M0 0L9 5.5L0 11V0Z" />
                </svg>
              ) : (
                // Pause icon
                <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" aria-hidden="true">
                  <rect x="0" y="0" width="3" height="10" rx="1" />
                  <rect x="5" y="0" width="3" height="10" rx="1" />
                </svg>
              )}
            </button>
            <div role="tablist" aria-label="Go to slide" aria-orientation="vertical" className="flex flex-col items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Slide ${i + 1}: ${s.heroHeadline}`}
                  onClick={() => goTo(i)}
                  className="flex items-center justify-center p-2"
                  style={shouldReduce ? undefined : { animationDelay: `${i * 40}ms` }}
                >
                  <span className={`w-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "h-6 bg-lagoon"
                      : "h-1.5 bg-sand/25 hover:bg-sand/50"
                  }`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide content — pulled up to overlap the bottom of the media block on mobile (~30% of its height), overlaid on it from md up */}
      <div className="relative z-10 mx-auto -mt-[120px] flex max-w-6xl flex-col px-5 pb-10 pt-8 md:mt-0 md:min-h-dvh md:justify-end md:px-8 md:pb-14 md:pt-36">
          <div
            key={`content-${slide.id}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${current + 1} of ${count}: ${slide.heroHeadline}`}
            className={shouldReduce ? undefined : "kayal-anim"}
            style={shouldReduce ? undefined : { animation: "kayal-fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {slide.status && <StatusBadge status={slide.status} />}

            <h1 className="headline heading-gradient mt-5 max-w-4xl text-[2.7rem] md:text-[5.4rem]">
              {slide.heroHeadline}
            </h1>

            {slide.heroSubcopy && (
              <p className="mt-3 max-w-xl text-lg text-sand-muted">
                {slide.heroSubcopy}
              </p>
            )}

            {slide.countdownTarget && (
              <Countdown target={slide.countdownTarget} size="lg" className="mt-5" />
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={slide.heroCtaUrl}
                target={isTicketCta ? "_blank" : undefined}
                rel={isTicketCta ? "noopener noreferrer" : undefined}
                onClick={() => {
                  if (isTicketCta) {
                    track("buy_ticket_click", {
                      event_name: slide.heroHeadline,
                      placement: "hero_carousel",
                    });
                  }
                }}
                className={
                  isTicketCta
                    ? "gradient-border coral-glow inline-flex items-center justify-center rounded-full bg-coral px-8 py-3.5 text-sm font-semibold tracking-wide text-sand transition-all duration-200 hover:scale-[1.03] hover:bg-coral-bright"
                    : "gradient-border inline-flex items-center justify-center rounded-full border border-lagoon/40 bg-lagoon/10 px-8 py-3.5 text-sm font-semibold text-lagoon transition-all duration-200 hover:bg-lagoon/20"
                }
              >
                {slide.heroCtaLabel}
                {isTicketCta && <span className="sr-only"> (opens in new tab)</span>}
              </a>
              {slide.eventSlug && (
                <a
                  href={`/events/${slide.eventSlug}`}
                  className="gradient-border inline-flex items-center justify-center rounded-full border border-sand/20 px-8 py-3.5 text-sm font-semibold text-sand transition-all duration-200 hover:border-lagoon hover:text-lagoon"
                >
                  Event details →
                </a>
              )}
            </div>
          </div>
      </div>

    </section>
  );
}
