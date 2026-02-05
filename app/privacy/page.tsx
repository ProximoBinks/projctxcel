import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Simple Tuition collects, uses, and protects your personal information. Read our full privacy policy.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Simple Tuition",
    description:
      "How Simple Tuition collects, uses, and protects your personal information.",
    url: `${BASE_URL}/privacy`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Adelaide Tutoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Simple Tuition",
    description:
      "How Simple Tuition collects, uses, and protects your personal information.",
    images: ["/images/banner.webp"],
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
