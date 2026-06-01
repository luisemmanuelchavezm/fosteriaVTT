import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import type { CharacterInventoryItemResponse } from "../../utils/dndApi";

function typeOrder(tipoObjeto: string): number {
  if (tipoObjeto === "ARMA") return 0;
  if (tipoObjeto === "ARMADURA") return 1;
  return 2;
}

function hasMbTag(tags: string | null | undefined): boolean {
  if (!tags) return false;
  return tags.split(",").some((tag) => tag.trim() === "MORK_BORG");
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const MAIN_STATS = [
  { id: "fuerza", label: "Fuerza", modKey: "MB_ModFuerza" },
  { id: "agilidad", label: "Agilidad", modKey: "MB_ModAgilidad" },
  { id: "presencia", label: "Presencia", modKey: "MB_ModPresencia" },
  { id: "resistencia", label: "Resistencia", modKey: "MB_ModResistencia" },
];

interface MorkBorgStatisticsSectionProps {
  character: DndCharacterDetailResponse;
  isEditMode?: boolean;
  editableMaxHp?: number;
  currentHp: number;
  totalHp: number;
  hpDelta: string;
  carga: number;
  onHpDeltaChange: (value: string) => void;
  onHeal: () => void;
  onDamage: () => void;
  onIncrementHpDelta: () => void;
  onDecrementHpDelta: () => void;
  onMaxHpChange?: (value: number) => void;
  pendingStatMods?: Record<string, number>;
  onRollStat: (statLabel: string, modifier: number) => void;
  onAdjustStat?: (modKey: string, delta: number) => void;
  onDeleteItem: (itemId: number) => void;
  onOpenCatalog: () => void;
  suppliesSlot: ReactNode;
}

export default function MorkBorgStatisticsSection({
  character,
  isEditMode = false,
  editableMaxHp,
  currentHp,
  totalHp,
  hpDelta,
  carga,
  onHpDeltaChange,
  onHeal,
  onDamage,
  onIncrementHpDelta,
  onDecrementHpDelta,
  onMaxHpChange,
  pendingStatMods,
  onRollStat,
  onAdjustStat,
  onDeleteItem,
  onOpenCatalog,
  suppliesSlot,
}: MorkBorgStatisticsSectionProps) {
  const stats = character.estadisticas;

  // Excluir dinero del conteo de carga (plata/comida se guardan como estadísticas, no como items)
  const carryableItems: CharacterInventoryItemResponse[] = [
    ...character.mochila,
  ]
    .filter((item) => item.tipoObjeto !== "DINERO" && hasMbTag(item.tags))
    .sort((a, b) => typeOrder(a.tipoObjeto) - typeOrder(b.tipoObjeto));
  // Items que no cuentan para carga (dinero, si existiera) los ordenamos aparte
  const sortedItems: CharacterInventoryItemResponse[] = carryableItems;

  const maxSlots = carga * 2;
  const isOverloaded = sortedItems.length > carga;
  const isAtMaxCapacity = sortedItems.length >= maxSlots;
  const slots: Array<{
    item: CharacterInventoryItemResponse | null;
    overCapacity: boolean;
  }> = Array.from(
    { length: Math.max(maxSlots, sortedItems.length) },
    (_, i) => ({
      item: sortedItems[i] ?? null,
      overCapacity: i >= carga,
    }),
  );

  return (
    <section className="space-y-6">
      <h3 className="text-[1.7rem] font-bold text-white">Estadísticas</h3>

      {/* ── Fila principal: [stats + vida + suministros] | carga ────────── */}
      <div className="flex flex-wrap gap-4 xl:flex-nowrap xl:items-start">
        {/* Columna izquierda: stats + HP + suministros */}
        <div className="flex shrink-0 flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            {/* Stats 2×2 */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {MAIN_STATS.map((stat) => {
                const mod =
                  pendingStatMods?.[stat.modKey] ?? stats[stat.modKey] ?? 0;
                return (
                  <div
                    key={stat.id}
                    className="rounded-[20px] border border-rose-200/25 bg-[linear-gradient(180deg,rgba(239,68,68,0.12),rgba(28,25,23,0.72))] px-3 py-3 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
                  >
                    <button
                      type="button"
                      onClick={() => onRollStat(stat.label, mod)}
                      className="w-full"
                    >
                      <p className="text-sm uppercase tracking-[0.18em] text-rose-100/80">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 text-[2rem] font-bold text-white leading-none">
                        {formatMod(mod)}
                      </p>
                    </button>
                    {isEditMode && onAdjustStat && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={mod <= -3}
                          onClick={() => onAdjustStat(stat.modKey, -1)}
                          className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          disabled={mod >= 6}
                          onClick={() => onAdjustStat(stat.modKey, 1)}
                          className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* HP panel — layout original: botones izquierda, HP derecha */}
            <div className="shrink-0 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-3 shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
              <div className="grid gap-3 grid-cols-[120px_minmax(0,1fr)]">
                {/* Columna izquierda: Curar / delta / Daño */}
                <div className="grid grid-rows-[48px_48px_48px] gap-2">
                  <button
                    type="button"
                    onClick={onHeal}
                    className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
                  >
                    Curar
                  </button>

                  <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                    <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                      <button
                        type="button"
                        onClick={onDecrementHpDelta}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={hpDelta}
                        onChange={(e) => onHpDeltaChange(e.target.value)}
                        aria-label="Cantidad de curación o daño"
                        className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={onIncrementHpDelta}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onDamage}
                    className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                  >
                    Daño
                  </button>
                </div>

                {/* Columna derecha: HP actual / máximo */}
                <div className="flex min-h-[156px] flex-col items-center justify-center px-2 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-[2.3rem] font-bold leading-none text-white md:text-[2.7rem]">
                      {currentHp}
                    </p>
                    <span className="text-[2rem] font-bold leading-none text-white/45 md:text-[2.4rem]">
                      /
                    </span>
                    {isEditMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={editableMaxHp ?? totalHp}
                          onChange={(e) =>
                            onMaxHpChange?.(
                              Number.parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="w-24 rounded-[12px] border border-white/10 bg-black/30 px-2 py-1 text-center text-[1.6rem] font-bold leading-none text-white outline-none md:w-28 md:text-[2rem]"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onMaxHpChange?.(
                                Math.min(1000, (editableMaxHp ?? totalHp) + 1),
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onMaxHpChange?.(
                                Math.max(1, (editableMaxHp ?? totalHp) - 1),
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[2.3rem] font-bold leading-none text-white md:text-[2.7rem]">
                        {totalHp}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
                    Puntos de vida
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* fin flex-wrap stats+hp */}

          {/* Suministros justo debajo de stats y HP */}
          <div className="min-w-0">{suppliesSlot}</div>
        </div>
        {/* fin columna izquierda */}

        {/* Capacidad de carga */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-300">
                Capacidad de carga
                <span className="ml-2 text-xs text-stone-500">({carga})</span>
              </p>
              {isOverloaded && (
                <span className="text-xs font-bold text-rose-400 animate-pulse">
                  CD+2 FUE y AGI
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenCatalog}
              disabled={isAtMaxCapacity}
              aria-label="Añadir objeto a la mochila"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-300/30 bg-blue-300/10 text-lg font-bold leading-none text-blue-100 transition hover:bg-blue-300/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>
          <div className="mt-3 max-h-[320px] overflow-y-auto pr-1 grid grid-cols-2 gap-2">
            {slots.map(({ item, overCapacity }, i) => (
              <div
                key={i}
                className={`relative flex flex-col gap-1 rounded-[12px] px-3 py-2.5 min-h-[68px] ${
                  overCapacity
                    ? "border border-rose-500/35 bg-rose-950/30"
                    : "border border-blue-500/25 bg-blue-950/35"
                }`}
              >
                {item ? (
                  <>
                    <div className="flex items-start gap-1.5">
                      <span
                        className={`shrink-0 text-xs font-bold tabular-nums mt-0.5 ${overCapacity ? "text-rose-300/70" : "text-blue-300/70"}`}
                      >
                        {item.cantidad}×
                      </span>
                      <span className="flex-1 text-base font-semibold text-amber-200 leading-tight break-words">
                        {item.nombre}
                      </span>
                      {item.tipoObjeto === "ARMA" && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-900/50 text-red-300 border border-red-500/30">
                          arma
                        </span>
                      )}
                      {item.tipoObjeto === "ARMADURA" && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-900/50 text-amber-300 border border-amber-500/30">
                          armadura
                        </span>
                      )}
                    </div>
                    {item.tipoObjeto === "ARMA" && item.formula && (
                      <p className="text-sm text-red-300/80 font-mono">
                        {item.formula}
                      </p>
                    )}
                    {item.tipoObjeto !== "ARMA" && item.descripcion && (
                      <p className="text-sm text-white line-clamp-2">
                        {item.descripcion}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Eliminar ${item.nombre}`}
                      className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-rose-500/60 transition hover:bg-rose-950/50 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
