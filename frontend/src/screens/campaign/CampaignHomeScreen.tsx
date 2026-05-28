import { Link2, LogOut, Map } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CampaignChatPanel from "./components/CampaignChatPanel";
import CampaignPlayersPanel from "./components/CampaignPlayersPanel";
import { useWebSocketChat } from "./hooks/useWebSocketChat";

const CAMPAIGN_BACKGROUND_URL =
  "https://res.cloudinary.com/doxqtmi46/image/upload/v1775178243/campa%C3%B1aPlaceHolder_fhrfx2.png";

interface CampaignHomeScreenProps {
  campaignId: string;
  onExit?: () => void;
  onOpenCampaignPestaña?: () => void;
}

export default function CampaignHomeScreen({
  campaignId,
  onExit,
  onOpenCampaignPestaña,
}: CampaignHomeScreenProps) {
  const [username, setUsername] = useState<string>("");
  const [messages, setMessages] = useState<
    Array<{ id: number; username: string; mensaje: string; enviadoEn: string }>
  >([]);
  const [players, setPlayers] = useState<
    Array<{ username: string; dm: boolean }>
  >([]);
  const [chatRealtimeError, setChatRealtimeError] = useState<string>("");

  // Invite popover
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteRef = useRef<HTMLDivElement>(null);
  const inviteLink = campaignId
    ? `${window.location.origin}${window.location.pathname}?join=${campaignId}`
    : "";

  const { sendMessage } = useWebSocketChat({
    campaignId: parseInt(campaignId),
    username,
    onNewMessage: (message) => {
      setMessages((current) => [...current, message]);
    },
    onPlayersUpdate: (playersList) => {
      setPlayers(playersList.players);
      setChatRealtimeError("");
    },
    onError: (error) => {
      setChatRealtimeError(`Error WebSocket: ${error}`);
    },
  });

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") ?? "";
    if (storedUsername) {
      setUsername(storedUsername);
      return;
    }
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1])) as { sub?: string };
      setUsername(payload.sub ?? "");
    } catch {
      setUsername("");
    }
  }, []);

  // Close invite popover on outside click
  useEffect(() => {
    if (!isInviteOpen) return;
    const handler = (e: MouseEvent) => {
      if (inviteRef.current && !inviteRef.current.contains(e.target as Node)) {
        setIsInviteOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isInviteOpen]);

  const handleCopyInvite = () => {
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  };

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center bg-no-repeat px-3 pb-4 text-stone-50 md:px-6 md:pb-6"
      style={{ backgroundImage: `url(${CAMPAIGN_BACKGROUND_URL})` }}
    >
      {/* Top-left: Exit + Invite buttons */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        {/* Exit button */}
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir de la campaña"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white transition hover:border-red-500/40 hover:bg-red-950/60 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
        </button>

        {/* Invite button */}
        <div ref={inviteRef}>
          <button
            type="button"
            onClick={() => setIsInviteOpen((v) => !v)}
            aria-label="Invitar a la campaña"
            className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
              isInviteOpen
                ? "border-amber-400/80 bg-amber-500/30 text-amber-300"
                : "border-white/25 bg-black/50 text-white hover:bg-black/60"
            }`}
          >
            <Link2 className="h-5 w-5" />
          </button>

          {isInviteOpen && (
            <div className="absolute left-0 mt-3 w-72 rounded-[18px] border border-white/20 bg-stone-950/95 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                Link de invitación
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-white/70 select-all">
                  {inviteLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                    inviteCopied
                      ? "bg-emerald-600/70 text-white"
                      : "bg-amber-600/70 text-white hover:bg-amber-500/70"
                  }`}
                >
                  {inviteCopied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-14 flex h-[calc(100%-3.5rem)] min-h-0 flex-col gap-4 md:mt-0 md:flex-row md:items-stretch md:justify-between md:pt-12">
        <div className="w-full max-w-[280px] min-h-0 pt-14 md:h-full md:pt-12">
          <div className="h-full min-h-0">
            <CampaignPlayersPanel
              players={players}
              errorMessage={chatRealtimeError}
            />
          </div>
        </div>

        <div className="min-h-0 md:ml-auto md:h-full md:w-[540px] md:pt-12">
          <div className="flex min-h-0 flex-col gap-2 md:h-full md:flex-row md:items-start md:gap-3">
            <button
              type="button"
              onClick={onOpenCampaignPestaña}
              aria-label="Abrir pestaña de campaña"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/35 bg-[rgba(0,0,0,0.5)] transition hover:bg-black/65"
            >
              <Map className="h-6 w-6 text-amber-100" />
            </button>

            <div className="min-h-0 md:flex-1">
              <CampaignChatPanel
                messages={messages}
                websocketError={chatRealtimeError}
                onSendMessage={sendMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
