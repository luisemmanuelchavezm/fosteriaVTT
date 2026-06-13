import { createPortal } from "react-dom";
import type { CampaignSummary } from "./CampaignCard";

interface DeleteCampaignModalProps {
  target: CampaignSummary;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteCampaignModal({
  target,
  confirmText,
  onConfirmTextChange,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteCampaignModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-900/40 bg-stone-950 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest">
            Eliminar campaña
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-stone-300 leading-relaxed">
            Vas a eliminar permanentemente{" "}
            <span className="font-semibold text-white">{target.title}</span>{" "}
            junto con todas sus pestañas, mapa, chat y jugadores. Esta acción no
            se puede deshacer.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs text-stone-400 uppercase tracking-widest">
              Escribe <span className="font-bold text-red-400">borrar</span>{" "}
              para confirmar
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder="borrar"
              className="w-full h-10 rounded-lg border border-stone-700 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-red-700"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-stone-700 bg-stone-800 text-sm font-semibold text-stone-200 transition hover:bg-stone-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmText !== "borrar" || isDeleting}
            className="flex-1 h-10 rounded-lg bg-red-700 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? "Eliminando..." : "Eliminar campaña"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
