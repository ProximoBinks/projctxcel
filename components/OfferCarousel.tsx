"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type OfferImage = {
  src: string;
  alt: string;
  /**
   * Which part of the letter stays in frame when the card crops it.
   * Two values: horizontal then vertical. "50% 50%" is dead centre.
   *   "50% 0%"    pin to the top      (show the letterhead)
   *   "50% 100%"  pin to the bottom
   *   "50% 30%"   a bit above centre
   * Keywords work too: "top", "center", "bottom left".
   */
  position?: string;
  /**
   * Zoom in on the letter. 1 = as-is, 1.25 = 25% closer, 0.9 = pulled back.
   * Zooming happens around `position`, so set that first, then zoom.
   */
  zoom?: number;
};

const ROTATE_MS = 3600;
const VISIBLE_EACH_SIDE = 2;

/** Per-step values, indexed by distance from the focused card. */
const STEP = [
  { shift: 0, scale: 1, rotate: 0, opacity: 1, blur: 0 },
  { shift: 40, scale: 0.88, rotate: 4, opacity: 0.9, blur: 0 },
  { shift: 72, scale: 0.76, rotate: 8, opacity: 0.6, blur: 1.5 },
];

/**
 * An overlapping fan of offer letters that cycles the focused card.
 *
 * Every image is pre-padded to the same 3:4 shape, so the cards stack evenly.
 * Neighbours stay legible rather than being reduced to slivers behind the
 * front card — the point of the section is how many offers there are.
 */
export default function OfferCarousel({ items }: { items: OfferImage[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const visible = items.filter((item) => !broken.has(item.src));
  const count = visible.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion || count <= 1) return;
    const id = setInterval(
      () => setActive((index) => (index + 1) % count),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [paused, prefersReducedMotion, count]);

  useEffect(() => {
    if (count > 0 && active >= count) setActive(0);
  }, [count, active]);

  const markBroken = useCallback((src: string) => {
    setBroken((previous) => new Set(previous).add(src));
  }, []);

  // Signed distance from the focused card, wrapped so the fan is circular.
  const positionFromActive = (index: number) => {
    let position = index - active;
    if (position > count / 2) position -= count;
    if (position < -count / 2) position += count;
    return position;
  };

  if (count === 0) return null;

  return (
    <div
      data-testid="offer-wall"
      className="mx-auto mt-12 w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-[280px] sm:h-[400px] lg:h-[520px]">
        {visible.map((item, index) => {
          const position = positionFromActive(index);
          const distance = Math.abs(position);
          const onScreen = distance <= VISIBLE_EACH_SIDE;
          const step = STEP[Math.min(distance, STEP.length - 1)];
          const direction = Math.sign(position);

          return (
            <button
              key={item.src}
              type="button"
              aria-label={`Show ${item.alt}`}
              aria-current={distance === 0}
              aria-hidden={!onScreen}
              tabIndex={onScreen ? 0 : -1}
              onClick={() => setActive(index)}
              className="absolute left-1/2 top-1/2 w-[290px] cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2455C2] sm:w-[460px] lg:w-[620px]"
              style={{
                zIndex: 20 - distance,
                transform: `translate(-50%, -50%) translateX(${
                  direction * step.shift
                }%) rotate(${direction * step.rotate}deg) scale(${step.scale})`,
                opacity: onScreen ? step.opacity : 0,
                filter: step.blur ? `blur(${step.blur}px)` : undefined,
                pointerEvents: onScreen ? "auto" : "none",
                transition: prefersReducedMotion
                  ? "opacity 200ms linear"
                  : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease, filter 600ms ease",
              }}
            >
              {/* The wrapper is the card and does the clipping, so `zoom` can
                  scale the image inside it without escaping the rounded edge. */}
              <span
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white"
                style={{
                  boxShadow:
                    distance === 0
                      ? "0 30px 60px -12px rgba(15,23,42,0.30), 0 8px 20px -8px rgba(15,23,42,0.18)"
                      : "0 18px 40px -16px rgba(15,23,42,0.22)",
                }}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 620px, (min-width: 640px) 460px, 290px"
                  onError={() => markBroken(item.src)}
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: item.position ?? "50% 50%",
                    transform:
                      item.zoom && item.zoom !== 1
                        ? `scale(${item.zoom})`
                        : undefined,
                    transformOrigin: item.position ?? "50% 50%",
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <span className="sr-only" aria-live="polite">
        Showing: {visible[active]?.alt}
      </span>
    </div>
  );
}
