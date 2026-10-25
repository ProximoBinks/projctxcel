"use client";

import { useEffect, useRef } from "react";

type MotionInViewProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export default function MotionInView({
  children,
  className,
  delay = 0,
  y = 24,
}: MotionInViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Render visible by default so content remains usable and crawlable without
  // JavaScript. Sections below the initial viewport are hidden only after
  // hydration, then revealed as they approach the viewport.

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const alreadyNearViewport =
      rect.top <= window.innerHeight + 80 && rect.bottom >= -80;
    if (alreadyNearViewport) return;

    element.style.opacity = "0";
    element.style.transform = `translateY(${y}px)`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
        observer.disconnect();
      },
      { rootMargin: "80px 0px", threshold: 0.05 },
    );
    observer.observe(element);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveal = () => {
      if (reduced.matches) {
        element.style.opacity = "1"; element.style.transform = "translateY(0)";
        observer.disconnect();
      }
    };
    reduced.addEventListener("change", reveal);
    return () => {
      observer.disconnect(); reduced.removeEventListener("change", reveal);
      element.style.opacity = "1"; element.style.transform = "translateY(0)";
    };
  }, [y]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 1,
        transform: "translateY(0)",
        transition: `opacity 600ms ease-out ${delay}s, transform 600ms ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
