import { ButtonLink } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg">{t.errors.notFound}</p>
      <ButtonLink href="/" variant="secondary">
        {t.common.back}
      </ButtonLink>
    </main>
  );
}
