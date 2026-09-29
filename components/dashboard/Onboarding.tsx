'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

const ICONS = ['🖼️', '🏛️', '🔗'];

/** First-login guide: 作品を選ぶ → 会場を選ぶ → 公開する */
export function Onboarding({
  open,
  onStart,
  onClose,
}: {
  open: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex flex-col items-center gap-6 py-2 text-center">
        <h2 className="text-xl font-semibold">{t.onboarding.title}</h2>
        <ol className="grid w-full gap-3 sm:grid-cols-3">
          {t.onboarding.steps.map((label, i) => (
            <li key={label} className="border-line bg-ink/60 rounded-xl border p-4">
              <div className="text-3xl" aria-hidden>
                {ICONS[i]}
              </div>
              <p className="text-gold mt-2 text-xs">STEP {i + 1}</p>
              <p className="mt-1 font-medium">{label}</p>
            </li>
          ))}
        </ol>
        <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>
          {t.onboarding.start}
        </Button>
      </div>
    </Modal>
  );
}
