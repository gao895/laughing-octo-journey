'use client';

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { FloorPattern } from '@/lib/gallery/templates';

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

/** Irregular stone pavement (Castle Town floor). */
export function stoneTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#4a4744';
    ctx.fillRect(0, 0, s, s);
    const rows = 4;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      let x = r % 2 ? -h / 2 : 0;
      let i = 0;
      while (x < s) {
        const w = h * (0.9 + ((r * 7 + i * 3) % 5) * 0.15);
        ctx.fillStyle = base;
        ctx.globalAlpha = 0.85 + ((r + i) % 3) * 0.05;
        ctx.fillRect(x + 3, r * h + 3, w - 6, h - 6);
        x += w;
        i++;
      }
    }
    ctx.globalAlpha = 1;
  });
}

/** Moss and grass (Forest floor). */
export function grassTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const light = (i * 37) % 3 === 0;
      ctx.fillStyle = light ? 'rgba(190,220,120,0.35)' : 'rgba(30,60,20,0.3)';
      const x = (i * 71) % s;
      const y = (i * 131) % s;
      ctx.fillRect(x, y, 1.5, 3 + (i % 4));
    }
  });
}

/** Whitewashed deck boards (Seaside floor). */
export function deckTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const board = s / 6;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(90,70,40,${0.04 + (i % 3) * 0.03})`;
      ctx.fillRect(i * board, 0, board, s);
      ctx.fillStyle = 'rgba(60,45,30,0.35)';
      ctx.fillRect(i * board, 0, 2, s);
      ctx.fillRect(i * board, ((i * 89) % s) + 20, board, 1.5);
    }
  });
}

/** Polished concrete with faint speckles (Simple floor). */
export function concreteTexture(base: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect((i * 53) % s, (i * 97) % s, 2, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, s, 1);
    ctx.fillRect(0, 0, 1, s);
  });
}

/** Namako-kabe: black tiles joined by raised white plaster in a diagonal grid (Castle Town walls). */
export function namakoTexture() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#23262b';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#eeeae0';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, s / 2);
    ctx.lineTo(s / 2, 0);
    ctx.lineTo(s, s / 2);
    ctx.lineTo(s / 2, s);
    ctx.closePath();
    ctx.stroke();
  });
}

const FLOORS: Record<FloorPattern, (base: string) => ReturnType<typeof canvasTexture>> = {
  wood: woodTexture,
  tatami: tatamiTexture,
  stars: starFloorTexture,
  stone: stoneTexture,
  grass: grassTexture,
  deck: deckTexture,
  concrete: concreteTexture,
};

export function floorTexture(pattern: FloorPattern, base: string) {
  return FLOORS[pattern](base);
}
