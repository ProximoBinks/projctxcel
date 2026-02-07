import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

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

/* ── Subject Colors ─────────────────────────────────────────── */

const getSubjectStyle = (subject: string) => {
  const s = subject.toLowerCase();
  // Maths
  if (s === "general maths") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "maths methods") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "specialist maths") return "bg-blue-100 text-blue-800 border-blue-200";
  // Sciences
  if (s === "biology") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "chemistry") return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === "physics") return "bg-violet-100 text-violet-700 border-violet-200";
  // English
  if (s === "english") return "bg-red-100 text-red-700 border-red-200";
  if (s === "english literature") return "bg-rose-100 text-rose-800 border-rose-200";
  if (s === "research project" || s === "research project/aif") return "bg-slate-100 text-slate-600 border-slate-200";
  // Business
  if (s === "accounting") return "bg-gray-200 text-gray-800 border-gray-300";
  if (s === "business innovation") return "bg-teal-100 text-teal-700 border-teal-200";
  if (s === "economics") return "bg-green-200 text-green-800 border-green-300";
  // Default
  return "border-slate-200 text-slate-600 bg-white";
};

/* ── Subjects ───────────────────────────────────────────────── */

const SACE_SUBJECTS = [
  { name: "Maths Methods", description: ["Skills & Assessment Tasks — 50%", "Mathematical Investigation — 20%", "Exam — 30%"] },
  { name: "Specialist Maths", description: ["Skills & Assessment Tasks — 50%", "Mathematical Investigation — 20%", "Exam — 30%"] },
  { name: "General Maths", description: ["Skills & Assessment Tasks — 40%", "Mathematical Investigation — 30%", "Exam — 30%"] },
  { name: "Biology", description: ["Topic Tests — 40%", "Practical Reports + SHE Task — 30%", "Exam — 30%"] },
  { name: "Chemistry", description: ["Topic Tests — 40%", "Practical Reports + SHE Task — 30%", "Exam — 30%"] },
  { name: "Physics", description: ["Topic Tests — 40%", "Practical Reports + SHE Task — 30%", "Exam — 30%"] },
  { name: "English", description: ["Responding to Texts — 30%", "Creating Texts — 40%", "Comparative Analysis — 30%"] },
  { name: "English Literature", description: ["Responding to Texts — 50%", "Creating Texts — 20%", "Comparative Analysis + Critical Reading — 30%"] },
  { name: "Accounting", description: ["Accounting Concepts and Solutions — 40%", "Accounting Advice — 30%", "Exam — 30%"] },
  { name: "Business Innovation", description: ["Business Skills — 40%", "Business Model — 30%", "Business Plan & Pitch — 30%"] },
  { name: "Economics", description: ["Folio — 40%", "Economic Project — 30%", "Exam — 30%"] },
  { name: "Research Project/AIF", description: ["Folio — 30%", "Research Outcome — 40%", "Evaluation — 30%"] },
];

/* ── Page Component ────────────────────────────────────────── */

export default function SACEProgramPage() {
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
            <li className="font-semibold text-slate-700">SACE Program</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          {/* Hero */}
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              Our services
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              SACE Program
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Years 11 and 12 are demanding but defining years. The difference between a strong
              ATAR and a great one often comes down to the quality of support
              around a student — and that&apos;s exactly where Simple Tuition comes in.
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

          {/* Why Simple Tuition */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Why SACE students choose Simple Tuition
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Top 1% ATAR tutors",
                  copy: "Every tutor has achieved an ATAR above 99, with many earning SACE subject merits, placing them in the top 1% of the state.",
                },
                {
                  title: "Same tutor, every session",
                  copy: "We don't rotate staff. Your student builds continuity and understanding with a dedicated tutor all year round.",
                },
                {
                  title: "The results speak for themselves",
                  copy: "See testimonials from students and parents on our homepage.",
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

          {/* Subjects We Cover */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Subjects we cover
            </h2>
            <p className="mt-4 text-base text-slate-600">
              All major Stage 1 and Stage 2 SACE subjects.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SACE_SUBJECTS.map((subject) => (
                <div
                  key={subject.name}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getSubjectStyle(subject.name)}`}>
                    {subject.name}
                  </span>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    {subject.description.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
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
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              Tell us your year level, subjects, and goals. We&apos;ll match a tutor with you within 1 business day.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
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
