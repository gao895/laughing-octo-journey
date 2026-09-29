import { GalleryEditor } from '@/components/dashboard/editor/GalleryEditor';

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GalleryEditor galleryId={id} />;
}
