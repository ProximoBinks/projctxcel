import type { Metadata } from "next";
import Script from "next/script";
import "../styles/globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Simple Tuition | Adelaide Tutoring",
  description:
    "In-person individual and group tutoring from Year 4 to Year 12 across SACE, UCAT, and interview prep.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
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
