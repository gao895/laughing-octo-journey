'use client';

export function galleryUrl(slug: string): string {
  const base =
    (typeof window !== 'undefined' && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  return `${base}/gallery/${encodeURIComponent(slug)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers / contexts without the async clipboard API.
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Share targets. Only "copy" is shown in the MVP; X / LINE are ready to be enabled. */
export function shareLinks(url: string, title: string) {
  const text = encodeURIComponent(`${title} | My Virtual Gallery`);
  const u = encodeURIComponent(url);
  return {
    x: `https://x.com/intent/post?text=${text}&url=${u}`,
    line: `https://social-plugins.line.me/lineit/share?url=${u}`,
  };
}
