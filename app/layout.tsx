import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Providers from "./providers";
import { JsonLd } from "../components/JsonLd";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.au";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Simple Tuition | Top 1% ATAR & UCAT Tutors in Adelaide",
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
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
  ],
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Simple Tuition",
    title: "Simple Tuition | Top 1% ATAR & UCAT Tutors in Adelaide",
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
    title: "Simple Tuition | Top 1% ATAR & UCAT Tutors in Adelaide",
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

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Simple Tuition",
  alternateName: "Simple Tuition Adelaide",
  url: BASE_URL,
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
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta
          name="facebook-domain-verification"
          content="obbe5dhql5e10pzaqcpo4xmks3ym6q"
        />
        <JsonLd data={websiteSchema} />
        <JsonLd data={organizationSchema} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-J81WF7WXDD"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J81WF7WXDD');
          `}
        </Script>
        {/* Meta Pixel. Deliberately `afterInteractive`, unlike the GA4 tags
            above: paid traffic bounces fast, and `lazyOnload` waits for the
            window load event, which can miss a visitor entirely. */}
        {META_PIXEL_ID ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
      </head>
      <body className={`${inter.variable} bg-white font-sans text-slate-950 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
