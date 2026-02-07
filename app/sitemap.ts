import type { MetadataRoute } from "next";
import tutorsData from "../data/tutors.json";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

type TutorRecord = {
  slug: string;
  active: boolean;
};

/**
 * Sitemap — only include pages that actually exist and are built.
 *
 * As you create new pages (subject pages, program pages, blog, etc.),
 * add them here. Never list URLs that return 404 or redirect.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const tutorPages = (tutorsData as TutorRecord[])
    .filter((tutor) => tutor.active)
    .map((tutor) => ({
      url: `${BASE_URL}/tutors/${tutor.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

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

    {
      url: `${BASE_URL}/programs/accelerate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/programs/medicine`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/programs/ucat`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/programs/classes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...tutorPages,
  ];
}
