import { useEffect, useMemo, useRef, useState } from "react";
import HomeNavbar, { type NavTab } from "../components/HomeNavbar";
import LogoLayout from "../components/LogoLayout";
import UserMenu from "../components/UserMenu";
import CampaignSystemSelectorModal from "../components/CampaignSystemSelectorModal";
import type { CampaignCreationSystem } from "../components/campaignSystem";
import { buildApiUrl } from "../lib/api";

interface CampaignsScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  onCreateCampaign?: (system: CampaignCreationSystem) => void;
  onOpenCampaignHome?: (campaignId: string) => void;
}

interface CampaignSummary {
  id: string;
  title: string;
  image?: string;
  system: string;
  dmUsername: string;
  lastPlayedAt: string;
}

interface CampaignPageResponse {
  items: Array<{
    id: number;
    nombre: string;
    portadaUrl?: string;
    sistemaDeJuego: string;
    dmUsername: string;
    ultimaVezAccedido: string;
  }>;
  hasMore: boolean;
}

const INITIAL_VISIBLE_CAMPAIGNS = 15;
const GAME_SYSTEMS = [
  "Dungeons and Dragons",
  "Call Of Cthulhu",
  "Vampire: The Masquerade",
];

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
  onCreateCampaign,
  onOpenCampaignHome,
}: CampaignsScreenProps) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [debouncedNameQuery, setDebouncedNameQuery] = useState("");
  const [dmQuery, setDmQuery] = useState("");
  const [debouncedDmQuery, setDebouncedDmQuery] = useState("");
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const filtersContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedNameQuery(nameQuery.trim().toLowerCase());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [nameQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedDmQuery(dmQuery.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dmQuery]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setCampaigns([]);
      return;
    }

    const abortController = new AbortController();

    const loadCampaigns = async () => {
      try {
        setIsLoadingCampaigns(true);
        const searchParams = new URLSearchParams();

        if (debouncedNameQuery) {
          searchParams.set("nombre", debouncedNameQuery);
        }

        if (debouncedDmQuery) {
          searchParams.set("dm", debouncedDmQuery);
        }

        searchParams.set("page", "0");
        searchParams.set("size", String(INITIAL_VISIBLE_CAMPAIGNS));

        selectedSystems.forEach((system) => {
          searchParams.append("sistemas", system);
        });

        const endpoint =
          searchParams.size > 0
            ? `/api/campanas?${searchParams.toString()}`
            : "/api/campanas";

        const response = await fetch(buildApiUrl(endpoint), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las campañas");
        }

        const data = (await response.json()) as CampaignPageResponse;

        setCampaigns(
          data.items.map((campaign) => ({
            id: String(campaign.id),
            title: campaign.nombre,
            image: campaign.portadaUrl,
            system: campaign.sistemaDeJuego,
            dmUsername: campaign.dmUsername,
            lastPlayedAt: campaign.ultimaVezAccedido,
          })),
        );
        setCurrentPage(0);
        setHasMoreCampaigns(data.hasMore);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCampaigns([]);
          setHasMoreCampaigns(false);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingCampaigns(false);
        }
      }
    };

    loadCampaigns();

    return () => {
      abortController.abort();
    };
  }, [debouncedNameQuery, debouncedDmQuery, selectedSystems]);

  const visibleCampaigns = useMemo(() => campaigns, [campaigns]);

  const activeFilterCount =
    (debouncedNameQuery ? 1 : 0) +
    (debouncedDmQuery ? 1 : 0) +
    selectedSystems.length;
  const hasActiveFilters =
    activeFilterCount > 0 || nameQuery.length > 0 || dmQuery.length > 0;

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!filtersContainerRef.current) {
        return;
      }

      if (!filtersContainerRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [filtersOpen]);

  const toggleSystem = (system: string) => {
    setSelectedSystems((current) =>
      current.includes(system)
        ? current.filter((item) => item !== system)
        : [...current, system],
    );
  };

  const handleClearFilters = () => {
    setNameQuery("");
    setDebouncedNameQuery("");
    setDmQuery("");
    setDebouncedDmQuery("");
    setSelectedSystems([]);
    setFiltersOpen(false);
  };

  const handleLoadMore = async () => {
    const token = localStorage.getItem("jwtToken");

    if (!token || !hasMoreCampaigns || isLoadingCampaigns) {
      return;
    }

    setIsLoadingCampaigns(true);

    try {
      const searchParams = new URLSearchParams();

      if (debouncedNameQuery) {
        searchParams.set("nombre", debouncedNameQuery);
      }

      if (debouncedDmQuery) {
        searchParams.set("dm", debouncedDmQuery);
      }

      searchParams.set("page", String(currentPage + 1));
      searchParams.set("size", String(INITIAL_VISIBLE_CAMPAIGNS));

      selectedSystems.forEach((system) => {
        searchParams.append("sistemas", system);
      });

      const response = await fetch(
        buildApiUrl(`/api/campanas?${searchParams.toString()}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar más campañas");
      }

      const data = (await response.json()) as CampaignPageResponse;

      setCampaigns((current) => [
        ...current,
        ...data.items.map((campaign) => ({
          id: String(campaign.id),
          title: campaign.nombre,
          image: campaign.portadaUrl,
          system: campaign.sistemaDeJuego,
          dmUsername: campaign.dmUsername,
          lastPlayedAt: campaign.ultimaVezAccedido,
        })),
      ]);
      setCurrentPage((current) => current + 1);
      setHasMoreCampaigns(data.hasMore);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateBySystem = (system: CampaignCreationSystem) => {
    setIsCreateModalOpen(false);
    onCreateCampaign?.(system);
  };

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

        <CampaignSystemSelectorModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSelect={handleCreateBySystem}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="rounded-[32px] border border-white/15 bg-stone-950/70 p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <section>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Campañas
                </h2>

                <div
                  ref={filtersContainerRef}
                  className="relative flex flex-wrap items-center justify-end gap-3"
                >
                  <button
                    type="button"
                    onClick={handleCreateClick}
                    className="h-12 min-w-[138px] rounded-full border border-amber-200/35 bg-amber-200/10 px-7 text-base font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-200/15"
                  >
                    Crear
                  </button>

                  <div className="flex min-w-[240px] flex-1 items-center gap-2 md:min-w-[300px] md:max-w-[320px]">
                    <input
                      type="text"
                      value={nameQuery}
                      onChange={(event) => setNameQuery(event.target.value)}
                      placeholder="Buscar por nombre"
                      className="h-11 flex-1 rounded-full border border-white/15 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-stone-400 focus:border-amber-200/60"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setFiltersOpen((current) => !current)}
                    aria-label="Filtros adicionales"
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-white transition hover:bg-white/20 ${
                      hasActiveFilters || filtersOpen
                        ? "border-amber-200/60 bg-amber-200/15 text-amber-100"
                        : "border-white/15 bg-white/10"
                    }`}
                  >
                    <span className="flex flex-col gap-1">
                      <span className="block h-[2px] w-4 rounded-full bg-current" />
                      <span className="block h-[2px] w-5 rounded-full bg-current" />
                      <span className="block h-[2px] w-3 rounded-full bg-current" />
                    </span>
                    {activeFilterCount > 0 ? (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-200 px-1 text-[11px] font-bold text-stone-950">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </button>

                  {filtersOpen ? (
                    <div className="absolute top-full right-0 z-20 mt-3 w-[min(100%,340px)] rounded-[24px] border border-white/15 bg-stone-950/95 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-md">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                          Sistema de juego
                        </p>
                        <div className="mt-3 space-y-2">
                          {GAME_SYSTEMS.map((system) => {
                            const isSelected = selectedSystems.includes(system);

                            return (
                              <button
                                key={system}
                                type="button"
                                onClick={() => toggleSystem(system)}
                                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                  isSelected
                                    ? "border-amber-200/60 bg-amber-200/10 text-amber-100"
                                    : "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
                                }`}
                              >
                                <span>{system}</span>
                                <span className="text-lg leading-none">
                                  {isSelected ? "x" : " "}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                          DM
                        </p>
                        <input
                          type="text"
                          value={dmQuery}
                          onChange={(event) => setDmQuery(event.target.value)}
                          placeholder="Buscar por nombre del DM"
                          className="mt-3 h-11 w-full rounded-full border border-white/15 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-stone-400 focus:border-amber-200/60"
                        />
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-5">
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          disabled={!hasActiveFilters}
                          className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {campaigns.length === 0 ? (
                <div className="mb-4 rounded-[24px] border border-dashed border-white/15 bg-black/15 px-4 py-5 text-sm text-stone-300">
                  No hay campañas que coincidan con la busqueda o los filtros.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                {visibleCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => onOpenCampaignHome?.(campaign.id)}
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
                  onClick={handleCreateClick}
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
                    onClick={handleLoadMore}
                    disabled={isLoadingCampaigns}
                    className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    {isLoadingCampaigns ? "Cargando..." : "Ver mas"}
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
