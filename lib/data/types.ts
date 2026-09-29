import type { Artwork, ArtworkUpdate, PreparedImage } from '@/types/artwork';
import type {
  Gallery,
  GallerySummary,
  GalleryUpdate,
  GalleryWithArtworks,
  LayoutMode,
  TemplateId,
} from '@/types/gallery';
import type { AppUser } from '@/types/profile';

export interface PublishedGalleryCard {
  gallery: Gallery;
  authorName: string;
  artworkCount: number;
}

export interface NewGalleryInput {
  title: string;
  description?: string;
  artist_name?: string;
  template: TemplateId;
  layout_mode: LayoutMode;
}

export interface NewArtworkInput {
  title: string;
  description: string;
  order_index: number;
}

/**
 * Data access used by the UI. There are two implementations:
 *  - SupabaseRepository: production (Auth + PostgreSQL + Storage, protected by RLS)
 *  - DemoRepository: browser-only fallback when Supabase is not configured
 */
export interface GalleryRepository {
  readonly mode: 'supabase' | 'demo';

  getUser(): Promise<AppUser | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ needsEmailConfirmation: boolean }>;
  signOut(): Promise<void>;

  listMyGalleries(): Promise<(GallerySummary & { visit_count: number })[]>;
  listPublishedGalleries(limit?: number): Promise<PublishedGalleryCard[]>;
  /** Returns null when the gallery does not exist or is not owned by the current user. */
  getGalleryForOwner(id: string): Promise<GalleryWithArtworks | null>;
  getPublishedGallery(slug: string): Promise<GalleryWithArtworks | null>;
  createGallery(input: NewGalleryInput): Promise<Gallery>;
  updateGallery(id: string, patch: GalleryUpdate): Promise<Gallery>;
  deleteGallery(id: string): Promise<void>;

  addArtwork(gallery: Gallery, image: PreparedImage, input: NewArtworkInput): Promise<Artwork>;
  updateArtworks(updates: { id: string; patch: ArtworkUpdate }[]): Promise<void>;
  deleteArtwork(artwork: Artwork): Promise<void>;

  uploadBgm(gallery: Gallery, file: File): Promise<string>;
  recordVisit(galleryId: string, visitorId: string): Promise<void>;
}
