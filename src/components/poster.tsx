import Image from "next/image";

/**
 * Renders the event/case-study image when available, otherwise a cinematic
 * gradient placeholder (no stock imagery — per design direction R4).
 */
export function Poster({
  src,
  alt,
  title,
  className = "",
  sizes,
  priority = false,
}: {
  src?: string;
  alt: string;
  title?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  // Callers position the poster themselves for hero overlays (absolute inset-0);
  // default to relative so next/image fill works in cards.
  const position = className.includes("absolute") ? "" : "relative";

  if (src) {
    return (
      <div className={`${position} overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "100vw"}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`poster-placeholder ${position} flex items-end overflow-hidden ${className}`}
    >
      {title && (
        <span
          aria-hidden="true"
          className="headline pointer-events-none select-none p-6 text-4xl text-ivory/10 md:text-6xl"
        >
          {title}
        </span>
      )}
    </div>
  );
}
