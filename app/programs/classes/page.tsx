import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

/* ── SEO Metadata ──────────────────────────────────────────── */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Subject Classes & Crash Courses Adelaide — Intensive Tutoring",
  description:
    "Join small group subject classes and intensive crash courses in Adelaide. Expert instruction in SACE subjects with flexible scheduling. Enquire today.",
  alternates: {
    canonical: "/programs/classes",
  },
  openGraph: {
    title: "Subject Classes & Crash Courses Adelaide — Intensive Tutoring | Simple Tuition",
    description:
      "Join small group subject classes and intensive crash courses in Adelaide. Expert instruction in SACE subjects with flexible scheduling.",
    url: `${BASE_URL}/programs/classes`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Subject Classes & Crash Courses in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subject Classes & Crash Courses Adelaide — Intensive Tutoring | Simple Tuition",
    description:
      "Join small group subject classes and intensive crash courses in Adelaide. Expert instruction in SACE subjects with flexible scheduling.",
    images: ["/images/banner.webp"],
  },
};

/* ── JSON-LD Structured Data ───────────────────────────────── */

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Subject Classes & Crash Courses",
  description:
    "Small group subject classes and intensive crash courses for SACE students, offering structured learning with expert tutors.",
  provider: {
    "@type": "Organization",
    name: "Simple Tuition",
    url: BASE_URL,
  },
  areaServed: {
    "@type": "City",
    name: "Adelaide",
  },
  serviceType: "Tutoring",
  audience: {
    "@type": "Audience",
    audienceType: "Year 11–12 students",
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
      name: "Programs",
      item: `${BASE_URL}/programs`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Subject Classes",
      item: `${BASE_URL}/programs/classes`,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What's the difference between classes and 1-on-1 tutoring?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Subject classes are small group sessions (max. 8 students) following a structured curriculum, while 1-on-1 tutoring is fully personalised. Classes are more affordable and great for covering content systematically, while 1-on-1 is better for targeting specific weaknesses.",
      },
    },
    {
      "@type": "Question",
      name: "Can I combine classes with 1-on-1 tutoring?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Many students attend weekly classes for structured content coverage and supplement with occasional 1-on-1 sessions to work through specific challenges or prepare for assessments.",
      },
    },
  ],
};

/* ── Page Component ────────────────────────────────────────── */

export default function ClassesPage() {
  return (
    <>
      {/* Structured Data */}
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Breadcrumbs */}
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
              <span className="text-slate-400">Programs</span>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-slate-700">Subject Classes</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          {/* Hero */}
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              Our services
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Subject Classes + Crash Courses
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Not everyone needs 1-on-1 tutoring. Our small group classes offer structured,
              expert-led instruction at a lower cost — perfect for students who want consistent
              support throughout the year or intensive revision before exams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/enquire" className="btn btn-lg">
                Enquire now
              </Link>
              <Link href="/#tutors" className="btn-ghost">
                Our tutors
              </Link>
            </div>
          </section>

          {/* Why Choose Classes */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Why choose group classes?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "More affordable",
                  copy: "Group classes cost less per hour than 1-on-1 tutoring while still providing expert instruction and personalised feedback.",
                },
                {
                  title: "Learn with peers",
                  copy: "Studying alongside other motivated students creates accountability and exposes you to different perspectives and questions.",
                },
                {
                  title: "Structured curriculum",
                  copy: "Classes follow a planned syllabus ensuring every key topic and niche concept is covered systematically.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Class Types */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              What we offer
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Different formats to suit different needs throughout the year.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {/* Weekly Subject Classes */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-7 shadow-sm">
                <div className="absolute right-5 top-5 text-6xl font-black leading-none text-slate-50 select-none">
                  01
                </div>
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  Ongoing
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  Weekly Subject Classes
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Regular small-group sessions following the SACE curriculum throughout the term — ideal for students who want consistent, structured support.
                </p>
              </div>

              {/* Holiday Crash Courses */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-7 shadow-sm">
                <div className="absolute right-5 top-5 text-6xl font-black leading-none text-slate-50 select-none">
                  02
                </div>
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  Intensive
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  Holiday Crash Courses
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Intensive multi-day courses during school holidays to cover key topics quickly. Use these to catch up or getting ahead before term resumes.
                </p>
              </div>

              {/* Exam Revision Sessions */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-7 shadow-sm">
                <div className="absolute right-5 top-5 text-6xl font-black leading-none text-slate-50 select-none">
                  03
                </div>
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  Exam prep
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  Exam Revision Sessions
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Focused revision and timed practice in the weeks leading up to exams. Consolidate content and sharpen exam technique under real exam conditions.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              How our classes work
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Small groups only
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Classes are capped at 8 students to ensure everyone gets attention.
                  This enables students to interact and received personalised feedback.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Expert tutors
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Classes are led by the same top-achieving tutors.
                  You get quality teaching at a more accessible price point.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Structured content
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Each class follows a planned curriculum aligned with SACE.
                  You&apos;ll cover theory, worked examples, and practice problems.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Resources included
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Students receive notes, practice questions, and exemplar assignments to help them secure that A+ throughout the year
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-6">
              {(
                faqSchema.mainEntity as Array<{
                  "@type": string;
                  name: string;
                  acceptedAnswer: { text: string };
                }>
              ).map((faq) => (
                <details
                  key={faq.name}
                  className="group rounded-2xl border border-slate-200/70 bg-white shadow-sm"
                >
                  <summary className="cursor-pointer px-6 py-5 text-base font-semibold text-slate-950">
                    {faq.name}
                  </summary>
                  <p className="px-6 pb-5 text-sm text-slate-600">
                    {faq.acceptedAnswer.text}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-slate-100 py-16 text-center">
            <h2 className="text-3xl font-semibold text-slate-950">
              Interested in joining a class?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              Tell us which subjects you&apos;re interested in. We&apos;ll let you know
              current availability and upcoming class schedules.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link href="/enquire" className="btn btn-lg">
                Enquire now
              </Link>
              <Link href="/#tutors" className="btn-ghost">
                Meet our tutors
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              All our tutors hold a valid Working with Children Check.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
