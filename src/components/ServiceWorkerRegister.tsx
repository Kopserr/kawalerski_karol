"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // avoid caching dev's ever-changing chunks
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // offline support just won't be available — never block the app on it
    });
  }, []);

  return null;
}
