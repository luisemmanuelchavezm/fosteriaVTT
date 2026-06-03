import { useEffect, useState } from "react";
import {
  fetchObjectCatalog,
  type AddDndCharacterInventoryItemRequest,
} from "../../utils/dndApi";
import {
  buildMbWeaponFallbackItems,
  hasMbTag,
  isVisibleMbCatalogItem,
  type MbCatalogItem,
} from "./MorkBorgInventoryCatalogHelpers";
import MorkBorgCustomItemForm from "./MorkBorgCustomItemForm";

const CATALOG_TYPE_FILTERS = [
  { value: "ARMA", label: "Arma" },
  { value: "ARMADURA", label: "Armadura" },
  { value: "OTROS", label: "Otros" },
];

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
  const [items, setItems] = useState<MbCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
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
        .then((catalogItems) => {
          const filteredItems = catalogItems.filter((item) =>
            hasMbTag(item.tags),
          );
          const shouldAddWeaponFallbacks =
            typeFilter === "" || typeFilter === "ARMA";
          setItems(
            shouldAddWeaponFallbacks
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

  const closeModal = () => {
    setSearch("");
    setTypeFilter("");
    setIsCustomMode(false);
    setSubmitError(null);
    onClose();
  };

  const handleAddExisting = async (item: MbCatalogItem) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onAddItem(
        item.fallback
          ? {
              nombre: item.nombre,
              descripcion: item.descripcion,
              formula: item.formula,
              tipoObjeto: item.tipoObjeto,
              indice: item.tags,
              cantidad: 1,
            }
          : { objetoId: item.id, cantidad: 1 },
      );
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

        {/* Mode tabs */}
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
          {isCustomMode ? (
            <MorkBorgCustomItemForm
              isSubmitting={isSubmitting}
              onAddItem={onAddItem}
              onSuccess={closeModal}
            />
          ) : (
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
                items.filter((item) => isVisibleMbCatalogItem(item, typeFilter))
                  .length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-400">
                    No hay objetos que coincidan con el filtro actual.
                  </div>
                ) : null}

                {items
                  .filter((item) => isVisibleMbCatalogItem(item, typeFilter))
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
                          onClick={() => void handleAddExisting(item)}
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
        </div>
      </div>
    </div>
  );
}
