import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../components/JsonLd";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BlogCard from "../../components/BlogCard";
import blogPosts from "../../data/blog-posts.json";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Blog — Insights & Guides for Students and Parents",
  description:
    "Expert guides on ATAR, UCAT, medicine pathways, and study tips from Adelaide's top tutors. Free resources for students and parents.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog — Insights & Guides | Simple Tuition",
    description:
      "Expert guides on ATAR, UCAT, medicine pathways, and study tips from Adelaide's top tutors.",
    url: `${BASE_URL}/blog`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Insights & Guides | Simple Tuition",
    description:
      "Expert guides on ATAR, UCAT, medicine pathways, and study tips from Adelaide's top tutors.",
    images: ["/images/banner.webp"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: BASE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: `${BASE_URL}/blog`,
    },
  ],
};

const activePosts = blogPosts.filter(
  (post: { active: boolean }) => post.active
);

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-white">
        <Header />

        <nav
          className="mx-auto w-full max-w-[1200px] px-6 pt-6 sm:px-10"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2 text-xs text-slate-500">
            <li>
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-slate-700">Blog</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              Blog
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Insights &amp; Guides
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Expert advice on ATAR preparation, UCAT, medicine pathways, and
              more — written by tutors who&apos;ve been through it.
            </p>
          </section>

          <section className="grid gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
            {activePosts.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
