"use client";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Confetti from "../../../components/Confetti";
import { useTranslation } from "../../../i18n/LanguageContext";
import { useMemo } from "react";

export default function SuccessClient() {
  const { t } = useTranslation();

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
