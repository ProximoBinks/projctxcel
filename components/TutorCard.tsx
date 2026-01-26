"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type TutorStat = { label: string; value: string };

export type TutorCardData = {
  name: string;
  slug: string;
  photoUrl: string;
  headline?: string;
  bioShort: string;
  subjects: string[];
  stats: TutorStat[];
};

export default function TutorCard({ tutor }: { tutor: TutorCardData }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <Link href={`/tutors/${tutor.slug}`} className="flex h-full flex-col">
        <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-slate-100">
          <img
            src={tutor.photoUrl}
            alt={tutor.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex h-full flex-col gap-4 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">
              {tutor.name}
            </h3>
            {tutor.headline && (
              <p className="mt-1 text-sm text-slate-500">{tutor.headline}</p>
            )}
          </div>
          <p className="text-sm text-slate-600">{tutor.bioShort}</p>
          <div className="mt-auto space-y-3">
            <div className="flex flex-wrap gap-2">
              {tutor.subjects.slice(0, 3).map((subject) => (
                <span
                  key={subject}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {subject}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {tutor.stats.slice(0, 3).map((stat) => (
                <div key={stat.label}>
                  <p className="text-sm font-semibold text-slate-900">
                    {stat.value}
                  </p>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
