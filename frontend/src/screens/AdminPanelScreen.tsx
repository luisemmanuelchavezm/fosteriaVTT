import { useEffect, useMemo, useState } from "react";
import UserMenu from "../components/UserMenu";
import AdminUserDetailScreen from "./AdminUserDetailScreen";
import AdminObjectsScreen from "./AdminObjectsScreen";
import AdminMarketplaceScreen from "./AdminMarketplaceScreen";
import AdminCreateUserModal from "./AdminCreateUserModal";
import AdminDeleteUserModal from "./AdminDeleteUserModal";
import AdminUserFilters from "./AdminUserFilters";
import AdminUsersTable from "./AdminUsersTable";
import fondoImage from "../assets/Fondo login.jpeg";
import { buildApiUrl } from "../lib/api";
import type { User, SortField, SortDir } from "./adminTypes";

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
  const [searchEmail, setSearchEmail] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Crear / borrar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

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

  function refreshUsers() {
    fetch(buildApiUrl("/api/admin/users"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<User[]>)
      .then(setUsers);
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
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setDeletingUserId(null));
  }

  function renderContent() {
    if (activeSection === "objetos")
      return <AdminObjectsScreen token={token} />;
    if (activeSection === "marketplace")
      return <AdminMarketplaceScreen token={token} />;
    if (selectedUserId !== null)
      return (
        <AdminUserDetailScreen
          token={token}
          userId={selectedUserId}
          onBack={() => setSelectedUserId(null)}
        />
      );

    return (
      <div className="h-full overflow-y-auto px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-amber-100 tracking-widest uppercase drop-shadow">
            Gestión de usuarios
          </h1>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Crear usuario
          </button>
        </div>

        <AdminUserFilters
          searchUsername={searchUsername}
          onSearchUsernameChange={setSearchUsername}
          searchEmail={searchEmail}
          onSearchEmailChange={setSearchEmail}
          filterRole={filterRole}
          onFilterRoleChange={setFilterRole}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onClearExtraFilters={() => {
            setSearchEmail("");
            setFilterRole("ALL");
            setSortField("none");
          }}
        />

        {loading && (
          <p className="text-gray-400 text-center py-12">
            Cargando usuarios...
          </p>
        )}
        {error && <p className="text-red-400 text-center py-12">{error}</p>}

        {!loading && !error && (
          <AdminUsersTable
            filteredUsers={filteredUsers}
            totalUsersCount={
              users.filter(
                (u) => u.username !== username && u.username !== "sistema",
              ).length
            }
            deletingUserId={deletingUserId}
            onSelectUser={setSelectedUserId}
            onDeleteUser={setPendingDeleteUser}
          />
        )}

        {showCreateModal && (
          <AdminCreateUserModal
            token={token}
            onClose={() => setShowCreateModal(false)}
            onSuccess={refreshUsers}
          />
        )}

        {pendingDeleteUser && (
          <AdminDeleteUserModal
            user={pendingDeleteUser}
            deleting={deletingUserId === pendingDeleteUser.id}
            onCancel={() => setPendingDeleteUser(null)}
            onDelete={handleDeleteUser}
          />
        )}
      </div>
    );
  }

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

      <UserMenu
        username={username}
        avatarUrl={avatarUrl}
        onLogout={onLogout}
        hideEditProfile
      />

      {/* Barra de navegación */}
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
        {renderContent()}
      </div>
    </div>
  );
}
