'use client';

import type { LightingPreset } from '@/types/gallery';
import type { TemplateStyle } from '@/lib/gallery/templates';

const PRESET_MULTIPLIER: Record<LightingPreset, number> = {
  standard: 1,
  bright: 1.4,
  soft: 0.7,
};

/**
 * Deliberately few lights (ambient + hemisphere + one directional) to keep the
 * scene light on phones. Artworks get extra brightness through emissive maps instead
 * of individual spotlights.
 */
export function GalleryLighting({
  template,
  preset,
  length,
  outdoor = false,
  sun = 0.9,
}: {
  template: TemplateStyle;
  preset: LightingPreset;
  length: number;
  /** A real-photo backdrop lights the scene; keep only a neutral fill and a sun. */
  outdoor?: boolean;
  /** Outdoor sun strength (per backdrop). */
  sun?: number;
}) {
  const m = PRESET_MULTIPLIER[preset];
  if (outdoor) {
    return (
      <>
        <ambientLight intensity={0.15 * m} />
        <directionalLight
          position={[3, 10, 2]}
          target-position={[0, 0, -length / 2]}
          intensity={sun * m}
        />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={template.ambient * m} />
      <hemisphereLight args={[template.hemiSky, template.hemiGround, 0.9 * m]} />
      <directionalLight
        position={[2, 8, 4]}
        target-position={[0, 0, -length / 2]}
        color={template.keyLight}
        intensity={template.keyIntensity * m}
      />
    </>
  );
}
