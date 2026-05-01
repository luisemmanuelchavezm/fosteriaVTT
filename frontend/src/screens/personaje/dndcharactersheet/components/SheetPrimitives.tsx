export function CircleIndicator({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-3.5 w-3.5 rounded-full border ${
        filled
          ? "border-amber-200 bg-amber-200"
          : "border-stone-300 bg-transparent"
      }`}
    />
  );
}

export function SectionTableHeader({ leftLabel }: { leftLabel: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
      <span>{leftLabel}</span>
      <span className="text-right">Total</span>
    </div>
  );
}

export function EmptyRowsMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-stone-400">
      {message}
    </div>
  );
}
