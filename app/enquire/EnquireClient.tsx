"use client";

import Link from "next/link";
import { Suspense } from "react";
import EnquiryForm from "../../components/EnquiryForm";
import { useTranslation } from "../../i18n/LanguageContext";

export default function EnquireClient() {
  const { lang, toggleLang, t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/">
            <img
              src="/images/simple-text-black.svg"
              alt="Simple Tuition"
              className="h-[60px]"
            />
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {lang === "en" ? "中" : "EN"}
            </button>
            <Link href="/#tutors" className="text-sm font-semibold text-slate-600">
              {t("nav.backToSite")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
            {t("enquirePage.eyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {t("enquirePage.title")}
          </h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            {t("enquirePage.subtitle")}
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-slate-600">{t("enquirePage.loading")}</p>
            </div>
          }
        >
          <EnquiryForm />
        </Suspense>
      </main>
    </div>
  );
}
