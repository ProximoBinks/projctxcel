import type { Metadata } from "next";
import TermsClient from "./TermsClient";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using Simple Tuition's tutoring services. Read our full terms of service.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Simple Tuition",
    description:
      "Terms and conditions for using Simple Tuition's tutoring services.",
    url: `${BASE_URL}/terms`,
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
    title: "Terms of Service | Simple Tuition",
    description:
      "Terms and conditions for using Simple Tuition's tutoring services.",
    images: ["/images/banner.webp"],
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
