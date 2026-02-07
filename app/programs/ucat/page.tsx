import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

/* ── SEO Metadata ──────────────────────────────────────────── */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "UCAT Tutoring Adelaide — Expert UCAT Preparation",
  description:
    "Maximise your UCAT score with Adelaide's top UCAT tutors. Expert preparation for all four UCAT subtests with proven strategies. Enquire today.",
  alternates: {
    canonical: "/programs/ucat",
  },
  openGraph: {
    title: "UCAT Tutoring Adelaide — Expert UCAT Preparation | Simple Tuition",
    description:
      "Maximise your UCAT score with Adelaide's top UCAT tutors. Expert preparation for all four UCAT subtests with proven strategies.",
    url: `${BASE_URL}/programs/ucat`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — UCAT Tutoring in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UCAT Tutoring Adelaide — Expert UCAT Preparation | Simple Tuition",
    description:
      "Maximise your UCAT score with Adelaide's top UCAT tutors. Expert preparation for all four UCAT subtests with proven strategies.",
    images: ["/images/banner.webp"],
  },
};

/* ── JSON-LD Structured Data ───────────────────────────────── */

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "UCAT Preparation Program",
  description:
    "Comprehensive UCAT preparation covering all four UCAT subtests with strategies, practice questions, and mock exams.",
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
    audienceType: "Students preparing for UCAT",
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
      name: "UCAT Program",
      item: `${BASE_URL}/programs/ucat`,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When should I start UCAT preparation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We recommend starting 3-6 months before your test date. This gives you enough time to learn strategies, practice consistently, and sit multiple mock tests without feeling rushed.",
      },
    },
    {
      "@type": "Question",
      name: "What UCAT score do I need for medicine?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Competitive scores vary by university and year, but generally a score in the 90th percentile or above significantly improves your chances. Our tutors help you understand realistic targets based on your university preferences.",
      },
    },
    {
      "@type": "Question",
      name: "How is UCAT tutoring different from self-study?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "While self-study resources are valuable, tutoring provides personalised strategies for your weak areas, immediate feedback on your approach, and accountability to stay on track. Our tutors share techniques that aren't in textbooks.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide practice questions and mock tests?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We provide extensive practice materials and conduct timed mock tests under exam conditions. We also help you analyse your results to identify patterns and areas for improvement.",
      },
    },
    {
      "@type": "Question",
      name: "What makes your UCAT tutors qualified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All our UCAT tutors scored in the top percentiles and have successfully gained admission to medical school. They understand the test inside out and can teach the strategies that actually work.",
      },
    },
  ],
};

/* ── UCAT Subtests ──────────────────────────────────────────── */

const UCAT_SUBTESTS = [
  { name: "Verbal Reasoning", description: ["Reading comprehension", "Critical analysis", "Inference skills"] },
  { name: "Decision Making", description: ["Logical puzzles", "Data interpretation", "Probabilistic reasoning"] },
  { name: "Quantitative Reasoning", description: ["Mental arithmetic", "Data analysis", "Problem-solving"] },
  { name: "Situational Judgement", description: ["Ethical scenarios", "Professional behaviour", "Decision prioritisation"] },
];

/* ── Page Component ────────────────────────────────────────── */

export default function UCATPage() {
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
            <li className="font-semibold text-slate-700">UCAT Program</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          {/* Hero */}
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              Our services
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              UCAT Preparation Program
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              The UCAT is a critical component of medical school admission. Our program
              equips you with proven strategies, extensive practice, and personalised
              coaching from tutors who achieved top scores themselves.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/enquire" className="btn">
                Enquire now
              </Link>
              <Link href="/#tutors" className="btn-ghost">
                Our tutors
              </Link>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Why prepare with Simple Tuition?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Top percentile tutors",
                  copy: "Learn from tutors who scored in the top percentiles and know exactly what it takes to excel in each subtest.",
                },
                {
                  title: "Proven strategies",
                  copy: "Master the time-saving techniques and approaches that separate high scorers from average performers.",
                },
                {
                  title: "Realistic practice",
                  copy: "Access extensive question banks and sit timed mock tests that accurately simulate exam conditions.",
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

          {/* UCAT Subtests */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              What we cover
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Comprehensive preparation for all four UCAT subtests.
            </p>
            <div className="mt-8 grid gap-6 grid-cols-2 lg:grid-cols-4">
              {UCAT_SUBTESTS.map((subtest) => (
                <div
                  key={subtest.name}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <span className="inline-block rounded-full border border-pink-200 bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">
                    {subtest.name}
                  </span>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    {subtest.description.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Approach */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Our approach to UCAT preparation
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Diagnostic assessment
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  We start with a diagnostic test to identify your strengths and weaknesses
                  across all subtests, then build a targeted study plan.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Strategy-focused sessions
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Each session focuses on specific techniques — time management, question
                  triage, pattern recognition — not just content review.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Regular mock tests
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Practice under realistic conditions with timed mock tests, followed by
                  detailed analysis of your performance and areas for improvement.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Flexible scheduling
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  We work around your school schedule with sessions that can be intensified
                  as your test date approaches.
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
              Ready to boost your UCAT score?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              Tell us your test date and current preparation level. We&apos;ll match you
              with a tutor who can maximise your score.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link href="/enquire" className="btn">
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
