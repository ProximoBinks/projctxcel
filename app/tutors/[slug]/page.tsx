import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import tutorsDataRaw from "../../../data/tutors.json";

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
  active: boolean;
  sortOrder: number;
};

const tutorsData = tutorsDataRaw as TutorRecord[];

type TutorPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: TutorPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return {
      title: "Tutor not found | projctxcel",
      description: "projctxcel premium tutoring.",
    };
  }

  const tutor = tutorsData.find((item) => item.slug === slug);

  if (!tutor) {
    return {
      title: "Tutor not found | projctxcel",
      description: "projctxcel premium tutoring.",
    };
  }

  return {
    title: `${tutor.name} | projctxcel`,
    description: tutor.headline ?? tutor.bioShort,
  };
}

export default async function TutorDetailPage({ params }: TutorPageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const tutor = tutorsData.find((item) => item.slug === slug);

  if (!tutor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            projctxcel
          </Link>
          <Link href="/#enquire" className="btn">
            Enquire
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr,1.2fr] lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="aspect-4/5 overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={`/images/tutors/${tutor.photoFile}`}
                alt={tutor.name}
                className="h-full w-full object-cover"
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
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-950">
                About {tutor.name}
              </h2>
              <p className="mt-4 text-sm text-slate-600">
                {tutor.bioLong ?? tutor.bioShort}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">
                Subjects
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
                Year levels
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
                Ready to enquire?
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Share your goals and we will set up the right support.
              </p>
              <Link href="/#enquire" className="btn btn-lg mt-5">
                Enquire
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
