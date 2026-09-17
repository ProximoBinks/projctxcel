"use client";

import { useEffect, useRef, useState } from "react";

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
  const [hiddenUntilInView, setHiddenUntilInView] = useState(false);

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

    setHiddenUntilInView(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHiddenUntilInView(false);
        observer.disconnect();
      },
      { rootMargin: "80px 0px", threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hiddenUntilInView ? 0 : 1,
        transform: hiddenUntilInView ? `translateY(${y}px)` : "translateY(0)",
        transition: `opacity 600ms ease-out ${delay}s, transform 600ms ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
