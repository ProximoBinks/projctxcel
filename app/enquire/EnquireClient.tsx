"use client";

import { Suspense } from "react";
import EnquiryForm from "../../components/EnquiryForm";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../i18n/LanguageContext";

export default function EnquireClient() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
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

      <Footer />
    </div>
  );
}
