import type { ObjectCatalogResponse } from "../../../utils/dndApi";

const OBJECT_TYPES = [
  "",
  "ARMA",
  "ARMADURA",
  "CONSUMIBLE",
  "MISCELANEO",
  "DINERO",
];

interface ExistingInventoryCatalogTabProps {
  search: string;
  typeFilter: string;
  isLoading: boolean;
  error: string | null;
  items: ObjectCatalogResponse[];
  isSubmitting: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onAddExisting: (itemId: number) => void;
}

export default function ExistingInventoryCatalogTab({
  search,
  typeFilter,
  isLoading,
  error,
  items,
  isSubmitting,
  onSearchChange,
  onTypeFilterChange,
  onAddExisting,
}: ExistingInventoryCatalogTabProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filtrar por nombre"
          className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
          className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Todos los tipos</option>
          {OBJECT_TYPES.filter(Boolean).map((type) => (
            <option key={type} value={type}>
              {type}
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

        {!isLoading && items.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-400">
            No hay objetos que coincidan con el filtro actual.
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
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                  {item.tipoObjeto}
                </p>
                {item.formula ? (
                  <p className="mt-3 text-sm font-semibold text-amber-100">
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
                onClick={() => onAddExisting(item.id)}
                className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50"
              >
                Añadir
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
