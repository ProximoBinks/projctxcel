import type { Metadata } from "next";
import Script from "next/script";
import "../styles/globals.css";
import Providers from "./providers";
import { JsonLd } from "../components/JsonLd";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Adelaide Tutors & Tuition | Top 1% ATAR Tutors | Simple Tuition",
    template: "%s | Simple Tuition",
  },
  description:
    "Private tuition in Adelaide from top 1% ATAR achievers. SACE, UCAT, and medicine prep for Year 4-12 students. Enquire today and we respond within 1 business day.",
  keywords: [
    "adelaide tutors",
    "tuition in adelaide",
    "adelaide tuition",
    "private tutors adelaide",
    "sace tutors adelaide",
    "ucat tutors adelaide",
  ],
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Simple Tuition",
    title: "Adelaide Tutors & Tuition | Top 1% ATAR Tutors | Simple Tuition",
    description:
      "Private tuition in Adelaide from top 1% ATAR achievers. SACE, UCAT, and medicine prep for Year 4-12 students.",
    url: BASE_URL,
    images: [
      {
        url: "/images/banner.webp",
        width: 1200,
        height: 630,
        alt: "Simple Tuition — Private tutoring from top 1% ATAR achievers in Adelaide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adelaide Tutors & Tuition | Top 1% ATAR Tutors | Simple Tuition",
    description:
      "Private tuition in Adelaide from top 1% ATAR achievers. SACE, UCAT, and medicine prep for Year 4-12 students.",
    images: ["/images/banner.webp"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Simple Tuition",
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  description:
    "Private tuition in Adelaide from top 1% ATAR achievers for Year 4-12 students. SACE, UCAT, and medicine interview preparation.",
  email: "admin@simpletuition.com.au",
  sameAs: [
    "https://www.facebook.com/simpletuition.au",
    "https://www.instagram.com/simpletuition.au/",
    "https://www.tiktok.com/@simpletuition.au",
  ],
  areaServed: {
    "@type": "City",
    name: "Adelaide",
    containedInPlace: {
      "@type": "State",
      name: "South Australia",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <JsonLd data={organizationSchema} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-J81WF7WXDD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J81WF7WXDD');
          `}
        </Script>
      </head>
      <body className="bg-white font-sans text-slate-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
