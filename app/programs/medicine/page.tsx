import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

/* ── SEO Metadata ──────────────────────────────────────────── */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Medicine Pathway Tutoring Adelaide — UCAT & Interview Prep",
  description:
    "Prepare for medical school with Adelaide's top medicine pathway tutors. Expert UCAT preparation, interview coaching, and private tuition in Adelaide. Enquire today.",
  alternates: {
    canonical: "/programs/medicine",
  },
  openGraph: {
    title: "Medicine Pathway Tutoring Adelaide — UCAT & Interview Prep | Simple Tuition",
    description:
      "Prepare for medical school with Adelaide's top medicine pathway tutors. Expert UCAT preparation, interview coaching, and private tuition in Adelaide.",
    url: `${BASE_URL}/programs/medicine`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Medicine Pathway Tutoring in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medicine Pathway Tutoring Adelaide — UCAT & Interview Prep | Simple Tuition",
    description:
      "Prepare for medical school with Adelaide's top medicine pathway tutors. Expert UCAT preparation, interview coaching, and private tuition in Adelaide.",
    images: ["/images/banner.webp"],
  },
};

/* ── JSON-LD Structured Data ───────────────────────────────── */

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Medicine Pathway Program",
  description:
    "Comprehensive preparation for students aspiring to enter medical school, including UCAT prep, interview coaching, and prerequisite subject tutoring.",
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
    audienceType: "Aspiring medical students and parents",
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
      name: "Medicine Pathway",
      item: `${BASE_URL}/programs/medicine`,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When should I start preparing for medicine?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ideally, start in Year 10 or 11 to build strong foundations in prerequisite subjects. UCAT preparation typically begins 3-6 months before the test, and interview prep should start once you receive an interview offer.",
      },
    },
    {
      "@type": "Question",
      name: "What ATAR do I need for medicine?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Medical school entry is highly competitive. Most successful applicants have ATARs above 95, though requirements vary by university. A strong UCAT score and interview performance are equally important.",
      },
    },
    {
      "@type": "Question",
      name: "Do your tutors have medical school experience?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our medicine pathway tutors are current medical students or recent graduates who have successfully navigated the application process. They understand exactly what it takes to gain admission.",
      },
    },
    {
      "@type": "Question",
      name: "How does UCAT preparation work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer structured UCAT preparation covering all four subtests: Verbal Reasoning, Decision Making, Quantitative Reasoning, and Situational Judgement. Sessions include strategy, practice questions, and timed mock tests.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer interview preparation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We provide MMI (Multiple Mini Interview) preparation with mock interviews, feedback, and coaching on common scenarios. Our tutors help you develop confident, authentic responses.",
      },
    },
  ],
};

/* ── What We Offer ──────────────────────────────────────────── */

const MEDICINE_SERVICES = [
  { name: "UCAT Preparation", description: "Comprehensive preparation for all four UCAT subtests with strategies and practice." },
  { name: "Interview Preparation", description: "In-person preparation with mock interviews and personalised feedback." },
  { name: "Pathway Consultations", description: "Speak to an expert about maximising your chances of getting into medicine nationwide." },
];

/* ── Page Component ────────────────────────────────────────── */

export default function MedicinePathwayPage() {
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
            <li className="font-semibold text-slate-700">Medicine Pathway</li>
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          {/* Hero */}
          <section className="py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              Our services
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Medicine Pathway Program
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Getting into medical school requires more than good grades. Our Medicine Pathway
              program provides comprehensive support — from UCAT preparation to interview coaching —
              guided by tutors who&apos;ve successfully navigated the journey themselves.
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
              Why choose Simple Tuition for medicine prep?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Tutors in medical school",
                  copy: "Our medicine pathway tutors are current medical students who have recently gone through the exact same process you're facing.",
                },
                {
                  title: "Proven UCAT strategies",
                  copy: "Learn the techniques and shortcuts that helped our tutors achieve top UCAT scores, tailored to your strengths and weaknesses.",
                },
                {
                  title: "Real interview experience",
                  copy: "Practice with tutors who have sat successful MMI interviews and know what assessors are looking for.",
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

          {/* What We Offer */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              What this program covers
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Everything you need to maximise your chances for medical school admission.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {MEDICINE_SERVICES.map((service) => (
                <div
                  key={service.name}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Our Approach */}
          <section className="border-t border-slate-100 py-16">
            <h2 className="text-3xl font-semibold text-slate-950">
              Our approach to medicine preparation
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Personalised study plans
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  We assess your starting point and create a tailored preparation timeline
                  that fits around your school commitments and targets your weak areas.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Realistic practice
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  From timed UCAT mock tests to full MMI simulations, we ensure you&apos;re
                  prepared for the real thing — not just the theory.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Insider knowledge
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  We share strategies and preparation frameworks from doctors who have sat on interview panels and from medical students who secured successful admission.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Holistic support
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Beyond test prep, we help with personal statements for various universities, understanding
                  different pathways, and managing the stress of the application process.
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
              Ready to start your medicine journey?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              Tell us where you are in your preparation. We&apos;ll match you with a tutor
              who can guide you through every step.
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
