import { notFound } from "next/navigation";
import type { Metadata } from "next";
import tutorsDataRaw from "../../../data/tutors.json";
import TutorDetailClient from "./TutorDetailClient";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

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
      title: "Tutor not found",
      description: "Simple Tuition Adelaide tutors and private tuition services.",
    };
  }

  const tutor = tutorsData.find((item) => item.slug === slug);

  if (!tutor) {
    return {
      title: "Tutor not found",
      description: "Simple Tuition Adelaide tutors and private tuition services.",
    };
  }

  const atarStat = tutor.stats.find((s) => s.label === "ATAR");
  const subjectList = tutor.subjects.slice(0, 4).join(", ");
  const headlinePrefix = tutor.headline ? `${tutor.headline} ` : "";
  const description = atarStat
    ? `${tutor.name} - ${atarStat.value} ATAR tutor in Adelaide. ${headlinePrefix}Subjects: ${subjectList}. Enquire with Simple Tuition.`
    : `${tutor.name} - Adelaide tutor. ${tutor.headline ?? tutor.bioShort} Subjects: ${subjectList}. Enquire with Simple Tuition.`;

  const ogImage = tutor.photoFile
    ? `/images/tutors/${tutor.photoFile}`
    : "/images/banner.webp";

  return {
    title: `${tutor.name} — ${atarStat ? `${atarStat.value} ATAR` : "Tutor"}`,
    description,
    alternates: {
      canonical: `/tutors/${slug}`,
    },
    openGraph: {
      title: `${tutor.name} | Simple Tuition`,
      description,
      url: `${BASE_URL}/tutors/${slug}`,
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 600,
          height: 600,
          alt: `${tutor.name} — Tutor at Simple Tuition`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tutor.name} | Simple Tuition`,
      description,
      images: [ogImage],
    },
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

  return <TutorDetailClient tutor={tutor} />;
}
