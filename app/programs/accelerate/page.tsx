import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

/* ── SEO Metadata ──────────────────────────────────────────── */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Year 4–10 Tutoring Adelaide — Build Strong Foundations",
  description:
    "Personalised tuition in Adelaide for Year 4-10 students. Build confidence in maths, science, and English with top-achieving tutors. Enquire today.",
  alternates: {
    canonical: "/programs/accelerate",
  },
  openGraph: {
    title: "Year 4–10 Tutoring Adelaide — Build Strong Foundations | Simple Tuition",
    description:
      "Personalised tuition in Adelaide for Year 4-10 students. Build confidence in maths, science, and English with top-achieving tutors.",
    url: `${BASE_URL}/programs/accelerate`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Year 4–10 Tutoring in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Year 4–10 Tutoring Adelaide — Build Strong Foundations | Simple Tuition",
    description:
      "Personalised tuition in Adelaide for Year 4-10 students. Build confidence in maths, science, and English with top-achieving tutors.",
    images: ["/images/banner.webp"],
  },
};

/* ── JSON-LD Structured Data ───────────────────────────────── */

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Year 4–10 Acceleration Program",
  description:
    "Personalised tutoring for Year 4-10 students, building strong foundations in maths, English, and science.",
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
    audienceType: "Year 4–10 students and parents",
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
      name: "Accelerate Program",
      item: `${BASE_URL}/programs/accelerate`,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When should my child start tutoring?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There's no single 'right' time — it depends on your child's needs. If they're struggling to keep up, feeling frustrated, or you want to accelerate their learning before high school, tutoring can help. Starting early builds habits and confidence that compound over time.",
      },
    },
    {
      "@type": "Question",
      name: "What subjects do you cover for Year 4–10?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We cover maths, English, and science across all year levels from Year 4 to Year 10. Our tutors adapt to your child's curriculum and learning needs.",
      },
    },
    {
      "@type": "Question",
      name: "Are your tutors experienced with younger students?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our tutors are selected not just for academic excellence but for their ability to connect with younger students. Every tutor holds a current Working with Children Check and understands how to make learning engaging for primary and middle school students.",
      },
    },
    {
      "@type": "Question",
      name: "How often should my child have tutoring sessions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most students benefit from 1–2 sessions per week. The right frequency depends on your child's goals and how much support they need. Your tutor can recommend an approach after the first few sessions.",
      },
    },
    {
      "@type": "Question",
      name: "Can tutoring help my child get ahead, not just catch up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Many of our Year 4–10 students are already performing well but want to be challenged beyond the classroom. Tutoring can extend their learning, introduce advanced concepts, and prepare them for the transition to SACE.",
      },
    },
  ],
};

/* ── Subjects ───────────────────────────────────────────────── */

const YEAR_4_10_SUBJECTS = [
  { name: "Maths", description: "Learn the foundations of algebra and problem-solving skills." },
  { name: "English", description: "Learn the foundations of strong essay writing and critical reading." },
  { name: "Science", description: "Learn the foundations of the 3 core sciences: biology, chemistry, and physics." },
];

/* ── Page Component ────────────────────────────────────────── */

export default function AccelerateProgramPage() {
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
            <li className="font-semibold text-slate-700">Accelerate Program</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          {/* Hero */}
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              Our services
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Year 4–10 Acceleration Program
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              The habits and confidence built in primary and middle school shape
              everything that comes after. Our Year 4–10 Acceleration Program
              gives students a structured edge and sets them up to excel academically in senior school.
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

          {/* Why Start Early */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Why start tutoring early?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Build strong foundations",
                  copy: "Core concepts in maths, English, and science build on each other. Their ability to learn carries through high school and beyond.",
                },
                {
                  title: "Develop study habits",
                  copy: "Students who learn how to learn and focus carry those habits into Year 11 and 12, when the stakes are highest.",
                },
                {
                  title: "Grow confidence",
                  copy: "Studies consistently show a strong, positive link between confidence and academic performance. The more confident they are, the better they perform.",
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

          {/* What This Program Covers */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              What this program covers
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Pre-SACE tutoring for the South Australian curriculum.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {YEAR_4_10_SUBJECTS.map((subject) => (
                <div
                  key={subject.name}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    {subject.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{subject.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Our Approach */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Our approach to younger students
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Relatable, patient tutors
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Our tutors aren&apos;t just academically strong. They&apos;ve been through the same systems and are relatable,
                  patient, and trained to work with younger students.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  WWCC verified
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Every tutor holds a current Working with Children Check. We take
                  trust seriously — because the best academic outcomes come from
                  relationships built on confidence and consistency.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Tailored plans
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Our tutors adapt their teaching style to each student's needs and build tailored plans to support the best possible outcome.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Parent updates
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Parents receive regular updates on how things are tracking. You&apos;ll
                  always know where your child stands and what they&apos;re working on.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              FAQs for parents
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
              Tell us your child&apos;s year level, subjects, and goals. We&apos;ll match a tutor with you within 1 business day.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
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
