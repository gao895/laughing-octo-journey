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
}: {
  template: TemplateStyle;
  preset: LightingPreset;
  length: number;
}) {
  const m = PRESET_MULTIPLIER[preset];
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
