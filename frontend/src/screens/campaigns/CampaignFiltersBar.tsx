import { useEffect, useRef, useState } from "react";

const GAME_SYSTEMS = ["Dungeons and Dragons", "Mork Borg"];

interface CampaignFiltersBarProps {
  nameQuery: string;
  onNameQueryChange: (value: string) => void;
  dmQuery: string;
  onDmQueryChange: (value: string) => void;
  selectedSystems: string[];
  onToggleSystem: (system: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  onCreateClick: () => void;
}

export default function CampaignFiltersBar({
  nameQuery,
  onNameQueryChange,
  dmQuery,
  onDmQueryChange,
  selectedSystems,
  onToggleSystem,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
  onCreateClick,
}: CampaignFiltersBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filtersOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [filtersOpen]);

  const handleClearFilters = () => {
    onClearFilters();
    setFiltersOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center justify-end gap-3"
    >
      <button
        type="button"
        onClick={onCreateClick}
        className="h-12 min-w-[138px] rounded-full border border-amber-200/35 bg-amber-200/10 px-7 text-base font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-200/15"
      >
        Crear
      </button>

      <div className="flex min-w-[240px] flex-1 items-center gap-2 md:min-w-[300px] md:max-w-[320px]">
        <input
          type="text"
          value={nameQuery}
          onChange={(event) => onNameQueryChange(event.target.value)}
          placeholder="Buscar por nombre"
          className="h-11 flex-1 rounded-full border border-white/15 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-stone-400 focus:border-amber-200/60"
        />
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen((current) => !current)}
        aria-label="Filtros adicionales"
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-white transition hover:bg-white/20 ${
          hasActiveFilters || filtersOpen
            ? "border-amber-200/60 bg-amber-200/15 text-amber-100"
            : "border-white/15 bg-white/10"
        }`}
      >
        <span className="flex flex-col gap-1">
          <span className="block h-[2px] w-4 rounded-full bg-current" />
          <span className="block h-[2px] w-5 rounded-full bg-current" />
          <span className="block h-[2px] w-3 rounded-full bg-current" />
        </span>
        {activeFilterCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-200 px-1 text-[11px] font-bold text-stone-950">
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      {filtersOpen ? (
        <div className="absolute top-full right-0 z-20 mt-3 w-[min(100%,340px)] rounded-[24px] border border-white/15 bg-stone-950/95 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
              Sistema de juego
            </p>
            <div className="mt-3 space-y-2">
              {GAME_SYSTEMS.map((system) => {
                const isSelected = selectedSystems.includes(system);
                return (
                  <button
                    key={system}
                    type="button"
                    onClick={() => onToggleSystem(system)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isSelected
                        ? "border-amber-200/60 bg-amber-200/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
                    }`}
                  >
                    <span>{system}</span>
                    <span className="text-lg leading-none">
                      {isSelected ? "x" : " "}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
              DM
            </p>
            <input
              type="text"
              value={dmQuery}
              onChange={(event) => onDmQueryChange(event.target.value)}
              placeholder="Buscar por nombre del DM"
              className="mt-3 h-11 w-full rounded-full border border-white/15 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-stone-400 focus:border-amber-200/60"
            />
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
