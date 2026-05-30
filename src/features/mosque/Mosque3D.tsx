import { Canvas, useFrame } from "@react-three/fiber/native";
import { useRef } from "react";
import * as THREE from "three";

import type { MosquePart } from "@/stores/mosqueStore";

/**
 * Prosedürel düşük-poli 3D cami — "Camini İnşa Et" meta-oyunu (PROJECT PROFILE §3.C).
 *
 * Her cami parçası ilerlemeye göre belirir: kilitliyken yarı saydam "hayalet",
 * açılınca katı renkli + büyüyerek yerine oturur. Sahne yavaşça döner.
 *
 * Geometri primitiflerden (box/sphere/cylinder/torus) üretilir — harici 3D
 * model/asset gerekmez, offline-first'e uygun. Final üründe Blender modeliyle
 * değiştirilebilir; arayüz (unlockedParts) aynı kalır.
 */

const COLORS = {
  foundation: "#C9B89A",
  walls: "#F3E9D2",
  dome: "#2E8B9E",
  gold: "#F5A524",
  crescent: "#F5C24B",
  garden: "#6FB36A",
  door: "#9A6B3F",
} as const;

/** Tek bir parça: kilitli→hayalet, açık→katı; açılınca scale ile büyür. */
function Part({
  unlocked,
  children,
}: {
  unlocked: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const target = unlocked ? 1 : 0.001;
    // yumuşak büyüme/küçülme
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
  });

  // Kilitli parçalar küçük bir "hayalet" iz bırakır
  if (!unlocked) {
    return (
      <group scale={[0.001, 0.001, 0.001]} ref={ref}>
        {children}
      </group>
    );
  }
  return <group ref={ref}>{children}</group>;
}

/** Kilitli parçalar için yarı saydam hayalet izi (her zaman görünür hedef). */
function Ghost({ unlocked, children }: { unlocked: boolean; children: React.ReactNode }) {
  if (unlocked) return null;
  return <group scale={[0.97, 0.97, 0.97]}>{children}</group>;
}

function mat(color: string, opacity = 1) {
  return (
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      roughness={0.6}
      metalness={0.05}
    />
  );
}

/** Cami geometrisi — `has(part)` parçanın açık olup olmadığını söyler. */
function MosqueModel({ has }: { has: (p: MosquePart) => boolean }) {
  const group = useRef<THREE.Group>(null);

  // Yavaş otomatik dönüş
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.35;
  });

  const GHOST = 0.12;

  return (
    <group ref={group} position={[0, -1, 0]}>
      {/* Temel platform */}
      <Ghost unlocked={has("foundation")}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[3.2, 0.4, 3.2]} />
          {mat(COLORS.foundation, GHOST)}
        </mesh>
      </Ghost>
      <Part unlocked={has("foundation")}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.4, 3.2]} />
          {mat(COLORS.foundation)}
        </mesh>
      </Part>

      {/* Duvarlar (ana gövde) + kapı */}
      <Ghost unlocked={has("walls")}>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[2.2, 1.8, 2.2]} />
          {mat(COLORS.walls, GHOST)}
        </mesh>
      </Ghost>
      <Part unlocked={has("walls")}>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[2.2, 1.8, 2.2]} />
          {mat(COLORS.walls)}
        </mesh>
        <mesh position={[0, 1.0, 1.11]}>
          <boxGeometry args={[0.7, 1.2, 0.06]} />
          {mat(COLORS.door)}
        </mesh>
      </Part>

      {/* Çini bandı (dekoratif şerit) */}
      <Ghost unlocked={has("tiles")}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.32, 0.28, 2.32]} />
          {mat(COLORS.gold, GHOST)}
        </mesh>
      </Ghost>
      <Part unlocked={has("tiles")}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.32, 0.28, 2.32]} />
          {mat(COLORS.gold)}
        </mesh>
      </Part>

      {/* Kubbe */}
      <Ghost unlocked={has("dome")}>
        <mesh position={[0, 2.5, 0]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[1.15, 24, 16]} />
          {mat(COLORS.dome, GHOST)}
        </mesh>
      </Ghost>
      <Part unlocked={has("dome")}>
        <mesh position={[0, 2.5, 0]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[1.15, 24, 16]} />
          {mat(COLORS.dome)}
        </mesh>
      </Part>

      {/* İki minare */}
      {[-1.45, 1.45].map((x) => (
        <group key={x}>
          <Ghost unlocked={has("minaret")}>
            <mesh position={[x, 1.7, 0]}>
              <cylinderGeometry args={[0.22, 0.24, 3.4, 12]} />
              {mat(COLORS.walls, GHOST)}
            </mesh>
          </Ghost>
          <Part unlocked={has("minaret")}>
            <mesh position={[x, 1.7, 0]}>
              <cylinderGeometry args={[0.22, 0.24, 3.4, 12]} />
              {mat(COLORS.walls)}
            </mesh>
            <mesh position={[x, 3.55, 0]}>
              <coneGeometry args={[0.3, 0.6, 12]} />
              {mat(COLORS.dome)}
            </mesh>
          </Part>
        </group>
      ))}

      {/* Bahçe (köşelerde çalılar) */}
      <Ghost unlocked={has("garden")}>
        {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.5, z]}>
            <sphereGeometry args={[0.32, 12, 10]} />
            {mat(COLORS.garden, GHOST)}
          </mesh>
        ))}
      </Ghost>
      <Part unlocked={has("garden")}>
        {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.5, z]}>
            <sphereGeometry args={[0.32, 12, 10]} />
            {mat(COLORS.garden)}
          </mesh>
        ))}
      </Part>

      {/* Hilal (tepe finali) */}
      <Ghost unlocked={has("crescent")}>
        <group position={[0, 3.7, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            {mat(COLORS.crescent, GHOST)}
          </mesh>
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.06, 10, 20]} />
            {mat(COLORS.crescent, GHOST)}
          </mesh>
        </group>
      </Ghost>
      <Part unlocked={has("crescent")}>
        <group position={[0, 3.7, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            {mat(COLORS.crescent)}
          </mesh>
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.06, 10, 20]} />
            {mat(COLORS.crescent)}
          </mesh>
        </group>
      </Part>
    </group>
  );
}

export function Mosque3D({ unlockedParts }: { unlockedParts: MosquePart[] }) {
  const set = new Set(unlockedParts);
  const has = (p: MosquePart) => set.has(p);

  return (
    <Canvas camera={{ position: [4.5, 3.2, 5.5], fov: 42 }}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <MosqueModel has={has} />
    </Canvas>
  );
}
