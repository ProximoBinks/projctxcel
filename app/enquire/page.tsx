import type { Metadata } from "next";
import EnquireClient from "./EnquireClient";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Enquire — Find Your Tutor",
  description:
    "Tell us your student's year level, subjects, and goals. We'll recommend a matched tutor within 1 business day. Enquire now at Simple Tuition.",
  alternates: {
    canonical: "/enquire",
  },
  openGraph: {
    title: "Enquire — Find Your Tutor | Simple Tuition",
    description:
      "Tell us your student's year level, subjects, and goals. We'll recommend a matched tutor within 1 business day.",
    url: `${BASE_URL}/enquire`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Enquire for a tutor in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enquire — Find Your Tutor | Simple Tuition",
    description:
      "Tell us your student's year level, subjects, and goals. We'll recommend a matched tutor within 1 business day.",
    images: ["/images/banner.webp"],
  },
};

export default function EnquirePage() {
  return <EnquireClient />;
}
