import { OwnerPreview } from '@/components/gallery/OwnerPreview';

export default async function PreviewGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OwnerPreview galleryId={id} />;
}
