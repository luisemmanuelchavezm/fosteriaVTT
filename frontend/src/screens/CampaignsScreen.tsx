import { useEffect, useMemo, useState } from "react";
import HomeNavbar, { type NavTab } from "../components/HomeNavbar";
import LogoLayout from "../components/LogoLayout";
import UserMenu from "../components/UserMenu";
import { buildApiUrl } from "../lib/api";

interface CampaignsScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
}

interface CampaignSummary {
  id: string;
  title: string;
  image?: string;
  system: string;
  dmUsername: string;
  lastPlayedAt: string;
}

const INITIAL_VISIBLE_CAMPAIGNS = 15;

function formatLastPlayed(lastPlayedAt: string) {
  const parsedDate = new Date(lastPlayedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return lastPlayedAt;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

export default function CampaignsScreen({
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
}: CampaignsScreenProps) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_CAMPAIGNS);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setCampaigns([]);
      return;
    }

    const abortController = new AbortController();

    const loadCampaigns = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/campanas"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las campañas");
        }

        const data = (await response.json()) as Array<{
          id: number;
          nombre: string;
          portadaUrl?: string;
          sistemaDeJuego: string;
          dmUsername: string;
          ultimaVezAccedido: string;
        }>;

        setCampaigns(
          data.map((campaign) => ({
            id: String(campaign.id),
            title: campaign.nombre,
            image: campaign.portadaUrl,
            system: campaign.sistemaDeJuego,
            dmUsername: campaign.dmUsername,
            lastPlayedAt: campaign.ultimaVezAccedido,
          })),
        );
        setVisibleCount(INITIAL_VISIBLE_CAMPAIGNS);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCampaigns([]);
        }
      }
    };

    loadCampaigns();

    return () => {
      abortController.abort();
    };
  }, []);

  const hasMoreCampaigns = visibleCount < campaigns.length;
  const visibleCampaigns = useMemo(
    () => campaigns.slice(0, visibleCount),
    [campaigns, visibleCount],
  );

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome();
      return;
    }

    if (tab === "campaigns") {
      onGoCampaigns();
      return;
    }

    if (tab === "characters") {
      onGoCharacters();
    }
  };

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      <>
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="rounded-[32px] border border-white/15 bg-stone-950/70 p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Campañas
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {visibleCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    className="overflow-hidden rounded-[24px] border border-amber-200/35 bg-stone-900 text-left shadow-xl transition duration-300 hover:-translate-y-1 hover:border-amber-200/70"
                  >
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
                          <span className="font-semibold text-stone-100">
                            DM:
                          </span>{" "}
                          {campaign.dmUsername}
                        </p>
                        <p>
                          <span className="font-semibold text-stone-100">
                            Sistema:
                          </span>{" "}
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
                  </button>
                ))}

                <button
                  type="button"
                  aria-label="Crear una nueva campaña"
                  className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white shadow-xl transition duration-300 hover:scale-[1.04] hover:shadow-[0_20px_35px_rgba(255,255,255,0.18)]"
                >
                  <span className="text-7xl font-light leading-none text-stone-500">
                    +
                  </span>
                </button>
              </div>

              {hasMoreCampaigns ? (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount(
                        (current) => current + INITIAL_VISIBLE_CAMPAIGNS,
                      )
                    }
                    className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Ver mas
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <HomeNavbar activeTab="campaigns" onTabChange={handleNavChange} />
      </>
    </LogoLayout>
  );
}
