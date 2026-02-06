"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../i18n/LanguageContext";

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { lang, toggleLang, t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [navCompact, setNavCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavCompact(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll handler for homepage sections
  const createScrollHandler = (id: string) => (event: React.MouseEvent) => {
    if (!isHomePage) return; // Let normal navigation happen on subpages
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Get the correct href based on whether we're on homepage or subpage
  const getNavHref = (section: string) => {
    return isHomePage ? `#${section}` : `/#${section}`;
  };

  return (
    <header
      className={`sticky top-0 z-20 border-b border-slate-100 transition-all duration-300 ${
        navCompact ? "bg-white/80 backdrop-blur" : "bg-white/60"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 transition-all duration-300 sm:px-10 ${
          navCompact ? "py-3" : "py-5"
        }`}
      >
        <Link href="/">
          <img
            src="/images/simple-text-black.svg"
            alt="Simple Tuition"
            className="h-[50px]"
          />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <Link
            href={getNavHref("tutors")}
            onClick={isHomePage ? createScrollHandler("tutors") : undefined}
          >
            {t("nav.tutors")}
          </Link>
          <Link
            href={getNavHref("testimonials")}
            onClick={isHomePage ? createScrollHandler("testimonials") : undefined}
          >
            {t("nav.testimonials")}
          </Link>
          <Link
            href={getNavHref("how-it-works")}
            onClick={isHomePage ? createScrollHandler("how-it-works") : undefined}
          >
            {t("nav.howItWorks")}
          </Link>
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            {lang === "en" ? "中文" : "EN"}
          </button>
          <Link
            href={getNavHref("enquire")}
            className="btn"
            onClick={isHomePage ? createScrollHandler("enquire") : undefined}
          >
            {t("nav.enquire")}
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:text-slate-900 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
              d="M3 6.5h18M3 12h18M3 17.5h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {menuOpen ? (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-5 text-sm text-slate-700 sm:px-10">
            <Link
              href={getNavHref("tutors")}
              onClick={(event) => {
                if (isHomePage) {
                  createScrollHandler("tutors")(event);
                }
                setMenuOpen(false);
              }}
            >
              {t("nav.tutors")}
            </Link>
            <Link
              href={getNavHref("testimonials")}
              onClick={(event) => {
                if (isHomePage) {
                  createScrollHandler("testimonials")(event);
                }
                setMenuOpen(false);
              }}
            >
              {t("nav.testimonials")}
            </Link>
            <Link
              href={getNavHref("how-it-works")}
              onClick={(event) => {
                if (isHomePage) {
                  createScrollHandler("how-it-works")(event);
                }
                setMenuOpen(false);
              }}
            >
              {t("nav.howItWorks")}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              {lang === "en" ? "中" : "EN"}
            </button>
            <Link
              href={getNavHref("enquire")}
              className="btn w-full justify-center"
              onClick={(event) => {
                if (isHomePage) {
                  createScrollHandler("enquire")(event);
                }
                setMenuOpen(false);
              }}
            >
              {t("nav.enquire")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
