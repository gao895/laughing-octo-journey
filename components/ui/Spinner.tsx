export function Spinner({ label }: { label?: string }) {
  return (
    <div className="text-mist flex flex-col items-center justify-center gap-3 py-16" role="status">
      <span className="border-gold size-8 animate-spin rounded-full border-2 border-t-transparent" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
