import type { CampaignPositionResponse } from "../types";

interface CharacterPortraitProps {
  selectedPosition: CampaignPositionResponse;
  portraitFailed: boolean;
  onPortraitError: () => void;
}

export default function CharacterPortrait({
  selectedPosition,
  portraitFailed,
  onPortraitError,
}: CharacterPortraitProps) {
  return (
    <div className="flex items-center gap-2 mr-2">
      <div className="h-10 w-10 rounded-full overflow-hidden border border-amber-400/40 bg-white/10 flex items-center justify-center shrink-0">
        {selectedPosition.retrato && !portraitFailed ? (
          <img
            src={selectedPosition.retrato}
            alt={selectedPosition.personajeNombre}
            className="h-full w-full object-cover"
            onError={onPortraitError}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-white/40"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-white/50 uppercase tracking-wider leading-none mb-0.5">
          Seleccionado
        </span>
        <span className="text-sm font-semibold text-amber-200 max-w-[110px] truncate leading-tight">
          {selectedPosition.personajeNombre}
        </span>
      </div>
    </div>
  );
}
