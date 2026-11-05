// Keep long jumps at a readable speed instead of crossing the whole homepage
// in roughly a second. Smoothstep starts and ends at zero velocity, and its
// peak speed is only 1.5 times the average speed.

const MIN_DURATION_MS = 550;
const MAX_DURATION_MS = 4500;
const PIXELS_PER_SECOND = 3200;

let cancelActive: ((notify: boolean) => void) | null = null;
const afterScroll = new Set<() => void>();

const easeInOut = (t: number) => t * t * (3 - 2 * t);

function finishDeferredWork() {
  for (const task of afterScroll) {
    afterScroll.delete(task);
    task();
  }
}

// Defer route prefetching until the glide has ended.
export function runAfterSmoothScroll(task: () => void) {
  if (!cancelActive) {
    task();
    return () => {};
  }
  afterScroll.add(task);
  return () => afterScroll.delete(task);
}

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
  cancelActive?.(false);

  const start = window.scrollY;
  const distance = Math.abs(destination() - start);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || distance < 2) {
    window.scrollTo({ top: destination(), behavior: "instant" });
    finishDeferredWork();
    return;
  }

  const duration = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, distance / PIXELS_PER_SECOND * 1000));
  let elapsed = 0;
  let lastFrameTime = performance.now();
  let frame = 0;

  // Hand control back if the visitor scrolls themselves mid-glide.
  const stop = (notify: boolean) => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", interrupt);
    window.removeEventListener("touchstart", interrupt);
    window.removeEventListener("keydown", interrupt);
    if (cancelActive === stop) cancelActive = null;
    if (notify) finishDeferredWork();
  };
  const interrupt = () => stop(true);
  cancelActive = stop;
  window.addEventListener("wheel", interrupt, { passive: true });
  window.addEventListener("touchstart", interrupt, { passive: true });
  window.addEventListener("keydown", interrupt);

  const step = (now: number) => {
    // A busy main thread can skip frames. Limit the distance of the next frame
    // so a delayed image decode does not turn into a visible scroll jump.
    elapsed += Math.min(now - lastFrameTime, 48);
    lastFrameTime = now;
    const progress = Math.min(1, elapsed / duration);
    // Re-measure each frame so lazily loaded sections above the target don't
    // leave the glide short of it.
    const end = destination();
    // "instant" bypasses the global `scroll-behavior: smooth` for each frame.
    window.scrollTo({ top: start + (end - start) * easeInOut(progress), behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(step);
    else stop(true);
  };
  frame = requestAnimationFrame(step);
}
