import { useState } from "react";
import { useWebSocketChat } from "../hooks/useWebSocketChat";

interface CampaignPlayersPanelProps {
  campaignId: string;
  username: string;
}

interface CampaignPlayerResponse {
  username: string;
  dm: boolean;
}

export default function CampaignPlayersPanel({
  campaignId,
  username,
}: CampaignPlayersPanelProps) {
  const [players, setPlayers] = useState<CampaignPlayerResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useWebSocketChat({
    campaignId: parseInt(campaignId),
    username,
    onNewMessage: () => {
      // Los mensajes se manejan en CampaignChatPanel.
    },
    onPlayersUpdate: (playersList) => {
      setPlayers(playersList.players);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(`Error: ${error}`);
    },
  });

  return (
    <aside className="flex h-full min-h-0 w-full max-w-[280px] flex-col text-stone-50">
      <div
        className="w-full rounded-md border-y border-amber-200/70 px-3 py-2"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-amber-100">
          Jugadores
        </h2>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(203,213,225,0.75)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/75 hover:[&::-webkit-scrollbar-thumb]:bg-slate-200/85">
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
            className="rounded-xl border border-white/25 px-3 py-2"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <p
              className="text-sm font-semibold leading-5 text-amber-100 break-words"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {player.username}
              {player.dm ? " (dm)" : ""}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
