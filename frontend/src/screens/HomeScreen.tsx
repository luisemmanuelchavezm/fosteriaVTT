import { useEffect, useState } from "react";
import HomeNavbar, { type NavTab } from "../components/HomeNavbar";
import LogoLayout from "../components/LogoLayout";
import UserMenu from "../components/UserMenu";
import CampaignSystemSelectorModal from "../components/CampaignSystemSelectorModal";
import type { CampaignCreationSystem } from "../components/campaignSystem";
import dndImage from "../assets/DND.png";
import morkBorgImage from "../assets/COC.png";
import { buildApiUrl } from "../lib/api";

interface HomeScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome?: () => void;
  onGoCampaigns?: () => void;
  onGoCharacters?: () => void;
  onCreateCampaign?: (system: CampaignCreationSystem) => void;
  onOpenCampaignHome?: (campaignId: string) => void;
}

interface FeaturedCampaign {
  id: string;
  title: string;
  image: string;
}

interface RecentCampaign {
  id: string;
  title: string;
  image?: string;
  system: string;
  dmUsername: string;
  lastPlayedAt: string;
}

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

const featuredCampaigns: FeaturedCampaign[] = [
  { id: "dnd", title: "Dungeons & Dragons", image: dndImage },
  { id: "mork-borg", title: "Mork Borg", image: morkBorgImage },
];

export default function HomeScreen({
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  onCreateCampaign,
  onOpenCampaignHome,
}: HomeScreenProps) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [recentIndex, setRecentIndex] = useState(0);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setRecentCampaigns([]);
      return;
    }

    const abortController = new AbortController();

    const loadRecentCampaigns = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/campanas/ultimas"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las últimas campañas");
        }

        const data = (await response.json()) as Array<{
          id: number;
          nombre: string;
          portadaUrl: string;
          sistemaDeJuego: string;
          dmUsername: string;
          ultimaVezAccedido: string;
        }>;

        setRecentCampaigns(
          data.slice(0, 5).map((campaign) => ({
            id: String(campaign.id),
            title: campaign.nombre,
            image: campaign.portadaUrl,
            system: campaign.sistemaDeJuego,
            dmUsername: campaign.dmUsername,
            lastPlayedAt: campaign.ultimaVezAccedido,
          })),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setRecentCampaigns([]);
        }
      }
    };

    loadRecentCampaigns();

    return () => {
      abortController.abort();
    };
  }, []);

  const recentItems: Array<RecentCampaign | null> = [...recentCampaigns, null];
  const canNavigateRecent = recentCampaigns.length > 3;
  const maxRecentIndex = canNavigateRecent
    ? Math.max(recentItems.length - 3, 0)
    : 0;
  const recentWindow = recentItems.slice(recentIndex, recentIndex + 3);

  useEffect(() => {
    setRecentIndex((current) => Math.min(current, maxRecentIndex));
  }, [maxRecentIndex]);

  const previousFeatured = () => {
    setFeaturedIndex((current) =>
      current === 0 ? featuredCampaigns.length - 1 : current - 1,
    );
  };

  const nextFeatured = () => {
    setFeaturedIndex((current) => (current + 1) % featuredCampaigns.length);
  };

  const previousRecent = () => {
    if (!canNavigateRecent) {
      return;
    }

    setRecentIndex((current) => Math.max(current - 1, 0));
  };

  const nextRecent = () => {
    if (!canNavigateRecent) {
      return;
    }

    setRecentIndex((current) => Math.min(current + 1, maxRecentIndex));
  };

  const handleOpenCreateCampaignModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateBySystem = (system: CampaignCreationSystem) => {
    setIsCreateModalOpen(false);
    onCreateCampaign?.(system);
  };

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome?.();
      return;
    }
    if (tab === "campaigns") {
      onGoCampaigns?.();
      return;
    }
    if (tab === "characters") {
      onGoCharacters?.();
      return;
    }
  };

  const featuredCampaign = featuredCampaigns[featuredIndex];

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      <>
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />

        <CampaignSystemSelectorModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSelect={handleCreateBySystem}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="rounded-[32px] border border-white/15 bg-stone-950/70 p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <section>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white md:text-3xl">
                    Crea una campaña
                  </h2>
                  <p className="mt-1 text-sm text-stone-300">
                    Elige el sistema y comienza a montar la mesa.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={previousFeatured}
                    aria-label="Ver campaña anterior"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={nextFeatured}
                    aria-label="Ver siguiente campaña"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1.75fr)_minmax(220px,0.85fr)]">
                <button
                  type="button"
                  className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-stone-900 text-left shadow-2xl"
                >
                  <img
                    src={featuredCampaign.image}
                    alt={featuredCampaign.title}
                    className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105 md:h-[420px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">
                      Sistema destacado
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-white md:text-4xl">
                      {featuredCampaign.title}
                    </h3>
                    <span className="mt-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                      Crear campaña
                    </span>
                  </div>
                </button>

                <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
                  {featuredCampaigns.map((campaign, index) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => setFeaturedIndex(index)}
                      className={`group relative overflow-hidden rounded-[24px] border text-left transition ${
                        featuredIndex === index
                          ? "border-amber-300/70 shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                          : "border-white/10"
                      }`}
                    >
                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        className="h-28 w-full object-cover transition duration-500 group-hover:scale-105 md:h-[124px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm font-semibold text-white">
                          {campaign.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-12">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Últimas partidas
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={previousRecent}
                    disabled={!canNavigateRecent || recentIndex === 0}
                    aria-label="Ver partidas anteriores"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={nextRecent}
                    disabled={
                      !canNavigateRecent || recentIndex === maxRecentIndex
                    }
                    aria-label="Ver más partidas"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {recentWindow.map((campaign, index) => {
                  if (!campaign) {
                    return (
                      <button
                        key={`placeholder-${recentIndex + index}`}
                        type="button"
                        onClick={handleOpenCreateCampaignModal}
                        aria-label="Crear una nueva campaña"
                        className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white shadow-xl transition duration-300 hover:scale-[1.04] hover:shadow-[0_20px_35px_rgba(255,255,255,0.18)]"
                      >
                        <span className="text-7xl font-light leading-none text-stone-500">
                          +
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => onOpenCampaignHome?.(campaign.id)}
                      className="overflow-hidden rounded-[24px] border border-amber-200/35 bg-stone-900 text-left shadow-xl transition duration-300 hover:-translate-y-1 hover:border-amber-200/70"
                    >
                      <div className="h-[185px] overflow-hidden bg-stone-800 md:h-[205px]">
                        <img
                          src={campaign.image}
                          alt={campaign.title}
                          className="h-full w-full object-cover"
                        />
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
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </>

      <HomeNavbar activeTab="home" onTabChange={handleNavChange} />
    </LogoLayout>
  );
}
