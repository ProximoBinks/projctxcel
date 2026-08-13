"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpenText,
  ChalkboardTeacher,
  ChartLineUp,
  ChatsCircle,
  Desktop,
  Stethoscope,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import MotionInView from "../components/MotionInView";
import Section from "../components/Section";
import TutorCard from "../components/TutorCard";
import EnquiryForm from "../components/EnquiryForm";
import Icon from "../components/Icon";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  type MouseEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import tutorsData from "../data/tutors.json";
import testimonialsData from "../data/testimonials.json";
import { useTranslation } from "../i18n/LanguageContext";

const serviceIcons: readonly PhosphorIcon[] = [
  ChartLineUp,
  BookOpenText,
  Stethoscope,
];
const serviceLinks = ["/programs/accelerate", "/programs/sace", "/programs/medicine"];
const groupIcons: readonly PhosphorIcon[] = [
  ChalkboardTeacher,
  Desktop,
  ChatsCircle,
];
const groupLinks = ["/programs/classes", "/programs/ucat", "/interview"];

const CAREER_ROTATE_MS = 2600;

function ServiceCardIcon({ icon: IconGraphic }: { icon: PhosphorIcon }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#2455C2]">
      <IconGraphic aria-hidden="true" size={24} weight="duotone" />
    </span>
  );
}

/**
 * The career word in the headline, cycling on a timer.
 *
 * An invisible copy of the longest word reserves the width, so the headline
 * never reflows as the word changes. The outgoing word slides left while the
 * incoming word enters from the right.
 */
function RotatingCareer({
  words,
  reduced,
}: {
  words: string[];
  reduced: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      CAREER_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [words.length]);

  if (words.length === 0) return null;

  const current = words[index % words.length];
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className="relative -mx-[0.08em] inline-grid overflow-visible px-[0.08em] pb-[0.22em] align-baseline leading-[1.15]">
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 whitespace-nowrap"
      >
        {widest}
      </span>
      {/* Read once by screen readers; the animated copy is hidden from them so
          the rotation is never announced repeatedly. */}
      <span className="sr-only">{words[0]}</span>
      <AnimatePresence mode="sync" initial={false}>
        <motion.span
          key={current}
          aria-hidden="true"
          className="gradient-text col-start-1 row-start-1 whitespace-nowrap"
          initial={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, x: "0.7em", filter: "blur(6px)" }
          }
          animate={
            reduced
              ? { opacity: 1 }
              : { opacity: 1, x: "0em", filter: "blur(0px)" }
          }
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, x: "-0.7em", filter: "blur(6px)" }
          }
          transition={{
            duration: reduced ? 0.2 : 0.46,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}



export default function HomePage() {
  const { t, tArray } = useTranslation();

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

  const careers = tArray<string>("hero.careers");

  const prefersReducedMotion = useReducedMotion();
  const heroFade = useMemo(
    () =>
      prefersReducedMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
        : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
    [prefersReducedMotion],
  );

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

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero: the headline carries the page. One proof row beneath it, built
            from the real roster, replaces the old interactive match panel. */}
        {/* Fills the viewport below the sticky header, so the next section only
            appears once you actually scroll. `svh` rather than `vh` so mobile
            browser chrome doesn't push the fold off-screen. */}
        <section className="relative flex min-h-[calc(100svh-var(--header-h))] items-center bg-white py-14 [--header-h:7rem] sm:py-18">
        <div className="relative z-10 mx-auto w-full max-w-[1120px] -translate-y-8 px-6 text-center sm:-translate-y-16 sm:px-10">
            <motion.h1
              initial={heroFade.initial}
              animate={heroFade.animate}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-[clamp(2.75rem,7vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-slate-950"
            >
              <span className="block">{t("hero.title")}</span>
              <span className="block">
                {t("hero.tailoredPrefix")}
                <RotatingCareer
                  words={careers}
                  reduced={Boolean(prefersReducedMotion)}
                />
                {t("hero.tailoredSuffix")}
              </span>
            </motion.h1>

            <motion.p
              initial={heroFade.initial}
              animate={heroFade.animate}
              transition={{ duration: 0.6, delay: 0.14 }}
              className="mx-auto mt-4 max-w-[38rem] text-base leading-relaxed text-slate-600 sm:text-lg"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              initial={heroFade.initial}
              animate={heroFade.animate}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="mt-11 flex flex-wrap items-center justify-center gap-4"
            >
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
            </motion.div>
          </div>
        </section>

        <section id="services" className="scroll-mt-16 bg-white pb-10 pt-6 sm:pb-16 sm:pt-10">
          <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-6">
            <div className="rounded-[2rem] bg-[#2455C2] px-6 py-8 sm:rounded-[3rem] sm:px-12 sm:py-12 lg:px-14">
              <div className="mx-auto w-full max-w-[1280px]">
                <MotionInView>
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                    {t("services.title")}
                  </h2>
                  <p className="mt-3 max-w-4xl text-base text-blue-50/85 sm:text-lg">
                    {t("services.subtitle")}
                  </p>
                </MotionInView>

                <div className="mt-6 grid gap-5 md:grid-cols-3 lg:gap-7">
                  {services.map((service, index) => (
                    <MotionInView
                      key={service.title}
                      className="h-full"
                      delay={index * 0.08}
                    >
                      <Link
                        href={serviceLinks[index] ?? "/programs"}
                        className="block h-full rounded-[1.4rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        <motion.div
                          whileHover={{
                            y: -5,
                            boxShadow: "0 22px 45px rgba(10,33,89,0.18)",
                          }}
                          className="h-full min-h-[200px] rounded-[1.4rem] border border-white/70 bg-[#F7FAFF] p-6 shadow-[0_12px_28px_rgba(10,33,89,0.1)] transition-colors hover:border-blue-200 sm:p-7"
                        >
                          <ServiceCardIcon
                            icon={serviceIcons[index] ?? ChartLineUp}
                          />
                          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                            {service.title}
                          </h3>
                          <p className="mt-3 text-base leading-relaxed text-slate-600">
                            {service.copy}
                          </p>
                        </motion.div>
                      </Link>
                    </MotionInView>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[2rem] bg-[#EDF4FF] px-6 py-8 sm:mt-5 sm:rounded-[3rem] sm:px-12 sm:py-12 lg:px-14">
              <div className="mx-auto w-full max-w-[1280px]">
                <MotionInView>
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
                    {t("services.groupTitle")}
                  </h3>
                  <p className="mt-3 max-w-4xl text-base text-slate-600 sm:text-lg">
                    {t("services.groupSubtitle")}
                  </p>
                </MotionInView>

                <div className="mt-6 grid gap-5 md:grid-cols-3 lg:gap-7">
                  {groupPrograms.map((item, index) => (
                    <MotionInView
                      key={item.title}
                      className="h-full"
                      delay={index * 0.08}
                    >
                      <Link
                        href={groupLinks[index] ?? "/programs"}
                        className="block h-full rounded-[1.4rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2455C2]"
                      >
                        <motion.div
                          whileHover={{
                            y: -5,
                            boxShadow: "0 22px 45px rgba(35,66,130,0.12)",
                          }}
                          className="h-full min-h-[190px] rounded-[1.4rem] border border-blue-200/80 bg-white/90 p-6 shadow-[0_10px_24px_rgba(35,66,130,0.07)] transition-colors sm:p-7"
                        >
                          <ServiceCardIcon
                            icon={groupIcons[index] ?? ChalkboardTeacher}
                          />
                          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-3 text-base leading-relaxed text-slate-600">
                            {item.copy}
                          </p>
                        </motion.div>
                      </Link>
                    </MotionInView>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section
          id="tutors"
          className="bg-slate-50"
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
              className="text-blue-600 underline"
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
                      className="relative flex h-[220px] w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                    >
                      <Icon name="quote" className="bg-[#e6edff] text-[#1232c3]" />
                      <p className="mt-4 flex-1 text-sm text-slate-600">
                        {translated?.quote ?? testimonial.quote}
                      </p>
                      <div className="mt-auto pt-4">
                        <div className="text-sm font-semibold text-slate-950">
                          {testimonial.name}
                        </div>
                        {(translated?.context ?? testimonial.context) ? (
                          <p className="text-xs text-slate-500">
                            {translated?.context ?? testimonial.context}
                          </p>
                        ) : null}
                      </div>
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
                      className="relative flex h-[220px] w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
                    >
                      <Icon name="quote" className="bg-[#e6edff] text-[#1232c3]" />
                      <p className="mt-4 flex-1 text-sm text-slate-600">
                        {translated?.quote ?? testimonial.quote}
                      </p>
                      <div className="mt-auto pt-4">
                        <div className="text-sm font-semibold text-slate-950">
                          {testimonial.name}
                        </div>
                        {(translated?.context ?? testimonial.context) ? (
                          <p className="text-xs text-slate-500">
                            {translated?.context ?? testimonial.context}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="how-it-works"
          className="bg-slate-50"
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
                  <p className="text-7xl font-semibold text-blue-500/20">
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
          subtitle={
            <>
              {t("enquireSection.subtitle")}{" "}
              {t("enquireSection.contactLinePrefix")}{" "}
              <a
                href="mailto:admin@simpletuition.com.au"
                className="font-semibold underline decoration-current/30 underline-offset-2 transition hover:decoration-current"
              >
                admin@simpletuition.com.au
              </a>
            </>
          }
        >
          <div className="w-full">
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

      <Footer />
    </div>
  );
}
