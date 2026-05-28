import { type CampaignCreationSystem } from "./campaignSystem";

interface CampaignSystemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (system: CampaignCreationSystem) => void;
}

export default function CampaignSystemSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: CampaignSystemSelectorModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[30px] border border-white/15 bg-stone-950/95 p-5 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">
              Nueva campaña
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Elige el sistema de juego
            </h3>
            <p className="mt-2 text-sm text-stone-300">
              Selecciona el sistema para comenzar la campaña.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de creación"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20"
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("Dungeons and Dragons")}
            className="group rounded-[24px] border border-amber-200/40 bg-amber-200/10 p-4 text-left transition hover:border-amber-200/70 hover:bg-amber-200/15"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200/20 text-base font-bold text-amber-100">
              D&D
            </div>
            <h4 className="mt-3 text-base font-semibold text-white md:text-lg">
              Dungeons and Dragons
            </h4>
            <p className="mt-2 text-sm text-stone-300">
              Crea una campaña de D&D.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelect("Call Of Cthulhu")}
            className="group rounded-[24px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/25 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-base font-bold text-stone-200">
              COC
            </div>
            <h4 className="mt-3 text-base font-semibold text-white md:text-lg">
              Call of Cthulhu
            </h4>
            <p className="mt-2 text-sm text-stone-300">
              Crea una campaña de Call of Cthulhu.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
