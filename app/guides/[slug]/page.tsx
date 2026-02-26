import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../components/JsonLd";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import blogPosts from "../../../data/blog-posts.json";
import HowToGetIntoMedicine from "./articles/HowToGetIntoMedicine";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  category: string;
  active: boolean;
};

const ARTICLE_COMPONENTS: Record<string, React.ComponentType> = {
  "how-to-get-into-medicine": HowToGetIntoMedicine,
};

export function generateStaticParams() {
  return (blogPosts as BlogPost[])
    .filter((post) => post.active)
    .map((post) => ({ slug: post.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (blogPosts as BlogPost[]).find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/guides/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | Simple Tuition`,
      description: post.excerpt,
      url: `${BASE_URL}/guides/${post.slug}`,
      type: "article",
      images: [
        {
          url: "/images/banner.webp",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Simple Tuition`,
      description: post.excerpt,
      images: ["/images/banner.webp"],
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = (blogPosts as BlogPost[]).find((p) => p.slug === slug);
  if (!post || !post.active) notFound();

  const ArticleContent = ARTICLE_COMPONENTS[post.slug];
  if (!ArticleContent) notFound();

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
        name: "Guides",
        item: `${BASE_URL}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${BASE_URL}/guides/${post.slug}`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Simple Tuition",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Simple Tuition",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/logo.png`,
      },
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={articleSchema} />

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
            <li>
              <Link href="/guides" className="hover:text-blue-600">
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-slate-700 truncate max-w-[200px]">
              {post.title}
            </li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <header className="py-12 sm:py-16">
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              {post.category}
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-sm text-slate-400">
              {post.date} &middot; {post.readingTime}
            </p>
          </header>

          <ArticleContent />
        </main>

        <Footer />
      </div>
    </>
  );
}
