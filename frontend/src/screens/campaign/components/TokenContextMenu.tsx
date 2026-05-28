import { BookOpen, Map, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { VisionConfig } from "../hooks/useCampaignRealtime";

type LayerSelection = "fichas" | "mapa" | "dm";

interface TokenContextMenuProps {
  posicionId: number;
  x: number;
  y: number;
  fogActiva: boolean;
  isDM: boolean;
  currentCapa: LayerSelection;
  visionConfig: VisionConfig | null;
  onToggleRevela: (posicionId: number, revela: boolean) => void;
  onOpenVisionArc: (posicionId: number) => void;
  onCambiarCapa: (posicionId: number, capa: LayerSelection) => void;
  onStartResize?: (posicionId: number) => void;
  onEliminar: (posicionId: number) => void;
  onClose: () => void;
}

const LAYERS: { value: LayerSelection; label: string; Icon: typeof User }[] = [
  { value: "fichas", label: "Personajes", Icon: User },
  { value: "mapa", label: "Mapa", Icon: Map },
  { value: "dm", label: "DM", Icon: BookOpen },
];

export default function TokenContextMenu({
  posicionId,
  x,
  y,
  fogActiva,
  isDM,
  currentCapa,
  visionConfig,
  onToggleRevela,
  onOpenVisionArc,
  onCambiarCapa,
  onStartResize,
  onEliminar,
  onClose,
}: TokenContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [capaOpen, setCapaOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = window.setTimeout(
      () => window.addEventListener("mousedown", handler),
      0,
    );
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const menuW = 200;
  // Estimate height for bottom-edge clamping: DM has more options than player
  const menuH = isDM ? 220 : 100;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  const revelaArea = visionConfig?.revelaArea ?? false;

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[200] min-w-[190px] rounded-xl border border-white/15 bg-black/90 py-1.5 shadow-2xl backdrop-blur-sm"
    >
      {/* ── Vision options — DM only ── */}
      {isDM &&
        (fogActiva ? (
          <>
            <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-white hover:bg-white/[0.08]">
              <input
                type="checkbox"
                checked={revelaArea}
                onChange={(e) => onToggleRevela(posicionId, e.target.checked)}
                className="accent-amber-400"
              />
              <span>Revela niebla</span>
            </label>

            {revelaArea && (
              <button
                type="button"
                onClick={() => {
                  onOpenVisionArc(posicionId);
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.08] hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4 shrink-0"
                >
                  <path d="M12 2L12 22M2 12L22 12" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                Modificar arco de visión
              </button>
            )}

            <div className="mx-3 my-1 h-px bg-white/10" />
          </>
        ) : (
          <>
            <p className="px-3 py-2 text-xs text-white/40">
              Activa la niebla de guerra para ver opciones de visión
            </p>
            <div className="mx-3 my-1 h-px bg-white/10" />
          </>
        ))}

      {/* ── Modificar tamaño — available to all ── */}
      {onStartResize && (
        <button
          type="button"
          onClick={() => {
            onStartResize(posicionId);
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.08] hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 text-white/50"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Modificar tamaño
        </button>
      )}

      {/* ── Cambiar capa — DM only ── */}
      {isDM && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setCapaOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.08] hover:text-white"
          >
            <span>Cambiar capa</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${capaOpen ? "rotate-90" : ""}`}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {capaOpen && (
            <div className="absolute left-full top-0 z-10 min-w-[140px] rounded-xl border border-white/15 bg-black/95 py-1 shadow-2xl">
              {LAYERS.filter((l) => l.value !== currentCapa).map(
                ({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onCambiarCapa(posicionId, value);
                      onClose();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Icon size={14} className="shrink-0 text-white/50" />
                    {label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Eliminar token — available to all ── */}
      <div className="mx-3 my-1 h-px bg-white/10" />
      <button
        type="button"
        onClick={() => {
          onEliminar(posicionId);
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4 shrink-0"
        >
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
        Eliminar token
      </button>
    </div>
  );
}
