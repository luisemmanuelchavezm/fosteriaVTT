import { Trash2 } from "lucide-react";
import type { User } from "./adminTypes";

interface AdminUsersTableProps {
  filteredUsers: User[];
  totalUsersCount: number;
  deletingUserId: number | null;
  onSelectUser: (id: number) => void;
  onDeleteUser: (user: User) => void;
}

export default function AdminUsersTable({
  filteredUsers,
  totalUsersCount,
  deletingUserId,
  onSelectUser,
  onDeleteUser,
}: AdminUsersTableProps) {
  return (
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
              u.role !== "ADMIN" ? "cursor-pointer hover:bg-amber-400/5" : ""
            }`}
            onClick={() => u.role !== "ADMIN" && onSelectUser(u.id)}
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
                  onDeleteUser(u);
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
            <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
              {totalUsersCount === 0
                ? "No hay usuarios registrados"
                : "Ningún usuario coincide con los filtros"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
