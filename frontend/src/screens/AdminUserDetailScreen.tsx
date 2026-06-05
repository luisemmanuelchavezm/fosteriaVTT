import { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { buildApiUrl } from "../lib/api";
import CharacterSheetModal from "./campaign/components/CharacterSheetModal";

interface PublishedItem {
  id: number;
  nombre: string;
  imageUrl: string;
  type: "map" | "personaje";
  sistemaDeJuego?: string;
}

interface UserDetail {
  id: number;
  username: string;
  email: string;
  avatar: string;
  campañaCount: number;
  personajeCount: number;
  publishedMaps: Omit<PublishedItem, "type">[];
  publishedPersonajes: Omit<PublishedItem, "type" | "sistemaDeJuego"> &
    { sistemaDeJuego: string }[];
}

interface AdminUserDetailScreenProps {
  token: string;
  userId: number;
  onBack: () => void;
}

interface DeleteConfirmModalProps {
  item: PublishedItem;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({
  item,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-gray-100">
            ¿Seguro que quieres eliminarlo?
          </h3>
          <p className="text-sm text-gray-400 truncate">"{item.nombre}"</p>
        </div>
        <p className="text-xs text-gray-500">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600/80 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ItemCardProps {
  item: PublishedItem;
  onRequestDelete: (item: PublishedItem) => void;
  onOpen: (item: PublishedItem) => void;
  deleting: boolean;
}

function ItemCard({ item, onRequestDelete, onOpen, deleting }: ItemCardProps) {
  return (
    <div className="flex flex-col gap-1 relative group">
      <div
        className={`w-full aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 relative ${item.type === "personaje" ? "cursor-pointer" : ""}`}
        onClick={() => item.type === "personaje" && onOpen(item)}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
            Sin imagen
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(item);
          }}
          disabled={deleting}
          className="absolute top-1 right-1 p-1 rounded-md bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Eliminar"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <p
        className="text-xs text-gray-300 truncate text-center"
        title={item.nombre}
      >
        {item.nombre}
      </p>
    </div>
  );
}

export default function AdminUserDetailScreen({
  token,
  userId,
  onBack,
}: AdminUserDetailScreenProps) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PublishedItem[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sheetItem, setSheetItem] = useState<PublishedItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PublishedItem | null>(
    null,
  );

  // Edit user fields
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [emailEditable, setEmailEditable] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch(buildApiUrl(`/api/admin/users/${userId}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el usuario");
        return res.json() as Promise<UserDetail>;
      })
      .then((data) => {
        setDetail(data);
        setEditUsername(data.username);
        setEditEmail(data.email);
        setItems([
          ...data.publishedMaps.map((m) => ({ ...m, type: "map" as const })),
          ...data.publishedPersonajes.map((p) => ({
            ...p,
            type: "personaje" as const,
          })),
        ]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, userId]);

  const hasChanges = detail
    ? editUsername.trim() !== detail.username ||
      editEmail.trim().toLowerCase() !== detail.email
    : false;

  async function handleSaveUser() {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(buildApiUrl(`/api/admin/users/${detail.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername.trim(),
          email: editEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setDetail((prev) =>
        prev ? { ...prev, username: data.username, email: data.email } : prev,
      );
      setUsernameEditable(false);
      setEmailEditable(false);
      setShowConfirmEdit(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    const endpoint =
      item.type === "map"
        ? `/api/admin/maps/${item.id}`
        : `/api/admin/personajes/${item.id}`;

    setDeletingId(item.id);
    fetch(buildApiUrl(endpoint), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo eliminar");
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setPendingDelete(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setDeletingId(null));
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-amber-300 hover:text-amber-100 transition-colors"
      >
        ← Volver
      </button>

      {loading && (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      )}
      {error && <p className="text-red-400 text-center py-12">{error}</p>}

      {sheetItem && detail && (
        <CharacterSheetModal
          characterId={sheetItem.id}
          sistemaDeJuego={sheetItem.sistemaDeJuego}
          username={detail.username}
          avatarUrl={detail.avatar}
          onLogout={() => {}}
          onGoHome={() => {}}
          onGoCampaigns={() => {}}
          onClose={() => setSheetItem(null)}
          compact
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          item={pendingDelete}
          deleting={deletingId === pendingDelete.id}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {detail && (
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-6">
            <img
              src={detail.avatar}
              alt={detail.username}
              className="h-24 w-24 rounded-full object-cover border-4 border-amber-400/40 shadow-lg flex-shrink-0"
            />
            <div className="flex flex-col gap-2 flex-1">
              {/* Username */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editUsername}
                  disabled={!usernameEditable}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={`text-2xl font-bold bg-transparent text-gray-100 border-b border-transparent outline-none transition w-full max-w-xs ${usernameEditable ? "border-amber-400/50 bg-white/5 px-1 rounded" : ""} disabled:opacity-100`}
                />
                <button
                  type="button"
                  onClick={() => setUsernameEditable(true)}
                  title="Editar usuario"
                  className={`transition-colors ${usernameEditable ? "text-amber-400" : "text-amber-400/40 hover:text-amber-300"}`}
                >
                  <Pencil size={13} />
                </button>
              </div>
              {/* Email */}
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={editEmail}
                  disabled={!emailEditable}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`text-sm bg-transparent text-gray-400 border-b border-transparent outline-none transition w-full max-w-xs ${emailEditable ? "border-amber-400/50 bg-white/5 px-1 rounded text-gray-100" : ""} disabled:opacity-100`}
                />
                <button
                  type="button"
                  onClick={() => setEmailEditable(true)}
                  title="Editar email"
                  className={`transition-colors ${emailEditable ? "text-amber-400" : "text-amber-400/40 hover:text-amber-300"}`}
                >
                  <Pencil size={13} />
                </button>
              </div>
              {/* Save button */}
              {saveError && <p className="text-xs text-red-400">{saveError}</p>}
              <button
                type="button"
                disabled={!hasChanges || saving}
                onClick={() => {
                  setSaveError(null);
                  setShowConfirmEdit(true);
                }}
                className="mt-1 self-start px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-amber-700/70 hover:bg-amber-600 border border-amber-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>

          {/* Confirm edit modal */}
          {showConfirmEdit && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowConfirmEdit(false)}
            >
              <div
                className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-semibold text-gray-100">
                  ¿Estás seguro que quieres modificar a este usuario?
                </h3>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmEdit(false)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm text-gray-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUser}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-700/80 hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Sí, modificar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-bold text-amber-300">
                {detail.campañaCount}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                Campañas
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-bold text-amber-300">
                {detail.personajeCount}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                Personajes
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-amber-200/80 uppercase tracking-widest mb-4">
              Publicaciones en el marketplace ({items.length})
            </h3>
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Este usuario no tiene publicaciones.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onRequestDelete={setPendingDelete}
                    onOpen={setSheetItem}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
