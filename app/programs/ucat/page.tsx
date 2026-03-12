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
      name: "When should I start studying for the UCAT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We recommend starting 1 year to 6 months before your test date. This gives you enough time to learn strategies, practice consistently, and sit multiple mock tests without feeling rushed and overwhelmed.",
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
        text: "While self-study resources are easily accessible, tutoring provides personalised strategies for your weak areas, immediate feedback on your approach, and accountability to stay on track. Our tutors share techniques that aren't available online.",
      },
    },
  ],
};

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
              Meducate UCAT Program
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              The UCAT is a critical component of medical school admission in Australia. Our program
              equips you with proven strategies, extensive practice, and personalised
              coaching from 99th percentile scorers.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/ucatonline" className="btn btn-lg">
                Sign up
              </Link>
              <Link href="/#tutors" className="btn-ghost">
                Our tutors
              </Link>
            </div>
          </section>

          {/* Tutors */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Meet your UCAT tutors
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {/* Lochie Siow */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/tutors/lochie-siow.jpg"
                    alt="Lochie Siow"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Lochie Siow</h3>
                    <p className="text-sm text-slate-500">Head Tutor</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-slate-950">99th</p>
                    <p className="mt-0.5 text-xs text-slate-500">percentile UCAT</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-slate-950">2540</p>
                    <p className="mt-0.5 text-xs text-slate-500">UCAT score</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-slate-950">1st yr</p>
                    <p className="mt-0.5 text-xs text-slate-500">Med Student</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Lochie scored 2540 on the UCAT, placing him in the 99th percentile among the 16,950 candidates who took the UCAT in 2025. He is now a medical student at the University of Adelaide.
                </p>
              </div>

              {/* Joey Fitzgerald */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/tutors/joey-fitzgerald.jpg"
                    alt="Joey Fitzgerald"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Joey Fitzgerald</h3>
                    <p className="text-sm text-slate-500">Tutor</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-slate-950">99th</p>
                    <p className="mt-0.5 text-xs text-slate-500">percentile UCAT</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-slate-950">2620</p>
                    <p className="mt-0.5 text-xs text-slate-500">UCAT score</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-slate-950">1st yr</p>
                    <p className="mt-0.5 text-xs text-slate-500">Med Student</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Joey scored 2620 out of 2700 on the UCAT, dropping just 80 points across the entire test and placing in the 99th percentile. He is now a medical student at the University of Adelaide.
                </p>
              </div>
            </div>
          </section>

          {/* Our Approach */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Our approach to UCAT preparation
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold tracking-normal text-slate-950">
                  Diagnostic assessment
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  We start with a diagnostic test to identify your strengths and weaknesses
                  across all subtests, then build a targeted study plan.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold tracking-normal text-slate-950">
                  Strategy-focused sessions
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Learn the exact techniques that our 99th percentile tutors used - from time management and question triage to pattern recognition
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold tracking-normal text-slate-950">
                  Regular mock tests
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Practice under realistic conditions with timed mock tests, followed by
                  detailed analysis of your performance and areas for improvement.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold tracking-normal text-slate-950">
                  Realistic practice questions
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  We work you through questions that are written by our tutors to replicate the exact style and difficulty of the real UCAT.
                </p>
              </div>
            </div>
          </section>

          {/* Class Schedule */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Class schedule
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Group classes run every Sunday and are capped at a 6 students to keep sessions focused and interactive.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  Year 12
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  Sunday · 9:00 am – 12:00 pm
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Three hours of intensive UCAT preparation covering all four subtests with timed practice, strategy sessions, and performance review.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  Year 11
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  Sunday · 1:00 pm – 4:00 pm
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  An early start for Year 11 students looking to build a strong foundation before their UCAT year. They will develop core skills and test strategies.
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
