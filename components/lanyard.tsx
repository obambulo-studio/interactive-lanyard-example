"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  type RapierRigidBody,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: Record<string, unknown>;
    meshLineMaterial: Record<string, unknown>;
  }
}

useGLTF.preload("/tag.glb");
useTexture.preload("/lanyard.png");

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 25 }}>
      <ambientLight intensity={1} />
      <directionalLight intensity={3} position={[5, 5, 5]} />
      <directionalLight intensity={3} position={[-5, 3, 3]} />
      <Physics gravity={[0, -40, 0]} interpolate timeStep={1 / 60}>
        <Band />
      </Physics>
    </Canvas>
  );
}

const segmentProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
} as const;

function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null);
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RapierRigidBody>(null);
  const j2 = useRef<RapierRigidBody>(null);
  const j3 = useRef<RapierRigidBody>(null);
  const card = useRef<RapierRigidBody>(null);
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);
  const { viewport } = useThree();

  // Scale lineWidth inversely with viewport width to maintain consistent appearance
  // Smaller viewports get proportionally larger lineWidth
  const lineWidth = useMemo(() => {
    const baseWidth = 10; // Base viewport width (viewport is in world units)
    const baseLineWidth = 1;
    // Scale up lineWidth for smaller viewports
    const scale = Math.max(1, baseWidth / Math.max(viewport.width, 3));
    return baseLineWidth * scale;
  }, [viewport.width]);

  const { nodes, materials } = useGLTF("/tag.glb");
  const texture = useTexture("/lanyard.png");

  // Type guard to check if an object is a THREE.Mesh
  const isMesh = (obj: THREE.Object3D | undefined): obj is THREE.Mesh => {
    return obj !== undefined && obj.type === "Mesh";
  };

  // Type guard to check if a material has a map property
  const hasMap = (
    material: THREE.Material | undefined
  ): material is THREE.Material & { map: THREE.Texture | null } => {
    return material !== undefined && "map" in material;
  };

  // Get the first available material or use the card's material if it exists
  const cardMaterial =
    (isMesh(nodes.card) && nodes.card.material instanceof THREE.Material
      ? nodes.card.material
      : undefined) ?? Object.values(materials)[0];

  const cardMap = hasMap(cardMaterial) ? cardMaterial.map : null;

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  useRopeJoint(
    fixed as RefObject<RapierRigidBody>,
    j1 as RefObject<RapierRigidBody>,
    [[0, 0, 0], [0, 0, 0], 1]
  );
  useRopeJoint(
    j1 as RefObject<RapierRigidBody>,
    j2 as RefObject<RapierRigidBody>,
    [[0, 0, 0], [0, 0, 0], 1]
  );
  useRopeJoint(
    j2 as RefObject<RapierRigidBody>,
    j3 as RefObject<RapierRigidBody>,
    [[0, 0, 0], [0, 0, 0], 1]
  );
  useSphericalJoint(
    j3 as RefObject<RapierRigidBody>,
    card as RefObject<RapierRigidBody>,
    [
      [0, 0, 0],
      [0, 1.45, 0],
    ]
  );

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
    }
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (
      !(
        fixed.current &&
        j1.current &&
        j2.current &&
        j3.current &&
        band.current &&
        card.current
      )
    ) {
      return;
    }

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      for (const ref of [card, j1, j2, j3, fixed]) {
        ref.current?.wakeUp();
      }
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    const [j1Lerped, j2Lerped] = [j1, j2].map((ref) => {
      if (ref.current) {
        const lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, lerped.distanceTo(ref.current.translation()))
        );
        return lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      }
      return undefined;
    });

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2Lerped ?? j2.current.translation());
    curve.points[2].copy(j1Lerped ?? j1.current.translation());
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(curve.getPoints(32));

    ang.copy(card.current.angvel());
    rot.copy(card.current.rotation());
    card.current.setAngvel(
      { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
      false
    );
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            onPointerDown={(e) => {
              (e.target as Element)?.setPointerCapture(e.pointerId);
              if (card.current) {
                setDragged(
                  new THREE.Vector3()
                    .copy(e.point)
                    .sub(vec.copy(card.current.translation()))
                );
              }
            }}
            onPointerOut={() => hover(false)}
            onPointerOver={() => hover(true)}
            onPointerUp={(e) => {
              (e.target as Element)?.releasePointerCapture(e.pointerId);
              setDragged(false);
            }}
            position={[0, -1.25, -0.05]}
            scale={2.25}
          >
            {isMesh(nodes.card) && (
              <mesh geometry={nodes.card.geometry}>
                <meshPhysicalMaterial
                  clearcoat={0.5}
                  clearcoatRoughness={0.3}
                  {...(cardMap && { map: cardMap, "map-anisotropy": 16 })}
                  metalness={1}
                  roughness={0.5}
                />
              </mesh>
            )}
            {isMesh(nodes.clip) && (
              <mesh geometry={nodes.clip.geometry}>
                <meshPhysicalMaterial
                  color="black"
                  metalness={1}
                  reflectivity={0.5}
                  roughness={0.5}
                />
              </mesh>
            )}
            {isMesh(nodes.clamp) && (
              <mesh geometry={nodes.clamp.geometry}>
                <meshPhysicalMaterial
                  color="black"
                  metalness={1}
                  reflectivity={0.5}
                  roughness={0.5}
                />
              </mesh>
            )}
          </group>
        </RigidBody>
      </group>
      <mesh ref={band} renderOrder={1}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={true}
          depthWrite={false}
          lineWidth={lineWidth}
          map={texture}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
          repeat={new THREE.Vector2(-3, 1)}
          resolution={new THREE.Vector2(2, 1)}
          useMap={1}
        />
      </mesh>
    </>
  );
}
