import { useState } from "react";
import type { DndCharacterDetailResponse } from "../utils/dndApi";
import { ABILITY_STATS } from "../creatednd/utils/statisticsUtils";
import { SKILL_ROWS, SAVING_THROW_ROWS } from "./data";

type NpcTab = "estadisticas" | "info" | "rasgos";

interface NpcSheetContentProps {
  character: DndCharacterDetailResponse;
  currentHp: number;
  totalHp: number;
  tempHp: number;
  hpDelta: string;
  tempHpDelta: string;
  onHpDeltaChange: (value: string) => void;
  onTempHpDeltaChange: (value: string) => void;
  onHeal: () => void;
  onDamage: () => void;
  onGainTempHp: () => void;
  onLoseTempHp: () => void;
  onIncrementHpDelta: () => void;
  onDecrementHpDelta: () => void;
  onIncrementTempHpDelta: () => void;
  onDecrementTempHpDelta: () => void;
  sanitizeNonNegativeNumber: (value: string) => string;
}

function abilitySuffix(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

function fmtBonus(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export default function NpcSheetContent({
  character,
  currentHp,
  totalHp,
  tempHp,
  hpDelta,
  tempHpDelta,
  onHpDeltaChange,
  onTempHpDeltaChange,
  onHeal,
  onDamage,
  onGainTempHp,
  onLoseTempHp,
  onIncrementHpDelta,
  onDecrementHpDelta,
  onIncrementTempHpDelta,
  onDecrementTempHpDelta,
  sanitizeNonNegativeNumber,
}: NpcSheetContentProps) {
  const [activeTab, setActiveTab] = useState<NpcTab>("estadisticas");

  const ca = character.estadisticas["CA"] ?? 10;
  const mov = character.estadisticas["Movimiento"] ?? 30;
  const ini = character.estadisticas["Iniciativa"] ?? 0;

  const skillBonuses = SKILL_ROWS.filter((skill) => {
    const val = character.estadisticas[skill.name];
    return val !== undefined && val !== 0;
  }).map((skill) => ({
    displayName: skill.displayName,
    bonus: character.estadisticas[skill.name] ?? 0,
  }));

  const saveBonuses = SAVING_THROW_ROWS.filter((save) => {
    const val =
      character.estadisticas[`Salvacion de ${save.statName}`] ??
      character.estadisticas[`Salvación de ${save.statName}`];
    return val !== undefined && val !== 0;
  }).map((save) => ({
    displayName: save.displayName,
    bonus:
      character.estadisticas[`Salvacion de ${save.statName}`] ??
      character.estadisticas[`Salvación de ${save.statName}`] ??
      0,
  }));

  const pasivas = character.habilidades.filter((h) => {
    const tags = h.tags?.toUpperCase().split(",") ?? [];
    return tags.includes("NPC") && tags.includes("PASIVA");
  });
  const acciones = character.habilidades.filter((h) => {
    const tags = h.tags?.toUpperCase().split(",") ?? [];
    return tags.includes("NPC") && tags.includes("ACCION");
  });

  const TABS: { key: NpcTab; label: string }[] = [
    { key: "estadisticas", label: "Estadísticas" },
    { key: "info", label: "Información" },
    { key: "rasgos", label: "Rasgos" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      {/* Portrait + nombre */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-28 w-28 overflow-hidden rounded-2xl border-2 border-amber-400/40 shadow-lg">
          {character.retrato ? (
            <img
              src={character.retrato}
              alt={character.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-12 w-12 text-white/30"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">{character.nombre}</h2>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            character.tipo === "PNJ"
              ? "bg-sky-700/40 text-sky-200"
              : "bg-rose-800/40 text-rose-200"
          }`}
        >
          {character.tipo === "PNJ" ? "PNJ" : "Enemigo"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "border-b-2 border-amber-400 text-amber-200"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Estadísticas ── */}
      {activeTab === "estadisticas" && (
        <div className="space-y-5">
          {/* Ability scores */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ABILITY_STATS.map((stat) => {
              const score = character.estadisticas[stat.name] ?? 10;
              return (
                <div
                  key={stat.id}
                  className="flex flex-col items-center rounded-[18px] border-2 border-white bg-white px-2 py-3 text-center shadow-md"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {stat.name}
                  </p>
                  <p className="my-0.5 text-xl font-bold text-stone-900">
                    {abilitySuffix(score)}
                  </p>
                  <p className="text-sm font-semibold text-stone-600">
                    {score}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Secondary stats: CA / MOV / INI */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "CA", value: String(ca) },
              { label: "Movimiento", value: `${mov} m` },
              { label: "Iniciativa", value: fmtBonus(ini) },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-xl border border-white/15 bg-white/5 py-3 text-center"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* HP widget */}
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 sm:grid-cols-[120px_120px_minmax(0,1fr)]">
              {/* Curar / Delta / Daño column */}
              <div className="grid grid-rows-[48px_48px_48px] gap-2">
                <button
                  type="button"
                  onClick={onHeal}
                  className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
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
                      onChange={(e) =>
                        onHpDeltaChange(
                          sanitizeNonNegativeNumber(e.target.value),
                        )
                      }
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
                  className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                >
                  Daño
                </button>
              </div>

              {/* Temp HP column */}
              <div className="grid grid-rows-[48px_48px_48px] gap-2">
                <button
                  type="button"
                  onClick={onGainTempHp}
                  className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
                >
                  Temp +
                </button>
                <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                  <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                    <button
                      type="button"
                      onClick={onDecrementTempHpDelta}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tempHpDelta}
                      onChange={(e) =>
                        onTempHpDeltaChange(
                          sanitizeNonNegativeNumber(e.target.value),
                        )
                      }
                      className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={onIncrementTempHpDelta}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLoseTempHp}
                  className="rounded-[16px] border border-cyan-300/35 bg-cyan-400/10 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Temp -
                </button>
              </div>

              {/* HP display */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2">
                  <p className="text-[2.6rem] font-bold leading-none text-white">
                    {currentHp}
                  </p>
                  <span className="text-[2rem] font-bold leading-none text-white/40">
                    /
                  </span>
                  <p className="text-[2rem] font-bold leading-none text-white/70">
                    {totalHp}
                  </p>
                </div>
                {tempHp > 0 && (
                  <p className="mt-2 text-sm font-semibold text-sky-300">
                    +{tempHp} temp
                  </p>
                )}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  Puntos de vida
                </p>
              </div>
            </div>
          </div>

          {/* Skill bonuses (only if overrides exist) */}
          {skillBonuses.length > 0 && (
            <p className="text-sm text-white/80">
              <span className="font-bold text-white">Habilidades: </span>
              {skillBonuses
                .map((s) => `${s.displayName} ${fmtBonus(s.bonus)}`)
                .join(", ")}
            </p>
          )}

          {/* Saving throw bonuses (only if overrides exist) */}
          {saveBonuses.length > 0 && (
            <p className="text-sm text-white/80">
              <span className="font-bold text-white">Salvaciones: </span>
              {saveBonuses
                .map((s) => `${s.displayName} ${fmtBonus(s.bonus)}`)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {/* ── Tab 2: Información ── */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {character.vd && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-900/15 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300/70">
                Valor de Desafío
              </span>
              <span className="text-lg font-bold text-amber-200">
                {character.vd}
              </span>
            </div>
          )}
          {character.biografia ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">
                Descripción
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {character.biografia}
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-white/30">Sin descripción</p>
          )}
        </div>
      )}

      {/* ── Tab 3: Rasgos ── */}
      {activeTab === "rasgos" && (
        <div className="space-y-6">
          {pasivas.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
                Pasivas
              </h3>
              <div className="space-y-3">
                {pasivas.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="font-semibold text-amber-200">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="mt-1 text-sm leading-relaxed text-white/70">
                        {p.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {acciones.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
                Acciones
              </h3>
              <div className="space-y-3">
                {acciones.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="font-semibold text-amber-200">{a.nombre}</p>
                    {a.descripcion && (
                      <p className="mt-1 text-sm leading-relaxed text-white/70">
                        {a.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pasivas.length === 0 && acciones.length === 0 && (
            <p className="text-center text-sm text-white/30">Sin rasgos</p>
          )}
        </div>
      )}
    </div>
  );
}
