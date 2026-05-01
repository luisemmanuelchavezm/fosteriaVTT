import { createPortal } from "react-dom";

import type { FeatOption } from "../feats";

interface FeatDetailModalProps {
  feat: FeatOption | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatDetailModal({
  feat,
  isOpen,
  onClose,
}: FeatDetailModalProps) {
  if (!isOpen || !feat || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-amber-200/80">
              Detalle de dote
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {feat.nombre}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="rounded-[24px] border border-stone-300/10 bg-black/30 p-5">
            <h4 className="text-lg font-semibold text-amber-100">
              Texto completo
            </h4>
            <p className="mt-4 text-sm leading-7 text-stone-100/90">
              {feat.descripcionCompleta ?? feat.descripcion}
            </p>
          </div>

          {feat.requisitos.length > 0 ? (
            <div className="mt-4 rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
              <h4 className="text-lg font-semibold text-white">Requisitos</h4>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                {feat.requisitos.join(", ")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-stone-300/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
