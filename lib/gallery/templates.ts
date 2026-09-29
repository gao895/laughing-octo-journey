import type { TemplateId } from '@/types/gallery';

export interface TemplateStyle {
  id: TemplateId;
  /** Only available templates can be chosen in the MVP. */
  available: boolean;
  background: string;
  wall: string;
  floor: string;
  ceiling: string;
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
  /** Spot-like emphasis on artworks (0 = none). */
  artworkGlow: number;
  fog: { color: string; near: number; far: number } | null;
  /** CSS gradient used for the template card preview. */
  preview: string;
}

// Base values reused by templates that are not implemented yet.
const TEMPLATES_BASE: Omit<TemplateStyle, 'id' | 'available' | 'preview'> = {
  background: '#e9e6e1',
  wall: '#f4f2ee',
  floor: '#9a9a9a',
  ceiling: '#fafafa',
  frame: '#2b2b2b',
  accent: '#d8d2c8',
  text: '#2b2b2b',
  ambient: 0.55,
  hemiSky: '#ffffff',
  hemiGround: '#999999',
  keyLight: '#ffffff',
  keyIntensity: 1,
  artworkGlow: 0.2,
  fog: null,
};

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
    ceiling: '#fafafa',
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
    ceiling: '#05060f',
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
    ceiling: '#5a3e28',
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
  'castle-town': placeholder('castle-town', '#8a8f99'),
  forest: placeholder('forest', '#3f6b45'),
  seaside: placeholder('seaside', '#5aa6c9'),
  halloween: placeholder('halloween', '#e0782d'),
  simple: placeholder('simple', '#c9c9c9'),
};

function placeholder(id: TemplateId, color: string): TemplateStyle {
  return {
    ...TEMPLATES_BASE,
    id,
    available: false,
    preview: `linear-gradient(160deg,${color} 0%,#2a2a2a 100%)`,
  };
}
