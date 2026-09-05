import type { Metadata } from "next";
import { Suspense } from "react";
import InterviewClient from "./InterviewClient";
import { JsonLd } from "../../components/JsonLd";
import en from "../../i18n/en.json";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.com.au";

const TITLE = "Medicine & Dentistry Interview Intensive | Simple Tuition";
const DESCRIPTION =
  "A four-day Medicine & Dentistry interview intensive, online, 6–9 October 2026. Four live sessions, mock MMI stations, and group feedback — coached by students who got their offer on the strength of the interview.";

export const metadata: Metadata = {
  title: "Medicine & Dentistry Interview Intensive",
  description: DESCRIPTION,
  keywords: [
    "medicine interview preparation",
    "MMI practice",
    "dentistry interview coaching",
    "multiple mini interview adelaide",
    "medical school interview course",
  ],
  alternates: {
    canonical: "/interview",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/interview`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Medicine & Dentistry Interview Intensive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/banner.webp"],
  },
};

/**
 * FAQ structured data, generated from the same i18n entries the page renders
 * so the schema can never drift from what a visitor actually sees — which is
 * what Google checks before showing the questions in search results.
 */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: en.interview.faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function InterviewPage() {
  return (
    <>
      {en.interview.faq.length > 0 ? <JsonLd data={faqSchema} /> : null}
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <InterviewClient />
      </Suspense>
    </>
  );
}
