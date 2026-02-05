"use client";

import Link from "next/link";
import { useTranslation } from "../../../i18n/LanguageContext";

type TutorRecord = {
  name: string;
  slug: string;
  photoFile: string;
  headline?: string;
  bioShort: string;
  bioLong?: string;
  subjects: string[];
  yearLevels: string[];
  stats: { label: string; value: string }[];
};

export default function TutorDetailClient({ tutor }: { tutor: TutorRecord }) {
  const { lang, toggleLang, t } = useTranslation();

  const displayBio = (() => {
    const translated = t(`tutorBios.${tutor.slug}`);
    return translated !== `tutorBios.${tutor.slug}` ? translated : tutor.bioShort;
  })();

  const displayBioLong = tutor.bioLong ?? displayBio;

  const getStatLabel = (label: string) => {
    const translated = t(`statLabels.${label}`);
    return translated !== `statLabels.${label}` ? translated : label;
  };

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
            <Link href="/#enquire" className="btn">
              {t("tutorDetail.enquire")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr,1.2fr] lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="aspect-4/5 overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={
                  tutor.photoFile
                    ? `/images/tutors/${tutor.photoFile}`
                    : "/images/tutors/default.webp"
                }
                alt={tutor.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  if (
                    event.currentTarget.src.includes(
                      "/images/tutors/default.webp"
                    )
                  ) {
                    return;
                  }
                  event.currentTarget.src = "/images/tutors/default.webp";
                }}
              />
            </div>
            <div className="mt-6 space-y-2">
              <h1 className="text-3xl font-semibold text-slate-950">
                {tutor.name}
              </h1>
              {tutor.headline ? (
                <p className="text-sm text-slate-600">{tutor.headline}</p>
              ) : null}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-slate-500">
              {tutor.stats.slice(0, 3).map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-base font-semibold text-slate-950">
                    {stat.value}
                  </p>
                  <p>{getStatLabel(stat.label)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-950">
                {t("tutorDetail.about")} {tutor.name}
              </h2>
              <p className="mt-4 text-sm text-slate-600">
                {displayBioLong}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">
                {t("tutorDetail.subjects")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">
                {t("tutorDetail.yearLevels")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.yearLevels.map((level) => (
                  <span
                    key={level}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
              <h3 className="text-lg font-semibold text-slate-950">
                {t("tutorDetail.readyToEnquire")}
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                {t("tutorDetail.readyToEnquireDesc")}
              </p>
              <Link href="/#enquire" className="btn btn-lg mt-5">
                {t("tutorDetail.enquire")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
