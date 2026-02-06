"use client";

import { useTranslation } from "../../i18n/LanguageContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function PrivacyClient() {
  const { t, tArray } = useTranslation();

  const sections = tArray<{ heading: string; body: string }>("privacy.sections");

  return (
    <div className="min-h-screen bg-white">
      <Header />

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
                      href="mailto:admin@simpletuition.com.au"
                      className="font-semibold text-blue-600"
                    >
                      admin@simpletuition.com.au
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
