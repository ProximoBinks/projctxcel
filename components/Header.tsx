"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../i18n/LanguageContext";

// Horizontal nudges for the header clusters, in pixels: how far to push each one
// inwards from its edge of the screen. They only apply from `xl` up, where there
// is spare room beside the centred nav, and are capped at MAX_NUDGE — a nudge
// larger than the empty space would slide the cluster under the nav pill.
const MAX_NUDGE = 120;
const LOGO_NUDGE = 96;
const ACTIONS_NUDGE = 96;

const clampNudge = (px: number) => Math.min(Math.max(px, 0), MAX_NUDGE);

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

  const navLinkClass =
    "rounded-full px-5 py-2.5 transition hover:bg-white hover:text-slate-900 hover:shadow-sm";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        navCompact
          ? "border-b border-slate-200/70 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-white/70 backdrop-blur-sm"
      }`}
    >
      {/* Three columns with equal 1fr sides, so the auto-width nav column lands
          dead centre on the page while still reserving its own space — the logo
          and actions cannot slide underneath it the way they could when the nav
          was absolutely positioned. */}
      <div
        className={`grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 transition-all duration-300 sm:px-10 lg:px-14 ${
          navCompact ? "py-4" : "py-6"
        }`}
      >
        <Link
          href="/"
          className="justify-self-start xl:ml-[var(--logo-nudge)]"
          style={
            { "--logo-nudge": `${clampNudge(LOGO_NUDGE)}px` } as CSSProperties
          }
        >
          <img
            src="/images/simple-text-black.svg"
            alt="Simple Tuition"
            className={`max-w-full transition-all duration-300 ${
              navCompact ? "h-14" : "h-[68px]"
            }`}
          />
        </Link>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-50/90 p-1.5 text-base text-slate-600 ring-1 ring-slate-200/60 lg:flex">
          <Link
            href={getNavHref("services")}
            className={navLinkClass}
            onClick={isHomePage ? createScrollHandler("services") : undefined}
          >
            {t("nav.services")}
          </Link>
          <Link
            href={getNavHref("tutors")}
            className={navLinkClass}
            onClick={isHomePage ? createScrollHandler("tutors") : undefined}
          >
            {t("nav.tutors")}
          </Link>
          <Link
            href={getNavHref("testimonials")}
            className={navLinkClass}
            onClick={isHomePage ? createScrollHandler("testimonials") : undefined}
          >
            {t("nav.testimonials")}
          </Link>
          <Link
            href={getNavHref("how-it-works")}
            className={navLinkClass}
            onClick={isHomePage ? createScrollHandler("how-it-works") : undefined}
          >
            {t("nav.howItWorks")}
          </Link>
          <Link href="/guides" className={navLinkClass}>
            {t("nav.blog")}
          </Link>
        </nav>
        {/* Both action clusters share the third column so the grid keeps exactly
            three children at every breakpoint. */}
        <div
          className="flex items-center justify-self-end xl:mr-[var(--actions-nudge)]"
          style={
            {
              "--actions-nudge": `${clampNudge(ACTIONS_NUDGE)}px`,
            } as CSSProperties
          }
        >
          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {lang === "en" ? "中文" : "EN"}
            </button>
            <Link
              href="/student/login"
              className="rounded-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href={getNavHref("enquire")}
              className="btn btn-lg px-7"
              onClick={isHomePage ? createScrollHandler("enquire") : undefined}
            >
              {t("nav.enquire")}
            </Link>
          </div>
          {/* Mobile + tablet: Language toggle + Login + Hamburger menu */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              {lang === "en" ? "中文" : "EN"}
            </button>
            <Link
              href="/student/login"
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              Login
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-2.5 text-slate-600 shadow-sm transition hover:text-slate-900"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
                <path
                  d="M3 6.5h18M3 12h18M3 17.5h18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {menuOpen ? (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="flex w-full flex-col gap-4 px-6 py-6 text-base text-slate-700 sm:px-10 lg:px-14">
            <Link
              href={getNavHref("services")}
              onClick={(event) => {
                if (isHomePage) {
                  createScrollHandler("services")(event);
                }
                setMenuOpen(false);
              }}
            >
              {t("nav.services")}
            </Link>
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
            <Link
              href="/guides"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.blog")}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              {lang === "en" ? "中" : "EN"}
            </button>
            <Link
              href="/student/login"
              className="w-fit rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
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
