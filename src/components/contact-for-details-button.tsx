"use client";

import { useState } from "react";
import { EventEnquiryModal } from "@/components/event-enquiry-modal";

/**
 * Drop-in replacement for a "Buy Tickets" CTA when an event has no ticket
 * URL set up yet — opens an enquiry modal instead of navigating away.
 */
export function ContactForDetailsButton({
  eventName,
  className,
}: {
  eventName: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Contact for Details
      </button>
      {open && <EventEnquiryModal eventName={eventName} onClose={() => setOpen(false)} />}
    </>
  );
}
