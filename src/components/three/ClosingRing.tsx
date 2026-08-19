"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * The finale (BRIEF §5.5): "obrączka 3D zamykająca się wokół kamery" — a
 * gold ring that grows from a distant point until it swallows the camera.
 * No PerfGovernor here: it's a ~2.5s one-shot on a screen that's otherwise
 * static, so it's cheap enough to just always run at full quality.
 */
export default function ClosingRing() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, scene }) => {
        gl.setClearAlpha(0);
        scene.background = null;
      }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[2, 2, 4]} intensity={40} color="#FFC24B" />
      <Ring />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

function Ring() {
  const mesh = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const geometry = useMemo(() => new THREE.TorusGeometry(1, 0.16, 24, 80), []);

  useFrame((_, delta) => {
    elapsed.current = Math.min(2.6, elapsed.current + delta);
    const t = elapsed.current / 2.6;
    const eased = 1 - Math.pow(1 - t, 3);
    if (mesh.current) {
      const scale = 0.3 + eased * 14;
      mesh.current.scale.setScalar(scale);
      mesh.current.position.z = -3 + eased * 6;
      mesh.current.rotation.z += delta * 0.4;
      mesh.current.rotation.x = Math.PI / 2 + Math.sin(elapsed.current) * 0.05;
      const mat = mesh.current.material as THREE.MeshStandardMaterial;
      mat.opacity = t > 0.85 ? Math.max(0, 1 - (t - 0.85) / 0.15) : 1;
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color="#FFC24B"
        metalness={1}
        roughness={0.2}
        emissive="#FF8A3D"
        emissiveIntensity={0.4}
        transparent
      />
    </mesh>
  );
}
