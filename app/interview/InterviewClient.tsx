"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MotionInView from "../../components/MotionInView";
import OfferCarousel, {
  type OfferImage,
} from "../../components/OfferCarousel";
import TutorCard from "../../components/TutorCard";
import { useTranslation } from "../../i18n/LanguageContext";
import { getMetaAttribution, trackFb } from "../../lib/fbq";
import tutorsData from "../../data/tutors.json";

const interviewTutorSlugs = [
  "yousif-shibeeb",
  "lachlan-escort-hughes",
  "anhong-do",
];
const interviewTutors = interviewTutorSlugs.map(
  (slug) => tutorsData.find((tutor) => tutor.slug === slug)!
);

/**
 * Offer letters shown at the top of the page.
 *
 * Each card crops its letter to a 4:3 frame. Two optional knobs control what
 * you see inside that frame:
 *
 *   position — which part stays in frame. "50% 50%" is centre; lower the
 *              second number to reveal more of the top of the letter.
 *              e.g. "50% 20%" sits above centre, "50% 0%" pins to the top.
 *   zoom     — 1 is as-is, 1.2 moves 20% closer, 0.9 pulls back.
 *              Zoom happens around `position`, so set position first.
 *
 * Tweak, save, and the page hot-reloads. Files live in
 * `public/images/offers/`; keep the uncropped originals in
 * `public/images/offers/src/`.
 */
const OFFER_IMAGES: OfferImage[] = [
  {
    src: "/images/offers/adelaide.webp",
    alt: "Medicine offer from Adelaide University",
  },
  {
    src: "/images/offers/dentistry.webp",
    alt: "Dental Surgery offer from Adelaide University",
  },
  {
    src: "/images/offers/unsw.webp",
    alt: "Medicine offer from UNSW",
    // Anchored to the bottom so zooming trims off the top: enough to lose the
    // UAC logo while keeping the date line down.
    position: "50% 100%",
    zoom: 1.18,
  },
  {
    src: "/images/offers/monash.webp",
    alt: "Medicine offer from Monash University",
  },
  {
    src: "/images/offers/uq.webp",
    alt: "Medicine offer from the University of Queensland",
  },
  {
    src: "/images/offers/utas.webp",
    alt: "Medicine offer from the University of Tasmania",
  },
];

type Program = "medicine" | "dentistry" | "both";

export default function InterviewClient() {
  const { t, tArray } = useTranslation();
  const searchParams = useSearchParams();
  const createPending = useMutation(api.courseEnrollments.createPending);
  const createCheckoutSession = useAction(
    api.courseCheckout.createCheckoutSession
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState<Program>("medicine");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const coverSessions = tArray<{
    label: string;
    date: string;
    title: string;
    copy: string[];
  }>("interview.coversSessions");
  const stakesParagraphs = tArray<string>("interview.stakesParagraphs");
  const whyParagraphs = tArray<string>("interview.whyParagraphs");
  const wasCancelled = searchParams.get("checkout") === "cancelled";

  const utm = useMemo(
    () => ({
      source: searchParams.get("utm_source") || undefined,
      medium: searchParams.get("utm_medium") || undefined,
      campaign: searchParams.get("utm_campaign") || undefined,
      term: searchParams.get("utm_term") || undefined,
      content: searchParams.get("utm_content") || undefined,
    }),
    [searchParams]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name || !email || !phone || !consent) {
      setError(t("interview.errorRequired"));
      return;
    }

    // Honeypot: bots fill the hidden field. Show the normal loading state and
    // stop, so the bot cannot tell it was rejected — and never take payment.
    if (company) {
      setStatus("loading");
      return;
    }

    setStatus("loading");
    try {
      const sourcePage = `${window.location.pathname}${window.location.search}`;

      // Read here rather than in the webhook: the Conversions API call is
      // server-to-server and never sees this visitor's cookies.
      const meta = getMetaAttribution();

      const enrollmentId = await createPending({
        name,
        email,
        phone,
        program,
        consent,
        sourcePage,
        utm,
        metaFbp: meta.fbp,
        metaFbc: meta.fbc,
        metaUserAgent: meta.userAgent,
      });

      const { url } = await createCheckoutSession({
        enrollmentId,
        origin: window.location.origin,
      });

      // Fired before the redirect, while our own page is still loaded — once we
      // hand off to Stripe's domain the pixel is out of reach.
      trackFb("InitiateCheckout", {
        value: 399,
        currency: "AUD",
        content_name: "Interview Intensive",
      });

      // Full navigation, not router.push — Checkout is on Stripe's domain.
      window.location.assign(url);
    } catch (err) {
      console.error(err);
      setStatus("idle");
      setError(t("interview.errorGeneric"));
    }
  };

  const programOptions: Array<{ value: Program; label: string }> = [
    { value: "medicine", label: t("interview.programMedicine") },
    { value: "dentistry", label: t("interview.programDentistry") },
    { value: "both", label: t("interview.programBoth") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-white pb-20 pt-32 sm:pb-28 sm:pt-40">
          <div className="noise-overlay" aria-hidden="true" />
          <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 sm:px-10">
            <MotionInView>
              <h1 className="max-w-5xl text-[2.25rem] sm:text-[clamp(1.75rem,5.5vw,4.5rem)] font-semibold leading-[1.15] tracking-tight text-slate-950 [text-wrap:balance] sm:leading-[1.1]">
                <span className="block">{t("interview.title")}</span>
                <span className="block">{t("interview.titleLine2")}</span>
                <span className="gradient-text block">
                  {t("interview.titleAccent")}
                </span>
              </h1>
              <p className="mt-6 max-w-none text-base text-slate-600 lg:whitespace-nowrap lg:text-lg">
                {t("interview.subhead")}
              </p>
            </MotionInView>
          </div>
        </section>

        {/* Offer wall. Deliberately small: at this size the letters read as a
            pile of offers rather than as documents anyone can pore over. */}
        {OFFER_IMAGES.length > 0 ? (
          <section className="overflow-hidden bg-[#F5F8FF] py-16 sm:py-24 lg:py-28">
            <div className="mx-auto w-full max-w-[1680px] px-6 text-center sm:px-10">
              <MotionInView>
                <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {t("interview.offersTitle")}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 sm:text-xl">
                  {t("interview.offersSubtitle")}
                </p>
              </MotionInView>

              <MotionInView>
                <OfferCarousel items={OFFER_IMAGES} />
                {t("interview.offersCaption") ? (
                  <p className="mt-10 text-sm text-slate-500">
                    {t("interview.offersCaption")}
                  </p>
                ) : null}
              </MotionInView>
            </div>
          </section>
        ) : null}

        {/* The Stakes / Why This Works */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-10 sm:py-24">
          {/* Two full-width passages rather than cards — the hairline rule
              between them separates the ideas without boxing them in. */}
          <div className="divide-y divide-slate-200">
            <MotionInView>
              <div className="pb-10 sm:pb-12">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {t("interview.stakesTitle")}
                </h2>
                {stakesParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`text-lg leading-relaxed sm:text-xl sm:leading-[1.7] ${
                      index === 0 ? "mt-5" : "mt-4"
                    } ${
                      index === stakesParagraphs.length - 1
                        ? "font-semibold text-slate-950"
                        : "text-slate-600"
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </MotionInView>
            <MotionInView>
              <div className="pt-10 sm:pt-12">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {t("interview.whyTitle")}
                </h2>
                <p className="mt-5 text-lg font-medium leading-relaxed text-slate-950 sm:text-xl sm:leading-[1.7]">
                  {t("interview.whyLead")}
                </p>
                {whyParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`mt-4 text-lg leading-relaxed sm:text-xl sm:leading-[1.7] ${
                      index === whyParagraphs.length - 1
                        ? "font-semibold text-slate-950"
                        : "text-slate-600"
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </MotionInView>
          </div>
        </section>

        {/* Meet the Team */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-10 sm:py-24">
          <MotionInView>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {t("interview.meetTeamTitle")}
            </h2>
            <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {interviewTutors.map((tutor) => (
                <TutorCard key={tutor.slug} tutor={tutor} hideSubjects />
              ))}
            </div>
          </MotionInView>
        </section>

        {/* What the week covers */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
            <MotionInView>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t("interview.coversTitle")}
              </h2>
              <p className="mt-4 text-slate-600">
                {t("interview.coversLead")}
              </p>
              {/* Table layout, with a big pale numeral in the session cell in
                  place of a "Session N" text label — matches the "How it
                  works" treatment on the homepage. */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th
                        scope="col"
                        className="w-[22%] px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 sm:w-[16%] sm:px-7"
                      >
                        {t("interview.coversHeadSession")}
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 sm:px-7"
                      >
                        {t("interview.coversHeadContent")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverSessions.map((session, index) => (
                      <tr
                        key={session.label}
                        className="border-t border-slate-200 align-top"
                      >
                        <th
                          scope="row"
                          className="px-5 py-6 text-left font-normal sm:px-7"
                        >
                          <p className="text-5xl font-semibold text-blue-500/20">
                            {String(index + 1).padStart(2, "0")}
                          </p>
                          <span className="mt-2 block text-xs font-medium text-slate-500">
                            {session.date}
                          </span>
                        </th>
                        <td className="px-5 py-6 text-base leading-relaxed text-slate-600 sm:px-7">
                          <span className="block text-xl font-semibold leading-snug tracking-tight text-slate-950">
                            {session.title}
                          </span>
                          <ul className="mt-3 grid gap-2">
                            {session.copy.map((point, pointIndex) => (
                              <li key={pointIndex} className="flex gap-2">
                                <span
                                  className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"
                                  aria-hidden="true"
                                />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MotionInView>
          </div>
        </section>

        {/* Pricing + form */}
        <section
          id="reserve"
          className="mx-auto w-full max-w-[1200px] scroll-mt-32 px-6 py-16 sm:px-10 sm:py-24"
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
            <MotionInView>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-500">
                {t("interview.pricingTitle")}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t("interview.priceName")}
              </h2>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight text-slate-950">
                  {t("interview.priceAmount")}
                </span>
                <span className="text-sm text-slate-500">AUD</span>
              </p>
              <p className="mt-4 text-slate-600">
                {t("interview.priceIncludes")}
              </p>
            </MotionInView>

            <MotionInView>
              <form
                onSubmit={handleSubmit}
                className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {t("interview.formTitle")}
                </p>

                {wasCancelled ? (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    {t("interview.cancelled")}
                  </p>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    {t("interview.fullName")}
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    {t("interview.email")}
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    {t("interview.phone")}
                    <input
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {t("interview.program")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {programOptions.map((option) => {
                      const selected = program === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setProgram(option.value)}
                          aria-pressed={selected}
                          className={`inline-flex min-h-[44px] items-center rounded-full border px-5 text-sm font-medium transition ${
                            selected
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    required
                  />
                  <span>{t("interview.consent")}</span>
                </label>

                <label className="hidden">
                  Company
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>

                {error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn btn-lg w-full justify-center rounded-full"
                >
                  {status === "loading"
                    ? t("interview.redirecting")
                    : t("interview.closingCta")}
                </button>

                <p className="text-center text-xs text-slate-400">
                  {t("interview.securedByStripe")}
                </p>

                {/* Sits with the payment button on purpose: the doubt about
                    fit or dates happens here, not in the footer. */}
                <p className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
                  {t("interview.contactPrefix")}{" "}
                  <a
                    href={`mailto:${t("interview.contactEmail")}`}
                    className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-[#2455C2] hover:decoration-[#2455C2]"
                  >
                    {t("interview.contactEmail")}
                  </a>{" "}
                  {t("interview.contactSuffix")}
                </p>
              </form>
            </MotionInView>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
