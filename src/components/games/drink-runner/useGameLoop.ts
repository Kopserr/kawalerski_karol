"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { DrinkRunnerEngine, DESIGN_H, DESIGN_W, WOBBLE_MAX } from "./Engine";
import { renderFrame, type Assets } from "./Renderer";

const FIXED_DT = 1 / 120; // decoupled from display refresh rate (BRIEF §7.1)
const MAX_FRAME = 0.25; // clamp the accumulator after a tab-switch stall
const WIN_DRINKS = DrinkRunnerEngine.winDrinks;

/**
 * requestAnimationFrame loop with a fixed-timestep accumulator, so physics
 * behave identically at 60Hz and 120Hz (BRIEF §7.1). The "upojenie" camera
 * work (wobble + rotation + edge chromatic tint + vignette + death tint) is
 * a 1:1 port of the prototype's render() wrapper — canvas transforms and
 * screen-blend gradients, not a CSS filter on the element.
 */
export function useGameLoop(
  engine: DrinkRunnerEngine,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  assetsRef: RefObject<Assets>,
) {
  const runningRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = DESIGN_W * dpr;
    canvas.height = DESIGN_H * dpr;

    let last = performance.now();
    let accumulator = 0;
    let raf = 0;
    let t = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!runningRef.current) return;

      let frameTime = (now - last) / 1000;
      last = now;
      frameTime = Math.min(frameTime, MAX_FRAME);
      accumulator += frameTime;

      while (accumulator >= FIXED_DT) {
        engine.step(FIXED_DT);
        accumulator -= FIXED_DT;
        t += FIXED_DT;
      }

      if (!ctx || !canvas) return;

      const drunk = engine.drinksCollected / WIN_DRINKS;
      const wob = drunk * WOBBLE_MAX;
      const ox = Math.sin(t * 1.7) * wob + Math.sin(t * 3.1) * wob * 0.45;
      const oy = Math.cos(t * 1.25) * wob * 0.6;
      const rot = Math.sin(t * 0.9) * drunk * 0.018;
      const sk = engine.screenShakeAmount();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.translate(DESIGN_W / 2, DESIGN_H / 2);
      ctx.rotate(rot + (sk ? (Math.random() - 0.5) * 0.03 : 0));
      ctx.translate(-DESIGN_W / 2, -DESIGN_H / 2);
      ctx.translate(
        ox + (sk ? (Math.random() - 0.5) * 22 * sk : 0),
        oy + (sk ? (Math.random() - 0.5) * 22 * sk : 0),
      );

      renderFrame(ctx, engine, assetsRef.current, t);
      ctx.restore();

      // chromatic-ish edge tint at high "upojenie" — screen-blended color
      // wash at the left/right edges, prototype's cheap stand-in for
      // per-channel chromatic aberration.
      if (drunk > 0.35) {
        const a = (drunk - 0.35) * 0.3;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const gl = ctx.createLinearGradient(0, 0, DESIGN_W * 0.42, 0);
        gl.addColorStop(0, `rgba(255,45,155,${a})`);
        gl.addColorStop(1, "rgba(255,45,155,0)");
        ctx.fillStyle = gl;
        ctx.fillRect(0, 0, DESIGN_W * 0.42, DESIGN_H);
        const gr = ctx.createLinearGradient(DESIGN_W, 0, DESIGN_W * 0.58, 0);
        gr.addColorStop(0, `rgba(34,228,255,${a})`);
        gr.addColorStop(1, "rgba(34,228,255,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(DESIGN_W * 0.58, 0, DESIGN_W * 0.42, DESIGN_H);
        ctx.restore();
      }

      // vignette — deepens as "upojenie" grows
      const vg = ctx.createRadialGradient(
        DESIGN_W / 2,
        DESIGN_H / 2,
        Math.min(DESIGN_W, DESIGN_H) * 0.32,
        DESIGN_W / 2,
        DESIGN_H / 2,
        Math.max(DESIGN_W, DESIGN_H) * 0.75,
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, `rgba(0,0,0,${(0.55 + drunk * 0.2).toFixed(3)})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

      if (engine.status === "gameover") {
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = "#2A0B12";
        ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
        ctx.restore();
      }
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    function onVisibility() {
      runningRef.current = document.visibilityState === "visible";
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
}
