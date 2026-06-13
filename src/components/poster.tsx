import Image from "next/image";

/**
 * Renders the event/case-study image when available, otherwise a cinematic
 * lagoon gradient placeholder (no stock imagery — per design direction R4).
 *
 * Pass `kenBurns` to apply a slow panning animation on the image,
 * ideal for event card thumbnails and hero backgrounds.
 */
export function Poster({
  src,
  alt,
  title,
  className = "",
  sizes,
  priority = false,
  kenBurns = false,
}: {
  src?: string;
  alt: string;
  title?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  kenBurns?: boolean;
}) {
  // Callers that overlay the poster (heroes) pass `absolute inset-0`;
  // default to `relative` so next/image fill works in cards.
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
          className={`object-cover ${kenBurns ? "ken-burns" : ""}`}
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
          className="headline pointer-events-none select-none p-6 text-4xl text-sand/8 md:text-6xl"
        >
          {title}
        </span>
      )}
    </div>
  );
}
