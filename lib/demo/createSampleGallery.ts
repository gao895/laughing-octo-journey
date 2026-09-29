'use client';

import type { Gallery } from '@/types/gallery';
import type { GalleryRepository } from '@/lib/data/types';
import { prepareImage } from '@/lib/image/optimize';
import { SAMPLE_ARTWORKS, SAMPLE_GALLERY } from './sample';

/** Creates the sample exhibition 「星空の記憶」 in the signed-in user's account. */
export async function createSampleGallery(repo: GalleryRepository): Promise<Gallery> {
  const gallery = await repo.createGallery({
    title: SAMPLE_GALLERY.title,
    description: SAMPLE_GALLERY.description,
    template: 'starlight',
    layout_mode: 'auto',
  });
  for (const [i, art] of SAMPLE_ARTWORKS.entries()) {
    const image = await prepareImage(new Blob([art.svg], { type: 'image/svg+xml' }));
    await repo.addArtwork(gallery, image, {
      title: art.title,
      description: art.description,
      order_index: i,
    });
  }
  return gallery;
}
