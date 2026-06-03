import { useState } from "react";

interface RandomTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: string[];
}

interface WeaponOption {
  nombre: string;
  formula: string;
}
interface RandomWeaponTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: WeaponOption[];
}

interface BiografiaJson {
  rasgosAleatorios?: RandomTable[];
  armaAleatoria?: RandomWeaponTable;
}

function parseBiografia(bio: string | null | undefined): BiografiaJson | null {
  if (!bio) return null;
  try {
    return JSON.parse(bio) as BiografiaJson;
  } catch {
    return null;
  }
}

function rollDice(sides: number): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] % sides) + 1;
}

function sidesFromDados(dados: string): number {
  const m = dados.match(/d(\d+)/i);
  return m ? Number.parseInt(m[1], 10) : 6;
}

export interface MBEnemyTraitsResult {
  tagsToAdd: string;
}

interface MBEnemyTraitsModalProps {
  nombreEnemigo: string;
  biografia: string | null | undefined;
  onConfirm: (result: MBEnemyTraitsResult) => void;
  onCancel: () => void;
}

export default function MBEnemyTraitsModal({
  nombreEnemigo,
  biografia,
  onConfirm,
  onCancel,
}: MBEnemyTraitsModalProps) {
  const bio = parseBiografia(biografia);
  const tables = bio?.rasgosAleatorios ?? [];
  const weaponTable = bio?.armaAleatoria ?? null;

  // Results: tagKey → rolled index (1-based)
  const [results, setResults] = useState<Record<string, number>>({});

  const rollTable = (table: RandomTable) => {
    const sides = sidesFromDados(table.dados);
    const rolled = rollDice(sides);
    setResults((prev) => ({ ...prev, [table.tagKey]: rolled }));
  };

  const rollWeapon = (table: RandomWeaponTable) => {
    const sides = sidesFromDados(table.dados);
    const rolled = rollDice(sides);
    setResults((prev) => ({ ...prev, [table.tagKey]: rolled }));
  };

  const rollAll = () => {
    const next: Record<string, number> = {};
    for (const t of tables) {
      next[t.tagKey] = rollDice(sidesFromDados(t.dados));
    }
    if (weaponTable) {
      next[weaponTable.tagKey] = rollDice(sidesFromDados(weaponTable.dados));
    }
    setResults(next);
  };

  const allRolled =
    tables.every((t) => results[t.tagKey] !== undefined) &&
    (!weaponTable || results[weaponTable.tagKey] !== undefined);

  const handleConfirm = () => {
    const parts: string[] = [];
    for (const [key, idx] of Object.entries(results)) {
      parts.push(`${key};${idx}`);
    }
    onConfirm({ tagsToAdd: parts.join(",") });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-[24px] border border-white/15 bg-[#14100e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/70">
              Antes de colocar
            </p>
            <h3 className="text-xl font-black text-white">{nombreEnemigo}</h3>
          </div>
          <button
            type="button"
            onClick={rollAll}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/50 px-4 py-1.5 text-sm font-bold text-amber-200 transition hover:bg-amber-900/60"
          >
            🎲 Tirar todo
          </button>
        </div>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {/* Trait tables */}
          {tables.map((table) => {
            const rolled = results[table.tagKey];
            return (
              <div
                key={table.tagKey}
                className="rounded-[16px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-white">
                    {table.nombre}
                    <span className="ml-2 text-xs font-normal text-stone-400">
                      ({table.dados})
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => rollTable(table)}
                    className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-900/50"
                  >
                    🎲 {table.dados}
                    {rolled !== undefined && (
                      <span className="ml-1 text-amber-400">({rolled})</span>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {table.opciones.map((op, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setResults((prev) => ({
                          ...prev,
                          [table.tagKey]: i + 1,
                        }))
                      }
                      className={`rounded-[10px] px-3 py-1.5 text-left text-sm transition ${
                        rolled === i + 1
                          ? "border border-amber-400/50 bg-amber-950/40 text-amber-200 font-semibold"
                          : "border border-white/8 bg-black/20 text-stone-300 hover:bg-white/8"
                      }`}
                    >
                      <span className="text-stone-500 mr-2 text-xs">
                        {i + 1}.
                      </span>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Weapon table */}
          {weaponTable && (
            <div className="rounded-[16px] border border-red-900/40 bg-red-950/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-white">
                  {weaponTable.nombre}
                  <span className="ml-2 text-xs font-normal text-stone-400">
                    ({weaponTable.dados})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => rollWeapon(weaponTable)}
                  className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 text-xs font-bold text-red-300 transition hover:bg-red-900/50"
                >
                  🎲 {weaponTable.dados}
                  {results[weaponTable.tagKey] !== undefined && (
                    <span className="ml-1 text-red-400">
                      ({results[weaponTable.tagKey]})
                    </span>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {weaponTable.opciones.map((op, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setResults((prev) => ({
                        ...prev,
                        [weaponTable.tagKey]: i + 1,
                      }))
                    }
                    className={`flex items-center justify-between rounded-[10px] px-3 py-1.5 text-left text-sm transition ${
                      results[weaponTable.tagKey] === i + 1
                        ? "border border-red-400/50 bg-red-950/40 text-red-200 font-semibold"
                        : "border border-white/8 bg-black/20 text-stone-300 hover:bg-white/8"
                    }`}
                  >
                    <span>
                      <span className="text-stone-500 mr-2 text-xs">
                        {i + 1}.
                      </span>
                      {op.nombre}
                    </span>
                    <span className="font-mono text-xs text-red-300">
                      {op.formula}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allRolled}
            className="flex-1 rounded-xl border border-amber-500/50 bg-amber-700/30 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Colocar en el mapa
          </button>
        </div>
      </div>
    </div>
  );
}
