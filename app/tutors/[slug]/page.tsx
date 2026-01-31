import { notFound } from "next/navigation";
import type { Metadata } from "next";
import tutorsDataRaw from "../../../data/tutors.json";
import TutorDetailClient from "./TutorDetailClient";

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
      title: "Tutor not found | Simple Tuition",
      description: "Simple Tuition premium tutoring.",
    };
  }

  const tutor = tutorsData.find((item) => item.slug === slug);

  if (!tutor) {
    return {
      title: "Tutor not found | Simple Tuition",
      description: "Simple Tuition premium tutoring.",
    };
  }

  return {
    title: `${tutor.name} | Simple Tuition`,
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

  return <TutorDetailClient tutor={tutor} />;
}
