/**
 * ============================================================================
 *  CLIENT CONFIGURATION — Urban Tadka
 * ============================================================================
 *
 *  This is the ONLY file that holds client-specific content. To reuse this
 *  codebase for another restaurant, copy this file and change the values:
 *  nothing about the layout, components or styles is Urban-Tadka-specific.
 *
 *  ---------------------------------------------------------------------------
 *  PROVENANCE RULES (read before editing)
 *  ---------------------------------------------------------------------------
 *  Every business fact below carries a `status` so nothing can drift from
 *  "true" to "assumed" without a trace:
 *
 *    'confirmed'     Cross-checked against several independent sources, or
 *                    taken verbatim from the restaurant's own published pages.
 *    'published'     Published by the restaurant itself, but only in one place
 *                    and/or contradicted by another source. Safe to show with
 *                    a pending note; needs owner re-confirmation before launch.
 *    'unresolved'    Cannot be verified from here. NEVER rendered as a live
 *                    link or a stated fact.
 *
 *  Anything not in this file is either real menu data (src/data/menu.json,
 *  lifted verbatim from the restaurant's own menu page) or deliberately absent.
 *
 *  This site is an unapproved design concept. It is not affiliated with,
 *  endorsed by, or operated by Urban Tadka.
 * ============================================================================
 */

export const siteConfig = {
  /* ------------------------------------------------------------------ */
  /* Deployment                                                          */
  /* ------------------------------------------------------------------ */
  deployment: {
    /**
     * PLACEHOLDER ORIGIN — replace with the live domain before launch.
     * Used for canonical URLs, Open Graph tags and the sitemap.
     */
    siteUrl: 'https://urban-tadka-concept.example',

    /**
     * While this is a concept for review it must not compete with the
     * restaurant's real website in search results. When false, robots.txt
     * disallows everything and every page emits noindex,nofollow.
     *
     * Set to true ONLY after the owner approves publication on the final domain.
     */
    allowIndexing: false,
  },

  /* ------------------------------------------------------------------ */
  /* Brand                                                               */
  /* ------------------------------------------------------------------ */
  brand: {
    name: 'Urban Tadka',
    /**
     * Colours sampled directly from the restaurant's own logo file with a
     * pixel histogram — these are the real brand colours, not invented ones.
     *   #FFCC29  gold, the logo's dominant colour
     *   #BF383E  crimson, the "URBAN" wordmark
     *   #373435  charcoal, the logo outlines and tagline bar
     *   #BDBFC1  steel, the spice bowl
     * The values are injected as CSS custom properties by MainLayout, so
     * re-theming for another client is a change to this object alone.
     */
    colors: {
      gold: '#FFCC29',
      crimson: '#BF383E',
      charcoal: '#373435',
      steel: '#BDBFC1',
      ink: '#373435',
      inkSoft: '#6B6560',
      paper: '#FBF8F3',
      paperWarm: '#F3EDE3',
      line: '#E4DED2',
      night: '#1C1917',
      cta: '#BF383E',
      ctaHover: '#A32E34',
      ctaActive: '#8E272D',
    },
    /**
     * No logo image is shipped. We do not have written permission to
     * redistribute the restaurant's artwork, so the header renders a
     * typographic wordmark built from these settings instead.
     * Drop an authorised SVG in at `logo.src` to switch over.
     */
    logo: {
      src: null,
      alt: 'Urban Tadka',
    },
    /** Verbatim from the restaurant's own site header. */
    tagline: 'Authentic traditional Indian cuisine',
  },

  /* ------------------------------------------------------------------ */
  /* Business facts                                                      */
  /* ------------------------------------------------------------------ */
  business: {
    legalName: 'Urban Tadka',
    /**
     * Display form, abbreviated at the developer's request. The restaurant's
     * own canonical form is "1800 Market Place Blvd, Suite #190" (identical
     * on every public listing — see docs/03-unverified-details.md); both
     * forms resolve to the same location. Confirm the display form with the
     * owner before launch.
     */
    streetAddress: '1800 Market Pl Blvd #190',
    addressLocality: 'Irving',
    addressRegion: 'TX',
    postalCode: '75063',
    addressCountry: 'US',
    /** Display form used in copy, with restaurant-name prefix. */
    addressOneLine: 'Urban Tadka, 1800 Market Pl Blvd #190, Irving, TX 75063',
    status: 'confirmed',

    /** Verbatim from the restaurant's site; identical on every public listing. */
    phoneDisplay: '(469) 420-9920',
    phoneE164: '+14694209920',
    phoneStatus: 'confirmed',

    /**
     * Derived from the Google Maps embed coordinates the restaurant publishes
     * on its own Contact page (3d32.920162, 2d-96.971588).
     */
    latitude: 32.920162,
    longitude: -96.971588,
    geoStatus: 'published',

    /**
     * The restaurant's own site says "Authentic Traditional Indian Cuisine"
     * and its About page describes the cuisine of the undivided Punjab.
     */
    cuisine: ['Indian', 'North Indian'],
    cuisineStatus: 'published',

    /** No verified public email address exists. Left null on purpose. */
    email: null,
  },

  /* ------------------------------------------------------------------ */
  /* Opening hours                                                       */
  /* ------------------------------------------------------------------ */
  /**
   * `status: 'published'` and NOT 'confirmed' on purpose.
   *
   * The restaurant's own Contact page lists:
   *   Lunch  Mon, Wed-Fri 11:00-2:30 | Sat 11:30-3:00 | Sun 11:30-2:30
   *   Dinner Mon-Sun 5:30-9:45 | Closed Tuesday
   * Public listings (Yelp, Uber Eats) advertise 11:00-2:00 and 5:30-9:30,
   * and the homepage still contains COMMENTED-OUT hours advertising a
   * Mon-Fri 11:30-2:30 buffet and Sat-Sun 11:30-5:30.
   *
   * Three versions disagree, so hours render with a visible pending note and
   * the conflict is listed in docs/03-unverified-details.md.
   */
  hours: {
    status: 'published',
    note: 'Hours shown are from the restaurant’s own website. Third-party listings differ — confirm before launch.',
    schedule: [
      { day: 'Monday', lunch: '11:00 am – 2:30 pm', dinner: '5:30 pm – 9:45 pm' },
      { day: 'Tuesday', lunch: null, dinner: null, closed: true },
      { day: 'Wednesday', lunch: '11:00 am – 2:30 pm', dinner: '5:30 pm – 9:45 pm' },
      { day: 'Thursday', lunch: '11:00 am – 2:30 pm', dinner: '5:30 pm – 9:45 pm' },
      { day: 'Friday', lunch: '11:00 am – 2:30 pm', dinner: '5:30 pm – 9:45 pm' },
      { day: 'Saturday', lunch: '11:30 am – 3:00 pm', dinner: '5:30 pm – 9:45 pm' },
      { day: 'Sunday', lunch: '11:30 am – 2:30 pm', dinner: '5:30 pm – 9:45 pm' },
    ],
    /**
     * Machine-readable form for structured data (schema.org).
     *
     * MUST be kept in step with `schedule` above. Tuesday is deliberately
     * absent from every block: schema.org has no "closed" marker, so a closed
     * day is expressed by omission. A previous version listed Tuesday with a
     * lunch window AND inside the seven-day dinner block, which told Google
     * the restaurant was open on the one day it is shut.
     */
    schema: [
      {
        days: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '11:00',
        closes: '14:30',
      },
      { days: ['Saturday'], opens: '11:30', closes: '15:00' },
      { days: ['Sunday'], opens: '11:30', closes: '14:30' },
      {
        days: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '17:30',
        closes: '21:45',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Ordering & booking                                                  */
  /* ------------------------------------------------------------------ */
  /**
   * `verified` records what we could actually confirm from here:
   *   'http-200'  the page responded successfully.
   *   'indexed'   appears as a live public listing in search results, but the
   *               platform blocks automated requests, so we could not fetch it.
   *
   * The restaurant's OWN order link (an ezCater brand page) redirects to
   * ezCater's homepage and serves no Urban Tadka content, so it is NOT
   * rendered as a button anywhere. It is reported in
   * docs/03-unverified-details.md instead — a concept must not ship a
   * conversion button we cannot show works.
   *
   * No reservation link is listed because none could be verified.
   */
  ordering: {
    status: 'published',
    options: [
      {
        label: 'Grubhub',
        kind: 'Delivery & pickup',
        url: 'https://www.grubhub.com/restaurant/urban-tadka-1800-market-pl-blvd-irving/6473936',
        verified: 'http-200',
      },
      {
        label: 'Uber Eats',
        kind: 'Delivery',
        url: 'https://www.ubereats.com/store/urban-tadka/iDQIaSxwSX-XLq2OhK0Pzw',
        verified: 'indexed',
      },
    ],
    note: 'Ordering is currently handled by third-party platforms. Confirm these links and their account ownership before launch.',
  },

  /* ------------------------------------------------------------------ */
  /* Social accounts                                                     */
  /* ------------------------------------------------------------------ */
  /**
   * Only accounts with real public evidence are listed.
   *
   * The restaurant's existing site advertises Facebook and Twitter in its
   * footer, but BOTH icons are href="#" on every page — dead links. No
   * Twitter/X account for this restaurant could be located, so that claim has
   * been removed rather than reproduced. No Instagram or TikTok account could
   * be found either, so none is shown; inventing handles would be a
   * fabricated fact.
   */
  social: {
    status: 'published',
    accounts: [
      {
        label: 'Facebook',
        handle: 'UrbanTadkaDallas',
        url: 'https://www.facebook.com/UrbanTadkaDallas/',
        verified: 'indexed',
      },
    ],
    note: 'Page exists publicly, but account ownership is unverified.',
  },

  /* ------------------------------------------------------------------ */
  /* Catering                                                            */
  /* ------------------------------------------------------------------ */
  /**
   * Catering is ADVERTISED BY THE RESTAURANT ITSELF: its homepage hero reads
   * "LUNCH . DINNER . CATERING" and it carries a "Catering Services" card.
   * That is an owner-published claim, so the service is real enough to build
   * a page for — but minimum headcount, lead time, delivery radius and
   * pricing are all unknown and are stated as unknown rather than invented.
   */
  catering: {
    status: 'published',
    advertised: true,
    verifiedDetails: null,
  },

  /* ------------------------------------------------------------------ */
  /* Photographs                                                         */
  /* ------------------------------------------------------------------ */
  /**
   * NO IMAGES ARE SHIPPED.
   *
   * The brief forbids AI-generated imagery presented as real restaurant food,
   * and we hold no authorised photography. The two photos on the restaurant's
   * current site appear to be generic stock (a stock chef holding a salad,
   * captioned "Catering Services"), so reusing them would misrepresent the
   * food. Until the owner supplies photographs, every image position renders
   * a designed placeholder that states what belongs there. Each `photo()` slot
   * below documents the shot we are asking for.
   */
  photography: {
    supplied: false,
    note: 'Concept build — all image positions are placeholders pending authorised photography from the restaurant.',
  },

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */
  nav: [
    { label: 'Menu', href: '/menu/' },
    { label: 'About', href: '/about/' },
    { label: 'Gallery', href: '/gallery/' },
    { label: 'Catering', href: '/catering/' },
    { label: 'Visit', href: '/visit/' },
  ],

  /* ------------------------------------------------------------------ */
  /* Home page featured dishes                                           */
  /* ------------------------------------------------------------------ */
  /**
   * References into src/data/menu.json by name. Prices and descriptions are
   * looked up from that file, so a price change is a single edit in one place
   * and the homepage can never disagree with the menu page.
   */
  featured: [
    { name: 'Samosa', category: 'appetizers' },
    { name: 'Butter Chicken', category: 'chicken' },
    { name: 'Tandoori Chicken', category: 'tandoor' },
    { name: 'Gulab Jamun', category: 'desserts' },
  ],

  /* ------------------------------------------------------------------ */
  /* SEO defaults                                                        */
  /* ------------------------------------------------------------------ */
  seo: {
    /**
     * The restaurant's own site has no meta description at all; these are
     * written copy, kept strictly to verifiable facts.
     */
    defaultDescription:
      'Urban Tadka serves North Indian cooking in Irving, Texas — lunch, dinner and catering at 1800 Market Place Blvd, Suite #190. Call (469) 420-9920.',
    /** Used for Open Graph previews; no image is shipped, so this is blank. */
    ogImage: null,
    locale: 'en_US',
  },

  /* ------------------------------------------------------------------ */
  /* Concept annotations                                                 */
  /* ------------------------------------------------------------------ */
  /** Shown in <ConceptNote> blocks so reviewers always know what is pending. */
  concept: {
    label: 'For the owner',
    ownerNote:
      'This is an unreleased design concept. Facts marked here need confirming by Urban Tadka before publication.',
  },

  /* ------------------------------------------------------------------ */
  /* Independent developer — provisional ownership                       */
  /* ------------------------------------------------------------------ */
  /**
   * PROVISIONAL ONLY. Replace `name` with the developer's legal business
   * name before showing this to the restaurant. The original code, layout,
   * styles, icons, favicon and placeholder artwork in this project were
   * prepared by the independent developer; the restaurant's name, menu text,
   * tagline and any future logo/photographs remain the restaurant's (or
   * their owners') property and are used here without permission for review
   * only. Final ownership, licence and payment terms must be set out in a
   * signed written agreement — nothing on this site transfers rights by
   * itself. Have a qualified attorney review before sale or publication.
   */
  developer: {
    name: '[Independent developer — replace with legal business name]',
    role: 'Independent website developer (not affiliated with Urban Tadka)',
    contactNote:
      'Contact details for the developer are exchanged privately, not published on this demo.',
  },

  /* ------------------------------------------------------------------ */
  /* Demo disclosure                                                     */
  /* ------------------------------------------------------------------ */
  /**
   * Rendered in the site-wide banner (DemoBanner) and the footer on every
   * page. A disclaimer reduces confusion but does not by itself eliminate
   * trademark, copyright or other legal risk — written permission and
   * attorney review are still required before any sale or publication.
   */
  demo: {
    shortNotice:
      'Independent design concept — not the official Urban Tadka website.',
    noOrdersNote:
      'This demo takes no orders, reservations, payments or inquiries. Phone and ordering links leave this demo for the real restaurant or third-party platforms.',
  },
};

/** Convenience helpers derived from the config above. */
export const fullAddress = `${siteConfig.business.streetAddress}, ${siteConfig.business.addressLocality}, ${siteConfig.business.addressRegion} ${siteConfig.business.postalCode}`;

/** Google Maps universal directions link — verified to resolve (HTTP 200). */
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  fullAddress,
)}`;

/** Google Maps place search link, used for "view on map". */
export const mapsPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${siteConfig.business.legalName} ${fullAddress}`,
)}`;

/**
 * Google Maps embed URL. The embed loads automatically with the page: it is
 * a third-party request that can set cookies, disclosed under the map and on
 * /privacy/ ("Embedded map"). Flag for attorney review whether a consent
 * banner is needed before launch.
 */
export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  `${siteConfig.business.legalName}, ${fullAddress}`,
)}&output=embed`;

export const telHref = `tel:${siteConfig.business.phoneE164}`;

export default siteConfig;
