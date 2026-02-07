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
        text: "Subject classes are small group sessions (4-8 students) following a structured curriculum, while 1-on-1 tutoring is fully personalised. Classes are more affordable and great for covering content systematically, while 1-on-1 is better for targeting specific weaknesses.",
      },
    },
    {
      "@type": "Question",
      name: "When do crash courses run?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Crash courses typically run during school holidays — particularly before exams in Terms 2 and 3. We also offer intensive revision sessions in the weeks leading up to final exams.",
      },
    },
    {
      "@type": "Question",
      name: "How big are the class sizes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We keep classes small — typically 4-8 students — to ensure everyone gets attention and can ask questions. This strikes a balance between collaborative learning and personalised support.",
      },
    },
    {
      "@type": "Question",
      name: "What subjects do you offer classes in?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer classes in high-demand SACE subjects including Maths Methods, Specialist Maths, Chemistry, Physics, and Biology. Check with us for current availability and schedules.",
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

/* ── Class Types ────────────────────────────────────────────── */

const CLASS_TYPES = [
  {
    name: "Weekly Subject Classes",
    description: "Regular small-group sessions following the SACE curriculum throughout the term."
  },
  {
    name: "Holiday Crash Courses",
    description: "Intensive multi-day courses during school holidays to cover key topics quickly."
  },
  {
    name: "Exam Revision Sessions",
    description: "Focused revision and practice in the weeks leading up to exams."
  },
];

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
              <Link href="/enquire" className="btn">
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
                  copy: "Classes follow a planned syllabus ensuring you cover all key topics systematically — nothing falls through the cracks.",
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
              {CLASS_TYPES.map((classType) => (
                <div
                  key={classType.name}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    {classType.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{classType.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Subjects Available */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Subjects available
            </h2>
            <p className="mt-4 text-base text-slate-600">
              We offer classes in high-demand SACE subjects. Availability varies by term.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Maths Methods", "Specialist Maths", "Chemistry", "Physics", "Biology", "English"].map((subject) => (
                <span
                  key={subject}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {subject}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Don&apos;t see your subject?{" "}
              <Link href="/enquire" className="text-blue-600 underline">
                Enquire anyway
              </Link>{" "}
              — we&apos;re always expanding our offerings.
            </p>
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
                  Classes are capped at 4-8 students to ensure everyone gets attention.
                  You can ask questions and get feedback — it&apos;s not a lecture.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Expert instructors
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Classes are led by the same top-achieving tutors who run our 1-on-1 sessions.
                  You get quality instruction at a more accessible price point.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Structured content
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Each class follows a planned curriculum aligned with SACE requirements.
                  You&apos;ll cover theory, worked examples, and practice problems.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Resources included
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Students receive notes, practice questions, and worked solutions.
                  Everything you need to consolidate what you learn in class.
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
