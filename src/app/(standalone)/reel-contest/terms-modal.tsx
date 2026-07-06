"use client";

import { useEffect, useRef, useState } from "react";
import { ReelContestTermsContent } from "@/components/reel-contest-terms-content";

export function TermsModal({
  open,
  alreadyAccepted,
  onClose,
  onAccept,
}: {
  open: boolean;
  alreadyAccepted: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const [reachedEnd, setReachedEnd] = useState(alreadyAccepted);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setReachedEnd(alreadyAccepted);

    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, alreadyAccepted, onClose]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setReachedEnd(true);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-marine-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 id="terms-modal-title" className="font-display text-lg text-sand">
            Terms &amp; Conditions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-sand-muted hover:text-sand"
          >
            &times;
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm [&_h2]:text-base"
        >
          <ReelContestTermsContent />
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4">
          {!reachedEnd && (
            <p className="mb-3 text-xs text-sand-muted">
              Scroll to the end to enable Accept.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-sm text-sand-muted transition hover:text-sand"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!reachedEnd}
              onClick={onAccept}
              className="flex-1 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-sand transition hover:bg-coral-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              I Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
