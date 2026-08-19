"use client";

import { useEffect, useRef } from "react";
import { DrinkRunnerEngine } from "./Engine";
import { useGameLoop } from "./useGameLoop";
import type { Assets } from "./Renderer";
import { DESIGN_W, DESIGN_H } from "./Engine";
import { sfx } from "@/lib/audio/sfx";
import { haptics } from "@/lib/utils/haptics";

interface DrinkRunnerCanvasProps {
  groomPhoto: string | null;
  bridePhoto: string | null;
  restartToken: number;
  onDrinkCollected: (count: number) => void;
  onGameOver: () => void;
  onWin: () => void;
}

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function DrinkRunnerCanvas({
  groomPhoto,
  bridePhoto,
  restartToken,
  onDrinkCollected,
  onGameOver,
  onWin,
}: DrinkRunnerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assetsRef = useRef<Assets>({ groomFace: null, brideFace: null });
  const engineRef = useRef<DrinkRunnerEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new DrinkRunnerEngine({
      onDrinkCollected: (n) => {
        sfx.chlup();
        haptics.tap();
        onDrinkCollected(n);
      },
      onGameOver: () => {
        sfx.error();
        haptics.error();
        onGameOver();
      },
      onWin: () => {
        sfx.chime();
        haptics.success();
        onWin();
      },
    });
  }
  const engine = engineRef.current;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadImage(groomPhoto), loadImage(bridePhoto)]).then(([groom, bride]) => {
      if (cancelled) return;
      assetsRef.current = { groomFace: groom, brideFace: bride };
    });
    return () => {
      cancelled = true;
    };
  }, [groomPhoto, bridePhoto]);

  useEffect(() => {
    if (restartToken > 0) engine.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartToken]);

  useGameLoop(engine, canvasRef, assetsRef);

  const pointerState = useRef({ startY: 0, ducked: false, active: false });

  function onPointerDown(e: React.PointerEvent) {
    pointerState.current = { startY: e.clientY, ducked: false, active: true };
    engine.requestJump();
  }
  function onPointerMove(e: React.PointerEvent) {
    const st = pointerState.current;
    if (!st.active || st.ducked) return;
    if (e.clientY - st.startY > 42) {
      st.ducked = true;
      engine.requestFastFallOrDuck();
    }
  }
  function onPointerUp() {
    pointerState.current.active = false;
    engine.releaseJump();
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="block h-full w-full touch-none [image-rendering:auto]"
      style={{ aspectRatio: `${DESIGN_W}/${DESIGN_H}` }}
    />
  );
}
