import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { MBRasgoClaseItem } from "../../utils/dndApi";

type ScrollFilter = "todos" | "sagrado" | "impuro";

interface Props {
  token: string;
  characterAbilityIds: number[];
  fetchCatalog: (token: string) => Promise<MBRasgoClaseItem[]>;
  onAdd: (habilidadId: number) => Promise<void>;
  onClose: () => void;
}

export default function MorkBorgScrollCatalogModal({
  token,
  characterAbilityIds,
  fetchCatalog,
  onAdd,
  onClose,
}: Props) {
  const [catalog, setCatalog] = useState<MBRasgoClaseItem[]>([]);
  const [filter, setFilter] = useState<ScrollFilter>("todos");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchCatalog(token)
      .then((all) =>
        setCatalog(
          all.filter(
            (item) =>
              item.tipo === "HABILIDAD" &&
              (item.tags?.includes("PergaminoImpuro") ||
                item.tags?.includes("PergaminoSagrado")),
          ),
        ),
      )
      .finally(() => setIsLoading(false));
  }, [token, fetchCatalog]);

  const filtered = catalog.filter((item) => {
    if (characterAbilityIds.includes(item.id)) return false;
    if (filter === "sagrado" && !item.tags?.includes("PergaminoSagrado"))
      return false;
    if (filter === "impuro" && !item.tags?.includes("PergaminoImpuro"))
      return false;
    if (search && !item.nombre.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const handleAdd = async (item: MBRasgoClaseItem) => {
    setLoadingId(item.id);
    try {
      await onAdd(item.id);
      onClose();
    } finally {
      setLoadingId(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-[#14100c] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-purple-200">
              Añadir pergamino
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Filtro tipo */}
          <div className="flex gap-2 mb-4">
            {(["todos", "sagrado", "impuro"] as ScrollFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition capitalize ${
                  filter === f
                    ? "bg-purple-200 text-stone-950"
                    : "border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
                }`}
              >
                {f === "todos"
                  ? "Todos"
                  : f === "sagrado"
                    ? "Sagrados"
                    : "Impuros"}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pergamino…"
            className="mb-4 w-full rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-purple-400/40"
          />

          {isLoading ? (
            <p className="py-8 text-center text-sm text-stone-500">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Sin resultados.
            </p>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[14px] border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-amber-200">
                          {item.nombre}
                        </p>
                        {item.tags?.includes("PergaminoSagrado") && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-yellow-900/50 text-yellow-300 border border-yellow-500/30">
                            sagrado
                          </span>
                        )}
                        {item.tags?.includes("PergaminoImpuro") && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-purple-900/50 text-purple-300 border border-purple-500/30">
                            impuro
                          </span>
                        )}
                      </div>
                      {item.descripcion && (
                        <p className="mt-1 text-sm leading-5 text-stone-300">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => void handleAdd(item)}
                      className="shrink-0 rounded-full border border-purple-400/40 bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-200 transition hover:bg-purple-900/60 disabled:opacity-40"
                    >
                      {loadingId === item.id ? "…" : "+ Añadir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
