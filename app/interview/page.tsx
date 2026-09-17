import type { Metadata } from "next";
import InterviewClient from "./InterviewClient";
import PublicConvexProvider from "../convex-provider";
import { JsonLd } from "../../components/JsonLd";
import { SITE_URL } from "../../lib/site";
import en from "../../i18n/en.json";

const CANONICAL_URL = `${SITE_URL}/interview`;
const TITLE = "Medicine & Dentistry Interview Prep Adelaide | Simple Tuition";
const DESCRIPTION =
  "Adelaide Medicine and Dentistry interview preparation from Simple Tuition, with live MMI practice, mock interviews and personalised feedback.";

export const metadata: Metadata = {
  title: "Medicine & Dentistry Interview Prep Adelaide",
  description: DESCRIPTION,
  keywords: [
    "medicine interview preparation Adelaide",
    "dentistry interview preparation Adelaide",
    "medical interview tutoring Adelaide",
    "MMI preparation Adelaide",
    "medicine mock interview Adelaide",
  ],
  alternates: {
    canonical: "/interview",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL_URL,
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

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": `${CANONICAL_URL}#course`,
  name: en.interview.priceName,
  description: DESCRIPTION,
  url: CANONICAL_URL,
  provider: {
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: "Simple Tuition",
    url: SITE_URL,
  },
  hasCourseInstance: {
    "@type": "CourseInstance",
    name: en.interview.priceName,
    courseMode: "Online",
    inLanguage: "en-AU",
    startDate: "2026-10-06T10:00:00+10:30",
    endDate: "2026-10-09T12:00:00+10:30",
    duration: "PT8H",
    location: {
      "@type": "VirtualLocation",
      url: CANONICAL_URL,
    },
    instructor: [
      { "@type": "Person", name: "Yousif Shibeeb" },
      { "@type": "Person", name: "Lachlan Escort-Hughes" },
      { "@type": "Person", name: "An Do" },
    ],
    offers: {
      "@type": "Offer",
      url: `${CANONICAL_URL}#reserve`,
      price: "399",
      priceCurrency: "AUD",
    },
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: en.interview.priceName,
      item: CANONICAL_URL,
    },
  ],
};

export default function InterviewPage() {
  return (
    <>
      {en.interview.faq.length > 0 ? <JsonLd data={faqSchema} /> : null}
      <JsonLd data={courseSchema} />
      <JsonLd data={breadcrumbSchema} />
      <PublicConvexProvider>
        <InterviewClient />
      </PublicConvexProvider>
    </>
  );
}
