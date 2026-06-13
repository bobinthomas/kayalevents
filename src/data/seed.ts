import type {
  CaseStudy,
  KayalEvent,
  Service,
  SiteSettings,
  Testimonial,
} from "@/lib/types";

/**
 * Placeholder content used until the Sanity project is provisioned and
 * rights-cleared photography arrives (PRD Open Questions 1 & 2).
 * The content layer (src/lib/content.ts) automatically prefers Sanity
 * once NEXT_PUBLIC_SANITY_PROJECT_ID is configured.
 */

export const siteSettings: SiteSettings = {
  siteName: "Kayal Events",
  tagline: "Australia's home of South Indian live entertainment",
  email: "kayaleventsofficial@gmail.com",
  phone: "+61450250111",
  phoneDisplay: "+61 450 250 111",
  whatsapp: "61450250111",
  instagram: "https://www.instagram.com/kayalevents",
  baseUrl: "https://kayalevents.com.au",
  heroImage: "/images/048A0885.jpg",
  fallbackHeroHeadline: "Australia's home of South Indian live entertainment",
  fallbackHeroSubcopy: "Concerts, national tours, corporate galas and festivals — produced end to end.",
  fallbackHeroCtaLabel: "Explore Events",
  fallbackHeroCtaUrl: "/events",
};

export const events: KayalEvent[] = [
  {
    slug: "mohanlal-live-in-australia-2026",
    title: "Mohanlal Live in Australia",
    artists: ["Mohanlal"],
    tagline: "The Complete Actor. One unforgettable night.",
    description:
      "For the first time on Australian soil, the legend of Malayalam cinema takes the stage. An evening of cinema, conversation and celebration with Padma Bhushan Mohanlal — a once-in-a-generation event for the South Indian community in Australia. Produced end-to-end by Kayal Events with full concert-grade staging, sound and lighting.",
    status: "on-sale",
    shows: [
      {
        city: "Melbourne",
        venue: "Melbourne Convention and Exhibition Centre",
        start: "2026-09-12T19:00:00+10:00",
        ticketUrl: "https://www.trybooking.com/",
      },
      {
        city: "Sydney",
        venue: "Sydney Olympic Park — Quaycentre",
        start: "2026-09-13T19:00:00+10:00",
        ticketUrl: "https://www.trybooking.com/",
      },
    ],
    ticketTiers: [
      { name: "Platinum", price: "$249" },
      { name: "Gold", price: "$149" },
      { name: "Silver", price: "$99" },
      { name: "General Admission", price: "$69" },
    ],
    ageRestriction: "All ages. Under 15s must be accompanied by an adult.",
    entryConditions: [
      "Doors open 90 minutes before showtime.",
      "Tickets are non-refundable except as required by Australian Consumer Law.",
      "Professional cameras and recording equipment are not permitted.",
    ],
    faqs: [
      {
        question: "Will there be a meet and greet?",
        answer:
          "A limited Platinum meet-and-greet allocation is available per city. Details are included with Platinum tickets.",
      },
      {
        question: "Is parking available at the venue?",
        answer:
          "Both venues offer on-site and nearby paid parking. We recommend public transport on event night.",
      },
      {
        question: "What languages is the show in?",
        answer:
          "The evening is presented primarily in Malayalam with English where appropriate.",
      },
    ],
    featured: true,
    heroImage: "/images/048A0938.jpg",
    posterImage: "/images/048A1047.jpg",
    heroHeadline: "Mohanlal Live in Australia",
    heroSubcopy: "The Complete Actor. One unforgettable night.",
    heroCtaLabel: "Buy Tickets",
    heroCtaUrl: "https://www.trybooking.com/",
    heroOrder: 1,
  },
  {
    slug: "onam-vibes-2026",
    title: "Onam Vibes",
    artists: ["Siddharth Menon", "Zeba Tommy"],
    tagline: "ft. Siddharth Menon & Zeba Tommy — a festival night of music",
    description:
      "Kerala's harvest festival meets a full live band. Siddharth Menon and Zeba Tommy headline a night of Malayalam favourites, folk fusion and festival energy — sadhya flavours, pookalam colours, and a dance floor that doesn't stop. Kayal Events' signature Onam celebration returns, bigger than ever.",
    status: "selling-fast",
    shows: [
      {
        city: "Melbourne",
        venue: "Plenary, Melbourne Convention Centre",
        start: "2026-08-29T18:30:00+10:00",
        ticketUrl: "https://www.trybooking.com/",
      },
    ],
    ticketTiers: [
      { name: "VIP (incl. sadhya)", price: "$129" },
      { name: "Premium", price: "$89" },
      { name: "General Admission", price: "$59" },
    ],
    ageRestriction: "All ages welcome — a family festival night.",
    entryConditions: [
      "Doors open at 5:30pm. Sadhya service for VIP ticket holders from 6:00pm.",
      "Traditional dress encouraged.",
    ],
    faqs: [
      {
        question: "Is food included with my ticket?",
        answer:
          "VIP tickets include a traditional Onam sadhya. Food stalls are available for all other ticket holders.",
      },
      {
        question: "Is the event family-friendly?",
        answer:
          "Yes — Onam Vibes is an all-ages community celebration with activities for kids before the main show.",
      },
    ],
    heroImage: "/images/048A0451.jpg",
    posterImage: "/images/048A0695.jpg",
    heroHeadline: "Onam Vibes 2026",
    heroSubcopy: "ft. Siddharth Menon & Zeba Tommy — a festival night of music",
    heroCtaLabel: "Buy Tickets",
    heroCtaUrl: "https://www.trybooking.com/",
    heroOrder: 2,
  },
];

export const caseStudies: CaseStudy[] = [
  {
    slug: "vismayam-2025-melbourne",
    title: "Vismayam 2025",
    year: "2025",
    summary:
      "A sold-out night of Malayalam music and dance that became Melbourne's largest Kerala community event of the year.",
    description:
      "Vismayam brought a 12-piece live band, classical and cinematic dance ensembles, and full theatrical production design to a 2,400-capacity venue. Kayal Events handled artist logistics from Kochi to Melbourne, staging, ticketing strategy and a marketing campaign that sold out fourteen days before doors.",
    stats: [
      { label: "Attendance", value: "2,400" },
      { label: "Sold out", value: "14 days early" },
      { label: "Artists flown in", value: "18" },
      { label: "Production crew", value: "40+" },
    ],
    heroImage: "/images/048A0374.jpg",
    gallery: [
      { src: "/images/048A0207.jpg", alt: "Venue during doors-open — audience taking their seats" },
      { src: "/images/048A0226.jpg", alt: "Stage and production setup before the show" },
      { src: "/images/048A0236.jpg", alt: "Female vocalist performing in traditional Kerala attire" },
      { src: "/images/048A0253.jpg", alt: "Artist performing to the early crowd" },
      { src: "/images/048A0261.jpg", alt: "Live band in full flight mid-set" },
      { src: "/images/048A0313.jpg", alt: "Lead vocalist performing with the 12-piece live band" },
      { src: "/images/048A0331.jpg", alt: "Stage performance under warm concert lighting" },
      { src: "/images/048A1000.jpg", alt: "Audience fully engaged during the concert finale" },
    ],
    testimonial: {
      quote:
        "Kayal ran our biggest community night flawlessly — artists, staging, ticketing, everything. It felt like a film premiere, not a function.",
      author: "Anoop Krishnan",
      role: "President, Melbourne Malayalee Association",
    },
  },
  {
    slug: "corporate-gala-2025",
    title: "Fortune-500 Diwali Gala",
    year: "2025",
    summary:
      "An 800-guest corporate Diwali gala for a national technology firm — concept to curtain in six weeks.",
    description:
      "A black-tie Diwali celebration delivered for a major corporate client: bespoke stage design, a curated South Asian performance program, full AV production, and white-glove guest management. Delivered on a six-week timeline with a 98% post-event guest satisfaction score.",
    stats: [
      { label: "Guests", value: "800" },
      { label: "Lead time", value: "6 weeks" },
      { label: "Guest satisfaction", value: "98%" },
      { label: "Performances", value: "9" },
    ],
    heroImage: "/images/048A0608.jpg",
    gallery: [
      { src: "/images/048A0400.jpg", alt: "Full stage and production under event lighting" },
      { src: "/images/048A0407.jpg", alt: "Artist performing to a packed house" },
      { src: "/images/048A0413.jpg", alt: "Performer on stage during the live show" },
      { src: "/images/048A0418.jpg", alt: "Stage setup with professional lighting and LED backdrop" },
      { src: "/images/048A0427.jpg", alt: "Live performance with full band accompaniment" },
      { src: "/images/048A0435.jpg", alt: "Vocalist performing under dramatic stage lights" },
      { src: "/images/048A0474.jpg", alt: "Concert production showcasing AV capability" },
      { src: "/images/048A0484.jpg", alt: "Artists and band on stage during the finale" },
    ],
    testimonial: {
      quote:
        "The most polished cultural event we've run in a decade. Kayal understood both the corporate stakes and the cultural detail.",
      author: "Events Lead",
      role: "National Technology Firm (name withheld)",
    },
  },
  {
    slug: "thiruvathira-tour-2024",
    title: "Thiruvathira National Tour",
    year: "2024",
    summary:
      "A four-city national tour — Melbourne, Sydney, Brisbane, Perth — featuring headline playback singers from Kerala.",
    description:
      "Kayal Events routed, produced and promoted a four-city Australian tour for a headline Malayalam playback lineup: inter-state logistics, four venue contracts, local crews in every city, and a unified national marketing campaign that delivered 7,800 total tickets.",
    stats: [
      { label: "Cities", value: "4" },
      { label: "Total attendance", value: "7,800" },
      { label: "Tour duration", value: "10 days" },
      { label: "Sell-through", value: "92%" },
    ],
    heroImage: "/images/048A0761.jpg",
    gallery: [
      { src: "/images/048A0630.jpg", alt: "Opening night — full stage lineup under pink lights" },
      { src: "/images/048A0631.jpg", alt: "Artists performing together on stage" },
      { src: "/images/048A0632.jpg", alt: "Concert production with full LED lighting rig" },
      { src: "/images/048A0633.jpg", alt: "Multiple performers during the ensemble number" },
      { src: "/images/048A0634.jpg", alt: "Band in full flight during the headline set" },
      { src: "/images/048A0639.jpg", alt: "Artists performing under dramatic stage spotlights" },
      { src: "/images/048A0643.jpg", alt: "Full stage panoramic during the show" },
      { src: "/images/048A0649.jpg", alt: "Closing moments of the concert with all artists" },
    ],
    testimonial: {
      quote:
        "Four cities, ten days, zero missed cues. Kayal is the team we trust with our artists in Australia.",
      author: "Artist Management Representative",
      role: "Kochi, India",
    },
  },
];

export const services: Service[] = [
  {
    slug: "concerts-and-cultural-shows",
    title: "Live Concerts & Cultural Shows",
    description:
      "Large-scale music concerts, stage shows and cultural programs featuring international and Indian artists — promoted, produced and delivered end to end, including multi-city national tours.",
    highlights: [
      "Multi-city tour routing and logistics",
      "Concert-grade staging, sound and lighting",
      "International and Indian artist programming",
      "On-sale and ticketing strategy",
    ],
  },
  {
    slug: "artist-talent-management",
    title: "Artist & Talent Management",
    description:
      "Direct liaison with artist management in India and beyond — bookings, contracts, travel logistics, hospitality and technical riders, coordinated for seamless performances.",
    highlights: [
      "Artist booking and contract negotiation",
      "India–Australia travel and visa logistics",
      "Hospitality and rider management",
      "Technical coordination with artist crews",
    ],
  },
  {
    slug: "corporate-private-events",
    title: "Corporate & Private Events",
    description:
      "Galas, product launches, conferences, weddings and milestone celebrations delivered with theatrical polish — customized solutions from concept and run-sheets to on-the-day show calling.",
    highlights: [
      "Concept, theming and stage design",
      "Curated cultural performance programs",
      "White-glove guest management",
      "Vendor curation and management",
    ],
  },
  {
    slug: "festival-community-events",
    title: "Festival & Community Events",
    description:
      "Onam, Vishu, Diwali and community celebrations at scale — family-friendly programming, food and stall coordination, crowd management, and production that honours the tradition.",
    highlights: [
      "Festival programming and artist booking",
      "Food, stalls and vendor coordination",
      "Crowd management and compliance",
      "Family and kids' activity zones",
    ],
  },
  {
    slug: "production-technical",
    title: "Event Production & Technical",
    description:
      "Complete production support under one roof — sound, lighting, stage design, LED screens and technical crew management, with venue coordination from booking and approvals to layouts and compliance.",
    highlights: [
      "Sound, lighting and LED screen production",
      "Stage design and build",
      "Technical crew management",
      "Venue booking, approvals and compliance",
    ],
  },
  {
    slug: "marketing-ticketing-logistics",
    title: "Marketing, Ticketing & Logistics",
    description:
      "Strategic promotion through digital marketing, branding and social campaigns; full ticketing coordination from platform setup to entry management; and end-to-end logistics across transport, accommodation and on-ground execution.",
    highlights: [
      "Digital marketing and social campaigns",
      "Ticket platform setup and sales monitoring",
      "Entry management and audience flow",
      "Transport, accommodation and scheduling",
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "Kayal ran our biggest community night flawlessly — it felt like a film premiere, not a function.",
    author: "Anoop Krishnan",
    role: "President, Melbourne Malayalee Association",
  },
  {
    quote:
      "Four cities, ten days, zero missed cues. Kayal is the team we trust with our artists in Australia.",
    author: "Artist Management Representative",
    role: "Kochi, India",
  },
  {
    quote:
      "The most polished cultural event we've run in a decade — corporate stakes and cultural detail, both understood.",
    author: "Events Lead",
    role: "National Technology Firm",
  },
];
