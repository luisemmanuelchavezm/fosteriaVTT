import { Trash2 } from "lucide-react";

export interface CampaignSummary {
  id: string;
  title: string;
  image?: string;
  system: string;
  dmUsername: string;
  lastPlayedAt: string;
}

function formatLastPlayed(lastPlayedAt: string) {
  const parsedDate = new Date(lastPlayedAt);
  if (Number.isNaN(parsedDate.getTime())) return lastPlayedAt;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

interface CampaignCardProps {
  campaign: CampaignSummary;
  onOpen: () => void;
  onDelete: () => void;
}

export default function CampaignCard({
  campaign,
  onOpen,
  onDelete,
}: CampaignCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border border-amber-200/35 bg-stone-900 text-left shadow-xl transition duration-300 hover:-translate-y-1 hover:border-amber-200/70 cursor-pointer"
      onClick={onOpen}
    >
      <button
        type="button"
        aria-label="Eliminar campaña"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/85 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-lg"
      >
        <Trash2 size={14} />
      </button>

      <div className="h-[185px] overflow-hidden bg-stone-800 md:h-[205px]">
        {campaign.image ? (
          <img
            src={campaign.image}
            alt={campaign.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 text-5xl text-white/70">
            🗺
          </div>
        )}
      </div>

      <div className="space-y-2 p-4 md:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">
            Campaña
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            {campaign.title}
          </h3>
        </div>
        <div className="space-y-1.5 text-sm text-stone-300">
          <p>
            <span className="font-semibold text-stone-100">DM:</span>{" "}
            {campaign.dmUsername}
          </p>
          <p>
            <span className="font-semibold text-stone-100">Sistema:</span>{" "}
            {campaign.system}
          </p>
          <p>
            <span className="font-semibold text-stone-100">
              Jugado por ultima vez:
            </span>{" "}
            {formatLastPlayed(campaign.lastPlayedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
