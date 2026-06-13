import { useEffect, useMemo, useState } from "react";
import HomeNavbar, { type NavTab } from "../components/HomeNavbar";
import LogoLayout from "../components/LogoLayout";
import UserMenu from "../components/UserMenu";
import CampaignSystemSelectorModal from "../components/CampaignSystemSelectorModal";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";
import type { CampaignCreationSystem } from "../components/campaignSystem";
import { buildApiUrl } from "../lib/api";
import CampaignCard, { type CampaignSummary } from "./campaigns/CampaignCard";
import CampaignFiltersBar from "./campaigns/CampaignFiltersBar";
import DeleteCampaignModal from "./campaigns/DeleteCampaignModal";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CampaignSummary | null>(
    null,
  );
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedNameQuery(nameQuery.trim().toLowerCase());
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [nameQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedDmQuery(dmQuery.trim());
    }, 300);
    return () => window.clearTimeout(timeoutId);
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
        if (debouncedNameQuery) searchParams.set("nombre", debouncedNameQuery);
        if (debouncedDmQuery) searchParams.set("dm", debouncedDmQuery);
        searchParams.set("page", "0");
        searchParams.set("size", String(INITIAL_VISIBLE_CAMPAIGNS));
        selectedSystems.forEach((system) =>
          searchParams.append("sistemas", system),
        );

        const endpoint =
          searchParams.size > 0
            ? `/api/campanas?${searchParams.toString()}`
            : "/api/campanas";

        const response = await fetch(buildApiUrl(endpoint), {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error("No se pudieron cargar las campañas");

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
        if (!abortController.signal.aborted) setIsLoadingCampaigns(false);
      }
    };

    loadCampaigns();
    return () => abortController.abort();
  }, [debouncedNameQuery, debouncedDmQuery, selectedSystems]);

  const visibleCampaigns = useMemo(() => campaigns, [campaigns]);

  const activeFilterCount =
    (debouncedNameQuery ? 1 : 0) +
    (debouncedDmQuery ? 1 : 0) +
    selectedSystems.length;
  const hasActiveFilters =
    activeFilterCount > 0 || nameQuery.length > 0 || dmQuery.length > 0;

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
  };

  const handleLoadMore = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !hasMoreCampaigns || isLoadingCampaigns) return;
    setIsLoadingCampaigns(true);
    try {
      const searchParams = new URLSearchParams();
      if (debouncedNameQuery) searchParams.set("nombre", debouncedNameQuery);
      if (debouncedDmQuery) searchParams.set("dm", debouncedDmQuery);
      searchParams.set("page", String(currentPage + 1));
      searchParams.set("size", String(INITIAL_VISIBLE_CAMPAIGNS));
      selectedSystems.forEach((system) =>
        searchParams.append("sistemas", system),
      );

      const response = await fetch(
        buildApiUrl(`/api/campanas?${searchParams.toString()}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error("No se pudieron cargar más campañas");

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteConfirmText !== "borrar" || isDeleting) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        buildApiUrl(`/api/campanas/${deleteTarget.id}`),
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Error al eliminar");
      setCampaigns((current) =>
        current.filter((c) => c.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
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
      return;
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
          onSelect={(system) => {
            setIsCreateModalOpen(false);
            onCreateCampaign?.(system);
          }}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="rounded-[32px] border border-white/15 bg-stone-950/70 p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <section>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Campañas
                </h2>
                <CampaignFiltersBar
                  nameQuery={nameQuery}
                  onNameQueryChange={setNameQuery}
                  dmQuery={dmQuery}
                  onDmQueryChange={setDmQuery}
                  selectedSystems={selectedSystems}
                  onToggleSystem={toggleSystem}
                  hasActiveFilters={hasActiveFilters}
                  activeFilterCount={activeFilterCount}
                  onClearFilters={handleClearFilters}
                  onCreateClick={() => setIsCreateModalOpen(true)}
                />
              </div>

              {campaigns.length === 0 ? (
                <div className="mb-4 rounded-[24px] border border-dashed border-white/15 bg-black/15 px-4 py-5 text-sm text-stone-300">
                  No hay campañas que coincidan con la busqueda o los filtros.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                {visibleCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onOpen={() => onOpenCampaignHome?.(campaign.id)}
                    onDelete={() => {
                      setDeleteTarget(campaign);
                      setDeleteConfirmText("");
                    }}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
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
                    onClick={() => void handleLoadMore()}
                    disabled={isLoadingCampaigns}
                    className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    {isLoadingCampaigns ? "Cargando..." : "Ver mas"}
                  </button>
                </div>
              ) : null}
            </section>

            <InlineFooter />
          </div>
        </div>

        <HomeNavbar activeTab="campaigns" onTabChange={handleNavChange} />

        {deleteTarget ? (
          <DeleteCampaignModal
            target={deleteTarget}
            confirmText={deleteConfirmText}
            onConfirmTextChange={setDeleteConfirmText}
            isDeleting={isDeleting}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => void handleDeleteConfirm()}
          />
        ) : null}
      </>
    </LogoLayout>
  );
}

function InlineFooter() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  return (
    <>
      <div className="mt-10 border-t border-white/10 pt-5 pb-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between text-sm text-stone-400">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300/60 mb-0.5">
            FosteriaVTT
          </span>
          <a
            href="mailto:fosteriavtt@gmail.com"
            className="hover:text-amber-300 transition-colors"
          >
            <span className="text-stone-500">Correo de soporte: </span>
            fosteriavtt@gmail.com
          </a>
          <a
            href="https://github.com/luisemmanuelchavezm/fosteriaVTT"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 transition-colors"
          >
            <span className="text-stone-500">Link del proyecto: </span>
            github.com/luisemmanuelchavezm/fosteriaVTT
          </a>
        </div>
        <div className="flex flex-col gap-1 sm:text-right sm:items-end">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300/60 mb-0.5">
            Legal
          </span>
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-amber-300 transition-colors text-left sm:text-right"
          >
            Política de Privacidad
          </button>
        </div>
      </div>
      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </>
  );
}
