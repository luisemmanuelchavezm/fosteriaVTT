import { Timer } from "lucide-react";
import { useRef, useState } from "react";
import type { IniciativaEntrada } from "../hooks/useCampaignRealtime";
import type { CampaignPositionResponse } from "../types";

interface IniciativaBarProps {
  entradas: IniciativaEntrada[];
  isDM?: boolean;
  onReordenar: (orden: number[]) => void;
  onTokenClick?: (personajeId: number) => void;
  onTokenRightClick?: (personajeId: number, x: number, y: number) => void;
  // MorkBorg-specific
  isMorkBorg?: boolean;
  mbDadoIniciativa?: number | null;
  posicionesMB?: CampaignPositionResponse[];
  onMBTirarIniciativa?: (
    personajeId: number,
    nombre: string,
    retrato: string | undefined,
  ) => void;
}

export default function IniciativaBar({
  entradas,
  isDM = false,
  onReordenar,
  onTokenClick,
  onTokenRightClick,
  isMorkBorg = false,
  mbDadoIniciativa,
  posicionesMB = [],
  onMBTirarIniciativa,
}: IniciativaBarProps) {
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [rollingId, setRollingId] = useState<number | null>(null);
  const dragIdRef = useRef<number | null>(null);

  const handleDragStart = (personajeId: number) => {
    if (!isDM) return;
    dragIdRef.current = personajeId;
  };

  const handleDragOver = (event: React.DragEvent, personajeId: number) => {
    if (!isDM) return;
    event.preventDefault();
    setDragOverId(personajeId);
  };

  const handleDrop = (event: React.DragEvent, targetId: number) => {
    if (!isDM) return;
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
    if (!isDM) return;
    setDragOverId(null);
    dragIdRef.current = null;
  };

  // ── MorkBorg: banner color and combined token list ─────────────────────────
  const mbEnemigosVanPrimero =
    mbDadoIniciativa !== null &&
    mbDadoIniciativa !== undefined &&
    mbDadoIniciativa <= 3;

  // Build ordered list for MorkBorg: rolled (sorted desc) + unrolled at bottom
  const mbTokens = isMorkBorg
    ? (() => {
        const rolledIds = new Set(entradas.map((e) => e.personajeId));
        const unrolled = posicionesMB.filter(
          (p) => !rolledIds.has(p.personajeId),
        );
        return [
          ...entradas
            .sort((a, b) => b.total - a.total)
            .map((e) => ({
              personajeId: e.personajeId,
              nombre: e.nombre,
              retrato: e.retrato ?? undefined,
              rolled: true as const,
              total: e.total,
              tirada: e.tirada,
              bonificacion: e.bonificacion,
            })),
          ...unrolled.map((p) => ({
            personajeId: p.personajeId,
            nombre: p.personajeNombre,
            retrato: p.retrato,
            rolled: false as const,
            total: 0,
            tirada: 0,
            bonificacion: 0,
          })),
        ];
      })()
    : [];

  const handleMBRoll = (
    personajeId: number,
    nombre: string,
    retrato: string | undefined,
  ) => {
    if (rollingId !== null || !onMBTirarIniciativa) return;
    setRollingId(personajeId);
    onMBTirarIniciativa(personajeId, nombre, retrato);
    // Clear rolling state after a delay
    setTimeout(() => setRollingId(null), 1500);
  };

  // ── Standard DnD rendering ─────────────────────────────────────────────────
  if (!isMorkBorg) {
    return (
      <div className="absolute top-0 left-1/2 z-30 -translate-x-1/2 mt-0.5 min-w-[220px] max-w-[90vw] rounded-2xl border border-white/10 bg-black/75 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Timer size={18} className="shrink-0 text-amber-400" />
          <p className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
            Turnos
          </p>
          <div className="w-[18px] shrink-0" />
        </div>

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
                draggable={isDM}
                onDragStart={() => handleDragStart(entrada.personajeId)}
                onDragOver={(e) => handleDragOver(e, entrada.personajeId)}
                onDrop={(e) => handleDrop(e, entrada.personajeId)}
                onDragEnd={handleDragEnd}
                className={[
                  "flex shrink-0 flex-col items-center gap-1.5 select-none transition-transform",
                  isDM ? "cursor-grab" : "cursor-default",
                  isDragTarget ? "scale-105" : "",
                ].join(" ")}
              >
                <div className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    className={[
                      "h-14 w-14 overflow-hidden rounded-xl border transition hover:brightness-110",
                      isFirst ? "border-amber-400/70" : "border-white/20",
                      isDragTarget ? "ring-2 ring-sky-400/60" : "",
                      "cursor-pointer",
                    ].join(" ")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTokenClick?.(entrada.personajeId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        onTokenClick?.(entrada.personajeId);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTokenRightClick?.(
                        entrada.personajeId,
                        e.clientX,
                        e.clientY,
                      );
                    }}
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

  // ── MorkBorg rendering ─────────────────────────────────────────────────────
  const bannerBg =
    mbDadoIniciativa == null
      ? "bg-black/75"
      : mbEnemigosVanPrimero
        ? "bg-red-900/80 border-red-500/30"
        : "bg-blue-900/80 border-blue-500/30";

  const bannerText =
    mbDadoIniciativa == null
      ? "Turnos"
      : mbEnemigosVanPrimero
        ? `🎲${mbDadoIniciativa} — Empiezan los enemigos`
        : `🎲${mbDadoIniciativa} — Empiezan los jugadores`;

  const bannerTextCls =
    mbDadoIniciativa == null
      ? "text-amber-100/80"
      : mbEnemigosVanPrimero
        ? "text-red-100"
        : "text-blue-100";

  return (
    <div
      className={[
        "absolute top-0 left-1/2 z-30 -translate-x-1/2 mt-0.5 min-w-[220px] max-w-[90vw] rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg",
        bannerBg,
      ].join(" ")}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Timer size={18} className="shrink-0 text-amber-400" />
        <p
          className={[
            "flex-1 text-center text-[11px] font-bold uppercase tracking-[0.15em]",
            bannerTextCls,
          ].join(" ")}
        >
          {bannerText}
        </p>
        <div className="w-[18px] shrink-0" />
      </div>

      <div className="flex items-end gap-3 overflow-x-auto px-4 pt-3 pb-4">
        {mbTokens.length === 0 ? (
          <p className="text-[11px] text-white/40 italic select-none py-1">
            No hay fichas en el tablero...
          </p>
        ) : null}

        {mbTokens.map((token, index) => {
          const isFirst = index === 0 && token.rolled;
          const isDragTarget = dragOverId === token.personajeId;
          const isRolling = rollingId === token.personajeId;

          return (
            <div
              key={token.personajeId}
              draggable={isDM && token.rolled}
              onDragStart={() =>
                token.rolled && handleDragStart(token.personajeId)
              }
              onDragOver={(e) =>
                token.rolled && handleDragOver(e, token.personajeId)
              }
              onDrop={(e) => token.rolled && handleDrop(e, token.personajeId)}
              onDragEnd={handleDragEnd}
              className={[
                "flex shrink-0 flex-col items-center gap-1.5 select-none transition-transform",
                isDM && token.rolled ? "cursor-grab" : "cursor-default",
                isDragTarget ? "scale-105" : "",
              ].join(" ")}
            >
              <div className="relative">
                <div
                  role={token.rolled ? "button" : undefined}
                  tabIndex={token.rolled ? 0 : undefined}
                  className={[
                    "relative h-14 w-14 overflow-hidden rounded-xl border transition",
                    isFirst
                      ? "border-amber-400/70"
                      : token.rolled
                        ? "border-white/20"
                        : "border-white/10",
                    isDragTarget ? "ring-2 ring-sky-400/60" : "",
                    token.rolled
                      ? "cursor-pointer hover:brightness-110"
                      : "cursor-default opacity-70",
                  ].join(" ")}
                  onClick={(e) => {
                    if (!token.rolled) return;
                    e.stopPropagation();
                    onTokenClick?.(token.personajeId);
                  }}
                  onKeyDown={(e) => {
                    if (!token.rolled) return;
                    if (e.key === "Enter" || e.key === " ")
                      onTokenClick?.(token.personajeId);
                  }}
                  onContextMenu={(e) => {
                    if (!token.rolled) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onTokenRightClick?.(
                      token.personajeId,
                      e.clientX,
                      e.clientY,
                    );
                  }}
                >
                  {token.retrato ? (
                    <img
                      src={token.retrato}
                      alt={token.nombre}
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

                  {/* "Tirar Iniciativa" overlay for unrolled tokens */}
                  {!token.rolled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMBRoll(
                          token.personajeId,
                          token.nombre,
                          token.retrato,
                        );
                      }}
                      disabled={isRolling}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 text-white transition hover:bg-black/75 disabled:cursor-wait"
                      title="Tirar iniciativa"
                    >
                      <span className="text-base leading-none">
                        {isRolling ? "…" : "🎲"}
                      </span>
                      <span className="mt-0.5 text-[8px] font-bold uppercase leading-tight text-white/90">
                        {isRolling ? "Tirando" : "Tirar ini."}
                      </span>
                    </button>
                  )}
                </div>

                {/* Initiative badge (only for rolled) */}
                {token.rolled && (
                  <div className="absolute -top-2 -left-2 flex items-baseline gap-0.5 rounded-full border-2 border-black bg-sky-500 px-1.5 py-0.5 shadow-md whitespace-nowrap">
                    <span className="text-[11px] font-bold leading-none text-white">
                      {token.total}
                    </span>
                    <span className="text-[8px] leading-none text-white/80">
                      ({token.tirada}
                      {token.bonificacion >= 0 ? "+" : ""}
                      {token.bonificacion})
                    </span>
                  </div>
                )}
              </div>

              <span
                className={[
                  "max-w-[64px] truncate text-center text-[10px] font-semibold",
                  isFirst
                    ? "text-amber-200"
                    : token.rolled
                      ? "text-white/80"
                      : "text-white/50",
                ].join(" ")}
              >
                {token.nombre}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
