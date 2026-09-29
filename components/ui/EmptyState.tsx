import type { ReactNode } from 'react';

export function EmptyState({
  title,
  action,
  icon = '🖼️',
}: {
  title: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="border-line flex flex-col items-center gap-5 rounded-2xl border border-dashed px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="text-paper/90 text-base">{title}</p>
      {action}
    </div>
  );
}
