import { Timer } from "lucide-react";
import { useRef, useState } from "react";
import type { IniciativaEntrada } from "../hooks/useCampaignRealtime";

interface IniciativaBarProps {
  entradas: IniciativaEntrada[];
  onReordenar: (orden: number[]) => void;
}

export default function IniciativaBar({
  entradas,
  onReordenar,
}: IniciativaBarProps) {
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragIdRef = useRef<number | null>(null);

  const handleDragStart = (personajeId: number) => {
    dragIdRef.current = personajeId;
  };

  const handleDragOver = (event: React.DragEvent, personajeId: number) => {
    event.preventDefault();
    setDragOverId(personajeId);
  };

  const handleDrop = (event: React.DragEvent, targetId: number) => {
    event.preventDefault();
    const sourceId = dragIdRef.current;
    if (sourceId === null || sourceId === targetId) {
      setDragOverId(null);
      return;
    }

    const ids = entradas.map((e) => e.personajeId);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragOverId(null);
      return;
    }

    const reordenados = [...ids];
    reordenados.splice(fromIndex, 1);
    reordenados.splice(toIndex, 0, sourceId);
    onReordenar(reordenados);
    setDragOverId(null);
    dragIdRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    dragIdRef.current = null;
  };

  return (
    <div className="absolute top-0 left-1/2 z-30 -translate-x-1/2 mt-0.5 min-w-[220px] max-w-[90vw] rounded-2xl border border-white/10 bg-black/75 backdrop-blur-sm shadow-lg">
      {/* Header: timer icon + centered title, spacer balances centering */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Timer size={18} className="shrink-0 text-amber-400" />
        <p className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
          Turnos
        </p>
        <div className="w-[18px] shrink-0" />
      </div>

      {/* Cards row — pt-3 gives room for the -top-2 badge overflow */}
      <div className="flex items-end gap-3 overflow-x-auto px-4 pt-3 pb-4">
        {entradas.length === 0 ? (
          <p className="text-[11px] text-white/40 italic select-none py-1">
            Esperando iniciativas...
          </p>
        ) : null}

        {entradas.map((entrada, index) => {
          const isFirst = index === 0;
          const isDragTarget = dragOverId === entrada.personajeId;

          return (
            <div
              key={entrada.personajeId}
              draggable
              onDragStart={() => handleDragStart(entrada.personajeId)}
              onDragOver={(e) => handleDragOver(e, entrada.personajeId)}
              onDrop={(e) => handleDrop(e, entrada.personajeId)}
              onDragEnd={handleDragEnd}
              className={[
                "flex shrink-0 cursor-grab flex-col items-center gap-1.5 select-none transition-transform",
                isDragTarget ? "scale-105" : "",
              ].join(" ")}
            >
              {/* Portrait with badge */}
              <div className="relative">
                <div
                  className={[
                    "h-14 w-14 overflow-hidden rounded-xl border",
                    isFirst ? "border-amber-400/70" : "border-white/20",
                    isDragTarget ? "ring-2 ring-sky-400/60" : "",
                  ].join(" ")}
                >
                  {entrada.retrato ? (
                    <img
                      src={entrada.retrato}
                      alt={entrada.nombre}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/10">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-7 w-7 text-white/30"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Initiative badge */}
                <div className="absolute -top-2 -left-2 flex items-baseline gap-0.5 rounded-full border-2 border-black bg-sky-500 px-1.5 py-0.5 shadow-md whitespace-nowrap">
                  <span className="text-[11px] font-bold leading-none text-white">
                    {entrada.total}
                  </span>
                  <span className="text-[8px] leading-none text-white/80">
                    ({entrada.tirada}
                    {entrada.bonificacion >= 0 ? "+" : ""}
                    {entrada.bonificacion})
                  </span>
                </div>
              </div>

              {/* Name */}
              <span
                className={[
                  "max-w-[64px] truncate text-center text-[10px] font-semibold",
                  isFirst ? "text-amber-200" : "text-white/80",
                ].join(" ")}
              >
                {entrada.nombre}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
