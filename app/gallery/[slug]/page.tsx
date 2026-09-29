import type { Metadata } from 'next';
import { PublicGallery } from '@/components/gallery/PublicGallery';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isValidSlug } from '@/lib/gallery/slug';
import { t } from '@/lib/i18n';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseConfigured() || !isValidSlug(slug)) return { title: t.app.name };
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('galleries')
      .select('title, description, cover_image_url')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (!data) return { title: t.viewer.notFound };
    return {
      title: data.title,
      description: data.description || t.home.sub,
      openGraph: {
        title: data.title,
        description: data.description || t.home.sub,
        images: data.cover_image_url ? [data.cover_image_url] : undefined,
      },
    };
  } catch {
    return { title: t.app.name };
  }
}

export default async function GalleryPage({ params }: PageProps) {
  const { slug } = await params;
  return <PublicGallery slug={isValidSlug(slug) ? slug : ''} />;
}
