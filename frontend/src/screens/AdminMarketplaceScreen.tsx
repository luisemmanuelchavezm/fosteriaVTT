import { useEffect, useMemo, useState } from "react";
import { Filter, Trash2 } from "lucide-react";
import { buildApiUrl } from "../lib/api";
import CharacterSheetModal from "./campaign/components/CharacterSheetModal";
import EnemyCreationModal from "./campaign/components/EnemyCreationModal";
import AdminMapUploadModal from "./AdminMapUploadModal";

interface MarketplaceItem {
  id: number;
  tipo: "MAPA" | "PERSONAJE";
  subtipo: "Mapa" | "Enemigo" | "PNJ";
  nombre: string;
  imageUrl: string | null;
  propietario: string;
  sistema: string | null;
  updatedAt: string | null;
}

type SortField = "none" | "nombre" | "reciente";
type SortDir = "asc" | "desc";

const SUBTIPO_COLOR: Record<string, string> = {
  Mapa: "bg-emerald-900/70 text-emerald-200 border border-emerald-700/50",
  Enemigo: "bg-rose-900/70 text-rose-200 border border-rose-700/50",
  PNJ: "bg-sky-900/70 text-sky-200 border border-sky-700/50",
};

interface AdminMarketplaceScreenProps {
  token: string;
}

export default function AdminMarketplaceScreen({
  token,
}: AdminMarketplaceScreenProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchNombre, setSearchNombre] = useState("");
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [filterSubtipo, setFilterSubtipo] = useState<
    "ALL" | "Mapa" | "Enemigo" | "PNJ"
  >("ALL");
  const [filterSistema, setFilterSistema] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [sheetItem, setSheetItem] = useState<MarketplaceItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MarketplaceItem | null>(
    null,
  );
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Creación de contenido
  const [showMapUpload, setShowMapUpload] = useState(false);
  const [npcStep, setNpcStep] = useState<"closed" | "select" | "dnd" | "mb">(
    "closed",
  );

  function handleNpcCreated() {
    setNpcStep("closed");
    // Recarga la lista
    setItems([]);
    setLoading(true);
    fetch(buildApiUrl("/api/admin/marketplace"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json() as Promise<MarketplaceItem[]>)
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleMapUploaded() {
    handleNpcCreated(); // misma lógica de recarga
  }

  function handleSort(field: SortField) {
    if (field === "none") return;
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField("none");
    }
  }

  function openDelete(item: MarketplaceItem) {
    setConfirmDelete(item);
    setDeleteText("");
  }

  function closeDelete() {
    setConfirmDelete(null);
    setDeleteText("");
  }

  useEffect(() => {
    fetch(buildApiUrl("/api/admin/marketplace"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el marketplace");
        return res.json() as Promise<MarketplaceItem[]>;
      })
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDelete() {
    if (!confirmDelete || deleteText !== "borrar") return;
    setIsDeleting(true);
    try {
      const url =
        confirmDelete.tipo === "MAPA"
          ? buildApiUrl(`/api/admin/maps/${confirmDelete.id}`)
          : buildApiUrl(`/api/admin/personajes/${confirmDelete.id}`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el elemento");
      setItems((prev) =>
        prev.filter(
          (i) => !(i.id === confirmDelete.id && i.tipo === confirmDelete.tipo),
        ),
      );
      closeDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  }

  const sistemas = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.sistema).filter(Boolean) as string[]),
      ).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let result = [...items];
    if (searchNombre.trim())
      result = result.filter((i) =>
        i.nombre.toLowerCase().includes(searchNombre.toLowerCase()),
      );
    if (filterSubtipo !== "ALL")
      result = result.filter((i) => i.subtipo === filterSubtipo);
    if (filterSistema !== "ALL")
      result = result.filter((i) => i.sistema === filterSistema);
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "nombre")
      result.sort((a, b) => dir * a.nombre.localeCompare(b.nombre));
    if (sortField === "reciente")
      result.sort(
        (a, b) => dir * (a.updatedAt ?? "").localeCompare(b.updatedAt ?? ""),
      );
    return result;
  }, [items, searchNombre, filterSubtipo, filterSistema, sortField, sortDir]);

  const hasExtraFilters =
    filterSubtipo !== "ALL" || filterSistema !== "ALL" || sortField !== "none";

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-amber-100 tracking-widest uppercase drop-shadow">
          Marketplace
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {filtered.length} de {items.length} elementos
          </span>
          <button
            type="button"
            onClick={() => setShowMapUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
          >
            <span className="text-base leading-none">🗺</span>
            Subir mapa
          </button>
          <button
            type="button"
            onClick={() => setNpcStep("select")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600/20 border border-sky-500/30 hover:bg-sky-600/30 transition-colors"
          >
            <span className="text-base leading-none">👤</span>
            Crear PNJ
          </button>
        </div>
      </div>

      {/* Modal subir mapa */}
      {showMapUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <AdminMapUploadModal
            token={token}
            onClose={() => setShowMapUpload(false)}
            onUploaded={handleMapUploaded}
          />
        </div>
      )}

      {/* Selector sistema PNJ */}
      {npcStep === "select" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setNpcStep("closed")}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">
              ¿Para qué sistema?
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNpcStep("dnd")}
                className="flex-1 py-4 rounded-xl border border-blue-700/40 bg-blue-900/30 text-sm font-bold text-blue-200 hover:bg-blue-900/50 transition-colors"
              >
                D&amp;D 5e
              </button>
              <button
                type="button"
                onClick={() => setNpcStep("mb")}
                className="flex-1 py-4 rounded-xl border border-red-700/40 bg-red-900/30 text-sm font-bold text-red-200 hover:bg-red-900/50 transition-colors"
              >
                Mork Borg
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNpcStep("closed")}
              className="text-xs text-gray-500 hover:text-gray-300 text-center transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Formulario PNJ (DnD o Mork Borg) */}
      <EnemyCreationModal
        isOpen={npcStep === "dnd" || npcStep === "mb"}
        sistemaDeJuego={npcStep === "mb" ? "Mork Borg" : "Dungeons and Dragons"}
        onClose={() => setNpcStep("closed")}
        onCreated={handleNpcCreated}
        adminMode
      />

      {/* Hoja de personaje */}
      {sheetItem && (
        <CharacterSheetModal
          characterId={sheetItem.id}
          sistemaDeJuego={sheetItem.sistema ?? undefined}
          username={sheetItem.propietario}
          avatarUrl=""
          onLogout={() => {}}
          onGoHome={() => {}}
          onGoCampaigns={() => {}}
          onClose={() => setSheetItem(null)}
          compact
        />
      )}

      {/* Modal confirmación borrado con texto explícito */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeDelete}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">
              ¿Eliminar del marketplace?
            </h3>
            <p className="text-sm text-white/60">
              Se eliminará{" "}
              <span className="font-semibold text-white">
                "{confirmDelete.nombre}"
              </span>{" "}
              permanentemente.
              {confirmDelete.tipo === "PERSONAJE" &&
                " Esto también borrará el personaje y todos sus datos asociados."}
            </p>
            <p className="text-sm text-white/60">
              Escribe{" "}
              <span className="font-mono font-bold text-white">borrar</span>{" "}
              para confirmar.
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="borrar"
              className="h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDelete}
                className="flex-1 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteText !== "borrar"}
                onClick={() => void handleDelete()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-40 transition-colors"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda + filtros */}
      <div className="mb-6 flex gap-2 relative">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchNombre}
          onChange={(e) => setSearchNombre(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50"
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExtraFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors ${
              showExtraFilters || hasExtraFilters
                ? "border-amber-400/60 bg-amber-500/15 text-amber-300"
                : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Filter size={14} />
            Filtros
            {hasExtraFilters && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {showExtraFilters && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-80 max-h-[80vh] overflow-y-auto rounded-xl border border-white/30 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Tipo
                </label>
                <div className="flex gap-2">
                  {(["ALL", "Mapa", "Enemigo", "PNJ"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterSubtipo(s)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                        filterSubtipo === s
                          ? "bg-amber-500/25 border-amber-400/70 text-white"
                          : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                      }`}
                    >
                      {s === "ALL" ? "Todos" : s}
                    </button>
                  ))}
                </div>
              </div>

              {sistemas.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Sistema
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {["ALL", ...sistemas].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilterSistema(s)}
                        className={`py-1.5 rounded-lg text-sm font-semibold border text-left px-3 transition-colors ${
                          filterSistema === s
                            ? "bg-amber-500/25 border-amber-400/70 text-white"
                            : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                        }`}
                      >
                        {s === "ALL" ? "Todos los sistemas" : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Ordenar por
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { field: "nombre" as SortField, label: "Nombre" },
                    { field: "reciente" as SortField, label: "Más reciente" },
                  ].map(({ field, label }) => {
                    const active = sortField === field;
                    const arrow = active
                      ? sortDir === "asc"
                        ? " ↑"
                        : " ↓"
                      : "";
                    return (
                      <button
                        key={field}
                        type="button"
                        onClick={() => handleSort(field)}
                        className={`py-1.5 rounded-lg text-sm font-semibold border text-left px-3 transition-colors ${
                          active
                            ? "bg-amber-500/25 border-amber-400/70 text-white"
                            : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                        }`}
                      >
                        {label}
                        {arrow}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasExtraFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterSubtipo("ALL");
                    setFilterSistema("ALL");
                    setSortField("none");
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-colors"
                >
                  ✕ Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-gray-400 text-center py-12">
          Cargando marketplace...
        </p>
      )}
      {error && <p className="text-red-400 text-center py-12">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">
          {items.length === 0
            ? "No hay elementos en el marketplace"
            : "Ningún elemento coincide con los filtros"}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((item) => {
            const isPersonaje = item.tipo === "PERSONAJE";
            return (
              <div
                key={`${item.tipo}-${item.id}`}
                className="group relative flex flex-col rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors"
              >
                {/* Imagen */}
                <div
                  className={`relative aspect-square w-full bg-black/40 overflow-hidden ${isPersonaje ? "cursor-pointer" : ""}`}
                  onClick={() => isPersonaje && setSheetItem(item)}
                  title={isPersonaje ? `Ver hoja de ${item.nombre}` : undefined}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/15 text-4xl select-none">
                      {item.subtipo === "Mapa" ? "🗺" : "👤"}
                    </div>
                  )}

                  {/* Overlay de "ver hoja" en personajes al hover */}
                  {isPersonaje && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-semibold text-white/90 bg-black/50 px-2 py-1 rounded-lg">
                        Ver hoja
                      </span>
                    </div>
                  )}

                  {/* Badge tipo */}
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${SUBTIPO_COLOR[item.subtipo] ?? "bg-black/60 text-white/60"}`}
                  >
                    {item.subtipo}
                  </span>

                  {/* Botón borrar — solo visible en hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDelete(item);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/40 opacity-0 group-hover:opacity-100 hover:bg-red-600/80 hover:text-white transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Info */}
                <div className="px-2.5 py-2 flex flex-col gap-0.5">
                  <p
                    className="text-xs font-semibold text-gray-100 truncate"
                    title={item.nombre}
                  >
                    {item.nombre}
                  </p>
                  <p
                    className="text-[10px] text-gray-500 truncate"
                    title={item.propietario}
                  >
                    {item.propietario}
                  </p>
                  {item.sistema && (
                    <p className="text-[10px] text-white/30 truncate">
                      {item.sistema}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
