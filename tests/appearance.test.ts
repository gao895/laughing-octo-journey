import { describe, expect, it } from 'vitest';
import { applyAppearance, frameFor, luminance, readAppearance } from '@/lib/gallery/appearance';
import { TEMPLATES } from '@/lib/gallery/templates';
import type { GallerySettings } from '@/types/gallery';

describe('readAppearance', () => {
  it('defaults to the venue look with captions shown', () => {
    expect(readAppearance({})).toEqual({
      wallColor: null,
      frameStyle: 'venue',
      showCaptions: true,
    });
    expect(readAppearance(null).showCaptions).toBe(true);
  });

  it('rejects invalid values coming from the database', () => {
    // Simulates a tampered row: values outside the allowed types.
    const a = readAppearance({
      wallColor: 'red; background:url(x)',
      frameStyle: 'diamond',
      showCaptions: false,
    } as unknown as GallerySettings);
    expect(a).toEqual({ wallColor: null, frameStyle: 'venue', showCaptions: false });
    expect(readAppearance({ wallColor: '#AABBCC' }).wallColor).toBe('#aabbcc');
  });
});

describe('applyAppearance', () => {
  const museum = TEMPLATES['white-museum'];
  it('keeps the venue untouched without a wall colour', () => {
    expect(applyAppearance(museum, readAppearance({}))).toBe(museum);
  });
  it('switches title text to light on dark walls and dark on light walls', () => {
    expect(applyAppearance(museum, readAppearance({ wallColor: '#1f2a44' })).text).toBe('#f5f1e6');
    expect(applyAppearance(museum, readAppearance({ wallColor: '#f4f2ee' })).text).toBe('#26221e');
    expect(luminance('#ffffff')).toBeCloseTo(1);
    expect(luminance('#000000')).toBeCloseTo(0);
  });
});

describe('frameFor', () => {
  it('uses the venue frame by default and removes it for "none"', () => {
    const museum = TEMPLATES['white-museum'];
    expect(frameFor(museum, readAppearance({})).color).toBe(museum.frame);
    expect(frameFor(museum, readAppearance({ frameStyle: 'none' })).border).toBe(0);
    expect(frameFor(museum, readAppearance({ frameStyle: 'gold' })).border).toBeGreaterThan(0);
  });
});
