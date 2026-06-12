import type { Metadata } from "next";
import { sanityConfigured } from "@/lib/sanity";
import Studio from "./studio";

export const metadata: Metadata = {
  title: "Kayal Events CMS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function StudioPage() {
  if (!sanityConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
        <h1 className="headline text-3xl">CMS not yet provisioned</h1>
        <p className="text-ivory-muted">
          Create a Sanity project (sanity.io), then set
          <code className="mx-1 text-gold">NEXT_PUBLIC_SANITY_PROJECT_ID</code>
          in your environment. The studio will appear here automatically, and
          the site will switch from placeholder content to CMS content.
        </p>
      </main>
    );
  }
  return <Studio />;
}
