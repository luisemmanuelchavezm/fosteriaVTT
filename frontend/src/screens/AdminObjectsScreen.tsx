import { useEffect, useMemo, useState } from "react";
import { Filter, Trash2 } from "lucide-react";
import { buildApiUrl } from "../lib/api";
import AdminDndCatalogItemForm from "./AdminDndCatalogItemForm";
import MorkBorgCustomItemForm from "./personaje/morkborgcharactersheet/components/MorkBorgCustomItemForm";
import type { AddDndCharacterInventoryItemRequest } from "./personaje/utils/dndApi";

interface CatalogObject {
  id: number;
  nombre: string;
  formula: string | null;
  descripcion: string;
  tipoObjeto: string;
  sistema: string;
  adminCreado: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  ARMA: "Arma",
  ARMADURA: "Armadura",
  CONSUMIBLE: "Consumible",
  MISCELANEO: "Miscelánea",
  DINERO: "Dinero",
};

type Sistema = "DND" | "MORK_BORG";
type SortField = "none" | "alfabetico" | "reciente";
type SortDir = "asc" | "desc";

interface AdminObjectsScreenProps {
  token: string;
}

export default function AdminObjectsScreen({ token }: AdminObjectsScreenProps) {
  const [objects, setObjects] = useState<CatalogObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchNombre, setSearchNombre] = useState("");
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [filterSistema, setFilterSistema] = useState<
    "ALL" | "D&D 5e" | "Mork Borg"
  >("ALL");
  const [filterTipo, setFilterTipo] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [createStep, setCreateStep] = useState<"closed" | "select" | "form">(
    "closed",
  );
  const [createSistema, setCreateSistema] = useState<Sistema | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  function openCreate() {
    setCreateStep("select");
    setCreateSistema(null);
  }
  function closeCreate() {
    setCreateStep("closed");
    setCreateSistema(null);
  }
  function selectSistema(s: Sistema) {
    setCreateSistema(s);
    setCreateStep("form");
  }

  async function handleDelete(id: number) {
    setIsDeleting(true);
    try {
      const res = await fetch(buildApiUrl(`/api/admin/objetos/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "No se pudo eliminar el objeto");
      }
      setObjects((prev) => prev.filter((o) => o.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAdminAdd(
    payload: AddDndCharacterInventoryItemRequest,
  ): Promise<void> {
    setIsSubmitting(true);
    try {
      const res = await fetch(buildApiUrl("/api/admin/objetos"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: payload.nombre,
          formula: payload.formula ?? null,
          descripcion: payload.descripcion ?? "",
          tipoObjeto: payload.tipoObjeto ?? "MISCELANEO",
          sistema: createSistema,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el objeto");
      const newObj: CatalogObject = {
        id: data.id,
        nombre: data.nombre,
        formula: data.formula,
        descripcion: data.descripcion,
        tipoObjeto: data.tipoObjeto,
        sistema: createSistema === "MORK_BORG" ? "Mork Borg" : "D&D 5e",
        adminCreado: true,
      };
      setObjects((prev) =>
        [...prev, newObj].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetch(buildApiUrl("/api/admin/objetos"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar objetos");
        return res.json() as Promise<CatalogObject[]>;
      })
      .then(setObjects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const tipos = useMemo(
    () => Array.from(new Set(objects.map((o) => o.tipoObjeto))).sort(),
    [objects],
  );

  const filtered = useMemo(() => {
    let result = [...objects];
    if (searchNombre.trim())
      result = result.filter((o) =>
        o.nombre.toLowerCase().includes(searchNombre.toLowerCase()),
      );
    if (filterSistema !== "ALL")
      result = result.filter((o) => o.sistema === filterSistema);
    if (filterTipo !== "ALL")
      result = result.filter((o) => o.tipoObjeto === filterTipo);
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "alfabetico")
      result.sort((a, b) => dir * a.nombre.localeCompare(b.nombre));
    if (sortField === "reciente") result.sort((a, b) => dir * (a.id - b.id));
    return result;
  }, [objects, searchNombre, filterSistema, filterTipo, sortField, sortDir]);

  const hasExtraFilters =
    filterSistema !== "ALL" || filterTipo !== "ALL" || sortField !== "none";

  const sistemaColor = (s: string) => {
    if (s === "D&D 5e")
      return "bg-blue-900/50 text-blue-200 border border-blue-700/40";
    if (s === "Mork Borg")
      return "bg-red-900/50 text-red-200 border border-red-700/40";
    return "bg-white/10 text-gray-400";
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-amber-100 tracking-widest uppercase drop-shadow">
          Gestión de objetos
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {filtered.length} de {objects.length} objetos
          </span>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Crear item
          </button>
        </div>
      </div>

      {/* Selector de sistema */}
      {createStep === "select" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeCreate}
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
                onClick={() => selectSistema("DND")}
                className="flex-1 py-4 rounded-xl border border-blue-700/40 bg-blue-900/30 text-sm font-bold text-blue-200 hover:bg-blue-900/50 transition-colors"
              >
                D&amp;D 5e
              </button>
              <button
                type="button"
                onClick={() => selectSistema("MORK_BORG")}
                className="flex-1 py-4 rounded-xl border border-red-700/40 bg-red-900/30 text-sm font-bold text-red-200 hover:bg-red-900/50 transition-colors"
              >
                Mork Borg
              </button>
            </div>
            <button
              type="button"
              onClick={closeCreate}
              className="text-xs text-gray-500 hover:text-gray-300 text-center transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Formulario DnD */}
      {createStep === "form" && createSistema === "DND" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <AdminDndCatalogItemForm
            onAdd={(p) => handleAdminAdd({ ...p, indice: null, cantidad: 1 })}
            onCancel={closeCreate}
            onSuccess={closeCreate}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Formulario Mork Borg */}
      {createStep === "form" && createSistema === "MORK_BORG" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="flex max-h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.06),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-5 py-4 flex-shrink-0">
              <div>
                <p className="text-xs font-medium text-red-300/80">
                  Catálogo — Mork Borg
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  Nuevo objeto de catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreate}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-lg text-white transition hover:border-red-300/30 hover:bg-stone-900/70"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <MorkBorgCustomItemForm
                isSubmitting={isSubmitting}
                onAddItem={handleAdminAdd}
                onSuccess={closeCreate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación borrado */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">
              ¿Eliminar objeto?
            </h3>
            <p className="text-sm text-white/60">
              Esta acción no se puede deshacer. El objeto será eliminado del
              catálogo permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda + filtros */}
      <div className="mb-4 flex gap-2 relative">
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
              {/* Sistema */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Sistema
                </label>
                <div className="flex gap-2">
                  {(["ALL", "D&D 5e", "Mork Borg"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterSistema(s)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                        filterSistema === s
                          ? s === "D&D 5e"
                            ? "bg-blue-900/50 border-blue-500/70 text-white"
                            : s === "Mork Borg"
                              ? "bg-red-900/50 border-red-500/70 text-white"
                              : "bg-white/25 border-white/40 text-white"
                          : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                      }`}
                    >
                      {s === "ALL" ? "Todos" : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Tipo
                </label>
                <div className="flex flex-col gap-1.5">
                  {["ALL", ...tipos].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterTipo(t)}
                      className={`py-1.5 rounded-lg text-sm font-semibold border text-left px-3 transition-colors ${
                        filterTipo === t
                          ? "bg-amber-500/25 border-amber-400/70 text-white"
                          : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                      }`}
                    >
                      {t === "ALL" ? "Todos los tipos" : (TIPO_LABELS[t] ?? t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordenar */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Ordenar por
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { field: "alfabetico" as SortField, label: "Alfabético" },
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

              {/* Limpiar */}
              {hasExtraFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterSistema("ALL");
                    setFilterTipo("ALL");
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
        <p className="text-gray-400 text-center py-12">Cargando objetos...</p>
      )}
      {error && <p className="text-red-400 text-center py-12">{error}</p>}

      {!loading && !error && (
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-amber-200/70 border-b border-white/10">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Sistema</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Fórmula</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((obj) => (
              <tr
                key={obj.id}
                className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3 font-semibold text-gray-100 max-w-[180px]">
                  <span className="block truncate" title={obj.nombre}>
                    {obj.nombre}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${sistemaColor(obj.sistema)}`}
                  >
                    {obj.sistema}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {TIPO_LABELS[obj.tipoObjeto] ?? obj.tipoObjeto}
                </td>
                <td className="px-4 py-3 text-amber-200/70 text-xs font-mono max-w-[120px]">
                  <span className="block truncate" title={obj.formula ?? ""}>
                    {obj.formula ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[300px]">
                  <span className="block truncate" title={obj.descripcion}>
                    {obj.descripcion}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {obj.adminCreado && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(obj.id)}
                      className="p-1 rounded-md bg-red-600/80 text-white opacity-40 hover:opacity-100 transition-opacity hover:bg-red-500"
                      title="Eliminar objeto"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {objects.length === 0
                    ? "No hay objetos en el catálogo"
                    : "Ningún objeto coincide con los filtros"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
