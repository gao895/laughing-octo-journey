'use client';

import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

const W = 512;
const H = 176;
/** Plate size in metres (a typical museum wall label). */
export const PLATE_W = 0.5;
export const PLATE_H = (PLATE_W * H) / W;
const FONT = '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif';

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const chars = Array.from(text);
  while (chars.length > 1 && ctx.measureText(`${chars.join('')}…`).width > maxWidth) chars.pop();
  return `${chars.join('')}…`;
}

/** Museum-style caption (title + creator) hung beside an artwork. Drawn with the 2D canvas. */
export function CaptionPlate({
  title,
  artist,
  x,
  y,
}: {
  title: string;
  artist: string;
  x: number;
  y: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f7f5f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1f1d1a';
      ctx.textBaseline = 'top';
      ctx.font = `600 50px ${FONT}`;
      ctx.fillText(fit(ctx, title || '無題', W - 56), 28, 30);
      ctx.fillStyle = '#6a655d';
      ctx.font = `36px ${FONT}`;
      if (artist) ctx.fillText(fit(ctx, artist, W - 56), 28, 104);
    }
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [title, artist]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[x, y, 0.004]}>
      <planeGeometry args={[PLATE_W, PLATE_H]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
