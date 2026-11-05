// Runs `task` once the browser is idle after load (Safari has no
// requestIdleCallback, so it falls back to a short timer). Returns a cleanup.
export function whenIdle(task: () => void) {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(task, 2000);
  return () => clearTimeout(id);
}
