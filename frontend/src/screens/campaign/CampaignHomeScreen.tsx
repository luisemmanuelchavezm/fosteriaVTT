import { Map, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CampaignChatPanel from "./components/CampaignChatPanel";
import CampaignPlayersPanel from "./components/CampaignPlayersPanel";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") ?? "";
    if (storedUsername) {
      setUsername(storedUsername);
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1])) as { sub?: string };
      setUsername(payload.sub ?? "");
    } catch {
      setUsername("");
    }
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleExit = () => {
    setIsMenuOpen(false);
    onExit?.();
  };

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center bg-no-repeat px-3 pb-4 text-stone-50 md:px-6 md:pb-6"
      style={{ backgroundImage: `url(${CAMPAIGN_BACKGROUND_URL})` }}
    >
      <div ref={menuRef} className="absolute top-3 left-3 z-20">
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label="Opciones de la campaña"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-black/60"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <Settings className="h-5 w-5" />
        </button>

        {isMenuOpen ? (
          <div
            role="menu"
            className="absolute left-0 mt-3 min-w-[180px] overflow-hidden rounded-[18px] border border-white/20 bg-stone-950/95 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleExit}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-red-400 transition hover:bg-red-950/30"
            >
              Salir
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-14 flex h-[calc(100%-3.5rem)] min-h-0 flex-col gap-4 md:mt-0 md:flex-row md:items-stretch md:justify-between md:pt-12">
        <div className="w-full max-w-[280px] min-h-0 pt-14 md:h-full md:pt-12">
          <div className="h-full min-h-0">
            <CampaignPlayersPanel campaignId={campaignId} username={username} />
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
              <CampaignChatPanel campaignId={campaignId} username={username} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
