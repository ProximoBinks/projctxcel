"use client";

import { motion } from "framer-motion";
import { useTranslation } from "../i18n/LanguageContext";

type TutorStat = { label: string; value: string };

export type TutorCardData = {
  name: string;
  slug: string;
  photoFile: string;
  headline?: string;
  bioShort: string;
  subjects: string[];
  stats: TutorStat[];
};

export default function TutorCard({ tutor }: { tutor: TutorCardData }) {
  const { t } = useTranslation();

  const displayBio = (() => {
    const translated = t(`tutorBios.${tutor.slug}`);
    return translated !== `tutorBios.${tutor.slug}` ? translated : tutor.bioShort;
  })();

  const getStatLabel = (label: string) => {
    const translated = t(`statLabels.${label}`);
    return translated !== `statLabels.${label}` ? translated : label;
  };

  const getSubjectStyle = (subject: string) => {
    const s = subject.toLowerCase();
    // Maths
    if (s === "general maths") return "bg-sky-100 text-sky-700 border-sky-200";
    if (s === "maths methods") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "specialist maths") return "bg-blue-100 text-blue-800 border-blue-200";
    // Sciences
    if (s === "biology") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s === "chemistry") return "bg-orange-100 text-orange-700 border-orange-200";
    if (s === "physics") return "bg-violet-100 text-violet-700 border-violet-200";
    // English
    if (s === "english") return "bg-red-100 text-red-700 border-red-200";
    if (s === "english literature") return "bg-rose-100 text-rose-800 border-rose-200";
    if (s === "research project") return "bg-slate-100 text-slate-600 border-slate-200";
    // Business
    if (s === "accounting") return "bg-gray-200 text-gray-800 border-gray-300";
    // Medicine pathway
    if (s === "ucat") return "bg-pink-100 text-pink-700 border-pink-200";
    if (s === "interview prep") return "bg-amber-50 text-amber-700 border-amber-300";
    // Default
    return "border-slate-200 text-slate-600";
  };

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="group relative h-full rounded-2xl border border-black/5 bg-white shadow-sm"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/60 opacity-0 transition duration-300 group-hover:opacity-100 backdrop-blur" />
      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <img
              src={
                tutor.photoFile
                  ? `/images/tutors/${tutor.photoFile}`
                  : "/images/tutors/default.webp"
              }
              alt={tutor.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                if (
                  event.currentTarget.src.includes("/images/tutors/default.webp")
                ) {
                  return;
                }
                event.currentTarget.src = "/images/tutors/default.webp";
              }}
            />
            <div className="absolute inset-0 bg-linear-to-tr from-blue-500/20 via-sky-400/10 to-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-950">
                {tutor.name}
              </h3>
              <img
                src="/images/checkmark.png"
                alt="Verified"
                className="h-4 w-4"
              />
            </div>
            {tutor.headline && (
              <p className="mt-1 text-sm text-slate-500">{tutor.headline}</p>
            )}
          </div>
        </div>
        <div className="mt-5 min-h-16">
          <p className="text-sm text-slate-600">{displayBio}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tutor.subjects.map((subject) => (
            <span
              key={subject}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getSubjectStyle(subject)}`}
            >
              {subject}
            </span>
          ))}
        </div>
        <div className="flex-1 min-h-4" aria-hidden="true" />
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
          {tutor.stats.slice(0, 3).map((stat) => (
            <div key={stat.label}>
              <p className="text-base font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="text-xs text-slate-400">{getStatLabel(stat.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
