'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Artwork, ArtworkUpdate, PreparedImage } from '@/types/artwork';
import type { Gallery, GalleryUpdate, GalleryWithArtworks } from '@/types/gallery';
import type { AppUser, ProfileUpdate } from '@/types/profile';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET } from '@/lib/supabase/config';
import { createSlug } from '@/lib/gallery/slug';
import { cleanArtistName, galleryAuthorName } from '@/lib/gallery/author';
import {
  isUuid,
  sanitizeText,
  TITLE_MAX,
  DESCRIPTION_MAX,
  DISPLAY_NAME_MAX,
  BIO_MAX,
} from '@/lib/gallery/validation';
import { extensionForBlob } from '@/lib/image/optimize';
import { FriendlyError, logDev } from '@/lib/errors';
import { t } from '@/lib/i18n';
import type {
  GalleryRepository,
  NewArtworkInput,
  NewGalleryInput,
  PublishedGalleryCard,
} from './types';

type Row = Record<string, unknown>;

const VIDEO_MIME = { mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v' } as const;

function fail(context: string, error: unknown, friendly: string = t.errors.generic): never {
  logDev(context, error);
  throw new FriendlyError(friendly, error);
}

function countOf(value: unknown): number {
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object' && 'count' in value[0]) {
    return Number((value[0] as { count: number }).count) || 0;
  }
  return 0;
}

export class SupabaseRepository implements GalleryRepository {
  readonly mode = 'supabase' as const;
  private readonly db: SupabaseClient;

  constructor(client: SupabaseClient = getSupabaseBrowserClient()) {
    this.db = client;
  }

  private async requireUser(): Promise<AppUser> {
    const user = await this.getUser();
    if (!user) throw new FriendlyError(t.errors.forbidden);
    return user;
  }

  // ---------------------------------------------------------------- auth

  async getUser(): Promise<AppUser | null> {
    const { data, error } = await this.db.auth.getUser();
    if (error || !data.user) return null;
    const { data: profile } = await this.db
      .from('profiles')
      .select('display_name, avatar_url, bio')
      .eq('user_id', data.user.id)
      .maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? '',
      displayName:
        (profile?.display_name as string | undefined) ||
        (data.user.user_metadata?.display_name as string | undefined) ||
        (data.user.email ?? '').split('@')[0] ||
        '',
      avatarUrl: (profile?.avatar_url as string | null | undefined) ?? null,
      bio: (profile?.bio as string | null | undefined) ?? '',
    };
  }

  async updateProfile(update: ProfileUpdate): Promise<AppUser> {
    const user = await this.requireUser();
    const displayName = sanitizeText(update.displayName, DISPLAY_NAME_MAX);
    if (!displayName) throw new FriendlyError(t.errors.displayNameRequired);
    // Upsert so accounts created before the profile trigger still work (RLS: own row only).
    const { error } = await this.db.from('profiles').upsert(
      {
        user_id: user.id,
        display_name: displayName,
        bio: sanitizeText(update.bio, BIO_MAX, { multiline: true }) || null,
        avatar_url: update.avatarUrl,
      },
      { onConflict: 'user_id' },
    );
    if (error) fail('updateProfile', error, t.errors.save);
    // Remove a replaced icon from storage.
    if (user.avatarUrl && user.avatarUrl !== update.avatarUrl) {
      const old = this.storagePathFromUrl(user.avatarUrl);
      if (old?.startsWith(`${user.id}/profile/`)) {
        await this.db.storage.from(STORAGE_BUCKET).remove([old]);
      }
    }
    return (await this.getUser()) ?? user;
  }

  async uploadAvatar(image: Blob): Promise<string> {
    const user = await this.requireUser();
    return this.upload(
      `${user.id}/profile/avatar-${crypto.randomUUID()}.${extensionForBlob(image)}`,
      image,
    );
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.db.auth.signInWithPassword({ email: email.trim(), password });
    if (error) fail('signIn', error, t.errors.login);
  }

  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await this.db.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: sanitizeText(displayName, DISPLAY_NAME_MAX) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      fail(
        'signUp',
        error,
        /registered|exists/i.test(error.message) ? t.errors.signupExists : t.errors.generic,
      );
    }
    // When "Confirm email" is enabled, no session is returned until the link is clicked.
    return { needsEmailConfirmation: !data.session };
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  // ---------------------------------------------------------------- galleries

  async listMyGalleries() {
    const user = await this.requireUser();
    const { data, error } = await this.db
      .from('galleries')
      .select('*, artworks(count), gallery_visits(count)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) fail('listMyGalleries', error);
    return (data ?? []).map((row: Row) => {
      const { artworks, gallery_visits, ...rest } = row;
      return {
        ...(rest as unknown as Gallery),
        artwork_count: countOf(artworks),
        visit_count: countOf(gallery_visits),
      };
    });
  }

  async listPublishedGalleries(limit = 24): Promise<PublishedGalleryCard[]> {
    const { data, error } = await this.db
      .from('galleries')
      .select('*, artworks(count)')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) fail('listPublishedGalleries', error);
    const rows = (data ?? []) as Row[];
    const names = await this.authorNames(rows.map((r) => r.user_id as string));
    return rows.map((row) => {
      const { artworks, ...rest } = row;
      const gallery = rest as unknown as Gallery;
      return {
        gallery,
        authorName: galleryAuthorName(gallery, names.get(gallery.user_id) ?? ''),
        artworkCount: countOf(artworks),
      };
    });
  }

  private async authorNames(userIds: string[]): Promise<Map<string, string>> {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return new Map();
    const { data } = await this.db
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', ids);
    return new Map((data ?? []).map((p: Row) => [p.user_id as string, p.display_name as string]));
  }

  private async withArtworks(gallery: Gallery): Promise<GalleryWithArtworks> {
    const { data, error } = await this.db
      .from('artworks')
      .select('*')
      .eq('gallery_id', gallery.id)
      .order('order_index', { ascending: true });
    if (error) fail('artworks', error);
    const { data: profile } = await this.db
      .from('profiles')
      .select('display_name, avatar_url, bio')
      .eq('user_id', gallery.user_id)
      .maybeSingle();
    return {
      gallery,
      artworks: (data ?? []) as Artwork[],
      authorName: galleryAuthorName(gallery, (profile?.display_name as string | undefined) ?? ''),
      author: {
        avatarUrl: (profile?.avatar_url as string | null | undefined) ?? null,
        bio: (profile?.bio as string | null | undefined) ?? '',
      },
    };
  }

  async getGalleryForOwner(id: string) {
    if (!isUuid(id)) return null;
    const user = await this.requireUser();
    const { data, error } = await this.db
      .from('galleries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) fail('getGalleryForOwner', error);
    return data ? this.withArtworks(data as Gallery) : null;
  }

  async getPublishedGallery(slug: string) {
    const { data, error } = await this.db
      .from('galleries')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) fail('getPublishedGallery', error);
    return data ? this.withArtworks(data as Gallery) : null;
  }

  async createGallery(input: NewGalleryInput): Promise<Gallery> {
    const user = await this.requireUser();
    const title = sanitizeText(input.title, TITLE_MAX);
    // Retry a few times in the unlikely case of a slug collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await this.db
        .from('galleries')
        .insert({
          user_id: user.id,
          title,
          description: sanitizeText(input.description ?? '', DESCRIPTION_MAX, { multiline: true }),
          slug: createSlug(title),
          artist_name: cleanArtistName(input.artist_name),
          template: input.template,
          layout_mode: input.layout_mode,
          status: 'draft',
        })
        .select('*')
        .single();
      if (!error) return data as Gallery;
      if (error.code !== '23505') fail('createGallery', error, t.errors.save);
    }
    return fail('createGallery', 'slug collision', t.errors.save);
  }

  async updateGallery(id: string, patch: GalleryUpdate): Promise<Gallery> {
    const user = await this.requireUser();
    const clean: GalleryUpdate = { ...patch };
    if (patch.title !== undefined) clean.title = sanitizeText(patch.title, TITLE_MAX);
    if (patch.description !== undefined) {
      clean.description = sanitizeText(patch.description, DESCRIPTION_MAX, { multiline: true });
    }
    if (patch.artist_name !== undefined) clean.artist_name = cleanArtistName(patch.artist_name);
    const { data, error } = await this.db
      .from('galleries')
      .update(clean)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();
    if (error) fail('updateGallery', error, t.errors.save);
    return data as Gallery;
  }

  async deleteGallery(id: string): Promise<void> {
    const user = await this.requireUser();
    // Remove stored files first (the DB cascade removes rows).
    const folder = `${user.id}/${id}`;
    const { data: files } = await this.db.storage
      .from(STORAGE_BUCKET)
      .list(folder, { limit: 1000 });
    if (files?.length) {
      await this.db.storage.from(STORAGE_BUCKET).remove(files.map((f) => `${folder}/${f.name}`));
    }
    const { error } = await this.db.from('galleries').delete().eq('id', id).eq('user_id', user.id);
    if (error) fail('deleteGallery', error);
  }

  // ---------------------------------------------------------------- artworks

  private publicUrl(path: string): string {
    return this.db.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  private async upload(path: string, blob: Blob): Promise<string> {
    const { error } = await this.db.storage.from(STORAGE_BUCKET).upload(path, blob, {
      contentType: blob.type,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) fail('upload', error, t.errors.upload);
    return this.publicUrl(path);
  }

  async addArtwork(
    gallery: Gallery,
    image: PreparedImage,
    input: NewArtworkInput,
  ): Promise<Artwork> {
    const user = await this.requireUser();
    if (gallery.user_id !== user.id) throw new FriendlyError(t.errors.forbidden);
    const assetId = crypto.randomUUID();
    const folder = `${user.id}/${gallery.id}`;
    const videoUrl = image.video
      ? await this.upload(
          `${folder}/${assetId}.${image.videoExt ?? 'mp4'}`,
          new Blob([image.video], { type: VIDEO_MIME[image.videoExt ?? 'mp4'] }),
        )
      : null;
    const imageUrl = await this.upload(
      `${folder}/${assetId}.${extensionForBlob(image.full)}`,
      image.full,
    );
    const thumbUrl = await this.upload(
      `${folder}/${assetId}_thumb.${extensionForBlob(image.thumbnail)}`,
      image.thumbnail,
    );
    const { data, error } = await this.db
      .from('artworks')
      .insert({
        id: assetId,
        gallery_id: gallery.id,
        title: sanitizeText(input.title, TITLE_MAX),
        description: sanitizeText(input.description, DESCRIPTION_MAX, { multiline: true }),
        media_type: videoUrl ? 'video' : 'image',
        video_url: videoUrl,
        image_url: imageUrl,
        thumbnail_url: thumbUrl,
        width: image.width,
        height: image.height,
        order_index: input.order_index,
      })
      .select('*')
      .single();
    if (error) fail('addArtwork', error, t.errors.upload);
    if (!gallery.cover_image_url) {
      await this.db.from('galleries').update({ cover_image_url: thumbUrl }).eq('id', gallery.id);
    }
    return data as Artwork;
  }

  async updateArtworks(updates: { id: string; patch: ArtworkUpdate }[]): Promise<void> {
    await this.requireUser();
    const results = await Promise.all(
      updates.map(({ id, patch }) => {
        const clean: ArtworkUpdate = { ...patch };
        if (patch.title !== undefined) clean.title = sanitizeText(patch.title, TITLE_MAX);
        if (patch.description !== undefined) {
          clean.description = sanitizeText(patch.description, DESCRIPTION_MAX, { multiline: true });
        }
        if (patch.artist_name !== undefined) clean.artist_name = cleanArtistName(patch.artist_name);
        // RLS guarantees only artworks in the user's own galleries are updated.
        return this.db.from('artworks').update(clean).eq('id', id);
      }),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) fail('updateArtworks', failed.error, t.errors.save);
  }

  private storagePathFromUrl(url: string): string | null {
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const i = url.indexOf(marker);
    return i >= 0 ? decodeURIComponent(url.slice(i + marker.length).split('?')[0] ?? '') : null;
  }

  async deleteArtwork(artwork: Artwork): Promise<void> {
    await this.requireUser();
    const { error } = await this.db.from('artworks').delete().eq('id', artwork.id);
    if (error) fail('deleteArtwork', error);
    const paths = [artwork.image_url, artwork.thumbnail_url, artwork.video_url]
      .filter((u): u is string => Boolean(u))
      .map((u) => this.storagePathFromUrl(u))
      .filter((p): p is string => Boolean(p));
    if (paths.length) await this.db.storage.from(STORAGE_BUCKET).remove(paths);
  }

  async uploadBgm(gallery: Gallery, file: File): Promise<string> {
    const user = await this.requireUser();
    if (gallery.user_id !== user.id) throw new FriendlyError(t.errors.forbidden);
    const ext = file.name.toLowerCase().endsWith('.wav') ? 'wav' : 'mp3';
    const blob = new Blob([file], { type: ext === 'wav' ? 'audio/wav' : 'audio/mpeg' });
    return this.upload(`${user.id}/${gallery.id}/bgm-${crypto.randomUUID()}.${ext}`, blob);
  }

  async recordVisit(galleryId: string, visitorId: string): Promise<void> {
    const { error } = await this.db
      .from('gallery_visits')
      .insert({ gallery_id: galleryId, visitor_id: visitorId.slice(0, 64) });
    if (error) logDev('recordVisit', error);
  }
}
