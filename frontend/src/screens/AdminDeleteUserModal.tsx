import { useState } from "react";

interface AdminDeleteUserModalProps {
  user: { id: number; username: string };
  deleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

export default function AdminDeleteUserModal({
  deleting,
  onCancel,
  onDelete,
}: AdminDeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState("");

  function handleCancel() {
    setConfirmText("");
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl">
        <p className="mb-1 text-base font-bold text-white">¿Borrar usuario?</p>
        <p className="mb-1 text-sm text-white/70">
          Se eliminarán{" "}
          <span className="font-semibold text-red-400">
            permanente e irreversiblemente
          </span>{" "}
          todos sus personajes, mapas y participaciones en campañas.
        </p>
        <p className="mb-4 text-sm text-white/70">
          Escribe <span className="font-mono font-bold text-white">borrar</span>{" "}
          para confirmar.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="borrar"
          className="mb-4 h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting || confirmText !== "borrar"}
            onClick={onDelete}
            className="flex-1 rounded-xl border border-red-500/50 bg-red-900/30 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900/50 disabled:opacity-40"
          >
            {deleting ? "Borrando…" : "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
