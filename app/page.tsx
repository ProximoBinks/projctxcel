"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import MotionInView from "../components/MotionInView";
import Section from "../components/Section";
import TutorCard from "../components/TutorCard";
import EnquiryForm from "../components/EnquiryForm";
import Icon from "../components/Icon";
import {
  type MouseEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tutorsData from "../data/tutors.json";
import testimonialsData from "../data/testimonials.json";
import matchPreviewData from "../data/matchPreview.json";
import { useTranslation } from "../i18n/LanguageContext";

const serviceIcons = ["school", "book", "stethoscope"] as const;
const groupIcons = ["sparkle", "stethoscope"] as const;

const getSubjectStyle = (subject: string) => {
  const s = subject.toLowerCase();
  // Maths
  if (s === "general maths") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "maths methods") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "specialist maths") return "bg-indigo-100 text-indigo-800 border-indigo-200";
  // Sciences
  if (s === "biology") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "chemistry") return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === "physics") return "bg-violet-100 text-violet-700 border-violet-200";
  // English
  if (s === "english") return "bg-red-100 text-red-700 border-red-200";
  if (s === "english literature") return "bg-rose-100 text-rose-800 border-rose-200";
  if (s === "research project") return "bg-slate-100 text-slate-600 border-slate-200";
  // Business
  if (s === "accounting") return "bg-gray-200 text-gray-800 border-gray-300";
  // Medicine pathway
  if (s === "ucat") return "bg-pink-100 text-pink-700 border-pink-200";
  if (s === "interview prep") return "bg-amber-50 text-amber-700 border-amber-300";
  // Default
  return "border-slate-200 text-slate-600 bg-white";
};


type FocusKey = "sace" | "ucat" | "in_person" | "tailored";

export default function HomePage() {
  const { lang, toggleLang, t, tArray } = useTranslation();

  const services = tArray<{ title: string; copy: string }>("services.items");
  const groupPrograms = tArray<{ title: string; copy: string }>("services.groupItems");
  const howItWorksSteps = tArray<{ step: string; title: string; copy: string }>("howItWorks.steps");

  const tutors = tutorsData
    .filter((tutor) => tutor.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const testimonialsRowOne = (testimonialsData.rowOne ?? []).filter(
    (testimonial) => testimonial.active,
  );
  const testimonialsRowTwo = (testimonialsData.rowTwo ?? []).filter(
    (testimonial) => testimonial.active,
  );
  const testimonialsRowOneLoop = [
    ...testimonialsRowOne,
    ...testimonialsRowOne,
  ];
  const testimonialsRowTwoLoop = [
    ...testimonialsRowTwo,
    ...testimonialsRowTwo,
  ];

  const translatedTestimonialsRow1 = tArray<{ quote: string; context: string }>("testimonials.row1");
  const translatedTestimonialsRow2 = tArray<{ quote: string; context: string }>("testimonials.row2");

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
  const scrollToId = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }, []);
  const createScrollHandler = useCallback(
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      scrollToId(id);
    },
    [scrollToId]
  );

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

  const getFocusLabel = (key: string) => {
    const translated = t(`focusAreas.${key}.label`);
    if (translated !== `focusAreas.${key}.label`) return translated;
    return focusAreas.find((a) => a.key === key)?.label ?? key;
  };
  const getFocusDesc = (key: string) => {
    const translated = t(`focusAreas.${key}.desc`);
    if (translated !== `focusAreas.${key}.desc`) return translated;
    return focusAreas.find((a) => a.key === key)?.desc ?? key;
  };
  const getFocusSignals = (key: string) => {
    const translated = tArray<string>(`focusAreas.${key}.signals`);
    if (translated.length > 0) return translated;
    return focusAreas.find((a) => a.key === key)?.signals ?? [];
  };

  const getDisplayBio = (slug: string, fallback: string) => {
    const translated = t(`tutorBios.${slug}`);
    return translated !== `tutorBios.${slug}` ? translated : fallback;
  };

  const getDisplayStatLabel = (label: string) => {
    const translated = t(`statLabels.${label}`);
    return translated !== `statLabels.${label}` ? translated : label;
  };

  const expectItems = tArray<string>("enquireSection.expectItems");

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
          <Link href="/">
            <img
              src="/images/simple-text-black.svg"
              alt="Simple Tuition"
              className="h-[60px]"
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <Link href="#tutors" onClick={createScrollHandler("tutors")}>
              {t("nav.tutors")}
            </Link>
            <Link
              href="#testimonials"
              onClick={createScrollHandler("testimonials")}
            >
              {t("nav.testimonials")}
            </Link>
            <Link
              href="#how-it-works"
              onClick={createScrollHandler("how-it-works")}
            >
              {t("nav.howItWorks")}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {lang === "en" ? "中文" : "EN"}
            </button>
            <Link
              href="#enquire"
              className="btn"
              onClick={createScrollHandler("enquire")}
            >
              {t("nav.enquire")}
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
              <Link
                href="#tutors"
                onClick={(event) => {
                  createScrollHandler("tutors")(event);
                  setMenuOpen(false);
                }}
              >
                {t("nav.tutors")}
              </Link>
              <Link
                href="#testimonials"
                onClick={(event) => {
                  createScrollHandler("testimonials")(event);
                  setMenuOpen(false);
                }}
              >
                {t("nav.testimonials")}
              </Link>
              <Link
                href="#how-it-works"
                onClick={(event) => {
                  createScrollHandler("how-it-works")(event);
                  setMenuOpen(false);
                }}
              >
                {t("nav.howItWorks")}
              </Link>
              <button
                type="button"
                onClick={toggleLang}
                className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                {lang === "en" ? "中" : "EN"}
              </button>
              <Link
                href="#enquire"
                className="btn w-full justify-center"
                onClick={(event) => {
                  createScrollHandler("enquire")(event);
                  setMenuOpen(false);
                }}
              >
                {t("nav.enquire")}
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
                {t("hero.eyebrow")}
              </p>
              <h1 className="mt-6 text-[clamp(3rem,5vw,4rem)] font-semibold tracking-tight text-slate-950">
                {t("hero.title")}{" "}
                <span className="gradient-text">{t("hero.titleAccent")}</span>
              </h1>
              <p className="mt-6 text-base text-slate-600 sm:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="#enquire"
                    className="btn btn-lg"
                    onClick={createScrollHandler("enquire")}
                  >
                    {t("hero.cta")}
                  </Link>
                </motion.div>
                <Link
                  href="#tutors"
                  className="btn-ghost"
                  onClick={createScrollHandler("tutors")}
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
            </MotionInView>
            <MotionInView className="relative">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div className="h-full rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
                      {t("hero.focusAreasLabel")}
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
                                {getFocusLabel(area.key)}
                              </span>
                              <span
                                className={`h-2 w-2 rounded-full transition ${
                                  isActive ? "bg-indigo-500" : "bg-slate-300"
                                }`}
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {getFocusDesc(area.key)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-xs text-slate-500">
                      {t("hero.focusAreasHint")}
                    </p>
                  </div>
                </div>
                <div className="relative lg:col-span-6">
                  <div className="pointer-events-none absolute -left-3 top-10 hidden h-40 w-1 rounded-full bg-linear-to-b from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 lg:block" />
                  <div className="h-full rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-500">
                      <span>{t("hero.matchPreview")}</span>
                      <span className="normal-case tracking-normal text-slate-500">
                        {t("hero.takingStudents")}
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
                                onError={(event) => {
                                  if (
                                    event.currentTarget.src.includes("/images/tutors/default.webp")
                                  ) {
                                    return;
                                  }
                                  event.currentTarget.src = "/images/tutors/default.webp";
                                }}
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
                            {getDisplayBio(activeTutor.slug, activeTutor.bioShort)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {activeTutor.stats.map((stat) => (
                              <span
                                key={`${activeTutor.slug}-${stat.label}`}
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {stat.value} {getDisplayStatLabel(stat.label)}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-700">
                              {t("hero.matchingSignals")}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {getFocusSignals(activeFocus).join(" • ")}
                            </p>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-700">
                              {t("hero.subjects")}
                            </p>
                            <div className="mt-2 flex gap-1.5 overflow-hidden">
                              {activeTutor.subjects.slice(0, 4).map((subject) => (
                                <span
                                  key={`${activeTutor.slug}-subject-${subject}`}
                                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSubjectStyle(subject)}`}
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link
                              href="#enquire"
                              className="btn"
                              onClick={createScrollHandler("enquire")}
                            >
                              {t("hero.enquireNow")}
                            </Link>
                            <Link
                              href="#tutors"
                              className="btn-ghost"
                              onClick={createScrollHandler("tutors")}
                            >
                              {t("hero.viewTutors")}
                            </Link>
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

        <Section
          id="services"
          eyebrow={t("services.eyebrow")}
          title={t("services.title")}
          subtitle={t("services.subtitle")}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service, index) => (
              <MotionInView key={service.title} delay={index * 0.08}>
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
                  }}
                  className="h-full min-h-[220px] rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm"
                >
                  <Icon name={serviceIcons[index] ?? "school"} />
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-base text-slate-600">{service.copy}</p>
                </motion.div>
              </MotionInView>
            ))}
          </div>
          <div className="mt-16">
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("services.groupTitle")}</h3>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">{t("services.groupSubtitle")}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {groupPrograms.map((item, index) => (
              <MotionInView key={item.title} delay={index * 0.08}>
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
                  }}
                  className="h-full min-h-[240px] rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm"
                >
                  <Icon name={groupIcons[index] ?? "sparkle"} />
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base text-slate-600">{item.copy}</p>
                </motion.div>
              </MotionInView>
            ))}
          </div>
        </Section>

        <Section
          id="tutors"
          eyebrow={t("tutorsSection.eyebrow")}
          title={t("tutorsSection.title")}
          subtitle={
            <>
              {t("tutorsSection.subtitle")}{" "}
              <strong className="font-semibold text-slate-950">
                {t("tutorsSection.subtitleBold")}
              </strong>
              {t("tutorsSection.subtitleEnd")}
            </>
          }
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.slug} tutor={tutor} />
            ))}
          </div>
          <p className="mt-10 text-sm text-slate-500">
            {t("tutorsSection.missingSubject")}{" "}
            <Link
              href="#enquire"
              className="text-indigo-600 underline"
              onClick={createScrollHandler("enquire")}
            >
              {t("tutorsSection.signupForm")}
            </Link>{" "}
            {t("tutorsSection.missingSubjectEnd")}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {t("tutorsSection.wwcc")}
          </p>
        </Section>

        <Section
          id="testimonials"
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
          subtitle={t("testimonials.subtitle")}
        >
          <div className="space-y-6">
            <div className="carousel-row carousel-fade">
              <div className="carousel-track">
                {testimonialsRowOneLoop.map((testimonial, index) => {
                  const realIndex = index % testimonialsRowOne.length;
                  const translated = translatedTestimonialsRow1[realIndex];
                  return (
                    <div
                      key={`${testimonial.name}-top-${index}`}
                      className="relative w-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                    >
                      <span className="pointer-events-none absolute -left-2 top-2 text-7xl font-bold text-slate-200/60">
                        &ldquo;
                      </span>
                      <Icon name="quote" />
                      <p className="mt-4 text-sm text-slate-600">
                        &ldquo;{translated?.quote ?? testimonial.quote}&rdquo;
                      </p>
                      <div className="mt-6 text-sm font-semibold text-slate-950">
                        {testimonial.name}
                      </div>
                      {(translated?.context ?? testimonial.context) ? (
                        <p className="text-xs text-slate-500">
                          {translated?.context ?? testimonial.context}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="carousel-row carousel-fade">
              <div
                className="carousel-track carousel-track-reverse"
                style={{ animationDelay: "-18s" }}
              >
                {testimonialsRowTwoLoop.map((testimonial, index) => {
                  const realIndex = index % testimonialsRowTwo.length;
                  const translated = translatedTestimonialsRow2[realIndex];
                  return (
                    <div
                      key={`${testimonial.name}-bottom-${index}`}
                      className="relative w-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                    >
                      <span className="pointer-events-none absolute -left-2 top-2 text-7xl font-bold text-slate-200/60">
                        &ldquo;
                      </span>
                      <Icon name="quote" />
                      <p className="mt-4 text-sm text-slate-600">
                        &ldquo;{translated?.quote ?? testimonial.quote}&rdquo;
                      </p>
                      <div className="mt-6 text-sm font-semibold text-slate-950">
                        {testimonial.name}
                      </div>
                      {(translated?.context ?? testimonial.context) ? (
                        <p className="text-xs text-slate-500">
                          {translated?.context ?? testimonial.context}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="how-it-works"
          eyebrow={t("howItWorks.eyebrow")}
          title={t("howItWorks.title")}
          subtitle={t("howItWorks.subtitle")}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
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
          anchorId="enquire"
          eyebrow={t("enquireSection.eyebrow")}
          title={t("enquireSection.title")}
          subtitle={t("enquireSection.subtitle")}
          className="bg-slate-50"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr] lg:items-start">
            <MotionInView>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-8 left-6 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
                <h3 className="text-xl font-semibold text-slate-950">
                  {t("enquireSection.whatToExpect")}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {expectItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
                  {t("enquireSection.pricingNote")}
                </div>
              </div>
            </MotionInView>
            <MotionInView>
              <Suspense
                fallback={
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-sm text-slate-600">
                      {t("enquireSection.loading")}
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
          <p>© {new Date().getFullYear()} Simple Tuition. {t("footer.rights")}</p>
          <div className="flex gap-6">
            <Link href="/privacy">{t("footer.privacy")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
