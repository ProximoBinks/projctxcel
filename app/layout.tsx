import type { Metadata } from "next";
import "../styles/globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Simple Tuition | Premium tutoring",
  description:
    "Modern, in-person tutoring from Reception to Year 12 across SACE, UCAT, and interview prep.",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
