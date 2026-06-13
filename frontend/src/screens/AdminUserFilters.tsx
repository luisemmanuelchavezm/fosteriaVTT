import { useState } from "react";
import { Filter } from "lucide-react";
import type { SortField, SortDir } from "./adminTypes";

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "marketplace", label: "Marketplace" },
  { field: "campañas", label: "Campañas" },
  { field: "alfabetico", label: "Alfabético" },
  { field: "creacion", label: "Más reciente" },
];

interface AdminUserFiltersProps {
  searchUsername: string;
  onSearchUsernameChange: (v: string) => void;
  searchEmail: string;
  onSearchEmailChange: (v: string) => void;
  filterRole: "ALL" | "USER" | "ADMIN";
  onFilterRoleChange: (v: "ALL" | "USER" | "ADMIN") => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onClearExtraFilters: () => void;
}

export default function AdminUserFilters({
  searchUsername,
  onSearchUsernameChange,
  searchEmail,
  onSearchEmailChange,
  filterRole,
  onFilterRoleChange,
  sortField,
  sortDir,
  onSort,
  onClearExtraFilters,
}: AdminUserFiltersProps) {
  const [showExtra, setShowExtra] = useState(false);
  const hasExtra = !!(
    searchEmail ||
    filterRole !== "ALL" ||
    sortField !== "none"
  );

  return (
    <div className="mb-4 flex gap-2 relative">
      <input
        type="text"
        placeholder="Buscar por usuario..."
        value={searchUsername}
        onChange={(e) => onSearchUsernameChange(e.target.value)}
        className="flex-1 h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50"
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowExtra((v) => !v)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors ${
            showExtra || hasExtra
              ? "border-amber-400/60 bg-amber-500/15 text-amber-300"
              : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          <Filter size={14} />
          Filtros
          {hasExtra && (
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        {showExtra && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-80 max-h-[80vh] overflow-y-auto rounded-xl border border-white/30 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-5 flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Email
              </label>
              <input
                type="text"
                placeholder="Buscar por email..."
                value={searchEmail}
                onChange={(e) => onSearchEmailChange(e.target.value)}
                className="h-9 rounded-lg border border-white/25 bg-black/40 px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Rol */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Rol
              </label>
              <div className="flex gap-2">
                {(["ALL", "USER", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onFilterRoleChange(r)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      filterRole === r
                        ? r === "ADMIN"
                          ? "bg-red-900/50 border-red-500/70 text-white"
                          : r === "USER"
                            ? "bg-amber-500/25 border-amber-400/70 text-white"
                            : "bg-white/25 border-white/40 text-white"
                        : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                    }`}
                  >
                    {r === "ALL" ? "Todos" : r === "USER" ? "Usuario" : "Admin"}
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
                {SORT_OPTIONS.map((opt) => {
                  const active = sortField === opt.field;
                  const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : "";
                  return (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => onSort(opt.field)}
                      className={`py-1.5 rounded-lg text-sm font-semibold border text-left px-3 transition-colors ${
                        active
                          ? "bg-amber-500/25 border-amber-400/70 text-white"
                          : "bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white"
                      }`}
                    >
                      {opt.label}
                      {arrow}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Limpiar */}
            {hasExtra && (
              <button
                type="button"
                onClick={() => {
                  onClearExtraFilters();
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
  );
}
