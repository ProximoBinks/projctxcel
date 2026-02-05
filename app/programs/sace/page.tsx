import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import tutorsData from "../../../data/tutors.json";

/* ── SEO Metadata ──────────────────────────────────────────── */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "SACE Tutoring Adelaide — Year 11–12 ATAR Tutors",
  description:
    "Maximise your ATAR with Adelaide's top-performing SACE tutors. Expert support in Maths Methods, Chemistry, Physics, English & more. Enquire today.",
  alternates: {
    canonical: "/programs/sace",
  },
  openGraph: {
    title: "SACE Tutoring Adelaide — Year 11–12 ATAR Tutors | Simple Tuition",
    description:
      "Maximise your ATAR with Adelaide's top-performing SACE tutors. Expert support in Maths Methods, Chemistry, Physics, English & more.",
    url: `${BASE_URL}/programs/sace`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — SACE Tutoring in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SACE Tutoring Adelaide — Year 11–12 ATAR Tutors | Simple Tuition",
    description:
      "Maximise your ATAR with Adelaide's top-performing SACE tutors. Expert support in Maths Methods, Chemistry, Physics, English & more.",
    images: ["/images/banner.webp"],
  },
};

/* ── JSON-LD Structured Data ───────────────────────────────── */

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "SACE Tutoring Program",
  description:
    "Targeted tutoring for Year 11–12 students across all SACE subjects, focused on maximising ATAR results.",
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
    audienceType: "Year 11–12 students and parents",
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
      name: "SACE Program",
      item: `${BASE_URL}/programs/sace`,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does SACE tutoring cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pricing varies by tutor experience and subject. Enquire for a personalised quote — we respond within 1 business day.",
      },
    },
    {
      "@type": "Question",
      name: "What SACE subjects do you cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We cover Maths Methods, Specialist Maths, General Maths, Chemistry, Physics, Biology, English, English Literature, Accounting, and Research Project. Enquire for additional subjects.",
      },
    },
    {
      "@type": "Question",
      name: "Are your SACE tutors qualified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All our tutors are top 1% ATAR achievers with a current Working with Children Check. Many hold SACE subject merits and are current university students.",
      },
    },
    {
      "@type": "Question",
      name: "How often should a Year 12 student have tutoring?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Year 12 students benefit from 1–2 sessions per week per subject. We recommend discussing your specific needs when you enquire, and your tutor can adjust the frequency as needed.",
      },
    },
    {
      "@type": "Question",
      name: "Can tutoring actually improve my ATAR?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Consistent, targeted tutoring with a knowledgeable tutor can significantly improve understanding and exam performance. Our students have achieved ATARs of 99+ with the support of our tutors.",
      },
    },
  ],
};

/* ── Subjects with links ───────────────────────────────────── */

const SACE_SUBJECTS = [
  { name: "Maths Methods", slug: "maths-methods" },
  { name: "Specialist Maths", slug: "specialist-maths" },
  { name: "General Maths", slug: "general-maths" },
  { name: "Chemistry", slug: "chemistry" },
  { name: "Physics", slug: "physics" },
  { name: "Biology", slug: "biology" },
  { name: "English", slug: "english" },
  { name: "English Literature", slug: "english-literature" },
  { name: "Accounting", slug: "accounting" },
  { name: "Research Project", slug: "research-project" },
];

/* ── Page Component ────────────────────────────────────────── */

export default function SACEProgramPage() {
  const saceTutors = tutorsData
    .filter((t) => t.active)
    .filter((t) =>
      t.subjects.some(
        (s) =>
          !["UCAT", "Interview Prep"].includes(s) ||
          t.subjects.length > 2
      )
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 6);

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-slate-100">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-5 sm:px-10">
            <Link href="/">
              <img
                src="/images/simple-text-black.svg"
                alt="Simple Tuition"
                className="h-[60px]"
              />
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/#tutors" className="text-slate-600 hover:text-slate-900">
                Tutors
              </Link>
              <Link
                href="/enquire"
                className="rounded-full bg-indigo-600 px-5 py-2 font-semibold text-white transition hover:bg-indigo-700"
              >
                Enquire now
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <nav
          className="mx-auto w-full max-w-[1200px] px-6 pt-6 sm:px-10"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2 text-xs text-slate-500">
            <li>
              <Link href="/" className="hover:text-indigo-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span className="text-slate-400">Programs</span>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-slate-700">SACE Program</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          {/* Hero */}
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
              SACE Program
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              SACE Tutoring — Maximise Your ATAR
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600">
              Year 11 and 12 are defining years. The difference between a strong
              ATAR and a great one often comes down to the quality of support
              around a student — and that&apos;s exactly where Simple Tuition fits in.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/enquire"
                className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Enquire about SACE tutoring
              </Link>
              <Link
                href="/tutors"
                className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Browse our SACE tutors
              </Link>
            </div>
          </section>

          {/* Why Simple Tuition */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Why SACE students choose Simple Tuition
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Top 1% ATAR tutors",
                  copy: "Every tutor achieved an ATAR between 99.40 and 99.95, with many earning SACE subject merits.",
                },
                {
                  title: "Same tutor, every session",
                  copy: "We don't rotate staff. Your student builds continuity and understanding with a dedicated tutor all year.",
                },
                {
                  title: "Matched within 1 business day",
                  copy: "Tell us your subjects, goals, and availability. We recommend a tutor and confirm within one business day.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Subjects */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Subjects we cover
            </h2>
            <p className="mt-4 text-base text-slate-600">
              We cover all major SACE subjects. If your subject isn&apos;t listed,{" "}
              <Link href="/enquire" className="text-indigo-600 underline">
                enquire anyway
              </Link>{" "}
              — we&apos;re continuously expanding our team.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SACE_SUBJECTS.map((subject) => (
                <Link
                  key={subject.slug}
                  href={`/subjects/${subject.slug}`}
                  className="rounded-xl border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {subject.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Tutor Preview */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Our SACE tutors
            </h2>
            <p className="mt-4 text-base text-slate-600">
              A handpicked team who&apos;ve been through the same system.{" "}
              <strong className="font-semibold text-slate-950">
                All top 1% ATAR achievers
              </strong>
              , with SACE subject merits and places at leading universities.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {saceTutors.map((tutor) => (
                <div
                  key={tutor.slug}
                  className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      <img
                        src={
                          tutor.photoFile
                            ? `/images/tutors/${tutor.photoFile}`
                            : "/images/tutors/default.webp"
                        }
                        alt={tutor.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">
                        {tutor.name}
                      </p>
                      <p className="text-xs text-slate-500">{tutor.headline}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tutor.stats.map((stat) => (
                      <span
                        key={stat.label}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {stat.value} {stat.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/tutors"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all tutors →
              </Link>
            </div>
          </section>

          {/* How It Works */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              How the SACE program works
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Tell us what you need",
                  copy: "Share your year level, subjects, goals, and availability — we'll take it from there.",
                },
                {
                  step: "02",
                  title: "Meet your tutor",
                  copy: "We connect you with a tutor who fits their subject needs, learning style, and schedule.",
                },
                {
                  step: "03",
                  title: "See the results",
                  copy: "Same tutor, consistent sessions, and a plan that evolves through the year. Parents can enquire anytime about progress.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <p className="text-5xl font-semibold text-indigo-500/20">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Learn more about how matching works →
              </Link>
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
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-600">
              Tell us your student&apos;s year level, subjects, and goals. We&apos;ll
              recommend a matched tutor within 1 business day.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/enquire"
                className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Enquire about SACE tutoring
              </Link>
              <Link
                href="/tutors"
                className="rounded-full border border-slate-200 px-8 py-3 font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Meet our tutors
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              All our tutors hold a valid Working with Children Check.
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-100 bg-white py-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p>© {new Date().getFullYear()} Simple Tuition. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
