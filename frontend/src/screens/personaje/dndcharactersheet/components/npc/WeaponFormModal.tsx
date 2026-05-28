import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import type { ObjectCatalogResponse } from "../../../utils/dndApi";
import { fetchObjectCatalog } from "../../../utils/dndApi";

const WEAPON_ABILITY_OPTIONS = [
  { value: "@fuerza", label: "Fuerza" },
  { value: "@destreza", label: "Destreza" },
  { value: "@constitucion", label: "Constitución" },
  { value: "@inteligencia", label: "Inteligencia" },
  { value: "@sabiduria", label: "Sabiduría" },
  { value: "@carisma", label: "Carisma" },
];

function parseFormulaToState(formula: string | null): {
  diceParts: { count: string; sides: string }[];
  baseBonus: string;
  abilityModifiers: string[];
} {
  if (!formula) return { diceParts: [], baseBonus: "", abilityModifiers: [] };
  const parts = formula
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
  const diceParts: { count: string; sides: string }[] = [];
  let baseBonus = "";
  const abilityModifiers: string[] = [];
  for (const part of parts) {
    const diceMatch = part.match(/^(\d+)d(\d+)/i);
    if (diceMatch) {
      diceParts.push({ count: diceMatch[1], sides: diceMatch[2] });
    } else if (/^\d+$/.test(part)) {
      baseBonus = part;
    } else if (part.startsWith("@")) {
      abilityModifiers.push(part);
    }
  }
  return { diceParts, baseBonus, abilityModifiers };
}

export interface WeaponFormModalProps {
  mode: "add" | "edit";
  initialNombre: string;
  initialFormula: string | null;
  initialBonificacion: number;
  initialDescripcion: string;
  isSaving: boolean;
  onConfirm: (data: {
    nombre: string;
    formula: string | null;
    bonificacion: number;
    descripcion: string;
  }) => void;
  onCancel: () => void;
}

/** Modal para añadir o editar un arma/ataque de NPC. */
export default function WeaponFormModal({
  mode,
  initialNombre,
  initialFormula,
  initialBonificacion,
  initialDescripcion,
  isSaving,
  onConfirm,
  onCancel,
}: WeaponFormModalProps) {
  const [tab, setTab] = useState<"catalog" | "custom">(
    mode === "edit" ? "custom" : "catalog",
  );

  // Estado del catálogo (solo en modo añadir)
  const [search, setSearch] = useState("");
  const [catalogItems, setCatalogItems] = useState<ObjectCatalogResponse[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Estado del formulario personalizado
  const parsed = parseFormulaToState(initialFormula);
  const [nombre, setNombre] = useState(initialNombre);
  const [descripcion, setDescripcion] = useState(initialDescripcion);
  const [diceParts, setDiceParts] = useState<
    { count: string; sides: string }[]
  >(parsed.diceParts);
  const [baseBonus, setBaseBonus] = useState(parsed.baseBonus);
  const [showBaseBonus, setShowBaseBonus] = useState(!!parsed.baseBonus);
  const [selectedModifier, setSelectedModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>(
    parsed.abilityModifiers,
  );
  const [attackBonus, setAttackBonus] = useState(
    initialBonificacion !== 0 ? String(initialBonificacion) : "",
  );
  const [customError, setCustomError] = useState<string | null>(null);

  // Búsqueda en catálogo con debounce
  useEffect(() => {
    if (mode !== "add" || tab !== "catalog") return;
    const token = localStorage.getItem("jwtToken") ?? "";
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoadingCatalog(true);
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
          if (!abortController.signal.aborted) setIsLoadingCatalog(false);
        });
    }, 200);
    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [mode, tab, search]);

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

  const handleCustomConfirm = () => {
    if (!nombre.trim()) {
      setCustomError("El nombre es requerido");
      return;
    }
    if (!builtFormula) {
      setCustomError("La fórmula de daño es obligatoria");
      return;
    }
    const bonif = attackBonus !== "" ? parseInt(attackBonus, 10) || 0 : 0;
    onConfirm({
      nombre: nombre.trim(),
      formula: builtFormula,
      bonificacion: bonif,
      descripcion: descripcion.trim(),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-stone-950 shadow-2xl sm:rounded-2xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Armas / Ataques
            </p>
            <h3 className="text-base font-black text-white">
              {mode === "add" ? "Añadir arma" : "Editar arma"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Pestañas — solo en modo añadir */}
        {mode === "add" && (
          <div className="flex gap-2 border-b border-white/10 px-5 py-3">
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
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {/* Pestaña de catálogo */}
          {mode === "add" && tab === "catalog" && (
            <div className="space-y-2">
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
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
                {isLoadingCatalog && (
                  <p className="py-2 text-center text-xs text-white/40">
                    Cargando catálogo...
                  </p>
                )}
                {!isLoadingCatalog && catalogItems.length === 0 && (
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
                        <p className="text-xs text-amber-200/80">
                          {item.formula}
                        </p>
                      )}
                      {item.descripcion && (
                        <p className="line-clamp-1 text-[11px] text-white/50">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.formula) return;
                        onConfirm({
                          nombre: item.nombre,
                          formula: item.formula,
                          bonificacion: 0,
                          descripcion: item.descripcion ?? "",
                        });
                      }}
                      disabled={!item.formula}
                      className="flex-shrink-0 rounded-full border border-amber-300/30 bg-amber-700/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-700/40 disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        !item.formula
                          ? "Este arma no tiene fórmula de daño"
                          : undefined
                      }
                    >
                      Añadir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario personalizado */}
          {(mode === "edit" || tab === "custom") && (
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Nombre del arma
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setCustomError(null);
                  }}
                  placeholder="Ej. Espada del Caos"
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${customError ? "border-red-400/70" : "border-white/20"}`}
                />
                {customError && (
                  <p className="mt-1 text-xs text-red-400">{customError}</p>
                )}
              </div>

              {/* Fórmula de daño */}
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-2.5">
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
                      className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/70 hover:bg-white/10 disabled:opacity-40"
                    >
                      + Dado
                    </button>
                    {!showBaseBonus && !baseBonus && (
                      <button
                        type="button"
                        onClick={() => setShowBaseBonus(true)}
                        className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/70 hover:bg-white/10"
                      >
                        + Bonif.
                      </button>
                    )}
                    <select
                      value={selectedModifier}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && abilityModifiers.length < 3)
                          setAbilityModifiers((p) => [...p, val]);
                        setSelectedModifier("");
                      }}
                      className="rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] text-white/70 outline-none"
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

                {diceParts.map((die, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={die.count}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        const c = isNaN(v)
                          ? ""
                          : String(Math.max(1, Math.min(10, v)));
                        setDiceParts((p) =>
                          p.map((d, j) => (j === i ? { ...d, count: c } : d)),
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
                        const c = isNaN(v)
                          ? ""
                          : String(Math.max(2, Math.min(100, v)));
                        setDiceParts((p) =>
                          p.map((d, j) => (j === i ? { ...d, sides: c } : d)),
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

                {abilityModifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {abilityModifiers.map((mod, i) => (
                      <button
                        key={`${mod}-${i}`}
                        type="button"
                        onClick={() =>
                          setAbilityModifiers((p) =>
                            p.filter((_, j) => j !== i),
                          )
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

                <p className="text-xs text-amber-200/70">
                  {builtFormula ?? "Sin fórmula de daño"}
                </p>
              </div>

              {/* Bonificador de ataque */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Bonificador de ataque{" "}
                  <span className="text-white/35">(-10 a +100, vacío = 0)</span>
                </label>
                <input
                  type="number"
                  min={-10}
                  max={100}
                  value={attackBonus}
                  onChange={(e) => setAttackBonus(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      setAttackBonus("");
                      return;
                    }
                    const v = parseInt(e.target.value, 10);
                    setAttackBonus(
                      isNaN(v) ? "" : String(Math.max(-10, Math.min(100, v))),
                    );
                  }}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-400/60"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Descripción <span className="text-white/35">(opcional)</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Descripción del arma..."
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-400/60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pie — solo en formulario personalizado */}
        {(mode === "edit" || tab === "custom") && (
          <div className="flex gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCustomConfirm}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-60"
            >
              {isSaving
                ? "Guardando…"
                : mode === "add"
                  ? "Añadir arma"
                  : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
