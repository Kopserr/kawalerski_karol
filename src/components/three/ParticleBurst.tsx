"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BurstProps {
  color: string;
  count: number;
  durationMs: number;
  onDone?: () => void;
}

function Burst({ color, count, durationMs, onDone }: BurstProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const velocities = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 2.4;
      arr[i * 3] = Math.cos(theta) * speed;
      arr[i * 3 + 1] = Math.sin(theta) * speed;
      arr[i * 3 + 2] = (Math.random() - 0.5) * speed * 0.6;
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const elapsed = useRef(0);
  const finished = useRef(false);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;
    const durationS = durationMs / 1000;
    const geo = pointsRef.current?.geometry;
    if (geo) {
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.array[i * 3] = velocities[i * 3] * t;
        posAttr.array[i * 3 + 1] = velocities[i * 3 + 1] * t - 0.9 * t * t;
        posAttr.array[i * 3 + 2] = velocities[i * 3 + 2] * t;
      }
      posAttr.needsUpdate = true;
    }
    const mat = pointsRef.current?.material as THREE.PointsMaterial | undefined;
    if (mat) mat.opacity = Math.max(0, 1 - t / durationS);

    if (t >= durationS && !finished.current) {
      finished.current = true;
      onDoneRef.current?.();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={1}
        depthWrite={false}
      />
    </points>
  );
}

export interface ParticleBurstProps {
  color?: string;
  count?: number;
  durationMs?: number;
  onDone?: () => void;
  className?: string;
}

/** A one-shot particle explosion, used at the reveal-flip midpoint (BRIEF
 * §5.3) and on tile completion (BRIEF §4.3 — "wybuch cząsteczek złota").
 * Default-exported for next/dynamic(ssr:false). */
export default function ParticleBurst({
  color = "#FFC24B",
  count = 90,
  durationMs = 650,
  onDone,
  className,
}: ParticleBurstProps) {
  useEffect(() => {
    if (durationMs <= 0) onDone?.();
  }, [durationMs, onDone]);

  return (
    <Canvas
      orthographic
      camera={{ zoom: 90, position: [0, 0, 10] }}
      gl={{ alpha: true, antialias: true }}
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <Burst color={color} count={count} durationMs={durationMs} onDone={onDone} />
    </Canvas>
  );
}
