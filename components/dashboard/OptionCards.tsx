'use client';

interface Option<T extends string> {
  value: T;
  label: string;
  body: string;
  badge?: string;
}

/** Large, tappable radio cards used for 展示方法 and 照明. */
export function OptionCards<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border p-4 text-left transition ${
              selected
                ? 'border-gold bg-gold/5 ring-gold/30 ring-2'
                : 'border-line bg-coal hover:border-white/30'
            }`}
          >
            <p className="flex items-center gap-2 font-medium">
              {o.label}
              {o.badge && (
                <span className="bg-gold/15 text-gold rounded-full px-2 py-0.5 text-[10px]">
                  {o.badge}
                </span>
              )}
            </p>
            <p className="text-mist mt-1 text-xs leading-relaxed">{o.body}</p>
          </button>
        );
      })}
    </div>
  );
}
