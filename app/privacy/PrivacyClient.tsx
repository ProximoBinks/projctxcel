"use client";

import Link from "next/link";
import { useTranslation } from "../../i18n/LanguageContext";

export default function PrivacyClient() {
  const { lang, toggleLang, t, tArray } = useTranslation();

  const sections = tArray<{ heading: string; body: string }>("privacy.sections");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
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
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              {lang === "en" ? "中" : "EN"}
            </button>
            <Link href="/#enquire" className="text-sm font-semibold text-slate-600">
              {t("nav.enquire")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
          {t("privacy.eyebrow")}
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          {t("privacy.title")}
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          {t("privacy.intro")}
        </p>

        <section className="mt-10 space-y-6 text-sm text-slate-600">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold text-slate-950">
                {section.heading}
              </h2>
              <p className="mt-2">
                {section.body}
                {i === sections.length - 1 && (
                  <>
                    {" "}
                    <a
                      href="mailto:simpletuitionau@gmail.com"
                      className="font-semibold text-blue-600"
                    >
                      simpletuitionau@gmail.com
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
