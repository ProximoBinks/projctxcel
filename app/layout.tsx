import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";
import Providers from "./providers";

const stolzl = localFont({
  variable: "--font-stolzl",
  src: [
    { path: "./fonts/stolzl_thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/stolzl_light.otf", weight: "300", style: "normal" },
    { path: "./fonts/stolzl_book.otf", weight: "400", style: "normal" },
    { path: "./fonts/stolzl_regular.otf", weight: "500", style: "normal" },
    { path: "./fonts/stolzl_medium.otf", weight: "600", style: "normal" },
    { path: "./fonts/stolzl_medium.otf", weight: "700", style: "normal" },
    { path: "./fonts/stolzl_bold.otf", weight: "800", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Simple Tuition | Premium tutoring",
  description:
    "Modern, in-person tutoring from Reception to Year 12 across SACE, UCAT, and interview prep.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${stolzl.className} ${stolzl.variable} bg-white font-sans text-slate-950 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
