'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';

/** Adjusts the field of view so portrait phones still see enough of the room. */
export function GalleryCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(s.size.height, 1));

  useEffect(() => {
    camera.fov = aspect < 0.8 ? 78 : aspect < 1.2 ? 70 : 62;
    camera.near = 0.05;
    camera.far = 200;
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  return null;
}
