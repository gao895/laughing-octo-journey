'use client';

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Wooden planks (White Museum floor). */
export function woodTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const plank = s / 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 2) * 0.05})`;
      ctx.fillRect(0, i * plank, s, plank);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, i * plank, s, 1.5);
      ctx.fillRect(((i * 97) % s) + 10, i * plank, 1.5, plank);
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(60,30,10,${0.05 + (i % 3) * 0.02})`;
      ctx.beginPath();
      const y = (i * 37) % s;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s / 3, y + 3, (2 * s) / 3, y - 3, s, y);
      ctx.stroke();
    }
  });
}

/** Tatami mats with dark borders (Japanese Gallery floor). */
export function tatamiTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(80,90,30,0.25)';
    for (let y = 0; y < s; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a3526';
    ctx.fillRect(0, 0, s, 8);
    ctx.fillRect(0, s / 2 - 4, s, 8);
    ctx.fillRect(0, 0, 8, s);
  });
}

/** Subtle speckled stone for the Starlight floor. */
export function starFloorTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(160,170,255,${((i * 13) % 10) / 60})`;
      ctx.fillRect((i * 53) % s, (i * 97) % s, 1.5, 1.5);
    }
  });
}
