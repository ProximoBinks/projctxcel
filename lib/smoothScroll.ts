// The browser's native smooth scroll has a fixed, fast speed, which feels like
// the page zipping away on long jumps (hero → enquiry form). This glides
// instead: the duration grows with distance, capped, with a quick run-up and a
// long ease-out.

const MIN_DURATION_MS = 500;
const MAX_DURATION_MS = 1100;
const MS_PER_PIXEL = 0.3;

let cancelActive: (() => void) | null = null;

// Speed ramps up over the first RAMP of the glide, then slows evenly to a stop
// (peak 2× the average speed). Starting at full speed made the page lurch:
// the click reliably costs a dropped frame or two, which at top speed is a
// several-hundred-pixel jump.
const RAMP = 0.12;
const easeRampOut = (t: number) =>
  t < RAMP ? (t * t) / RAMP : RAMP + (2 * (t - RAMP) - (t * t - RAMP * RAMP)) / (1 - RAMP);

// Where the element lands, honouring its `scroll-mt-*` offset for the sticky header.
function destinationFor(target: HTMLElement, margin: number) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const top = target.getBoundingClientRect().top + window.scrollY - margin;
  return Math.max(0, Math.min(top, maxScroll));
}

export function smoothScrollToElement(target: HTMLElement) {
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  glideTo(() => destinationFor(target, margin));
}

export function smoothScrollToTop() {
  glideTo(() => 0);
}

// `destination` is re-read every frame, so it can track a target that moves.
function glideTo(destination: () => number) {
  cancelActive?.();

  const start = window.scrollY;
  const distance = Math.abs(destination() - start);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || distance < 2) {
    window.scrollTo({ top: destination(), behavior: "instant" });
    return;
  }

  const duration = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, distance * MS_PER_PIXEL));
  const startTime = performance.now();
  let frame = 0;

  // Hand control back if the visitor scrolls themselves mid-glide.
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
    if (cancelActive === stop) cancelActive = null;
  };
  cancelActive = stop;
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration);
    // Re-measure each frame so lazily loaded sections above the target don't
    // leave the glide short of it.
    const end = destination();
    // "instant" bypasses the global `scroll-behavior: smooth` for each frame.
    window.scrollTo({ top: start + (end - start) * easeRampOut(progress), behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
}
