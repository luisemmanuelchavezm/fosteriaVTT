import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import type { CreatedCharacterResponse } from "../../personaje/utils/dndApi";
import type {
  CampaignPageResponse,
  CharacterPageResponse,
  CharacterSummaryResponse,
  ChestContentTab,
  ChestSourceTab,
  ChestTipoTab,
  CreateMapResponse,
  MapPageResponse,
  MapSummaryResponse,
  MarketplaceCharacterResponse,
  MarketplacePageResponse,
} from "../components/baulTypes";

export interface BaulData {
  // UI tabs
  chestSourceTab: ChestSourceTab;
  setChestSourceTab: (tab: ChestSourceTab) => void;
  chestContentTab: ChestContentTab;
  setChestContentTab: (tab: ChestContentTab) => void;
  chestTipoTab: ChestTipoTab;
  setChestTipoTab: (tab: ChestTipoTab) => void;
  chestSearchQuery: string;
  setChestSearchQuery: (q: string) => void;

  // My items
  isChestLoading: boolean;
  chestError: string | null;
  filteredChestCharacters: CharacterSummaryResponse[];
  isChestMapsLoading: boolean;
  chestMapsError: string | null;
  filteredChestMaps: MapSummaryResponse[];
  chestCampaignSystem: string | null;

  // Marketplace items
  isMarketplaceCharactersLoading: boolean;
  marketplaceCharactersError: string | null;
  filteredMarketplaceCharacters: MarketplaceCharacterResponse[];
  isMarketplaceMapsLoading: boolean;
  marketplaceMapsError: string | null;
  filteredMarketplaceMaps: MapSummaryResponse[];

  // Filter state
  mpCharFilterOpen: boolean;
  setMpCharFilterOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  mpCharUserFilter: string;
  setMpCharUserFilter: (v: string) => void;
  mpCharTypeFilter: "" | "enemigo" | "pnj";
  setMpCharTypeFilter: (v: "" | "enemigo" | "pnj") => void;
  mpMapFilterOpen: boolean;
  setMpMapFilterOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  mpMapUserFilter: string;
  setMpMapUserFilter: (v: string) => void;

  // Card open-menu state
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;

  // Modal: save
  saveTarget: { type: "character" | "map"; id: number; nombre: string } | null;
  setSaveTarget: (
    t: { type: "character" | "map"; id: number; nombre: string } | null,
  ) => void;
  isSaving: boolean;
  handleSave: () => Promise<void>;

  // Modal: publish
  publishTarget: {
    type: "character" | "map";
    id: number;
    nombre: string;
  } | null;
  setPublishTarget: (
    t: {
      type: "character" | "map";
      id: number;
      nombre: string;
    } | null,
  ) => void;
  isPublishing: boolean;
  handlePublish: () => Promise<void>;

  // Modal: delete
  deleteTarget: {
    type: "character" | "map";
    id: number;
    nombre: string;
    fromMarketplace?: boolean;
  } | null;
  setDeleteTarget: (
    t: {
      type: "character" | "map";
      id: number;
      nombre: string;
      fromMarketplace?: boolean;
    } | null,
  ) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (t: string) => void;
  isDeleting: boolean;
  handleDelete: () => Promise<void>;

  // Map upload modal
  isMapUploadModalOpen: boolean;
  setIsMapUploadModalOpen: (v: boolean) => void;
  isMapSubmitting: boolean;
  handleSubmitMap: (payload: {
    file: File;
    nombre: string;
    esPublico: boolean;
    tags: string[];
  }) => Promise<void>;

  // NPC modal
  isNpcModalOpen: boolean;
  setIsNpcModalOpen: (v: boolean) => void;
  handleNpcCreated: (created: CreatedCharacterResponse) => void;

  // Misc
  currentUsername: string | null;

  // Drag handlers
  handleCharacterDragStart: (
    event: React.DragEvent<HTMLElement>,
    character: {
      id: number;
      nombre: string;
      retrato?: string;
      tipo?: string;
      source?: string;
      sistemaDeJuego?: string;
    },
  ) => void;
}

const CHARACTER_DRAG_MIME = "application/x-fosteria-character";

export function useBaulData(campaignId: string): BaulData {
  const [chestSourceTab, setChestSourceTab] = useState<ChestSourceTab>("mine");
  const [chestContentTab, setChestContentTab] =
    useState<ChestContentTab>("characters");
  const [chestTipoTab, setChestTipoTab] = useState<ChestTipoTab>("todos");
  const [chestSearchQuery, setChestSearchQuery] = useState("");
  const [chestCampaignSystem, setChestCampaignSystem] = useState<string | null>(
    null,
  );

  // ── Mis elementos ────────────────────────────────────────────
  const [chestCharacters, setChestCharacters] = useState<
    CharacterSummaryResponse[]
  >([]);
  const [chestMaps, setChestMaps] = useState<MapSummaryResponse[]>([]);
  const [isChestLoading, setIsChestLoading] = useState(false);
  const [chestError, setChestError] = useState<string | null>(null);
  const [isChestMapsLoading, setIsChestMapsLoading] = useState(false);
  const [chestMapsError, setChestMapsError] = useState<string | null>(null);
  const [isMapUploadModalOpen, setIsMapUploadModalOpen] = useState(false);
  const [isMapSubmitting, setIsMapSubmitting] = useState(false);
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);

  // ── Usuario actual (del JWT) ─────────────────────────────────
  const currentUsername = useMemo(() => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) return null;
      const payload = token.split(".")[1];
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { sub?: string };
      return decoded.sub ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Menú de opciones por tarjeta ─────────────────────────────
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ── Modal publicar ───────────────────────────────────────────
  const [publishTarget, setPublishTarget] = useState<{
    type: "character" | "map";
    id: number;
    nombre: string;
  } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Modal guardar ────────────────────────────────────────────
  const [saveTarget, setSaveTarget] = useState<{
    type: "character" | "map";
    id: number;
    nombre: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal borrar ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "character" | "map";
    id: number;
    nombre: string;
    fromMarketplace?: boolean;
  } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Marketplace ──────────────────────────────────────────────
  const [marketplaceCharacters, setMarketplaceCharacters] = useState<
    MarketplaceCharacterResponse[]
  >([]);
  const [isMarketplaceCharactersLoading, setIsMarketplaceCharactersLoading] =
    useState(false);
  const [marketplaceCharactersError, setMarketplaceCharactersError] = useState<
    string | null
  >(null);

  const [marketplaceMaps, setMarketplaceMaps] = useState<MapSummaryResponse[]>(
    [],
  );
  const [isMarketplaceMapsLoading, setIsMarketplaceMapsLoading] =
    useState(false);
  const [marketplaceMapsError, setMarketplaceMapsError] = useState<
    string | null
  >(null);

  const marketplaceSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ── Filtros del marketplace ───────────────────────────────────
  const [mpCharFilterOpen, setMpCharFilterOpen] = useState(false);
  const [mpCharUserFilter, setMpCharUserFilter] = useState("");
  const [mpCharTypeFilter, setMpCharTypeFilter] = useState<
    "" | "enemigo" | "pnj"
  >("");
  const [mpMapFilterOpen, setMpMapFilterOpen] = useState(false);
  const [mpMapUserFilter, setMpMapUserFilter] = useState("");

  // Resetear filtros del marketplace al cambiar de sección
  useEffect(() => {
    setMpCharFilterOpen(false);
    setMpCharUserFilter("");
    setMpCharTypeFilter("");
    setMpMapFilterOpen(false);
    setMpMapUserFilter("");
  }, [chestSourceTab, chestContentTab]);

  // ── Cargar personajes propios ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setChestError("No hay sesión activa.");
      setChestCharacters([]);
      setChestCampaignSystem(null);
      return;
    }

    const campaignIdNumber = Number(campaignId);
    if (!Number.isFinite(campaignIdNumber)) {
      setChestError("Campaña inválida.");
      setChestCharacters([]);
      setChestCampaignSystem(null);
      return;
    }

    const abortController = new AbortController();

    const loadChestCharacters = async () => {
      try {
        setIsChestLoading(true);
        setChestError(null);

        let page = 0;
        let hasMore = true;
        let resolvedSystem: string | null = null;

        while (hasMore && page < 25 && !abortController.signal.aborted) {
          const campaignsResponse = await fetch(
            buildApiUrl(`/api/campanas?page=${page}&size=25`),
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: abortController.signal,
            },
          );

          if (!campaignsResponse.ok) {
            throw new Error("No se pudo resolver el sistema de la campaña.");
          }

          const campaignsData =
            (await campaignsResponse.json()) as CampaignPageResponse;
          const campaignMatch = campaignsData.items.find(
            (campaign) => campaign.id === campaignIdNumber,
          );

          if (campaignMatch) {
            resolvedSystem = campaignMatch.sistemaDeJuego;
            break;
          }

          hasMore = campaignsData.hasMore;
          page += 1;
        }

        if (!resolvedSystem) {
          throw new Error(
            "No se encontró el sistema de juego de esta campaña.",
          );
        }

        setChestCampaignSystem(resolvedSystem);

        const searchParams = new URLSearchParams();
        searchParams.set("page", "0");
        searchParams.set("size", "120");
        searchParams.append("sistemas", resolvedSystem);
        searchParams.set("incluirTodos", "true");

        const charactersResponse = await fetch(
          buildApiUrl(`/api/personajes?${searchParams.toString()}`),
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal,
          },
        );

        if (!charactersResponse.ok) {
          throw new Error("No se pudieron cargar los personajes del baúl.");
        }

        const charactersData =
          (await charactersResponse.json()) as CharacterPageResponse;

        setChestCharacters(
          charactersData.items.filter(
            (character) => character.sistemaDeJuego === resolvedSystem,
          ),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setChestCampaignSystem(null);
          setChestCharacters([]);
          setChestError((error as Error).message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsChestLoading(false);
        }
      }
    };

    void loadChestCharacters();

    return () => {
      abortController.abort();
    };
  }, [campaignId]);

  // ── Cargar mapas propios ──────────────────────────────────────
  const loadChestMaps = useCallback(async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setChestMaps([]);
      setChestMapsError("No hay sesión activa.");
      return;
    }

    try {
      setIsChestMapsLoading(true);
      setChestMapsError(null);

      const searchParams = new URLSearchParams();
      searchParams.set("page", "0");
      searchParams.set("size", "120");

      const response = await fetch(
        buildApiUrl(`/api/mapas?${searchParams.toString()}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar tus mapas.");
      }

      const mapsData = (await response.json()) as MapPageResponse;
      setChestMaps(mapsData.items ?? []);
    } catch (error) {
      setChestMaps([]);
      setChestMapsError((error as Error).message);
    } finally {
      setIsChestMapsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChestMaps();
  }, [loadChestMaps]);

  // ── Refrescar personajes propios (sin re-resolver la campaña) ─
  const refreshCharacters = useCallback(async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !chestCampaignSystem) return;

    try {
      setIsChestLoading(true);
      setChestError(null);

      const searchParams = new URLSearchParams();
      searchParams.set("page", "0");
      searchParams.set("size", "120");
      searchParams.append("sistemas", chestCampaignSystem);
      searchParams.set("incluirTodos", "true");

      const res = await fetch(
        buildApiUrl(`/api/personajes?${searchParams.toString()}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok)
        throw new Error("No se pudieron cargar los personajes del baúl.");

      const data = (await res.json()) as CharacterPageResponse;
      setChestCharacters(
        data.items.filter((c) => c.sistemaDeJuego === chestCampaignSystem),
      );
    } catch (error) {
      setChestCharacters([]);
      setChestError((error as Error).message);
    } finally {
      setIsChestLoading(false);
    }
  }, [chestCampaignSystem]);

  // ── Cargar personajes del marketplace ─────────────────────────
  const loadMarketplaceCharacters = useCallback(
    async (search: string, tipoTab: ChestTipoTab) => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;

      const tipoParam =
        tipoTab === "todos"
          ? ""
          : tipoTab === "personajes"
            ? "personaje"
            : tipoTab === "enemigos"
              ? "enemigo"
              : "pnj";

      try {
        setIsMarketplaceCharactersLoading(true);
        setMarketplaceCharactersError(null);

        // Base URL is a fixed literal — only query params vary with user input
        const requestUrl = new URL(buildApiUrl("/api/marketplace/personajes"));
        requestUrl.searchParams.set("nombre", search);
        requestUrl.searchParams.set("tipo", tipoParam);
        requestUrl.searchParams.set("page", "0");
        requestUrl.searchParams.set("size", "100");
        const res = await fetch(requestUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("No se pudo cargar el marketplace.");

        const data = (await res.json()) as MarketplacePageResponse;
        setMarketplaceCharacters(data.items);
      } catch (error) {
        setMarketplaceCharacters([]);
        setMarketplaceCharactersError((error as Error).message);
      } finally {
        setIsMarketplaceCharactersLoading(false);
      }
    },
    [],
  );

  // ── Cargar mapas del marketplace ──────────────────────────────
  const loadMarketplaceMaps = useCallback(async (search: string) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      setIsMarketplaceMapsLoading(true);
      setMarketplaceMapsError(null);

      // Base URL is a fixed literal — only query params vary with user input
      const requestUrl = new URL(buildApiUrl("/api/marketplace/mapas"));
      requestUrl.searchParams.set("nombre", search);
      requestUrl.searchParams.set("page", "0");
      requestUrl.searchParams.set("size", "100");
      const res = await fetch(requestUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudieron cargar los mapas públicos.");

      const data = (await res.json()) as {
        items: MapSummaryResponse[];
        hasMore: boolean;
      };
      setMarketplaceMaps(data.items);
    } catch (error) {
      setMarketplaceMaps([]);
      setMarketplaceMapsError((error as Error).message);
    } finally {
      setIsMarketplaceMapsLoading(false);
    }
  }, []);

  // ── Disparar carga del marketplace con debounce ───────────────
  useEffect(() => {
    if (chestSourceTab !== "marketplace") return;

    if (marketplaceSearchTimer.current) {
      clearTimeout(marketplaceSearchTimer.current);
    }

    marketplaceSearchTimer.current = setTimeout(() => {
      if (chestContentTab === "characters") {
        void loadMarketplaceCharacters(chestSearchQuery, "todos");
      } else {
        void loadMarketplaceMaps(chestSearchQuery);
      }
    }, 300);

    return () => {
      if (marketplaceSearchTimer.current) {
        clearTimeout(marketplaceSearchTimer.current);
      }
    };
  }, [
    chestSourceTab,
    chestContentTab,
    chestSearchQuery,
    loadMarketplaceCharacters,
    loadMarketplaceMaps,
  ]);

  // ── Acciones ─────────────────────────────────────────────────
  const handleSubmitMap = useCallback(
    async (payload: {
      file: File;
      nombre: string;
      esPublico: boolean;
      tags: string[];
    }) => {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("No hay sesión activa.");
      }

      setIsMapSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("mapImage", payload.file);
        formData.append("nombre", payload.nombre);
        formData.append("esPublico", String(payload.esPublico));
        formData.append("tags", payload.tags.join(","));

        const response = await fetch(buildApiUrl("/api/mapas"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "No se pudo subir el mapa.");
        }

        const createdMap = (await response.json()) as CreateMapResponse;
        setChestMaps((current) => [createdMap, ...current]);
        await loadChestMaps();
      } finally {
        setIsMapSubmitting(false);
      }
    },
    [loadChestMaps],
  );

  const handleNpcCreated = useCallback(
    (created: CreatedCharacterResponse) => {
      setIsNpcModalOpen(false);
      setChestCharacters((prev) => [
        {
          id: created.id,
          nombre: created.nombre,
          retrato: created.retrato,
          sistemaDeJuego: chestCampaignSystem ?? "",
          tipo: created.tipo,
        },
        ...prev,
      ]);
    },
    [chestCampaignSystem],
  );

  // ── Guardar desde marketplace ─────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!saveTarget) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsSaving(true);
    try {
      const url =
        saveTarget.type === "character"
          ? buildApiUrl(`/api/personajes/${saveTarget.id}/guardar`)
          : buildApiUrl(`/api/mapas/${saveTarget.id}/guardar`);
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo guardar.");
      if (saveTarget.type === "character") {
        setMarketplaceCharacters((prev) =>
          prev.map((c) =>
            c.id === saveTarget.id ? { ...c, yaTienesCopia: true } : c,
          ),
        );
        void refreshCharacters();
      } else {
        setMarketplaceMaps((prev) =>
          prev.map((m) =>
            m.id === saveTarget.id ? { ...m, yaTienesCopia: true } : m,
          ),
        );
        void loadChestMaps();
      }
      setSaveTarget(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [saveTarget, refreshCharacters, loadChestMaps]);

  // ── Publicar ─────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!publishTarget) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsPublishing(true);
    try {
      const url =
        publishTarget.type === "character"
          ? buildApiUrl(`/api/personajes/${publishTarget.id}/publicar`)
          : buildApiUrl(`/api/mapas/${publishTarget.id}/publicar`);
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo publicar.");
      if (publishTarget.type === "character") {
        void refreshCharacters();
      } else {
        void loadChestMaps();
      }
      setPublishTarget(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  }, [publishTarget, refreshCharacters, loadChestMaps]);

  // ── Borrar ────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget || deleteConfirmText !== "borrar") return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsDeleting(true);
    try {
      const url =
        deleteTarget.type === "character"
          ? buildApiUrl(`/api/personajes/${deleteTarget.id}`)
          : buildApiUrl(`/api/mapas/${deleteTarget.id}`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo borrar.");

      if (deleteTarget.type === "character") {
        void refreshCharacters();
        void loadMarketplaceCharacters(chestSearchQuery, chestTipoTab);
      } else {
        void loadChestMaps();
        void loadMarketplaceMaps(chestSearchQuery);
      }

      setDeleteTarget(null);
      setDeleteConfirmText("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteTarget,
    deleteConfirmText,
    refreshCharacters,
    loadChestMaps,
    loadMarketplaceCharacters,
    loadMarketplaceMaps,
    chestSearchQuery,
    chestTipoTab,
  ]);

  // ── Filtros locales (mis elementos) ───────────────────────────
  const filteredChestCharacters = useMemo(() => {
    const query = chestSearchQuery.trim().toLowerCase();
    const byTipo = chestCharacters.filter((character) => {
      if (chestTipoTab === "todos") return true;
      const t = (character.tipo ?? "personaje").toLowerCase();
      if (chestTipoTab === "personajes") return t === "personaje";
      if (chestTipoTab === "enemigos") return t === "enemigo";
      if (chestTipoTab === "pnj") return t === "pnj";
      return true;
    });
    if (!query) return byTipo;
    return byTipo.filter((character) =>
      character.nombre.toLowerCase().includes(query),
    );
  }, [chestCharacters, chestSearchQuery, chestTipoTab]);

  const filteredChestMaps = useMemo(() => {
    const query = chestSearchQuery.trim().toLowerCase();
    if (!query) return chestMaps;
    return chestMaps.filter((map) => map.nombre.toLowerCase().includes(query));
  }, [chestMaps, chestSearchQuery]);

  // ── Filtros client-side del marketplace ───────────────────────
  const filteredMarketplaceCharacters = useMemo(() => {
    let result = marketplaceCharacters;
    if (chestCampaignSystem) {
      result = result.filter((c) => c.sistemaDeJuego === chestCampaignSystem);
    }
    if (mpCharTypeFilter) {
      result = result.filter((c) => c.tipo.toLowerCase() === mpCharTypeFilter);
    }
    if (mpCharUserFilter.trim()) {
      const q = mpCharUserFilter.trim().toLowerCase();
      result = result.filter((c) =>
        c.creadorUsername.toLowerCase().includes(q),
      );
    }
    return result;
  }, [
    marketplaceCharacters,
    chestCampaignSystem,
    mpCharTypeFilter,
    mpCharUserFilter,
  ]);

  const filteredMarketplaceMaps = useMemo(() => {
    if (!mpMapUserFilter.trim()) return marketplaceMaps;
    const q = mpMapUserFilter.trim().toLowerCase();
    return marketplaceMaps.filter((m) =>
      (m.creadorUsername ?? "").toLowerCase().includes(q),
    );
  }, [marketplaceMaps, mpMapUserFilter]);

  // ── Drag & drop ───────────────────────────────────────────────
  const handleCharacterDragStart = useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      character: {
        id: number;
        nombre: string;
        retrato?: string;
        tipo?: string;
        source?: string;
        sistemaDeJuego?: string;
      },
    ) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        CHARACTER_DRAG_MIME,
        JSON.stringify({
          id: character.id,
          nombre: character.nombre,
          retrato: character.retrato,
          tipo: character.tipo,
          source: character.source,
          sistemaDeJuego: character.sistemaDeJuego,
        }),
      );
      event.dataTransfer.setData("text/plain", character.nombre);
    },
    [],
  );

  return {
    // UI tabs
    chestSourceTab,
    setChestSourceTab,
    chestContentTab,
    setChestContentTab,
    chestTipoTab,
    setChestTipoTab,
    chestSearchQuery,
    setChestSearchQuery,

    // My items
    isChestLoading,
    chestError,
    filteredChestCharacters,
    isChestMapsLoading,
    chestMapsError,
    filteredChestMaps,
    chestCampaignSystem,

    // Marketplace items
    isMarketplaceCharactersLoading,
    marketplaceCharactersError,
    filteredMarketplaceCharacters,
    isMarketplaceMapsLoading,
    marketplaceMapsError,
    filteredMarketplaceMaps,

    // Filter state
    mpCharFilterOpen,
    setMpCharFilterOpen,
    mpCharUserFilter,
    setMpCharUserFilter,
    mpCharTypeFilter,
    setMpCharTypeFilter,
    mpMapFilterOpen,
    setMpMapFilterOpen,
    mpMapUserFilter,
    setMpMapUserFilter,

    // Card menu
    openMenuId,
    setOpenMenuId,

    // Modal: save
    saveTarget,
    setSaveTarget,
    isSaving,
    handleSave,

    // Modal: publish
    publishTarget,
    setPublishTarget,
    isPublishing,
    handlePublish,

    // Modal: delete
    deleteTarget,
    setDeleteTarget,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeleting,
    handleDelete,

    // Map upload modal
    isMapUploadModalOpen,
    setIsMapUploadModalOpen,
    isMapSubmitting,
    handleSubmitMap,

    // NPC modal
    isNpcModalOpen,
    setIsNpcModalOpen,
    handleNpcCreated,

    // Misc
    currentUsername,
    handleCharacterDragStart,
  };
}
