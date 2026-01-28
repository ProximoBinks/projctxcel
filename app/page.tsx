"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MotionInView from "../components/MotionInView";
import Section from "../components/Section";
import TutorCard from "../components/TutorCard";
import EnquiryForm from "../components/EnquiryForm";
import Icon from "../components/Icon";
import { Suspense, useState } from "react";
import tutorsData from "../data/tutors.json";
import testimonialsData from "../data/testimonials.json";

const proofPoints = [
  {
    icon: "sparkle",
    title: "Built for SACE outcomes",
    copy: "Specialists across all SACE subjects plus UCAT and interview prep.",
  },
  {
    icon: "users",
    title: "In-person, logistics handled",
    copy: "Tutors coordinate sessions directly, keeping it seamless for families.",
  },
  {
    icon: "check",
    title: "Reception to Year 12",
    copy: "Support across every stage of schooling, with tailored mentoring.",
  },
] as const;

const howItWorks = [
  {
    step: "01",
    title: "Tell us what you need",
    copy: "Share year level, subjects, and goals. We'll tailor the match.",
  },
  {
    step: "02",
    title: "Meet your tutor",
    copy: "We connect you with the right expert for learning style and subject.",
  },
  {
    step: "03",
    title: "Start progressing fast",
    copy: "Sessions start with a plan, clear milestones, and feedback loops.",
  },
];

export default function HomePage() {
  const tutors = tutorsData
    .filter((tutor) => tutor.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const testimonials = testimonialsData
    .filter((testimonial) => testimonial.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            projctxcel
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <Link href="#tutors">Tutors</Link>
            <Link href="#testimonials">Testimonials</Link>
            <Link href="#how-it-works">How it works</Link>
            <Link href="#enquire" className="btn">
              Enquire
            </Link>
          </nav>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-900 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path
                d="M3 6.5h18M3 12h18M3 17.5h18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-slate-100 bg-white md:hidden">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 text-sm text-slate-700 sm:px-10">
              <Link href="#tutors" onClick={() => setMenuOpen(false)}>
                Tutors
              </Link>
              <Link href="#testimonials" onClick={() => setMenuOpen(false)}>
                Testimonials
              </Link>
              <Link href="#how-it-works" onClick={() => setMenuOpen(false)}>
                How it works
              </Link>
              <Link
                href="#enquire"
                className="btn w-full justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Enquire
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 sm:px-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <MotionInView>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
                Premium tutoring
              </p>
              <h1 className="mt-6 text-slate-950">
                Exceptional tutoring{" "}
                <span className="gradient-text">tailored to you</span>
              </h1>
              <p className="mt-6 text-base text-slate-600 sm:text-lg">
                projctxcel pairs families with exceptional tutors for all SACE
                subjects, UCAT, and interview preparation. No IB. In-person
                sessions with tutors who handle logistics.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Pricing varies by tutor experience and subject. Enquire for a
                quote.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link href="#enquire" className="btn btn-lg">
                    Enquire now
                  </Link>
                </motion.div>
                <Link
                  href="#tutors"
                  className="text-sm font-semibold text-slate-700"
                >
                  View tutors
                </Link>
              </div>
            </MotionInView>
            <MotionInView className="relative">
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
                  Focus areas
                </p>
                <div className="mt-6 grid gap-4">
                  {[
                    "SACE Stage 1 & 2 coverage",
                    "UCAT + interview coaching",
                    "In-person, Adelaide metro",
                    "Tailored learning plans",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-10 -right-12 hidden h-40 w-40 rounded-full bg-indigo-100 blur-3xl lg:block" />
            </MotionInView>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 sm:px-10 md:grid-cols-3">
            {proofPoints.map((point, index) => (
              <MotionInView key={point.title} delay={index * 0.08}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <Icon name={point.icon} />
                  <h3 className="text-lg font-semibold text-slate-950">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">{point.copy}</p>
                </div>
              </MotionInView>
            ))}
          </div>
        </section>

        <Section
          id="tutors"
          eyebrow="Tutors"
          title="Meet the tutors shaping results"
          subtitle="A handpicked team spanning maths, sciences, humanities, UCAT, and interview preparation."
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.slug} tutor={tutor} />
            ))}
          </div>
        </Section>

        <Section
          id="testimonials"
          eyebrow="Testimonials"
          title="Trusted by students and parents"
          subtitle="Personalised tutoring with measurable progress."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <MotionInView
                key={`${testimonial.name}-${index}`}
                delay={index * 0.08}
              >
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <Icon name="quote" />
                  <p className="mt-4 text-sm text-slate-600">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-6 text-sm font-semibold text-slate-950">
                    {testimonial.name}
                  </div>
                  {testimonial.context ? (
                    <p className="text-xs text-slate-500">
                      {testimonial.context}
                    </p>
                  ) : null}
                </div>
              </MotionInView>
            ))}
          </div>
        </Section>

        <Section
          id="how-it-works"
          eyebrow="How it works"
          title="A clear, premium process"
          subtitle="Designed to keep students focused and parents informed."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {howItWorks.map((step, index) => (
              <MotionInView key={step.title} delay={index * 0.08}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    {step.step}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">{step.copy}</p>
                </div>
              </MotionInView>
            ))}
          </div>
        </Section>

        <Section
          id="enquire"
          eyebrow="Enquire"
          title="Tell us what your student needs"
          subtitle="We will respond with a recommended tutor and availability."
          className="bg-slate-50"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr] lg:items-start">
            <MotionInView>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-xl font-semibold text-slate-950">
                  What to expect
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>We reply within 1 business day.</li>
                  <li>We match based on subject fit and learning style.</li>
                  <li>Sessions are in-person across Adelaide metro.</li>
                </ul>
                <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
                  Pricing varies by tutor experience and subject. Enquire for a
                  quote.
                </div>
              </div>
            </MotionInView>
            <MotionInView>
              <Suspense
                fallback={
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-sm text-slate-600">
                      Loading enquiry form...
                    </p>
                  </div>
                }
              >
                <EnquiryForm />
              </Suspense>
            </MotionInView>
          </div>
        </Section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p>© {new Date().getFullYear()} projctxcel. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
