import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchObjectCatalog,
  type ObjectCatalogResponse,
} from "../../personaje/utils/dndApi";
import { MB_WEAPONS } from "../../personaje/createmorkborg/utils/morkBorgUtils";

const MAX_TEXT_LENGTH = 500;

type EquipmentKind = "ARMA" | "ARMADURA";

export interface EquipmentEntry {
  nombre: string;
  formula: string;
  descripcion: string | null;
}

interface MbCatalogItem extends ObjectCatalogResponse {
  fallback?: boolean;
}

function hasMbTag(tags: string | null | undefined) {
  if (!tags) return false;
  return tags.split(",").some((tag) => tag.trim() === "MORK_BORG");
}

function isMbCatalogItem(item: ObjectCatalogResponse, kind: EquipmentKind) {
  return hasMbTag(item.tags) && item.tipoObjeto === kind;
}

function normalizeCatalogName(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

function buildMbWeaponFallbackItems(
  existingItems: ObjectCatalogResponse[],
  search: string,
): MbCatalogItem[] {
  const normalizedSearch = normalizeCatalogName(search);
  const existingNames = new Set(
    existingItems.map((item) => normalizeCatalogName(item.nombre)),
  );

  return MB_WEAPONS.filter((weapon) => {
    const normalizedName = normalizeCatalogName(weapon.nombre);
    const matchesSearch =
      !normalizedSearch || normalizedName.includes(normalizedSearch);
    return matchesSearch && !existingNames.has(normalizedName);
  }).map((weapon) => ({
    id: -weapon.idx,
    nombre: weapon.nombre,
    formula: weapon.formula,
    descripcion: "Arma base de Mork Borg.",
    tipoObjeto: "ARMA",
    tags: `MORK_BORG,Arma,ArmaIdx;${weapon.idx}`,
    fallback: true,
  }));
}

function normalizeDiceFormula(raw: string, kind: EquipmentKind) {
  const compact = raw.trim().replace(/\s+/g, "");
  if (!compact) return "";

  if (kind === "ARMA") {
    if (/^d\d+$/i.test(compact)) return `1${compact}`;
    return compact;
  }

  const withoutMinus = compact.startsWith("-") ? compact.slice(1) : compact;
  if (/^d\d+$/i.test(withoutMinus)) return `-1${withoutMinus}`;
  if (/^\d+d\d+$/i.test(withoutMinus)) return `-${withoutMinus}`;
  return compact.startsWith("-") ? compact : `-${compact}`;
}

function isValidMbFormula(
  formula: string | null | undefined,
  kind: EquipmentKind,
) {
  if (!formula) return false;
  if (kind === "ARMA") return /\d+d\d+/i.test(formula);
  return /^-\d+d\d+$/i.test(formula);
}

export function EquipmentPickerModal({
  token,
  isOpen,
  kind,
  onClose,
  onAdd,
}: {
  token: string;
  isOpen: boolean;
  kind: EquipmentKind;
  onClose: () => void;
  onAdd: (entry: EquipmentEntry) => void;
}) {
  const [search, setSearch] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [items, setItems] = useState<MbCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customFormula, setCustomFormula] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || isCustomMode || !token) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchObjectCatalog(
        token,
        {
          nombre: search.trim() || undefined,
          tipo: kind,
        },
        abortController.signal,
      )
        .then((catalogItems) => {
          const filteredItems = catalogItems.filter(
            (item) =>
              isMbCatalogItem(item, kind) &&
              isValidMbFormula(
                normalizeDiceFormula(item.formula ?? "", kind),
                kind,
              ),
          );
          setItems(
            kind === "ARMA"
              ? [
                  ...filteredItems,
                  ...buildMbWeaponFallbackItems(filteredItems, search),
                ]
              : filteredItems,
          );
        })
        .catch((fetchError) => {
          if ((fetchError as Error).name === "AbortError") return;
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudo cargar el catálogo.",
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
  }, [isCustomMode, isOpen, kind, search, token]);

  const singularTitle = kind === "ARMA" ? "arma" : "armadura";

  const resetAndClose = () => {
    setSearch("");
    setIsCustomMode(false);
    setItems([]);
    setError(null);
    setCustomName("");
    setCustomFormula("");
    setCustomDescription("");
    setSubmitError(null);
    onClose();
  };

  const handleAddCatalogItem = (item: ObjectCatalogResponse) => {
    const formula = normalizeDiceFormula(item.formula ?? "", kind);
    if (!isValidMbFormula(formula, kind)) return;
    onAdd({
      nombre: item.nombre,
      formula,
      descripcion: item.descripcion ?? null,
    });
    resetAndClose();
  };

  const handleCreateCustom = () => {
    const nombre = customName.trim();
    const formula = normalizeDiceFormula(customFormula, kind);
    if (!nombre) {
      setSubmitError(`Debes indicar un nombre para la ${singularTitle}.`);
      return;
    }
    if (!isValidMbFormula(formula, kind)) {
      setSubmitError(
        kind === "ARMA"
          ? "La fórmula del arma debe ser una tirada válida, por ejemplo 1d6 o 1d8+2."
          : "La fórmula de armadura debe ser una tirada como -1d2, -1d4 o -1d6.",
      );
      return;
    }
    onAdd({
      nombre,
      formula,
      descripcion: customDescription.trim() || null,
    });
    resetAndClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-white/15 bg-stone-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300/70">
              Mork Borg
            </p>
            <h3 className="mt-1 text-lg font-black">Añadir {singularTitle}</h3>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex gap-2">
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

        <div className="overflow-y-auto px-5 py-4">
          {!isCustomMode ? (
            <>
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value.slice(0, MAX_TEXT_LENGTH))
                }
                placeholder={`Buscar ${singularTitle} del catálogo`}
                maxLength={MAX_TEXT_LENGTH}
                className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />

              {error ? (
                <div className="mt-4 rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-300">
                    Cargando catálogo...
                  </div>
                ) : null}

                {!isLoading && items.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-400">
                    No hay {kind === "ARMA" ? "armas" : "armaduras"} compatibles
                    con Mork Borg para este filtro.
                  </div>
                ) : null}

                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-white">
                          {item.nombre}
                        </p>
                        {item.formula ? (
                          <p className="mt-2 font-mono text-sm text-rose-200">
                            {normalizeDiceFormula(item.formula, kind)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm leading-6 text-stone-300">
                          {item.descripcion || "Sin descripción."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCatalogItem(item)}
                        className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100"
                      >
                        Añadir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Nombre
                </span>
                <input
                  type="text"
                  value={customName}
                  onChange={(event) =>
                    setCustomName(event.target.value.slice(0, MAX_TEXT_LENGTH))
                  }
                  maxLength={MAX_TEXT_LENGTH}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Fórmula
                </span>
                <input
                  type="text"
                  value={customFormula}
                  onChange={(event) =>
                    setCustomFormula(
                      event.target.value.slice(0, MAX_TEXT_LENGTH),
                    )
                  }
                  maxLength={MAX_TEXT_LENGTH}
                  placeholder={kind === "ARMA" ? "1d6" : "-1d2"}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                    Descripción
                  </span>
                  <span className="text-[10px] text-white/30">
                    {customDescription.length}/{MAX_TEXT_LENGTH}
                  </span>
                </div>
                <textarea
                  value={customDescription}
                  onChange={(event) =>
                    setCustomDescription(
                      event.target.value.slice(0, MAX_TEXT_LENGTH),
                    )
                  }
                  rows={4}
                  maxLength={MAX_TEXT_LENGTH}
                  className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </label>

              {submitError ? (
                <div className="rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {submitError}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustom}
                  className="flex-1 rounded-lg bg-rose-700 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600"
                >
                  Añadir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
