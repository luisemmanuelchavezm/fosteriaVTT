interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.08),_rgba(12,10,9,0.96)_52%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-200/80">
              Confirmación
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
            <p className="mt-4 text-sm leading-6 text-stone-300">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar modal"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-rose-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-stone-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-rose-300/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
