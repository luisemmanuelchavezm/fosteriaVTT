import { useState } from "react";

interface CharacterDetailModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  formula?: string | null;
  quantity?: number | null;
  deleteLabel?: string;
  onClose: () => void;
  onDelete?: () => void;
  onSaveQuantity?: (quantity: number) => void;
}

export default function CharacterDetailModal({
  isOpen,
  title,
  subtitle,
  description,
  formula,
  quantity = null,
  deleteLabel = "Eliminar",
  onClose,
  onDelete,
  onSaveQuantity,
}: CharacterDetailModalProps) {
  const [currentQuantity, setCurrentQuantity] = useState(
    quantity === null ? "" : String(quantity),
  );

  if (!isOpen) {
    return null;
  }

  const parsedQuantity = Number.parseInt(currentQuantity, 10);
  const safeQuantity = Number.isNaN(parsedQuantity)
    ? 0
    : Math.max(0, parsedQuantity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            {subtitle ? (
              <p className="text-sm font-medium text-sky-200/80">{subtitle}</p>
            ) : null}
            <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {formula ? (
            <div className="rounded-[20px] border border-stone-300/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Fórmula
              </p>
              <p className="mt-3 text-base font-semibold text-white">
                {formula}
              </p>
            </div>
          ) : null}

          {onSaveQuantity ? (
            <div className="mt-5 rounded-[20px] border border-stone-300/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Cantidad
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuantity(String(Math.max(0, safeQuantity - 1)))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm text-white"
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentQuantity}
                  onChange={(event) =>
                    setCurrentQuantity(event.target.value.replace(/\D+/g, ""))
                  }
                  className="w-24 rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm font-semibold text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCurrentQuantity(String(safeQuantity + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm text-white"
                >
                  +
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-[24px] border border-stone-300/10 bg-black/30 p-5">
            <h4 className="text-lg font-semibold text-amber-100">
              Descripción
            </h4>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-100/90">
              {description?.trim() || "No hay descripción disponible."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-300/10 px-6 py-4">
          {onSaveQuantity ? (
            <button
              type="button"
              onClick={() => onSaveQuantity(safeQuantity)}
              className="rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-100"
            >
              Guardar cantidad
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100"
            >
              {deleteLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
