import { ButtonLink } from '@/components/ui/Button';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { t } from '@/lib/i18n';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="relative isolate overflow-hidden">
        {/* A quiet, dark gallery: soft spotlights on a charcoal wall. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(217,195,138,0.16), transparent 70%),' +
              'radial-gradient(ellipse 30% 30% at 18% 38%, rgba(255,255,255,0.05), transparent 70%),' +
              'radial-gradient(ellipse 30% 30% at 82% 38%, rgba(255,255,255,0.05), transparent 70%),' +
              'linear-gradient(180deg, #121215 0%, #0c0c0e 60%, #08080a 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black/60"
        />

        <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="animate-fade-in text-gold/90 mb-6 text-xs tracking-[0.3em] uppercase">
            {t.app.name}
          </p>
          <h1 className="animate-fade-in text-3xl leading-tight font-semibold tracking-wide text-balance sm:text-5xl">
            {t.home.headline}
          </h1>
          <p className="animate-fade-in text-mist mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            {t.home.sub}
          </p>
          <div className="animate-fade-in mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/dashboard/new" size="lg">
              {t.home.create}
            </ButtonLink>
            <ButtonLink href="/explore" variant="secondary" size="lg">
              {t.home.explore}
            </ButtonLink>
          </div>
          <p className="text-mist/80 mt-6 text-xs">{t.home.noSkills}</p>

          <ol className="mt-20 grid w-full gap-4 text-left sm:grid-cols-3">
            {t.home.steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
              >
                <span className="text-gold text-xs">STEP {i + 1}</span>
                <p className="mt-2 font-medium">{step.title}</p>
                <p className="text-mist mt-1 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
