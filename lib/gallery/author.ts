import type { Artwork } from '@/types/artwork';
import type { Gallery } from '@/types/gallery';
import { DISPLAY_NAME_MAX, sanitizeText } from './validation';

/** 作者名 of an exhibition: the name set on the gallery, else the owner's display name. */
export function galleryAuthorName(
  gallery: Pick<Gallery, 'artist_name'>,
  ownerName: string,
): string {
  return gallery.artist_name?.trim() || ownerName;
}

/** 作者名 of one artwork: its own name (group shows), else the exhibition's. */
export function artworkAuthorName(
  artwork: Pick<Artwork, 'artist_name'>,
  galleryAuthor: string,
): string {
  return artwork.artist_name?.trim() || galleryAuthor;
}

/** Normalises a typed name; blank becomes null ("use the default"). */
export function cleanArtistName(value: string | null | undefined): string | null {
  if (value == null) return null;
  return sanitizeText(value, DISPLAY_NAME_MAX) || null;
}
