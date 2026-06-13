import { useState } from "react";
import { ACTIONS } from "./actionConfig";

function FallbackIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  ataque: (
    <FallbackIcon>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </FallbackIcon>
  ),
  habilidad: (
    <FallbackIcon>
      <rect x="2" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="18" y="2" width="4" height="18" rx="1" />
    </FallbackIcon>
  ),
  especialidad: (
    <FallbackIcon>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </FallbackIcon>
  ),
  botin: (
    <FallbackIcon>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </FallbackIcon>
  ),
  hechizos: (
    <FallbackIcon>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </FallbackIcon>
  ),
  recursos: (
    <FallbackIcon>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
      <path d="M8 3v4" />
      <path d="M16 10v4" />
      <path d="M12 17v4" />
    </FallbackIcon>
  ),
  "rasgos-clase": (
    <FallbackIcon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </FallbackIcon>
  ),
};

export default function ActionButton({
  action,
  label: labelOverride,
  onClick,
}: {
  action: (typeof ACTIONS)[number];
  label?: string;
  onClick?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const displayLabel = labelOverride ?? action.label;
  return (
    <button
      title={displayLabel}
      onClick={onClick}
      className="group flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-150 hover:bg-white/10 active:scale-95"
    >
      <div className="h-16 w-16 rounded-lg overflow-hidden border border-white/20 group-hover:border-amber-400/60 transition-colors flex items-center justify-center bg-white/5">
        {imgFailed ? (
          <span className="text-amber-200/70 group-hover:text-amber-200 transition-colors">
            {FALLBACK_ICONS[action.key]}
          </span>
        ) : (
          <img
            src={action.img}
            alt={displayLabel}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <span className="text-[10px] text-white/70 group-hover:text-amber-200 transition-colors">
        {displayLabel}
      </span>
    </button>
  );
}
