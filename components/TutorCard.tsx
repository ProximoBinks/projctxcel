"use client";

import { motion } from "framer-motion";

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
            <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/20 via-sky-400/10 to-transparent" />
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
        <div className="mt-4 min-h-16">
          <p className="text-sm text-slate-600">{tutor.bioShort}</p>
        </div>
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
        <div className="flex-1 min-h-4" aria-hidden="true" />
        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
          {tutor.stats.slice(0, 3).map((stat) => (
            <div key={stat.label}>
              <p className="text-base font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
