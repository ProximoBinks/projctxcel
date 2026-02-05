import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

/**
 * Sitemap — only include pages that actually exist and are built.
 *
 * As you create new pages (subject pages, program pages, blog, etc.),
 * add them here. Never list URLs that return 404 or redirect.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/programs/sace`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/enquire`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },

    // ── Add these as you build the pages ──────────────────────
    // { url: `${BASE_URL}/programs/year-4-10`, ... },
    // { url: `${BASE_URL}/programs/medicine-pathway`, ... },
    // { url: `${BASE_URL}/ucat`, ... },
    // { url: `${BASE_URL}/ucat/group-program`, ... },
    // { url: `${BASE_URL}/how-it-works`, ... },
    // { url: `${BASE_URL}/testimonials`, ... },
    // { url: `${BASE_URL}/subjects/maths-methods`, ... },
    // { url: `${BASE_URL}/subjects/chemistry`, ... },
    // { url: `${BASE_URL}/blog`, ... },
    // { url: `${BASE_URL}/tutors`, ... },
    // { url: `${BASE_URL}/tutors/[slug]`, ... },
  ];
}
