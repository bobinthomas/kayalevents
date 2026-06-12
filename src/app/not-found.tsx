import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="headline mt-4 text-4xl md:text-6xl">
        This stage is empty.
      </h1>
      <p className="mt-4 max-w-md text-ivory-muted">
        The page you&apos;re after doesn&apos;t exist — but the next show is
        never far away.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/events"
          className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink transition hover:bg-gold-bright"
        >
          Upcoming Events
        </Link>
        <Link
          href="/"
          className="rounded-full border border-ink-border px-7 py-3 text-sm text-ivory-muted transition hover:border-gold hover:text-gold"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
