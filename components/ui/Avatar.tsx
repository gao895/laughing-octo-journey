import { safeMediaUrl } from '@/lib/gallery/validation';

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-12 text-base',
  lg: 'size-24 text-3xl',
};

/** Round profile icon; falls back to the first letter of the name. */
export function Avatar({
  url,
  name,
  size = 'sm',
  className = '',
}: {
  url: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const src = safeMediaUrl(url);
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?';
  return (
    <span
      className={`bg-slate text-gold inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-1 ring-white/15 ${sizes[size]} ${className}`}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads / data URLs
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
