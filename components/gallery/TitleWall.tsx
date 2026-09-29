'use client';

import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { TemplateStyle } from '@/lib/gallery/templates';

interface TitleWallProps {
  title: string;
  authorName: string;
  description: string;
  template: TemplateStyle;
  /** Wall surface Z; the panel faces +Z (towards the entrance). */
  z: number;
}

const W = 1024;
const H = 640;
const FONT = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

/** Splits text into lines that fit `maxWidth` (character based, so it works for Japanese). */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const ch of Array.from(paragraph)) {
      if (ctx.measureText(line + ch).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.slice(0, -1)}…`;
    return kept;
  }
  return lines;
}

/**
 * The exhibition's title panel on the far wall, like the entrance wall of a real
 * exhibition. Drawn with the 2D canvas so no web font has to be downloaded.
 */
export function TitleWall({ title, authorName, description, template, z }: TitleWallProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = template.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `600 76px ${FONT}`;
      const titleLines = wrap(ctx, title, W - 120, 2);
      let y = 120;
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, y);
        y += 96;
      }
      ctx.globalAlpha = 0.5;
      ctx.fillRect(W / 2 - 40, y + 10, 80, 2);
      ctx.globalAlpha = 0.85;
      y += 44;
      if (authorName) {
        ctx.font = `36px ${FONT}`;
        ctx.fillText(authorName, W / 2, y);
        y += 70;
      }
      if (description) {
        ctx.globalAlpha = 0.75;
        ctx.font = `28px ${FONT}`;
        for (const line of wrap(ctx, description, W - 220, 4)) {
          ctx.fillText(line, W / 2, y);
          y += 42;
        }
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [title, authorName, description, template.text]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 2.1, z + 0.02]}>
      <planeGeometry args={[4.4, 2.75]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}
