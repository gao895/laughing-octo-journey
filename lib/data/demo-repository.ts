'use client';

import type { Artwork, ArtworkUpdate, PreparedImage } from '@/types/artwork';
import type { Gallery, GalleryUpdate, GalleryWithArtworks } from '@/types/gallery';
import type { AppUser } from '@/types/profile';
import { createSlug } from '@/lib/gallery/slug';
import {
  sanitizeText,
  TITLE_MAX,
  DESCRIPTION_MAX,
  DISPLAY_NAME_MAX,
} from '@/lib/gallery/validation';
import { blobToDataUrl } from '@/lib/image/optimize';
import { SAMPLE_ARTWORKS, SAMPLE_GALLERY, svgToDataUrl } from '@/lib/demo/sample';
import { FriendlyError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import type {
  GalleryRepository,
  NewArtworkInput,
  NewGalleryInput,
  PublishedGalleryCard,
} from './types';

/**
 * Browser-only implementation used when Supabase is not configured.
 * Everything is stored in IndexedDB of the current browser, so it is meant for
 * trying the app locally — not for sharing with other people.
 */

interface DemoUser {
  id: string;
  email: string;
  displayName: string;
}

interface DemoState {
  version: 1;
  users: DemoUser[];
  galleries: Gallery[];
  artworks: Artwork[];
  visits: { gallery_id: string; visitor_id: string; visited_at: string }[];
}

const DB_NAME = 'my-virtual-gallery-demo';
const STORE = 'kv';
const STATE_KEY = 'state';
const SESSION_KEY = 'mvg-demo-session';
const SAMPLE_USER_ID = '00000000-0000-4000-8000-000000000001';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const now = () => new Date().toISOString();

function sampleState(): DemoState {
  const created = now();
  const galleryId = '00000000-0000-4000-8000-0000000000a1';
  const artworks: Artwork[] = SAMPLE_ARTWORKS.map((a, i) => {
    const url = svgToDataUrl(a.svg);
    return {
      id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
      gallery_id: galleryId,
      title: a.title,
      description: a.description,
      media_type: 'image',
      image_url: url,
      thumbnail_url: url,
      width: a.width,
      height: a.height,
      order_index: i,
      position_x: null,
      position_y: null,
      position_z: null,
      rotation_y: null,
      scale: null,
      created_at: created,
      updated_at: created,
    };
  });
  return {
    version: 1,
    users: [
      {
        id: SAMPLE_USER_ID,
        email: 'sample-author@demo.invalid',
        displayName: SAMPLE_GALLERY.authorName,
      },
    ],
    galleries: [
      {
        id: galleryId,
        user_id: SAMPLE_USER_ID,
        title: SAMPLE_GALLERY.title,
        description: SAMPLE_GALLERY.description,
        slug: SAMPLE_GALLERY.slug,
        template: 'starlight',
        status: 'published',
        layout_mode: 'auto',
        lighting: 'standard',
        cover_image_url: artworks[0]?.thumbnail_url ?? null,
        bgm_url: null,
        settings: {},
        created_at: created,
        updated_at: created,
      },
    ],
    artworks,
    visits: [],
  };
}

export class DemoRepository implements GalleryRepository {
  readonly mode = 'demo' as const;
  private cache: DemoState | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  private async load(): Promise<DemoState> {
    if (this.cache) return this.cache;
    const stored = await idbGet<DemoState>(STATE_KEY);
    this.cache = stored?.version === 1 ? stored : sampleState();
    if (!stored) await idbSet(STATE_KEY, this.cache);
    return this.cache;
  }

  /** Serialises writes so concurrent uploads never overwrite each other. */
  private mutate<T>(fn: (s: DemoState) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const state = await this.load();
      const result = await fn(state);
      try {
        await idbSet(STATE_KEY, state);
      } catch (e) {
        this.cache = null; // reload the last good state next time
        throw new FriendlyError(t.errors.storageFull, e);
      }
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private sessionUserId(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  private async requireUser(): Promise<AppUser> {
    const user = await this.getUser();
    if (!user) throw new FriendlyError(t.errors.forbidden);
    return user;
  }

  private async ownedGallery(s: DemoState, id: string): Promise<Gallery> {
    const user = await this.requireUser();
    const g = s.galleries.find((x) => x.id === id);
    if (!g || g.user_id !== user.id) throw new FriendlyError(t.errors.forbidden);
    return g;
  }

  // ---------------------------------------------------------------- auth

  async getUser(): Promise<AppUser | null> {
    const id = this.sessionUserId();
    if (!id) return null;
    const s = await this.load();
    const u = s.users.find((x) => x.id === id);
    return u ? { id: u.id, email: u.email, displayName: u.displayName } : null;
  }

  async signIn(email: string): Promise<void> {
    // Demo mode accepts any password; real authentication is done by Supabase Auth.
    const normalized = email.trim().toLowerCase();
    const id = await this.mutate((s) => {
      let user = s.users.find((u) => u.email === normalized);
      if (!user) {
        user = {
          id: crypto.randomUUID(),
          email: normalized,
          displayName: normalized.split('@')[0] ?? '',
        };
        s.users.push(user);
      }
      return user.id;
    });
    localStorage.setItem(SESSION_KEY, id);
  }

  async signUp(email: string, _password: string, displayName: string) {
    const normalized = email.trim().toLowerCase();
    const id = await this.mutate((s) => {
      if (s.users.some((u) => u.email === normalized))
        throw new FriendlyError(t.errors.signupExists);
      const user = {
        id: crypto.randomUUID(),
        email: normalized,
        displayName:
          sanitizeText(displayName, DISPLAY_NAME_MAX) || (normalized.split('@')[0] ?? ''),
      };
      s.users.push(user);
      return user.id;
    });
    localStorage.setItem(SESSION_KEY, id);
    return { needsEmailConfirmation: false };
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  }

  // ---------------------------------------------------------------- galleries

  async listMyGalleries() {
    const user = await this.requireUser();
    const s = await this.load();
    return s.galleries
      .filter((g) => g.user_id === user.id)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((g) => ({
        ...g,
        artwork_count: s.artworks.filter((a) => a.gallery_id === g.id).length,
        visit_count: s.visits.filter((v) => v.gallery_id === g.id).length,
      }));
  }

  async listPublishedGalleries(limit = 24): Promise<PublishedGalleryCard[]> {
    const s = await this.load();
    return s.galleries
      .filter((g) => g.status === 'published')
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, limit)
      .map((g) => ({
        gallery: g,
        authorName: s.users.find((u) => u.id === g.user_id)?.displayName ?? '',
        artworkCount: s.artworks.filter((a) => a.gallery_id === g.id).length,
      }));
  }

  private bundle(s: DemoState, g: Gallery): GalleryWithArtworks {
    return {
      gallery: g,
      artworks: s.artworks
        .filter((a) => a.gallery_id === g.id)
        .sort((a, b) => a.order_index - b.order_index),
      authorName: s.users.find((u) => u.id === g.user_id)?.displayName ?? '',
    };
  }

  async getGalleryForOwner(id: string) {
    const user = await this.requireUser();
    const s = await this.load();
    const g = s.galleries.find((x) => x.id === id && x.user_id === user.id);
    return g ? this.bundle(s, g) : null;
  }

  async getPublishedGallery(slug: string) {
    const s = await this.load();
    const g = s.galleries.find((x) => x.slug === slug && x.status === 'published');
    return g ? this.bundle(s, g) : null;
  }

  async createGallery(input: NewGalleryInput): Promise<Gallery> {
    const user = await this.requireUser();
    return this.mutate((s) => {
      const title = sanitizeText(input.title, TITLE_MAX);
      let slug = createSlug(title);
      while (s.galleries.some((g) => g.slug === slug)) slug = createSlug(title);
      const g: Gallery = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        description: sanitizeText(input.description ?? '', DESCRIPTION_MAX, { multiline: true }),
        slug,
        template: input.template,
        status: 'draft',
        layout_mode: input.layout_mode,
        lighting: 'standard',
        cover_image_url: null,
        bgm_url: null,
        settings: {},
        created_at: now(),
        updated_at: now(),
      };
      s.galleries.push(g);
      return g;
    });
  }

  async updateGallery(id: string, patch: GalleryUpdate): Promise<Gallery> {
    return this.mutate(async (s) => {
      const g = await this.ownedGallery(s, id);
      const clean: GalleryUpdate = { ...patch };
      if (patch.title !== undefined) clean.title = sanitizeText(patch.title, TITLE_MAX);
      if (patch.description !== undefined) {
        clean.description = sanitizeText(patch.description, DESCRIPTION_MAX, { multiline: true });
      }
      Object.assign(g, clean, { updated_at: now() });
      return { ...g };
    });
  }

  async deleteGallery(id: string): Promise<void> {
    await this.mutate(async (s) => {
      await this.ownedGallery(s, id);
      s.galleries = s.galleries.filter((g) => g.id !== id);
      s.artworks = s.artworks.filter((a) => a.gallery_id !== id);
      s.visits = s.visits.filter((v) => v.gallery_id !== id);
    });
  }

  // ---------------------------------------------------------------- artworks

  async addArtwork(
    gallery: Gallery,
    image: PreparedImage,
    input: NewArtworkInput,
  ): Promise<Artwork> {
    const [full, thumb] = await Promise.all([
      blobToDataUrl(image.full),
      blobToDataUrl(image.thumbnail),
    ]);
    return this.mutate(async (s) => {
      const g = await this.ownedGallery(s, gallery.id);
      const artwork: Artwork = {
        id: crypto.randomUUID(),
        gallery_id: g.id,
        title: sanitizeText(input.title, TITLE_MAX),
        description: sanitizeText(input.description, DESCRIPTION_MAX, { multiline: true }),
        media_type: 'image',
        image_url: full,
        thumbnail_url: thumb,
        width: image.width,
        height: image.height,
        order_index: input.order_index,
        position_x: null,
        position_y: null,
        position_z: null,
        rotation_y: null,
        scale: null,
        created_at: now(),
        updated_at: now(),
      };
      s.artworks.push(artwork);
      g.cover_image_url ??= thumb;
      g.updated_at = now();
      return artwork;
    });
  }

  async updateArtworks(updates: { id: string; patch: ArtworkUpdate }[]): Promise<void> {
    await this.mutate(async (s) => {
      for (const { id, patch } of updates) {
        const a = s.artworks.find((x) => x.id === id);
        if (!a) continue;
        await this.ownedGallery(s, a.gallery_id);
        const clean: ArtworkUpdate = { ...patch };
        if (patch.title !== undefined) clean.title = sanitizeText(patch.title, TITLE_MAX);
        if (patch.description !== undefined) {
          clean.description = sanitizeText(patch.description, DESCRIPTION_MAX, { multiline: true });
        }
        Object.assign(a, clean, { updated_at: now() });
      }
    });
  }

  async deleteArtwork(artwork: Artwork): Promise<void> {
    await this.mutate(async (s) => {
      const g = await this.ownedGallery(s, artwork.gallery_id);
      s.artworks = s.artworks.filter((a) => a.id !== artwork.id);
      if (g.cover_image_url === artwork.thumbnail_url) {
        g.cover_image_url = s.artworks.find((a) => a.gallery_id === g.id)?.thumbnail_url ?? null;
      }
    });
  }

  async uploadBgm(gallery: Gallery, file: File): Promise<string> {
    await this.ownedGallery(await this.load(), gallery.id);
    return blobToDataUrl(file);
  }

  async recordVisit(galleryId: string, visitorId: string): Promise<void> {
    await this.mutate((s) => {
      s.visits.push({ gallery_id: galleryId, visitor_id: visitorId, visited_at: now() });
    });
  }
}
