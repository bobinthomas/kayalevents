/**
 * Full-width animated marquee strip of artist and city names.
 * CSS-driven (transform only) — 60fps, no JS loop required.
 * Faded edges via CSS mask-image for polish.
 */
export function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;

  // Duplicate so the seamless loop has enough content
  const doubled = [...items, ...items];

  return (
    <div
      className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className}`}
      aria-hidden="true"
    >
      <div className="marquee-track flex items-center whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-5 px-5 font-display text-xl font-light tracking-wide text-sand/25 md:text-2xl"
          >
            {item}
            <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-lagoon/50" />
          </span>
        ))}
      </div>
    </div>
  );
}
