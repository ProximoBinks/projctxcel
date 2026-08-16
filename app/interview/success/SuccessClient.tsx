"use client";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Confetti from "../../../components/Confetti";
import { useTranslation } from "../../../i18n/LanguageContext";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { trackFb } from "../../../lib/fbq";

/** Fallback only — the real figure comes from Stripe. */
const LIST_PRICE_AUD = 399;

export default function SuccessClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const purchaseTracked = useRef(false);
  const getPaidAmountCents = useAction(api.courseCheckout.getPaidAmountCents);

  // This page only renders after Stripe's success redirect, so reaching it is
  // the client-side signal of a completed purchase. The Stripe session id is
  // the shared event id: the Conversions API sends the same Purchase with the
  // same id, and Meta keeps one of the two.
  useEffect(() => {
    if (purchaseTracked.current) return;
    purchaseTracked.current = true;

    const sessionId = searchParams.get("session_id") ?? undefined;

    const fire = (value: number) =>
      trackFb(
        "Purchase",
        { value, currency: "AUD", content_name: "Interview Intensive" },
        sessionId,
      );

    // Ask Stripe what was actually collected, so a promotion code doesn't get
    // reported as full price. Falls back to list price if that lookup fails —
    // a slightly wrong value beats losing the conversion entirely.
    if (!sessionId) {
      fire(LIST_PRICE_AUD);
      return;
    }
    getPaidAmountCents({ sessionId })
      .then((cents) => fire(cents === null ? LIST_PRICE_AUD : cents / 100))
      .catch(() => fire(LIST_PRICE_AUD));
  }, [searchParams, getPaidAmountCents]);

  const confettiOptions = useMemo(
    () => ({
      particleCount: 160,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
    }),
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <Confetti options={confettiOptions} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-20 sm:px-10 sm:py-28">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-500">
            {t("interview.eyebrow")}
          </p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t("interview.successTitle")}
          </h1>
          <p className="mt-4 text-slate-600">{t("interview.successBody")}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
