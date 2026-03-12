import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UcatSignupForm from "./UcatSignupForm";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  title: "Sign Up — Meducate UCAT Program | Simple Tuition",
  description:
    "Register for the Meducate UCAT Program. Choose between group classes, 1-on-1 tutoring, or both. Small cohorts, 99th percentile tutors.",
  alternates: {
    canonical: "/ucatonline",
  },
  openGraph: {
    title: "Sign Up — Meducate UCAT Program | Simple Tuition",
    description:
      "Register for the Meducate UCAT Program. Choose between group classes, 1-on-1 tutoring, or both.",
    url: `${BASE_URL}/ucatonline`,
    type: "website",
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Meducate UCAT Program",
      },
    ],
  },
};

export default function UcatSignupPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
        {/* Breadcrumbs */}
        <nav className="mb-10" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs text-slate-500">
            <li>
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/programs/ucat" className="hover:text-blue-600">
                UCAT Program
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-slate-700">Sign up</li>
          </ol>
        </nav>

        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
          Simple Tuition UCAT Online Workshop Registration
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Reserve your spot
          </h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Classes are capped at a small cohort size. Fill in the form below and
            we&apos;ll confirm your place within 1 business day.
          </p>
        </div>

        <UcatSignupForm />
      </main>

      <Footer />
    </div>
  );
}
