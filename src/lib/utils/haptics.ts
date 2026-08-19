/** Thin wrapper around navigator.vibrate — safe to call anywhere (SSR, unsupported browsers). */
export function vibrate(pattern: number | number[]): void {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — some browsers throw when tab isn't focused
  }
}

export const haptics = {
  tap: () => vibrate(12),
  success: () => vibrate([10, 40, 20]),
  error: () => vibrate([30, 30, 30]),
  bingo: () => vibrate([15, 30, 15, 30, 40]),
};
