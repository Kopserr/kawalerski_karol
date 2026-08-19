"use client";

import { useEffect, useState } from "react";

interface Tilt {
  rx: number; // rotateX degrees
  ry: number; // rotateY degrees
}

const MAX_DEG = 6;

function clamp(n: number, max: number) {
  return Math.max(-max, Math.min(max, n));
}

/** Subtle parallax tilt driven by phone orientation (BRIEF §5.2).
 * Falls back to {0,0} silently everywhere it isn't supported/granted —
 * this is a nice-to-have, never a requirement to interact with a tile. */
export function useDeviceTilt(): Tilt {
  const [tilt, setTilt] = useState<Tilt>({ rx: 0, ry: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.beta == null || e.gamma == null) return;
      // beta: front-back tilt [-180,180], gamma: left-right tilt [-90,90]
      const rx = clamp((e.beta - 45) * -0.15, MAX_DEG);
      const ry = clamp(e.gamma * 0.25, MAX_DEG);
      setTilt({ rx, ry });
    }

    window.addEventListener("deviceorientation", handleOrientation);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  return tilt;
}

/** Must be called from within a user gesture handler on iOS 13+. */
export async function requestTiltPermission(): Promise<void> {
  type DOEWithPermission = typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  const DOE = DeviceOrientationEvent as unknown as DOEWithPermission | undefined;
  if (DOE?.requestPermission) {
    try {
      await DOE.requestPermission();
    } catch {
      // ignore — tilt just won't be available
    }
  }
}
