'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, useTexture } from '@react-three/drei';
import {
  BackSide,
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  type Mesh,
  type MeshBasicMaterial,
  type Texture,
} from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { BACKDROPS, backdropUrl, type BackdropId } from '@/lib/gallery/backdrops';

/** Height of the camera that took the photos, in metres (about eye level). */
const CAPTURE_HEIGHT = 1.8;
const SKY_RADIUS = 90;

/**
 * Real-photo 360° surroundings. The photo is shown with its original colours
 * (no tone mapping) and also lights the scene (image-based lighting). Open scenery
 * is projected onto the ground so it stays put while visitors walk; city scenes are
 * shown as a distant panorama instead.
 */
export function Backdrop({ id, centerZ }: { id: BackdropId; centerZ: number }) {
  const spec = BACKDROPS[id];
  const texture = useTexture(backdropUrl(id), (tex) => {
    tex.mapping = EquirectangularReflectionMapping;
    tex.colorSpace = SRGBColorSpace;
  });

  return (
    <>
      <Environment
        map={texture}
        environmentIntensity={spec.environmentIntensity}
        environmentRotation={[0, spec.rotationY, 0]}
      />
      {spec.grounded ? (
        <GroundedSky texture={texture} centerZ={centerZ} rotationY={spec.rotationY} />
      ) : (
        <DistantSky texture={texture} rotationY={spec.rotationY} />
      )}
    </>
  );
}

type SkyProps = { texture: Texture; rotationY: number };

function GroundedSky({ texture, centerZ, rotationY }: SkyProps & { centerZ: number }) {
  const skybox = useMemo(() => {
    const mesh = new GroundedSkybox(texture, CAPTURE_HEIGHT, SKY_RADIUS);
    (mesh.material as MeshBasicMaterial).toneMapped = false;
    return mesh;
  }, [texture]);
  useEffect(
    () => () => {
      skybox.geometry.dispose();
      (skybox.material as MeshBasicMaterial).dispose();
    },
    [skybox],
  );
  return (
    <primitive
      object={skybox}
      position={[0, CAPTURE_HEIGHT - 0.01, centerZ]}
      rotation-y={rotationY}
    />
  );
}

/** A sky sphere that travels with the camera, so the scenery looks infinitely far away. */
function DistantSky({ texture, rotationY }: SkyProps) {
  const mesh = useRef<Mesh>(null);
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} rotation-y={rotationY} renderOrder={-1}>
      <sphereGeometry args={[SKY_RADIUS, 64, 32]} />
      <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
