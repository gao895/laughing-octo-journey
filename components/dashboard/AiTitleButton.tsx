'use client';

import { useToast } from '@/components/ui/Toast';
import { ai } from '@/lib/ai';
import { t } from '@/lib/i18n';

/** Placeholder for 「AIにタイトルを考えてもらう」 (wired to lib/ai once available). */
export function AiTitleButton({
  imageUrl,
  onTitle,
}: {
  imageUrl: string;
  onTitle: (title: string) => void;
}) {
  const toast = useToast();
  async function run() {
    if (!ai.available) {
      toast(t.uploader.aiComingSoon);
      return;
    }
    try {
      onTitle(await ai.suggestArtworkTitle(imageUrl));
    } catch {
      toast(t.errors.generic, 'error');
    }
  }
  return (
    <button
      type="button"
      onClick={run}
      className="text-gold/90 text-xs underline-offset-4 hover:underline"
    >
      ✨ {t.uploader.aiTitle}
    </button>
  );
}
