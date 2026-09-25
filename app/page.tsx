"use client";

import Link from "next/link";
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
import DeferredEnquiryForm from "../components/DeferredEnquiryForm";
import Icon from "../components/Icon";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import tutorsData from "../data/tutors.json";
import testimonialsData from "../data/testimonials.json";
import { useTranslation } from "../i18n/LanguageContext";
import { keepLastWordsTogether } from "../lib/typography";

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
 * The word leads the headline's last line, so its width is free to change: the
 * line re-centres on each swap, which happens while the word is faded out. The
 * outgoing word slides left while the incoming word enters from the right.
 */
function RotatingCareer({
  words,
}: {
  words: string[];
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;
    let transitionId: number | undefined;
    const id = setInterval(() => {
      setVisible(false);
      transitionId = window.setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 220);
    }, CAREER_ROTATE_MS);
    return () => {
      clearInterval(id);
      if (transitionId !== undefined) clearTimeout(transitionId);
    };
  }, [words.length]);

  if (words.length === 0) return null;

  const current = words[index % words.length];

  return (
    <span className="relative -mx-[0.08em] inline-grid overflow-visible px-[0.08em] pb-[0.22em] align-baseline leading-[1.15]">
      {/* Read once by screen readers; the animated copy is hidden from them so
          the rotation is never announced repeatedly. */}
      <span className="sr-only">{words[0]}</span>
      <span
        aria-hidden="true"
        className={`gradient-text col-start-1 row-start-1 whitespace-nowrap transition duration-300 ease-out motion-reduce:transition-none ${
          visible ? "translate-x-0 opacity-100 blur-0" : "-translate-x-3 opacity-0 blur-sm"
        }`}
      >
        {current}
      </span>
    </span>
  );
}



/**
 * A programs-card subtitle that sits on exactly two lines at every width.
 * Must render inside an `@container`: sizes are fractions of its width.
 *
 * The "\n" in the copy is the break from `sm` up, where each line is its own
 * unbreakable block. On phones the lines run together and balance into two.
 * Each fit is the widest line in em (Inter, with a little slack) for that
 * layout, so the text keeps its normal size (16px phones, 18px up) and only
 * shrinks when that line wouldn't otherwise fit the card. Copy without a "\n"
 * (zh) wraps normally.
 */
function TwoLineSubtitle({
  text,
  phoneFitEm,
  wideFitEm,
  className,
}: {
  text: string;
  phoneFitEm: number;
  wideFitEm: number;
  className: string;
}) {
  const lines = text.split("\n");
  if (lines.length === 1) {
    return <p className={`${className} text-base sm:text-lg`}>{text}</p>;
  }
  return (
    <p
      className={`${className} text-[length:min(1rem,calc(100cqw/var(--phone-fit)))] text-balance sm:text-[length:min(1.125rem,calc(100cqw/var(--wide-fit)))]`}
      style={
        {
          "--phone-fit": phoneFitEm,
          "--wide-fit": wideFitEm,
        } as CSSProperties
      }
    >
      {lines.map((line, index) => (
        <span key={line} className="sm:block sm:whitespace-nowrap">
          {index > 0 ? " " : null}
          {line}
        </span>
      ))}
    </p>
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
  const subtitleLines = t("hero.subtitle").split("\n");

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

      <main className="tidy-wrap">
        {/* Hero: the headline carries the page. One proof row beneath it, built
            from the real roster, replaces the old interactive match panel. */}
        {/* Fills the viewport below the sticky header, so the next section only
            appears once you actually scroll. `svh` rather than `vh` so mobile
            browser chrome doesn't push the fold off-screen. */}
        <section className="relative flex min-h-[calc(100svh-var(--header-h))] items-center bg-white py-14 [--header-h:5.75rem] sm:[--header-h:7rem] sm:py-18">
        <div className="relative z-10 mx-auto w-full max-w-[1120px] -translate-y-8 px-6 text-center sm:-translate-y-16 sm:px-10">
            {/* Three lines at every width, with the career word always leading
                the last one. The size tracks viewport width so the lines keep
                the same proportions from a small phone up to the desktop cap.
                On phones "Exceptional tutoring" (8.4–8.7em in Inter, widest small)
                fills the whole text column, gutter to gutter, so the headline
                dominates. */}
            <h1
              className="hero-enter mx-auto max-w-4xl text-[calc((100vw-3rem)/8.7)] font-semibold leading-[1.02] tracking-[-0.035em] text-slate-950 sm:text-[min(9vw,5.25rem)]"
            >
              <span className="block">{t("hero.title")}</span>
              <span className="block">{t("hero.tailoredPrefix")}</span>
              <span className="block">
                <RotatingCareer words={careers} />
                {t("hero.tailoredSuffix")}
              </span>
            </h1>

            {/* Copy with line breaks (en) keeps exactly those breaks on every
                phone: each line is unbreakable, and below ~400px the size
                shrinks so the longest line (21.9em in Inter) still fits the
                gutters. From sm up the lines run inline as one paragraph, with
                a space restored unless the line ended on a hyphen. Copy without
                breaks (zh) wraps normally. */}
            <p
              className={`hero-enter hero-enter-delay-1 mx-auto mt-4 max-w-[38rem] leading-relaxed text-slate-600 sm:text-lg ${
                subtitleLines.length > 1
                  ? "text-[min(1rem,calc((100vw-3rem)/22.3))]"
                  : "text-base"
              }`}
            >
              {subtitleLines.length > 1
                ? subtitleLines.map((line, index) => (
                    <span
                      key={line}
                      className="block whitespace-nowrap sm:inline sm:whitespace-normal"
                    >
                      {index > 0 && !subtitleLines[index - 1].endsWith("-")
                        ? " "
                        : null}
                      {line}
                    </span>
                  ))
                : subtitleLines[0]}
            </p>

            <div
              className="hero-enter hero-enter-delay-2 mt-11 flex flex-wrap items-center justify-center gap-4"
            >
              <div className="transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
                <Link
                  href="#enquire"
                  className="btn btn-lg"
                  onClick={createScrollHandler("enquire")}
                >
                  {t("hero.cta")}
                </Link>
              </div>
              <Link
                href="#tutors"
                className="btn-ghost"
                onClick={createScrollHandler("tutors")}
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-28 flex min-h-[calc(100svh-var(--header-h))] flex-col justify-center bg-white py-6 [--header-h:5.75rem] sm:[--header-h:7rem] sm:py-10"
        >
          <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-3 sm:px-6">
            <div className="flex flex-1 flex-col justify-center rounded-[2rem] bg-[#2455C2] px-6 py-8 sm:rounded-[3rem] sm:px-12 sm:py-12 lg:px-14">
              <div className="mx-auto w-full max-w-[1280px]">
                <MotionInView className="@container">
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                    {t("services.title")}
                  </h2>
                  {/* Phones balance to "…medical school / admissions. …"
                      (24.2em); wider screens break at the full stop, where
                      the first sentence is 30em. */}
                  <TwoLineSubtitle
                    text={t("services.subtitle")}
                    phoneFitEm={24.6}
                    wideFitEm={30.4}
                    className="mt-3 max-w-4xl text-blue-50/85"
                  />
                </MotionInView>

                <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:gap-7">
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
                        <div
                          className="h-full min-h-[200px] rounded-[1.4rem] border border-white/70 bg-[#F7FAFF] p-6 shadow-[0_12px_28px_rgba(10,33,89,0.1)] transition duration-300 hover:-translate-y-[5px] hover:border-blue-200 hover:shadow-[0_22px_45px_rgba(10,33,89,0.18)] sm:p-7"
                        >
                          <ServiceCardIcon
                            icon={serviceIcons[index] ?? ChartLineUp}
                          />
                          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                            {service.title}
                          </h3>
                          <p className="mt-3 text-base leading-relaxed text-slate-600">
                            {keepLastWordsTogether(service.copy)}
                          </p>
                        </div>
                      </Link>
                    </MotionInView>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-1 flex-col justify-center rounded-[2rem] bg-[#EDF4FF] px-6 py-8 sm:mt-5 sm:rounded-[3rem] sm:px-12 sm:py-12 lg:px-14">
              <div className="mx-auto w-full max-w-[1280px]">
                <MotionInView className="@container">
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
                    {t("services.groupTitle")}
                  </h3>
                  {/* Phones balance to the same break as wider screens; the
                      longer line is 22.8em. */}
                  <TwoLineSubtitle
                    text={t("services.groupSubtitle")}
                    phoneFitEm={23.2}
                    wideFitEm={23.2}
                    className="mt-3 max-w-4xl text-slate-600"
                  />
                </MotionInView>

                <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:gap-7">
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
                        <div
                          className="h-full min-h-[190px] rounded-[1.4rem] border border-blue-200/80 bg-white/90 p-6 shadow-[0_10px_24px_rgba(35,66,130,0.07)] transition duration-300 hover:-translate-y-[5px] hover:shadow-[0_22px_45px_rgba(35,66,130,0.12)] sm:p-7"
                        >
                          <ServiceCardIcon
                            icon={groupIcons[index] ?? ChalkboardTeacher}
                          />
                          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-3 text-base leading-relaxed text-slate-600">
                            {keepLastWordsTogether(item.copy)}
                          </p>
                        </div>
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
          subtitleClassName="text-justify"
          subtitle={
            <>
              {t("tutorsSection.subtitle")}{" "}
              <strong className="font-semibold text-slate-950">
                {t("tutorsSection.subtitleBold")}
              </strong>
              {keepLastWordsTogether(t("tutorsSection.subtitleEnd"))}
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
            {keepLastWordsTogether(t("tutorsSection.missingSubjectEnd"))}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {t("tutorsSection.wwcc")}
          </p>
        </Section>

        <Section
          id="testimonials"
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
          subtitle={keepLastWordsTogether(t("testimonials.subtitle"))}
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
                        {keepLastWordsTogether(translated?.quote ?? testimonial.quote)}
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
                        {keepLastWordsTogether(translated?.quote ?? testimonial.quote)}
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
          subtitle={keepLastWordsTogether(t("howItWorks.subtitle"))}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
              <MotionInView key={step.title} delay={index * 0.08}>
                <div
                  className="h-full rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-7xl font-semibold text-blue-500/20">
                    {step.step}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">
                    {keepLastWordsTogether(step.copy)}
                  </p>
                </div>
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
              {t("enquireSection.contactLinePrefix")}
              {/* Non-breaking, so the address never sits alone on a line. */}
              {"\u00A0"}
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
              <DeferredEnquiryForm />
            </MotionInView>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
