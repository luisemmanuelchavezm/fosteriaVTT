interface CampaignPlayersPanelProps {
  players: CampaignPlayerResponse[];
  errorMessage?: string;
}

interface CampaignPlayerResponse {
  username: string;
  dm: boolean;
}

export default function CampaignPlayersPanel({
  players,
  errorMessage,
}: CampaignPlayersPanelProps) {
  return (
    <aside className="flex h-full max-h-[46vh] min-h-0 w-full max-w-[280px] flex-col text-stone-50 md:max-h-[78vh]">
      <div className="w-full rounded-md border-y border-amber-200/70 bg-black/50 px-3 py-2">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-amber-100">
          Jugadores
        </h2>
      </div>

      <div className="mt-3 max-h-[32vh] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(203,213,225,0.75)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/75 hover:[&::-webkit-scrollbar-thumb]:bg-slate-200/85 md:max-h-[62vh]">
        {errorMessage ? (
          <p className="rounded-xl border border-red-300/40 bg-red-900/45 px-3 py-2 text-sm text-red-100">
            {errorMessage}
          </p>
        ) : null}

        {!errorMessage && players.length === 0 ? (
          <p className="rounded-xl border border-white/20 bg-black/45 px-3 py-2 text-sm text-white/90">
            No hay jugadores disponibles.
          </p>
        ) : null}

        {players.map((player) => (
          <div
            key={player.username}
            className="rounded-xl border border-white/25 bg-black/50 px-3 py-2"
          >
            <p className="break-words text-sm font-semibold leading-5 text-amber-100 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [overflow:hidden]">
              {player.username}
              {player.dm ? " (dm)" : ""}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
