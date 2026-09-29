import type { TemplateId } from '@/types/gallery';

export type FloorPattern = 'wood' | 'tatami' | 'stars' | 'stone' | 'grass' | 'deck' | 'concrete';

/**
 * Look of a venue. Geometry is shared (lib/gallery/layout.ts); each venue adds its
 * own decorations in components/gallery/venues/. To add a venue: add an entry here,
 * a decor component there, and its name in lib/i18n.
 */
export interface TemplateStyle {
  id: TemplateId;
  /** Set to false to show a venue as 「準備中」 in the picker. */
  available: boolean;
  background: string;
  wall: string;
  floor: string;
  floorPattern: FloorPattern | null;
  floorRoughness: number;
  floorMetalness: number;
  ceiling: string;
  /** No ceiling: the sky (and whatever the venue puts in it) is visible. */
  openSky: boolean;
  frame: string;
  /** Accent used for trims, lanterns, baseboards. */
  accent: string;
  /** Text colour of the exhibition title wall. */
  text: string;
  ambient: number;
  hemiSky: string;
  hemiGround: string;
  keyLight: string;
  keyIntensity: number;
  /** Self-illumination of artworks so they read well without extra lights. */
  artworkGlow: number;
  fog: { color: string; near: number; far: number } | null;
  /** CSS gradient used for the template card preview. */
  preview: string;
}

export const TEMPLATE_ORDER: TemplateId[] = [
  'white-museum',
  'starlight',
  'japanese',
  'castle-town',
  'forest',
  'seaside',
  'halloween',
  'simple',
];

export function getTemplate(id: string): TemplateStyle {
  return TEMPLATES[id as TemplateId] ?? TEMPLATES['white-museum'];
}

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && value in TEMPLATES;
}

export const TEMPLATES: Record<TemplateId, TemplateStyle> = {
  'white-museum': {
    id: 'white-museum',
    available: true,
    background: '#e9e6e1',
    wall: '#f4f2ee',
    floor: '#b98f62',
    floorPattern: 'wood',
    floorRoughness: 0.85,
    floorMetalness: 0,
    ceiling: '#fafafa',
    openSky: false,
    frame: '#2b2b2b',
    accent: '#d8d2c8',
    text: '#2b2b2b',
    ambient: 0.55,
    hemiSky: '#ffffff',
    hemiGround: '#b7a58f',
    keyLight: '#fff8ee',
    keyIntensity: 1.1,
    artworkGlow: 0.25,
    fog: null,
    preview: 'linear-gradient(160deg,#fbfaf7 0%,#e7e2da 60%,#b98f62 100%)',
  },
  starlight: {
    id: 'starlight',
    available: true,
    background: '#05060f',
    wall: '#2a3068',
    floor: '#1a1e44',
    floorPattern: 'stars',
    floorRoughness: 0.35,
    floorMetalness: 0.25,
    ceiling: '#05060f',
    openSky: true,
    frame: '#d9c38a',
    accent: '#3b4380',
    text: '#e9e4ff',
    ambient: 0.5,
    hemiSky: '#aab8ff',
    hemiGround: '#1a1640',
    keyLight: '#c9d3ff',
    keyIntensity: 0.8,
    artworkGlow: 0.6,
    fog: { color: '#05060f', near: 14, far: 60 },
    preview: 'radial-gradient(circle at 30% 20%,#3b4a9a 0%,#141833 40%,#05060f 100%)',
  },
  japanese: {
    id: 'japanese',
    available: true,
    background: '#2a1d14',
    wall: '#efe6d2',
    floor: '#b7b27a',
    floorPattern: 'tatami',
    floorRoughness: 0.9,
    floorMetalness: 0,
    ceiling: '#5a3e28',
    openSky: false,
    frame: '#4a2f1b',
    accent: '#6b4a2f',
    text: '#3a2616',
    ambient: 0.45,
    hemiSky: '#ffe2b8',
    hemiGround: '#5a3e28',
    keyLight: '#ffd9a8',
    keyIntensity: 0.9,
    artworkGlow: 0.3,
    fog: null,
    preview: 'linear-gradient(160deg,#efe6d2 0%,#c9b58a 55%,#6b4a2f 100%)',
  },
  'castle-town': {
    id: 'castle-town',
    available: true,
    background: '#2c2f38',
    // White shikkui plaster above a black-and-white namako-kabe band.
    wall: '#f1ece1',
    floor: '#9a958c',
    floorPattern: 'stone',
    floorRoughness: 0.95,
    floorMetalness: 0,
    ceiling: '#3a2c22',
    openSky: false,
    frame: '#2a2522',
    accent: '#2f2622',
    text: '#2a2522',
    ambient: 0.5,
    hemiSky: '#fff1dc',
    hemiGround: '#4a3e34',
    keyLight: '#ffe6c4',
    keyIntensity: 0.95,
    artworkGlow: 0.28,
    fog: null,
    preview:
      'linear-gradient(180deg,#3a2c22 0%,#3a2c22 18%,#f1ece1 18%,#f1ece1 68%,#23262b 68%,#23262b 100%)',
  },
  forest: {
    id: 'forest',
    available: true,
    background: '#b9d8e6',
    wall: '#e2cfae',
    floor: '#5f7f43',
    floorPattern: 'grass',
    floorRoughness: 1,
    floorMetalness: 0,
    ceiling: '#e2cfae',
    openSky: true,
    frame: '#5b4128',
    accent: '#7a5a3a',
    text: '#3b2c1c',
    ambient: 0.5,
    hemiSky: '#e8f4ff',
    hemiGround: '#4d6b35',
    keyLight: '#fff1d0',
    keyIntensity: 1.15,
    artworkGlow: 0.22,
    fog: { color: '#cfe3d4', near: 16, far: 70 },
    preview: 'linear-gradient(180deg,#b9d8e6 0%,#7fa66a 45%,#3f6b45 70%,#5f7f43 100%)',
  },
  seaside: {
    id: 'seaside',
    available: true,
    background: '#8fcdec',
    wall: '#f8f6f1',
    floor: '#e2d3b6',
    floorPattern: 'deck',
    floorRoughness: 0.8,
    floorMetalness: 0,
    ceiling: '#f8f6f1',
    openSky: true,
    frame: '#1f4e79',
    accent: '#2f6f9f',
    text: '#1f4e79',
    ambient: 0.6,
    hemiSky: '#e6f6ff',
    hemiGround: '#d8c7a4',
    keyLight: '#fffaf0',
    keyIntensity: 1.2,
    artworkGlow: 0.2,
    fog: { color: '#bfe4f5', near: 25, far: 110 },
    preview:
      'linear-gradient(180deg,#8fcdec 0%,#cfeaf7 45%,#2f6f9f 45%,#2f6f9f 55%,#e2d3b6 55%,#e2d3b6 100%)',
  },
  halloween: {
    id: 'halloween',
    available: true,
    background: '#140b24',
    wall: '#3a2452',
    floor: '#3a2c22',
    floorPattern: 'wood',
    floorRoughness: 0.8,
    floorMetalness: 0,
    ceiling: '#140b24',
    openSky: true,
    frame: '#1d1128',
    accent: '#e0782d',
    text: '#ffb86b',
    ambient: 0.45,
    hemiSky: '#b99cff',
    hemiGround: '#2a1406',
    keyLight: '#ffcf9a',
    keyIntensity: 0.7,
    artworkGlow: 0.5,
    fog: { color: '#1b0f2e', near: 12, far: 50 },
    preview: 'radial-gradient(circle at 75% 20%,#fff2c0 0%,#fff2c0 8%,#3a2452 9%,#140b24 70%)',
  },
  simple: {
    id: 'simple',
    available: true,
    background: '#e4e4e1',
    wall: '#ebebe8',
    floor: '#b8b7b2',
    floorPattern: 'concrete',
    floorRoughness: 0.6,
    floorMetalness: 0.05,
    ceiling: '#f4f4f2',
    openSky: false,
    frame: '#1c1c1c',
    accent: '#c9c9c5',
    text: '#1c1c1c',
    ambient: 0.6,
    hemiSky: '#ffffff',
    hemiGround: '#a9a9a4',
    keyLight: '#ffffff',
    keyIntensity: 1,
    artworkGlow: 0.2,
    fog: null,
    preview: 'linear-gradient(160deg,#f4f4f2 0%,#ebebe8 60%,#b8b7b2 100%)',
  },
};
