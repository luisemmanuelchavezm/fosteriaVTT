import { useEffect, useMemo, useState } from "react";
import { Filter, Trash2 } from "lucide-react";
import UserMenu from "../components/UserMenu";
import AdminUserDetailScreen from "./AdminUserDetailScreen";
import AdminObjectsScreen from "./AdminObjectsScreen";
import AdminMarketplaceScreen from "./AdminMarketplaceScreen";
import fondoImage from "../assets/Fondo login.jpeg";
import { buildApiUrl } from "../lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string;
  campañaCount: number;
  marketplaceCount: number;
}

type SortField =
  | "none"
  | "marketplace"
  | "campañas"
  | "alfabetico"
  | "creacion";
type SortDir = "asc" | "desc";

interface AdminPanelScreenProps {
  token: string;
  username: string;
  avatarUrl: string;
  onLogout: () => void;
}

export default function AdminPanelScreen({
  token,
  username,
  avatarUrl,
  onLogout,
}: AdminPanelScreenProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<
    "usuarios" | "objetos" | "marketplace"
  >("usuarios");

  // Filtros
  const [searchUsername, setSearchUsername] = useState("");
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField("none");
    }
  }

  // Crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [createFieldErrors, setCreateFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function validateCreateForm(): {
    username?: string;
    email?: string;
    password?: string;
  } {
    const errs: { username?: string; email?: string; password?: string } = {};
    const u = createForm.username.trim();
    if (!u) errs.username = "El nombre de usuario es obligatorio";
    else if (u.length < 3) errs.username = "Mínimo 3 caracteres";
    else if (u.length > 100) errs.username = "Máximo 100 caracteres";

    const e = createForm.email.trim();
    if (!e) errs.email = "El email es obligatorio";
    else if (e.length > 254) errs.email = "Máximo 254 caracteres";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      errs.email = "Formato de email no válido";
    else if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(e))
      errs.email = "No se permiten emojis en el email";

    if (!createForm.password) errs.password = "La contraseña es obligatoria";
    else if (createForm.password.length < 8)
      errs.password = "Mínimo 8 caracteres";
    else if (createForm.password.length > 100)
      errs.password = "Máximo 100 caracteres";

    return errs;
  }

  // Borrar usuario
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetch(buildApiUrl("/api/admin/users"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar usuarios");
        return res.json() as Promise<User[]>;
      })
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredUsers = useMemo(() => {
    let result = users.filter(
      (u) => u.username !== username && u.username !== "sistema",
    );

    if (searchUsername.trim())
      result = result.filter((u) =>
        u.username.toLowerCase().includes(searchUsername.toLowerCase()),
      );
    if (searchEmail.trim())
      result = result.filter((u) =>
        u.email.toLowerCase().includes(searchEmail.toLowerCase()),
      );
    if (filterRole !== "ALL")
      result = result.filter((u) => u.role === filterRole);

    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "marketplace")
      result.sort((a, b) => dir * (a.marketplaceCount - b.marketplaceCount));
    if (sortField === "campañas")
      result.sort((a, b) => dir * (a.campañaCount - b.campañaCount));
    if (sortField === "alfabetico")
      result.sort((a, b) => dir * a.username.localeCompare(b.username));
    if (sortField === "creacion") result.sort((a, b) => dir * (a.id - b.id));

    return result;
  }, [
    users,
    username,
    searchUsername,
    searchEmail,
    filterRole,
    sortField,
    sortDir,
  ]);

  function handleCreateUser() {
    const errs = validateCreateForm();
    setCreateFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreateError(null);
    setCreating(true);
    fetch(buildApiUrl("/api/admin/users"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createForm),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg: string =
            (data as { error?: string }).error ?? "No se pudo crear el usuario";
          const lower = msg.toLowerCase();
          if (lower.includes("username") || lower.includes("usuario")) {
            setCreateFieldErrors({ username: "Este usuario ya existe" });
          } else if (lower.includes("email") || lower.includes("correo")) {
            setCreateFieldErrors({ email: "Este email ya existe" });
          } else {
            setCreateError(msg);
          }
          return;
        }
        setShowCreateModal(false);
        setCreateForm({ username: "", email: "", password: "", role: "USER" });
        setCreateFieldErrors({});
        return fetch(buildApiUrl("/api/admin/users"), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json() as Promise<User[]>)
          .then(setUsers);
      })
      .catch((e: Error) => setCreateError(e.message))
      .finally(() => setCreating(false));
  }

  function handleDeleteUser() {
    if (!pendingDeleteUser) return;
    const user = pendingDeleteUser;
    setDeletingUserId(user.id);
    fetch(buildApiUrl(`/api/admin/users/${user.id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo eliminar el usuario");
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setPendingDeleteUser(null);
        setDeleteConfirmText("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setDeletingUserId(null));
  }

  const sortOptions: { field: SortField; label: string }[] = [
    { field: "marketplace", label: "Marketplace" },
    { field: "campañas", label: "Campañas" },
    { field: "alfabetico", label: "Alfabético" },
    { field: "creacion", label: "Más reciente" },
  ];

  const hasExtraFilters = !!(
    searchEmail ||
    filterRole !== "ALL" ||
    sortField !== "none"
  );

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: `url(${fondoImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <UserMenu username={username} avatarUrl={avatarUrl} onLogout={onLogout} />

      <div
        className="fixed inset-x-0 top-0 z-40 flex items-end pb-3 pl-6"
        style={{
          height: "8rem",
          background:
            "linear-gradient(to right, #fbbf24 0%, #f59e0b 25%, rgba(245,158,11,0.4) 55%, transparent 75%)",
          boxShadow: "inset 0 -1px 0 rgba(251,191,36,0.3)",
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] pointer-events-none"
          style={{
            background: "#fbbf24",
            boxShadow: "0 0 18px 4px rgba(251,191,36,0.7)",
          }}
        />
        <div className="flex gap-2">
          {(["usuarios", "objetos", "marketplace"] as const).map((sec) => {
            const labels: Record<string, string> = {
              usuarios: "Usuarios",
              objetos: "Objetos",
              marketplace: "Marketplace",
            };
            const icons: Record<string, string> = {
              usuarios: "◈",
              objetos: "◆",
              marketplace: "◉",
            };
            return (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setActiveSection(sec);
                  setSelectedUserId(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-colors"
                style={
                  activeSection === sec
                    ? {
                        background: "linear-gradient(135deg, #ea580c, #c2410c)",
                        boxShadow: "0 2px 8px rgba(234,88,12,0.5)",
                      }
                    : {
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }
                }
              >
                <span className="text-base">{icons[sec]}</span>
                {labels[sec]}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="fixed inset-x-0 z-40 h-[2px]"
        style={{
          top: "8rem",
          background:
            "linear-gradient(to right, #fbbf24 0%, #fbbf24 60%, rgba(251,191,36,0.1) 100%)",
          boxShadow: "0 0 10px 1px rgba(251,191,36,0.5)",
        }}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-40 bg-stone-950/90 backdrop-blur-sm"
        style={{ top: "calc(8rem + 2px)" }}
      >
        {activeSection === "objetos" ? (
          <AdminObjectsScreen token={token} />
        ) : activeSection === "marketplace" ? (
          <AdminMarketplaceScreen token={token} />
        ) : selectedUserId !== null ? (
          <AdminUserDetailScreen
            token={token}
            userId={selectedUserId}
            onBack={() => setSelectedUserId(null)}
          />
        ) : (
          <div className="h-full overflow-y-auto px-8 py-6">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-amber-100 tracking-widest uppercase drop-shadow">
                Gestión de usuarios
              </h1>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(true);
                  setCreateError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 transition-colors"
              >
                <span className="text-base leading-none">+</span>
                Crear usuario
              </button>
            </div>

            {/* Zona de filtros */}
            <div className="mb-4 flex gap-2 relative">
              <input
                type="text"
                placeholder="Buscar por usuario..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
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
                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-white uppercase tracking-wider">
                        Email
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
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
                            onClick={() => setFilterRole(r)}
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
                            {r === "ALL"
                              ? "Todos"
                              : r === "USER"
                                ? "Usuario"
                                : "Admin"}
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
                        {sortOptions.map((opt) => {
                          const active = sortField === opt.field;
                          const arrow = active
                            ? sortDir === "asc"
                              ? " ↑"
                              : " ↓"
                            : "";
                          return (
                            <button
                              key={opt.field}
                              type="button"
                              onClick={() => handleSort(opt.field)}
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
                    {hasExtraFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchEmail("");
                          setFilterRole("ALL");
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
                Cargando usuarios...
              </p>
            )}
            {error && <p className="text-red-400 text-center py-12">{error}</p>}

            {/* Modal crear usuario */}
            {showCreateModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFieldErrors({});
                  setCreateError(null);
                }}
              >
                <div
                  className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl flex flex-col gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-base font-bold text-white">
                    Crear usuario
                  </h3>
                  <div className="flex flex-col gap-3">
                    {/* Username */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Username (mín. 3 caracteres)"
                        value={createForm.username}
                        onChange={(e) => {
                          setCreateForm((f) => ({
                            ...f,
                            username: e.target.value,
                          }));
                          setCreateFieldErrors((fe) => ({
                            ...fe,
                            username: undefined,
                          }));
                        }}
                        className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60 ${createFieldErrors.username ? "border-rose-500/70" : "border-white/20"}`}
                      />
                      {createFieldErrors.username && (
                        <p className="text-xs text-rose-400">
                          {createFieldErrors.username}
                        </p>
                      )}
                    </div>
                    {/* Email */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="email"
                        placeholder="Email"
                        value={createForm.email}
                        onChange={(e) => {
                          setCreateForm((f) => ({
                            ...f,
                            email: e.target.value,
                          }));
                          setCreateFieldErrors((fe) => ({
                            ...fe,
                            email: undefined,
                          }));
                        }}
                        className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60 ${createFieldErrors.email ? "border-rose-500/70" : "border-white/20"}`}
                      />
                      {createFieldErrors.email && (
                        <p className="text-xs text-rose-400">
                          {createFieldErrors.email}
                        </p>
                      )}
                    </div>
                    {/* Password */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="password"
                        placeholder="Contraseña (mín. 8 caracteres)"
                        value={createForm.password}
                        onChange={(e) => {
                          setCreateForm((f) => ({
                            ...f,
                            password: e.target.value,
                          }));
                          setCreateFieldErrors((fe) => ({
                            ...fe,
                            password: undefined,
                          }));
                        }}
                        className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60 ${createFieldErrors.password ? "border-rose-500/70" : "border-white/20"}`}
                      />
                      {createFieldErrors.password && (
                        <p className="text-xs text-rose-400">
                          {createFieldErrors.password}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCreateForm((f) => ({ ...f, role: "USER" }))
                        }
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          createForm.role === "USER"
                            ? "bg-amber-500/20 border-amber-400/60 text-amber-300"
                            : "bg-white/5 border-white/15 text-white/40 hover:bg-white/10"
                        }`}
                      >
                        Usuario
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCreateForm((f) => ({ ...f, role: "ADMIN" }))
                        }
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          createForm.role === "ADMIN"
                            ? "bg-red-900/40 border-red-500/60 text-red-300"
                            : "bg-white/5 border-white/15 text-white/40 hover:bg-white/10"
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                  {createError && (
                    <p className="text-xs text-rose-400">{createError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateFieldErrors({});
                        setCreateError(null);
                      }}
                      disabled={creating}
                      className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateUser}
                      disabled={creating}
                      className="flex-1 rounded-xl border border-amber-500/50 bg-amber-900/30 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-900/50 transition-colors disabled:opacity-40"
                    >
                      {creating ? "Creando..." : "Crear"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal borrar usuario */}
            {pendingDeleteUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl">
                  <p className="mb-1 text-base font-bold text-white">
                    ¿Borrar usuario?
                  </p>
                  <p className="mb-1 text-sm text-white/70">
                    Se eliminarán{" "}
                    <span className="font-semibold text-red-400">
                      permanente e irreversiblemente
                    </span>{" "}
                    todos sus personajes, mapas y participaciones en campañas.
                  </p>
                  <p className="mb-4 text-sm text-white/70">
                    Escribe{" "}
                    <span className="font-mono font-bold text-white">
                      borrar
                    </span>{" "}
                    para confirmar.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="borrar"
                    className="mb-4 h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingDeleteUser(null);
                        setDeleteConfirmText("");
                      }}
                      className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={
                        deletingUserId !== null ||
                        deleteConfirmText !== "borrar"
                      }
                      onClick={handleDeleteUser}
                      className="flex-1 rounded-xl border border-red-500/50 bg-red-900/30 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900/50 disabled:opacity-40"
                    >
                      {deletingUserId !== null ? "Borrando…" : "Borrar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-amber-200/70 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3 text-center">Marketplace</th>
                    <th className="px-4 py-3 text-center">Campañas</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-t border-white/5 transition-colors ${
                        u.role !== "ADMIN"
                          ? "cursor-pointer hover:bg-amber-400/5"
                          : ""
                      }`}
                      onClick={() =>
                        u.role !== "ADMIN" && setSelectedUserId(u.id)
                      }
                    >
                      <td className="px-4 py-3">
                        <span
                          className="block truncate max-w-[180px] font-semibold text-gray-100"
                          title={u.username}
                        >
                          {u.username}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="block truncate max-w-[260px] text-gray-300"
                          title={u.email}
                        >
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            u.role === "ADMIN"
                              ? "bg-red-900/70 text-red-300 border border-red-700/50"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {u.marketplaceCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {u.campañaCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteUser(u);
                          }}
                          disabled={deletingUserId === u.id}
                          className="p-1 rounded-md bg-red-600/80 text-white opacity-40 hover:opacity-100 transition-opacity hover:bg-red-500 disabled:cursor-not-allowed"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        {users.length === 0
                          ? "No hay usuarios registrados"
                          : "Ningún usuario coincide con los filtros"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
