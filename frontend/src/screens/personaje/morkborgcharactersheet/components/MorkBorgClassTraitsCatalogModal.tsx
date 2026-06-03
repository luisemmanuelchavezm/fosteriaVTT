import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { MBRasgoClaseItem } from "../../utils/mbApi";

interface Props {
  token: string;
  characterAbilityIds: number[];
  characterItemIds: number[];
  onAddAbility: (habilidadId: number) => Promise<void>;
  onAddItem: (objetoId: number) => Promise<void>;
  onCreateCustom: (nombre: string, descripcion: string) => Promise<void>;
  onClose: () => void;
  fetchCatalog: (token: string) => Promise<MBRasgoClaseItem[]>;
}

type ClassFilter =
  | "todos"
  | "escoria"
  | "desertor"
  | "ermitano"
  | "realeza"
  | "sacerdote"
  | "herborista"
  | "otros";

type ActiveTab = "rasgos" | "custom";

const CLASS_FILTERS: { id: ClassFilter; label: string; keyword: string }[] = [
  { id: "todos", label: "Todos", keyword: "" },
  { id: "escoria", label: "Escoria", keyword: "EscoriaAlcantarillas" },
  { id: "desertor", label: "Desertor", keyword: "DesertorColmilludo" },
  { id: "ermitano", label: "Ermitaño", keyword: "ErmitanoEsoterico" },
  { id: "realeza", label: "Realeza", keyword: "RealezaDesgracia" },
  { id: "sacerdote", label: "Sacerdote", keyword: "SacerdoteHereje" },
  { id: "herborista", label: "Herborista", keyword: "HerboristaOcultista" },
  { id: "otros", label: "Otros", keyword: "__otros__" },
];

const CLASS_KEYWORDS = CLASS_FILTERS.filter(
  (f) => f.keyword && f.keyword !== "__otros__" && f.id !== "todos",
).map((f) => f.keyword);

function matchesFilter(item: MBRasgoClaseItem, filter: ClassFilter): boolean {
  if (filter === "todos") return true;
  const tags = item.tags ?? "";
  if (filter === "otros")
    return !CLASS_KEYWORDS.some((kw) => tags.includes(kw));
  const kw = CLASS_FILTERS.find((f) => f.id === filter)?.keyword ?? "";
  return tags.includes(kw);
}

export default function MorkBorgClassTraitsCatalogModal({
  token,
  characterAbilityIds,
  characterItemIds,
  onAddAbility,
  onAddItem,
  onCreateCustom,
  onClose,
  fetchCatalog,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("rasgos");
  const [catalog, setCatalog] = useState<MBRasgoClaseItem[]>([]);
  const [filter, setFilter] = useState<ClassFilter>("todos");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const filterRef = useRef<HTMLDivElement>(null);

  const [customNombre, setCustomNombre] = useState("");
  const [customDescripcion, setCustomDescripcion] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  useEffect(() => {
    setIsCatalogLoading(true);
    fetchCatalog(token)
      .then(setCatalog)
      .finally(() => setIsCatalogLoading(false));
  }, [token, fetchCatalog]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = catalog.filter((item) => {
    const isAbility = item.tipo === "HABILIDAD";
    const alreadyHas = isAbility
      ? characterAbilityIds.includes(item.id)
      : characterItemIds.includes(item.id);
    const matchClass = matchesFilter(item, filter);
    const matchSearch =
      !search || item.nombre.toLowerCase().includes(search.toLowerCase());
    return !alreadyHas && matchClass && matchSearch;
  });

  const handleAdd = async (item: MBRasgoClaseItem) => {
    setLoadingId(item.id);
    try {
      if (item.tipo === "HABILIDAD") await onAddAbility(item.id);
      else await onAddItem(item.id);
    } finally {
      setLoadingId(null);
    }
  };

  const currentFilterLabel =
    CLASS_FILTERS.find((f) => f.id === filter)?.label ?? "Todos";

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
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-amber-200">
              Rasgos de clase
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-3 mb-4">
            {(["rasgos", "custom"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition capitalize ${
                  activeTab === tab
                    ? "bg-amber-200 text-stone-950"
                    : "border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
                }`}
              >
                {tab === "rasgos" ? "Rasgos" : "Personalizado"}
              </button>
            ))}
          </div>

          {/* ── Rasgos tab ── */}
          {activeTab === "rasgos" && (
            <>
              {/* Search + filter dropdown */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar rasgo…"
                  className="flex-1 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-amber-400/40"
                />
                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setFilterOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-stone-300 transition hover:bg-white/5 whitespace-nowrap"
                  >
                    {currentFilterLabel}
                    <span className="text-xs">{filterOpen ? "▲" : "▼"}</span>
                  </button>
                  {filterOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-[14px] border border-white/10 bg-[#1a1410] p-1 shadow-lg">
                      {CLASS_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setFilter(f.id);
                            setFilterOpen(false);
                          }}
                          className={`w-full rounded-[10px] px-3 py-1.5 text-left text-sm transition ${
                            filter === f.id
                              ? "bg-amber-200/20 text-amber-200"
                              : "text-stone-300 hover:bg-white/5"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* List */}
              {isCatalogLoading ? (
                <p className="text-center text-stone-500 text-sm py-8">
                  Cargando…
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-stone-500 text-sm py-8">
                  Sin resultados.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filtered.map((item) => (
                    <div
                      key={`${item.tipo}-${item.id}`}
                      className="rounded-[14px] border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-base font-semibold text-amber-200">
                              {item.nombre}
                            </p>
                            {item.tipo === "OBJETO" && (
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-900/50 text-red-300 border border-red-500/30">
                                arma
                              </span>
                            )}
                          </div>
                          {item.formula && (
                            <p className="text-sm font-mono text-red-300/80">
                              {item.formula}
                            </p>
                          )}
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
                          className="shrink-0 rounded-full border border-amber-400/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-900/60 disabled:opacity-40"
                        >
                          {loadingId === item.id ? "…" : "+ Añadir"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Custom tab ── */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-400">
                Crea una habilidad personalizada con nombre y descripción.
              </p>
              <input
                type="text"
                value={customNombre}
                onChange={(e) => setCustomNombre(e.target.value)}
                placeholder="Nombre del rasgo…"
                className="w-full rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-amber-400/40"
              />
              <textarea
                value={customDescripcion}
                onChange={(e) => setCustomDescripcion(e.target.value)}
                placeholder="Descripción…"
                rows={4}
                className="w-full rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-amber-400/40 resize-none"
              />
              <button
                type="button"
                disabled={!customNombre.trim() || isSavingCustom}
                onClick={async () => {
                  setIsSavingCustom(true);
                  try {
                    await onCreateCustom(
                      customNombre.trim(),
                      customDescripcion.trim(),
                    );
                    setCustomNombre("");
                    setCustomDescripcion("");
                    onClose();
                  } finally {
                    setIsSavingCustom(false);
                  }
                }}
                className="w-full rounded-full border border-amber-400/40 bg-amber-950/50 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-amber-900/60 disabled:opacity-40"
              >
                {isSavingCustom ? "Guardando…" : "Crear rasgo"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
