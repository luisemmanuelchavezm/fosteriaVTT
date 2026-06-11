import { type CampaignCreationSystem } from "./campaignSystem";

interface CampaignSystemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (system: CampaignCreationSystem) => void;
  context?: "campaign" | "character";
}

const LABELS = {
  campaign: {
    eyebrow: "Nueva campaña",
    title: "Elige el sistema de juego",
    subtitle: "Selecciona el sistema para comenzar la campaña.",
    dndDescription: "Crea una campaña de D&D.",
    mbDescription: "Crea una campaña de Mork Borg.",
  },
  character: {
    eyebrow: "Nuevo personaje",
    title: "Elige el sistema de juego",
    subtitle: "Elige el sistema para empezar a crear tu personaje.",
    dndDescription: "Crear personaje por fases.",
    mbDescription: "Crear personaje por fases.",
  },
};

export default function CampaignSystemSelectorModal({
  isOpen,
  onClose,
  onSelect,
  context = "campaign",
}: CampaignSystemSelectorModalProps) {
  if (!isOpen) {
    return null;
  }

  const labels = LABELS[context];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[30px] border border-white/15 bg-stone-950/95 p-5 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">
              {labels.eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {labels.title}
            </h3>
            <p className="mt-2 text-sm text-stone-300">{labels.subtitle}</p>
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
              {labels.dndDescription}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelect("Mork Borg")}
            className="group rounded-[24px] border border-red-900/40 bg-red-900/10 p-4 text-left transition hover:border-red-900/70 hover:bg-red-900/15"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-900/20 text-base font-bold text-red-200">
              MB
            </div>
            <h4 className="mt-3 text-base font-semibold text-white md:text-lg">
              Mork Borg
            </h4>
            <p className="mt-2 text-sm text-stone-300">
              {labels.mbDescription}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
