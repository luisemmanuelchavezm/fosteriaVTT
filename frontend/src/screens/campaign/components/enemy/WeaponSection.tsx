import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  fetchObjectCatalog,
  type ObjectCatalogResponse,
} from "../../../personaje/utils/dndApi";
import { type WeaponEntry } from "../../utils/enemyUtils";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEAPON_ABILITY_OPTIONS = [
  { value: "@fuerza", label: "Fuerza" },
  { value: "@destreza", label: "Destreza" },
  { value: "@constitucion", label: "Constitución" },
  { value: "@inteligencia", label: "Inteligencia" },
  { value: "@sabiduria", label: "Sabiduría" },
  { value: "@carisma", label: "Carisma" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeaponSectionProps {
  weapons: WeaponEntry[];
  onWeaponsChange: React.Dispatch<React.SetStateAction<WeaponEntry[]>>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeaponSection({
  weapons,
  onWeaponsChange,
}: WeaponSectionProps) {
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");

  // Catalog state
  const [search, setSearch] = useState("");
  const [catalogItems, setCatalogItems] = useState<ObjectCatalogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Custom weapon state
  const [customNombre, setCustomNombre] = useState("");
  const [customDescripcion, setCustomDescripcion] = useState("");
  const [diceParts, setDiceParts] = useState<
    { count: string; sides: string }[]
  >([]);
  const [baseBonus, setBaseBonus] = useState("");
  const [showBaseBonus, setShowBaseBonus] = useState(false);
  const [selectedModifier, setSelectedModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>([]);
  const [attackBonus, setAttackBonus] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const keyCounter = useRef(0);

  // Catalog search with debounce
  useEffect(() => {
    if (tab !== "catalog") return;
    const token = localStorage.getItem("jwtToken") ?? "";
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setCatalogError(null);
      void fetchObjectCatalog(
        token,
        { nombre: search.trim() || undefined, tipo: "ARMA" },
        abortController.signal,
      )
        .then(setCatalogItems)
        .catch((err) => {
          if ((err as Error).name !== "AbortError") {
            setCatalogError("No se pudo cargar el catálogo.");
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsLoading(false);
        });
    }, 200);
    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [tab, search]);

  const builtFormula = useMemo(() => {
    const parts: string[] = [];
    for (const die of diceParts) {
      const count = parseInt(die.count, 10);
      const sides = parseInt(die.sides, 10);
      if (!isNaN(count) && !isNaN(sides) && count > 0 && sides > 0) {
        parts.push(`${count}d${sides}`);
      }
    }
    const bonusParsed = parseInt(baseBonus, 10);
    if (!isNaN(bonusParsed) && bonusParsed > 0) parts.push(String(bonusParsed));
    parts.push(...abilityModifiers);
    return parts.join(" + ").trim() || null;
  }, [diceParts, baseBonus, abilityModifiers]);

  const addFromCatalog = (item: ObjectCatalogResponse) => {
    const key = keyCounter.current++;
    onWeaponsChange((prev) => [
      ...prev,
      {
        key,
        displayName: item.nombre,
        payload: { objetoId: item.id, cantidad: 1 },
      },
    ]);
  };

  const addCustomWeapon = () => {
    if (!customNombre.trim()) {
      setCustomError("El nombre es requerido");
      return;
    }
    const key = keyCounter.current++;
    const attackBonusNum =
      attackBonus !== "" ? parseInt(attackBonus, 10) : null;
    const indice =
      attackBonusNum !== null && !isNaN(attackBonusNum)
        ? `BONO_ATAQUE=${attackBonusNum}`
        : "ASCuerpo,COMPETENTE_POR_DEFECTO";
    onWeaponsChange((prev) => [
      ...prev,
      {
        key,
        displayName: `${customNombre.trim()}${builtFormula ? ` (${builtFormula})` : ""}`,
        payload: {
          nombre: customNombre.trim(),
          formula: builtFormula,
          descripcion: customDescripcion.trim() || null,
          tipoObjeto: "ARMA",
          indice,
          cantidad: 1,
        },
      },
    ]);
    setCustomNombre("");
    setCustomDescripcion("");
    setDiceParts([]);
    setBaseBonus("");
    setShowBaseBonus(false);
    setSelectedModifier("");
    setAbilityModifiers([]);
    setAttackBonus("");
    setCustomError(null);
  };

  const removeWeapon = (key: number) =>
    onWeaponsChange((prev) => prev.filter((w) => w.key !== key));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-white/60">
          Armas / Ataques
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-2">
        {(["catalog", "custom"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              tab === t
                ? "bg-amber-200 text-stone-950"
                : "border border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {t === "catalog" ? "Catálogo" : "Personalizada"}
          </button>
        ))}
      </div>

      {/* Catalog tab */}
      {tab === "catalog" && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar arma..."
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50"
          />
          {catalogError && (
            <p className="text-xs text-red-400">{catalogError}</p>
          )}
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {isLoading && (
              <p className="py-2 text-center text-xs text-white/40">
                Cargando catálogo...
              </p>
            )}
            {!isLoading && catalogItems.length === 0 && (
              <p className="py-2 text-center text-xs text-white/40">
                No hay armas que coincidan.
              </p>
            )}
            {catalogItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {item.nombre}
                  </p>
                  {item.formula && (
                    <p className="text-xs text-amber-200/80">{item.formula}</p>
                  )}
                  {item.descripcion && (
                    <p className="line-clamp-1 text-[11px] text-white/50">
                      {item.descripcion}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addFromCatalog(item)}
                  className="flex-shrink-0 rounded-full border border-amber-300/30 bg-amber-700/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-700/40"
                >
                  Añadir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom tab */}
      {tab === "custom" && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Nombre del arma
            </label>
            <input
              type="text"
              value={customNombre}
              onChange={(e) => setCustomNombre(e.target.value)}
              placeholder="Ej. Espada del Caos"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>

          {/* Formula builder */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                Fórmula de daño
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setDiceParts((p) =>
                      p.length < 3 ? [...p, { count: "", sides: "" }] : p,
                    )
                  }
                  disabled={diceParts.length >= 3}
                  className="rounded px-2 py-0.5 text-[10px] font-semibold border border-white/15 text-white/70 hover:bg-white/10 disabled:opacity-40"
                >
                  + Dado
                </button>
                {!showBaseBonus && !baseBonus && (
                  <button
                    type="button"
                    onClick={() => setShowBaseBonus(true)}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold border border-white/15 text-white/70 hover:bg-white/10"
                  >
                    + Bonif.
                  </button>
                )}
                <select
                  value={selectedModifier}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && abilityModifiers.length < 3) {
                      setAbilityModifiers((p) => [...p, val]);
                    }
                    setSelectedModifier("");
                  }}
                  className="rounded px-2 py-0.5 text-[10px] border border-white/15 bg-black/40 text-white/70 outline-none"
                >
                  <option value="">+ Mod.</option>
                  {WEAPON_ABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dice parts */}
            {diceParts.map((die, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={die.count}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const clamped = isNaN(v)
                      ? ""
                      : String(Math.max(1, Math.min(10, v)));
                    setDiceParts((p) =>
                      p.map((d, j) => (j === i ? { ...d, count: clamped } : d)),
                    );
                  }}
                  placeholder="N"
                  className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm font-bold text-white/50">d</span>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={die.sides}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const clamped = isNaN(v)
                      ? ""
                      : String(Math.max(2, Math.min(100, v)));
                    setDiceParts((p) =>
                      p.map((d, j) => (j === i ? { ...d, sides: clamped } : d)),
                    );
                  }}
                  placeholder="S"
                  className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDiceParts((p) => p.filter((_, j) => j !== i))
                  }
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Base bonus */}
            {(showBaseBonus || baseBonus) && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Bonif.:</span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={baseBonus}
                  onChange={(e) => setBaseBonus(e.target.value)}
                  placeholder="0"
                  className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-xs text-white outline-none"
                />
              </div>
            )}

            {/* Ability modifier chips */}
            {abilityModifiers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {abilityModifiers.map((mod, i) => (
                  <button
                    key={`${mod}-${i}`}
                    type="button"
                    onClick={() =>
                      setAbilityModifiers((p) => p.filter((_, j) => j !== i))
                    }
                    className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-200"
                  >
                    {WEAPON_ABILITY_OPTIONS.find((o) => o.value === mod)
                      ?.label ?? mod}{" "}
                    ×
                  </button>
                ))}
              </div>
            )}

            {/* Formula preview */}
            <p className="text-xs text-amber-200/70">
              {builtFormula ?? "Sin fórmula de daño"}
            </p>
          </div>

          {/* Attack bonus */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Bonificador de ataque{" "}
              <span className="text-white/35">(vacío = auto)</span>
            </label>
            <input
              type="number"
              min={-1}
              max={100}
              value={attackBonus}
              onChange={(e) => {
                if (e.target.value === "") {
                  setAttackBonus("");
                  return;
                }
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v))
                  setAttackBonus(String(Math.max(-1, Math.min(100, v))));
              }}
              placeholder="auto (competencia + FUE/DES)"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-400/60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Descripción
            </label>
            <textarea
              value={customDescripcion}
              onChange={(e) => setCustomDescripcion(e.target.value)}
              placeholder="Descripción del arma (opcional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>

          {customError && <p className="text-xs text-red-400">{customError}</p>}

          <button
            type="button"
            onClick={addCustomWeapon}
            className="w-full rounded-lg border border-amber-400/40 bg-amber-700/20 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-700/30"
          >
            Añadir arma
          </button>
        </div>
      )}

      {/* Added weapons list */}
      {weapons.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {weapons.map((w) => (
            <div
              key={w.key}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5"
            >
              <p className="flex-1 truncate text-xs text-white">
                {w.displayName}
              </p>
              <button
                type="button"
                onClick={() => removeWeapon(w.key)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
