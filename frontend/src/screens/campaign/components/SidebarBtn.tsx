import type { ReactNode } from "react";

export function SidebarBtn({
  children,
  title,
  isActive = false,
  onClick,
}: {
  children: ReactNode;
  title: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded transition-all ${
        isActive
          ? "border border-amber-400/95 bg-amber-700/18 text-amber-100 shadow-[inset_0_0_0_1px_rgba(146,64,14,0.55)]"
          : "border border-transparent text-white/75 hover:bg-white/12 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function SidebarDivider({ label }: { label?: string }) {
  return (
    <div className="my-1 flex w-full flex-col items-center gap-0.5">
      {label ? (
        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/75">
          {label}
        </span>
      ) : null}
      <div className="h-px w-5.5 bg-white/20" />
    </div>
  );
}
