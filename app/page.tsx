"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import localFont from "next/font/local";
import MotionInView from "../components/MotionInView";
import Section from "../components/Section";
import TutorCard from "../components/TutorCard";
import EnquiryForm from "../components/EnquiryForm";
import Icon from "../components/Icon";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import tutorsData from "../data/tutors.json";
import testimonialsData from "../data/testimonials.json";
import matchPreviewData from "../data/matchPreview.json";

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

const pepi = localFont({
  src: "./fonts/Pepi-SemiBold.otf",
  weight: "600",
  style: "normal",
});

type FocusKey = "sace" | "ucat" | "in_person" | "tailored";

export default function HomePage() {
  const tutors = tutorsData
    .filter((tutor) => tutor.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const testimonials = testimonialsData
    .filter((testimonial) => testimonial.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const shuffledTestimonials = useMemo(() => {
    const result = [...testimonials];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }, [testimonials.length]);
  const testimonialsLoop = [
    ...shuffledTestimonials,
    ...shuffledTestimonials,
  ];
  const testimonialsOffset = [
    ...shuffledTestimonials.slice(Math.ceil(shuffledTestimonials.length / 2)),
    ...shuffledTestimonials.slice(0, Math.ceil(shuffledTestimonials.length / 2)),
  ];
  const testimonialsOffsetLoop = [
    ...testimonialsOffset,
    ...testimonialsOffset,
  ];
  const focusAreas = matchPreviewData.focusAreas as Array<{
    key: FocusKey;
    label: string;
    desc: string;
    signals: string[];
    tutorSlugs: string[];
  }>;
  const [activeFocus, setActiveFocus] = useState<FocusKey>(
    focusAreas[0]?.key ?? "sace",
  );
  const [tutorIndex, setTutorIndex] = useState(0);
  const rotationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const focusConfig = useMemo(
    () => focusAreas.find((area) => area.key === activeFocus) ?? focusAreas[0],
    [activeFocus, focusAreas],
  );

  const filteredTutors = useMemo(() => {
    const tutorBySlug = new Map(
      tutors.map((tutor) => [tutor.slug, tutor]),
    );
    const configured = (focusConfig?.tutorSlugs ?? [])
      .map((slug) => tutorBySlug.get(slug))
      .filter(Boolean);
    return configured.length ? (configured as typeof tutors) : tutors;
  }, [focusConfig, tutors]);

  const activeTutor = filteredTutors[tutorIndex % filteredTutors.length];

  useEffect(() => {
    setTutorIndex(0);
  }, [activeFocus]);

  const startRotationTimer = useCallback(() => {
    if (!filteredTutors.length) return;
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    rotationTimerRef.current = setInterval(() => {
      setTutorIndex((index) => (index + 1) % filteredTutors.length);
    }, matchPreviewData.rotationMs ?? 3800);
  }, [filteredTutors.length]);

  useEffect(() => {
    startRotationTimer();
    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [startRotationTimer]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navCompact, setNavCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavCompact(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <header
        className={`sticky top-0 z-20 border-b border-slate-100 transition-all duration-300 ${
          navCompact ? "bg-white/80 backdrop-blur" : "bg-white/60"
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 transition-all duration-300 sm:px-10 ${
            navCompact ? "py-3" : "py-5"
          }`}
        >
          <Link
            href="/"
            className={`flex items-end gap-2 text-slate-950 ${pepi.className}`}
          >
            <span className="text-2xl font-bold tracking-widest">
              SIMPLE
            </span>
            <span className="ml-[-5px] mb-[0.18rem] text-sm font-semibold lowercase tracking-wide">
              tuition
            </span>
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
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:text-slate-900 md:hidden"
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
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-5 text-sm text-slate-700 sm:px-10">
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
        <section className="relative min-h-[80vh] overflow-hidden bg-slate-50 py-20 sm:py-28 lg:py-32">
          <div className="noise-overlay" aria-hidden="true" />
          <div className="hero-blob" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid w-full max-w-[1200px] gap-12 px-6 sm:px-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <MotionInView>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
                Private tutoring for Year 4-12
              </p>
              <h1 className="mt-6 text-[clamp(3rem,5vw,4rem)] font-semibold tracking-tight text-slate-950">
                Exceptional tutoring{" "}
                <span className="gradient-text">tailored to you</span>
              </h1>
              <p className="mt-6 text-base text-slate-600 sm:text-lg">
                Simple Tuition connects students with high-achievers for SACE
                subjects, UCAT, and  medicine interview preparation.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link href="#enquire" className="btn btn-lg">
                    Enquire now
                  </Link>
                </motion.div>
                <Link
                  href="#tutors"
                  className="btn-ghost"
                >
                  View tutors
                </Link>
              </div>
            </MotionInView>
            <MotionInView className="relative">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
                      Focus areas
                    </p>
                    <div className="mt-4 space-y-3">
                      {focusAreas.map((area) => {
                        const isActive = area.key === activeFocus;
                        return (
                          <button
                            key={area.key}
                            type="button"
                            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              isActive
                                ? "border-indigo-300 bg-white shadow-sm"
                                : "border-slate-200 bg-white/60 hover:bg-white"
                            }`}
                            onClick={() => {
                              setActiveFocus(area.key);
                              startRotationTimer();
                            }}
                            onMouseEnter={() => {
                              setActiveFocus(area.key);
                              startRotationTimer();
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-slate-900">
                                {area.label}
                              </span>
                              <span
                                className={`h-2 w-2 rounded-full transition ${
                                  isActive ? "bg-indigo-500" : "bg-slate-300"
                                }`}
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {area.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-xs text-slate-500">
                      Hover a focus area to preview a matching tutor.
                    </p>
                  </div>
                </div>
                <div className="relative lg:col-span-6">
                  <div className="pointer-events-none absolute -left-3 top-10 hidden h-40 w-1 rounded-full bg-linear-to-b from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 lg:block" />
                  <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-500">
                      <span>Match preview</span>
                      <span className="normal-case tracking-normal text-slate-500">
                        Taking students this week
                      </span>
                    </div>
                    <div className="mt-4 min-h-[220px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeFocus}-${activeTutor.slug}-${tutorIndex}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              <img
                                src={
                                  activeTutor.photoFile
                                    ? `/images/tutors/${activeTutor.photoFile}`
                                    : "/images/tutors/default.webp"
                                }
                                alt={activeTutor.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-slate-950">
                                {activeTutor.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {activeTutor.headline}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            {activeTutor.bioShort}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {activeTutor.stats.map((stat) => (
                              <span
                                key={`${activeTutor.slug}-${stat.label}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                              >
                                {stat.value} {stat.label}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-700">
                              Matching signals
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {(focusConfig?.signals ?? []).join(" • ")}
                            </p>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-700">
                              Subjects
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {activeTutor.subjects.slice(0, 5).join(" • ")}
                            </p>
                          </div>
                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link href="#enquire" className="btn">
                              Enquire now
                            </Link>
                            <Link href="#tutors" className="btn-ghost">
                              View tutors →
                            </Link>
                          </div>
                          <div className="mt-4">
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                              In-person Adelaide metro
                            </span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-12 -right-12 hidden h-40 w-40 rounded-full bg-indigo-200/60 blur-3xl lg:block" />
            </MotionInView>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto grid w-full max-w-[1200px] gap-6 px-6 sm:px-10 md:grid-cols-3">
            {proofPoints.map((point, index) => (
              <MotionInView key={point.title} delay={index * 0.08}>
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
                  }}
                  className="h-full rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <Icon name={point.icon} />
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">{point.copy}</p>
                </motion.div>
              </MotionInView>
            ))}
          </div>
        </section>

        <Section
          id="tutors"
          eyebrow="Tutors"
          title="Learn from the best"
          subtitle={
            <>
              A handpicked team who've been through the same systems. Our tutors
              are all{" "}
              <strong className="font-semibold text-slate-950">
                top 1% ATAR achievers
              </strong>
              , with many earning subject merits and ranking among the best in
              the state - helping them reach their dream degrees.
            </>
          }
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
          subtitle="Personalised support with outcomes that last."
        >
          <div className="space-y-6">
            <div className="carousel-row carousel-fade">
              <div className="carousel-track">
                {testimonialsLoop.map((testimonial, index) => (
                  <div
                    key={`${testimonial.name}-top-${index}`}
                    className="relative w-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                  >
                    <span className="pointer-events-none absolute -left-2 top-2 text-7xl font-bold text-slate-200/60">
                      “
                    </span>
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
                ))}
              </div>
            </div>
            <div className="carousel-row carousel-fade">
              <div
                className="carousel-track carousel-track-reverse"
                style={{ animationDelay: "-18s" }}
              >
                {testimonialsOffsetLoop.map((testimonial, index) => (
                  <div
                    key={`${testimonial.name}-bottom-${index}`}
                    className="relative w-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                  >
                    <span className="pointer-events-none absolute -left-2 top-2 text-7xl font-bold text-slate-200/60">
                      “
                    </span>
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
                ))}
              </div>
            </div>
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
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
                  }}
                  className="h-full rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <p className="text-7xl font-semibold text-indigo-500/20">
                    {step.step}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">{step.copy}</p>
                </motion.div>
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
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-8 left-6 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
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

      <footer className="relative border-t border-slate-100 bg-white py-12">
        <div className="noise-overlay" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p>© {new Date().getFullYear()} Simple Tuition. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
