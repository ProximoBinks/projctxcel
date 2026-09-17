import type { MetadataRoute } from "next";
import tutorsData from "../data/tutors.json";
import blogPosts from "../data/blog-posts.json";
import { SITE_URL } from "../lib/site";

type TutorRecord = {
  slug: string;
  active: boolean;
};

type BlogPostRecord = {
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
  const blogPages = (blogPosts as BlogPostRecord[])
    .filter((post) => post.active)
    .map((post) => ({
      url: `${SITE_URL}/guides/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  const tutorPages = (tutorsData as TutorRecord[])
    .filter((tutor) => tutor.active)
    .map((tutor) => ({
      url: `${SITE_URL}/tutors/${tutor.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/programs/sace`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/enquire`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },

    {
      url: `${SITE_URL}/programs/accelerate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/programs/medicine`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/programs/ucat`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/programs/classes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/interview`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...blogPages,
    ...tutorPages,
  ];
}
