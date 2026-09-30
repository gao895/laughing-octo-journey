import type { Artwork } from './artwork';

export type GalleryStatus = 'draft' | 'published' | 'private';

export type TemplateId =
  | 'white-museum'
  | 'starlight'
  | 'japanese'
  | 'castle-town'
  | 'forest'
  | 'seaside'
  | 'halloween'
  | 'simple';

/** 展示方法: auto = おまかせ, even = 均等に展示, large = 大きく展示, manual = 自分で配置 */
export type LayoutMode = 'auto' | 'even' | 'large' | 'manual';

export type LightingPreset = 'standard' | 'bright' | 'soft';

/**
 * Free-form settings kept in a jsonb column so future features (AI suggestions,
 * wall colours, multiplayer options, avatars…) can be added without migrations.
 */
export type FrameStyle = 'venue' | 'wood' | 'gold' | 'white' | 'black' | 'none';

export interface GallerySettings {
  /** '#rrggbb'; absent = the venue's own wall colour. */
  wallColor?: string;
  /** Absent = 'venue' (the venue's own frame). */
  frameStyle?: FrameStyle;
  /** Museum-style caption plate beside each artwork. Absent = shown. */
  showCaptions?: boolean;
  /** Real-photo 360° backdrop id (lib/gallery/backdrops.ts); absent = indoor venue. */
  backdrop?: string;
  [key: string]: unknown;
}

export interface Gallery {
  id: string;
  user_id: string;
  title: string;
  description: string;
  slug: string;
  /** 作者名 shown to visitors. Empty/null = the owner's display name. */
  artist_name: string | null;
  template: TemplateId;
  status: GalleryStatus;
  layout_mode: LayoutMode;
  lighting: LightingPreset;
  cover_image_url: string | null;
  bgm_url: string | null;
  settings: GallerySettings;
  created_at: string;
  updated_at: string;
}

export interface GallerySummary extends Gallery {
  artwork_count: number;
}

export interface GalleryWithArtworks {
  gallery: Gallery;
  artworks: Artwork[];
  authorName: string;
}

export type GalleryUpdate = Partial<
  Pick<
    Gallery,
    | 'title'
    | 'description'
    | 'artist_name'
    | 'template'
    | 'status'
    | 'layout_mode'
    | 'lighting'
    | 'cover_image_url'
    | 'bgm_url'
    | 'settings'
  >
>;
