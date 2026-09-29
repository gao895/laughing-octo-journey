'use client';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { GalleryRepository } from './types';
import { DemoRepository } from './demo-repository';
import { SupabaseRepository } from './supabase-repository';

let repo: GalleryRepository | null = null;

/** Returns the Supabase repository when configured, otherwise the in-browser demo one. */
export function getRepository(): GalleryRepository {
  repo ??= isSupabaseConfigured() ? new SupabaseRepository() : new DemoRepository();
  return repo;
}

export type { GalleryRepository } from './types';
