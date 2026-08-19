"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Share, SquarePlus, X } from "lucide-react";
import { haptics } from "@/lib/utils/haptics";

const SEEN_KEY = "lfd-install-prompt-seen";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** "Dodaj do ekranu głównego", shown once (BRIEF §11). Android/Chrome gets
 * the real install prompt; iOS Safari has no such API, so it gets the
 * manual Share → Add to Home Screen instructions instead. */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(SEEN_KEY)) return;

    if (isIOS()) {
      setIos(true);
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  }

  async function install() {
    haptics.tap();
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      deferredPrompt.current = null;
    }
    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="glass safe-bottom fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan/10">
            <SquarePlus className="size-5 text-cyan" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm text-off-white">Dodaj na ekran główny</p>
            {ios ? (
              <p className="text-xs text-fog">
                Stuknij <Share className="inline size-3" /> Udostępnij, potem „Dodaj do ekranu
                głównego&rdquo;.
              </p>
            ) : (
              <p className="text-xs text-fog">Pełny ekran, bez paska przeglądarki.</p>
            )}
          </div>
          {!ios && (
            <button
              onClick={install}
              className="shrink-0 rounded-xl bg-cyan/15 px-3 py-2 text-xs font-semibold text-cyan"
            >
              Zainstaluj
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Zamknij"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-fog"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
