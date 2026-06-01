import { useEffect, useMemo, useState } from "react";
import {
  fetchObjectCatalog,
  type AddDndCharacterInventoryItemRequest,
  type ObjectCatalogResponse,
} from "../../utils/dndApi";

const MB_ABILITY_OPTIONS = [
  { value: "@mb_fuerza", label: "Fuerza" },
  { value: "@mb_agilidad", label: "Agilidad" },
  { value: "@mb_presencia", label: "Presencia" },
  { value: "@mb_resistencia", label: "Resistencia" },
];

const MB_ARMOR_MODIFIER_CODES = [
  { value: "AGILIDAD", label: "Agilidad" },
  { value: "FUERZA", label: "Fuerza" },
  { value: "PRESENCIA", label: "Presencia" },
  { value: "RESISTENCIA", label: "Resistencia" },
];

const CATALOG_TYPE_FILTERS = [
  { value: "ARMA", label: "Arma" },
  { value: "ARMADURA", label: "Armadura" },
  { value: "OTROS", label: "Otros" },
];
const CUSTOM_WEAPON_MAX_DICE = 10;

interface CustomDiePart {
  count: string;
  sides: string;
}

type CustomObjectType = "ARMA" | "ARMADURA" | "OTROS";

interface MorkBorgInventoryCatalogModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (payload: AddDndCharacterInventoryItemRequest) => Promise<void>;
}

export default function MorkBorgInventoryCatalogModal({
  token,
  isOpen,
  onClose,
  onAddItem,
}: MorkBorgInventoryCatalogModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<ObjectCatalogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customType, setCustomType] = useState<CustomObjectType>("OTROS");
  const [armorBaseValue, setArmorBaseValue] = useState("");
  const [armorModifierCode, setArmorModifierCode] = useState("");
  const [diceParts, setDiceParts] = useState<CustomDiePart[]>([]);
  const [selectedAbilityModifier, setSelectedAbilityModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || isCustomMode) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchObjectCatalog(
        token,
        {
          nombre: search.trim() || undefined,
          tipo: typeFilter && typeFilter !== "OTROS" ? typeFilter : undefined,
        },
        abortController.signal,
      )
        .then(setItems)
        .catch((fetchError) => {
          if ((fetchError as Error).name === "AbortError") return;
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudo cargar el catálogo de objetos.",
          );
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsLoading(false);
        });
    }, 180);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isCustomMode, isOpen, search, token, typeFilter]);

  const builtFormula = useMemo(() => {
    if (customType === "ARMADURA") {
      const baseArmor = Number.parseInt(armorBaseValue, 10);
      if (Number.isNaN(baseArmor) || baseArmor <= 0) return null;
      return armorModifierCode
        ? `CA=${baseArmor}+${armorModifierCode}`
        : `CA=${baseArmor}`;
    }
    if (customType === "OTROS") return null;

    const parts: string[] = [];
    for (const die of diceParts) {
      const count = Number.parseInt(die.count, 10);
      const sides = Number.parseInt(die.sides, 10);
      if (
        !Number.isNaN(count) &&
        !Number.isNaN(sides) &&
        count > 0 &&
        sides > 0
      ) {
        parts.push(`${count}d${sides}`);
      }
    }
    parts.push(...abilityModifiers);
    return parts.join(" + ").trim() || null;
  }, [
    abilityModifiers,
    armorBaseValue,
    armorModifierCode,
    customType,
    diceParts,
  ]);

  const resetCustomForm = () => {
    setCustomName("");
    setCustomDescription("");
    setCustomType("OTROS");
    setArmorBaseValue("");
    setArmorModifierCode("");
    setDiceParts([]);
    setAbilityModifiers([]);
    setSelectedAbilityModifier("");
    setSubmitError(null);
  };

  const closeModal = () => {
    setSearch("");
    setTypeFilter("");
    setIsCustomMode(false);
    resetCustomForm();
    onClose();
  };

  const handleAddExisting = async (itemId: number) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onAddItem({ objetoId: itemId, cantidad: 1 });
      closeModal();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "No se pudo añadir el objeto a la mochila.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDie = () => {
    if (diceParts.length >= 3) {
      setSubmitError("Máximo 3 dados.");
      return;
    }
    setDiceParts((c) => [...c, { count: "", sides: "" }]);
    setSubmitError(null);
  };

  const handleAddModifier = (modifier: string) => {
    if (!modifier) return;
    if (abilityModifiers.length >= 2) {
      setSubmitError("Máximo 2 modificadores.");
      return;
    }
    setAbilityModifiers((c) => [...c, modifier]);
    setSelectedAbilityModifier("");
    setSubmitError(null);
  };

  const sanitize = (value: string, max: number) => {
    const digits = value.replace(/\D+/g, "");
    if (!digits) return "";
    return String(Math.min(max, Number.parseInt(digits, 10)));
  };

  const handleCreate = async () => {
    if (!customName.trim()) {
      setSubmitError("Debes indicar un nombre para el objeto.");
      return;
    }
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onAddItem({
        nombre: customName.trim(),
        descripcion: customDescription.trim() || null,
        formula: builtFormula,
        tipoObjeto: customType === "OTROS" ? "MISCELANEO" : customType,
        indice: null,
        cantidad: 1,
      });
      closeModal();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el objeto personalizado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-rose-200/80">Mochila</p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Añadir objeto
            </h3>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Cerrar modal de objetos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-rose-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-300/10 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${!isCustomMode ? "bg-rose-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${isCustomMode ? "bg-rose-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5">
          {!isCustomMode ? (
            <>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por nombre"
                  className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Todos los tipos</option>
                  {CATALOG_TYPE_FILTERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="mt-4 rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-300">
                    Cargando catálogo de objetos...
                  </div>
                ) : null}

                {!isLoading &&
                items.filter((item) =>
                  typeFilter !== "OTROS"
                    ? true
                    : item.tipoObjeto !== "ARMA" &&
                      item.tipoObjeto !== "ARMADURA",
                ).length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-400">
                    No hay objetos que coincidan con el filtro actual.
                  </div>
                ) : null}

                {items
                  .filter((item) =>
                    typeFilter !== "OTROS"
                      ? true
                      : item.tipoObjeto !== "ARMA" &&
                        item.tipoObjeto !== "ARMADURA",
                  )
                  .map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            {item.nombre}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                            {item.tipoObjeto}
                          </p>
                          {item.formula ? (
                            <p className="mt-3 text-sm font-semibold text-rose-200">
                              {item.formula}
                            </p>
                          ) : null}
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-300">
                            {item.descripcion || "Sin descripción."}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleAddExisting(item.id)}
                          className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-50"
                        >
                          Añadir
                        </button>
                      </div>
                    </article>
                  ))}
              </div>

              {submitError ? (
                <div className="mt-4 rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {submitError}
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              {/* Nombre */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Nombre
                </span>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              {/* Tipo */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Tipo
                </span>
                <select
                  value={customType}
                  onChange={(e) =>
                    setCustomType(e.target.value as CustomObjectType)
                  }
                  className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="ARMA">Arma</option>
                  <option value="ARMADURA">Armadura</option>
                  <option value="OTROS">Otros</option>
                </select>
              </label>

              {/* Fórmula — solo para arma y armadura */}
              {customType !== "OTROS" ? (
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-stone-200">
                        Fórmula
                      </span>
                      <input
                        type="text"
                        value={builtFormula ?? ""}
                        readOnly
                        placeholder="La fórmula se construye automáticamente"
                        className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500"
                      />
                    </label>
                    {customType === "ARMA" ? (
                      <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-7">
                        <button
                          type="button"
                          onClick={handleAddDie}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
                        >
                          Añadir dado
                        </button>
                        <select
                          value={selectedAbilityModifier}
                          onChange={(e) => handleAddModifier(e.target.value)}
                          className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white outline-none"
                        >
                          <option value="">Modificador</option>
                          {MB_ABILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>

                  {customType === "ARMADURA" ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                          CA base
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={armorBaseValue}
                          onChange={(e) =>
                            setArmorBaseValue(sanitize(e.target.value, 30))
                          }
                          placeholder="Ej. 12"
                          className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                          Mod. característica
                        </span>
                        <select
                          value={armorModifierCode}
                          onChange={(e) => setArmorModifierCode(e.target.value)}
                          className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="">Sin modificador</option>
                          {MB_ARMOR_MODIFIER_CODES.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {diceParts.map((die, index) => (
                        <div
                          key={`die-${index}`}
                          className="grid min-w-[250px] flex-1 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_auto] items-end gap-2 md:max-w-[320px]"
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            value={die.count}
                            onChange={(e) => {
                              const v = sanitize(
                                e.target.value,
                                CUSTOM_WEAPON_MAX_DICE,
                              );
                              setDiceParts((c) =>
                                c.map((entry, i) =>
                                  i === index ? { ...entry, count: v } : entry,
                                ),
                              );
                            }}
                            placeholder={`max ${CUSTOM_WEAPON_MAX_DICE}`}
                            className="rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm text-white outline-none placeholder:text-stone-500"
                          />
                          <span className="pb-2 text-center text-lg font-bold text-white">
                            d
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={die.sides}
                            onChange={(e) => {
                              const v = sanitize(e.target.value, 100);
                              setDiceParts((c) =>
                                c.map((entry, i) =>
                                  i === index ? { ...entry, sides: v } : entry,
                                ),
                              );
                            }}
                            placeholder="max 100"
                            className="rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm text-white outline-none placeholder:text-stone-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDiceParts((c) =>
                                c.filter((_, i) => i !== index),
                              )
                            }
                            className="rounded-full border border-rose-300/20 px-3 py-2 text-xs font-semibold text-rose-100"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {customType === "ARMA" && abilityModifiers.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {abilityModifiers.map((mod, index) => (
                        <button
                          key={`${mod}-${index}`}
                          type="button"
                          onClick={() =>
                            setAbilityModifiers((c) =>
                              c.filter((_, i) => i !== index),
                            )
                          }
                          className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100"
                        >
                          {MB_ABILITY_OPTIONS.find((o) => o.value === mod)
                            ?.label ?? mod}{" "}
                          ×
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-4 text-sm text-stone-300">
                    {builtFormula ?? "Sin fórmula"}
                  </p>
                </div>
              ) : null}

              {/* Descripción */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-200">
                  Descripción
                </span>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              {submitError ? (
                <div className="rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {submitError}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stone-300/10 px-6 py-4">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Cancelar
          </button>
          {isCustomMode ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleCreate()}
              className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-50"
            >
              Crear
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
