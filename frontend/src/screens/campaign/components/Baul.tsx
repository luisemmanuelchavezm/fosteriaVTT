import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import MapUploadModal from "./MapUploadModal";
import EnemyCreationModal from "./EnemyCreationModal";
import type { CreatedCharacterResponse } from "../../personaje/utils/dndApi";

interface BaulProps {
  campaignId: string;
  onClose: () => void;
  onMapSelect?: (payload: { mapaId: number; mapaUrl: string }) => void;
  onCharacterClick?: (characterId: number) => void;
}

interface CampaignSummaryResponse {
  id: number;
  sistemaDeJuego: string;
}

interface CampaignPageResponse {
  items: CampaignSummaryResponse[];
  hasMore: boolean;
}

interface CharacterSummaryResponse {
  id: number;
  nombre: string;
  retrato?: string;
  sistemaDeJuego: string;
  tipo?: string;
  esPublico?: boolean;
  estaPublicado?: boolean;
  esGuardado?: boolean;
}

interface CharacterPageResponse {
  items: CharacterSummaryResponse[];
}

interface MapSummaryResponse {
  id: number;
  nombre: string;
  mapa?: string;
  esPublico?: boolean;
  estaPublicado?: boolean;
  creadorUsername?: string;
  yaTienesCopia?: boolean;
  esGuardado?: boolean;
}

interface MapPageResponse {
  items: MapSummaryResponse[];
}

interface CreateMapResponse {
  id: number;
  nombre: string;
  mapa?: string;
}

interface MarketplaceCharacterResponse {
  id: number;
  nombre: string;
  retrato?: string;
  sistemaDeJuego: string;
  tipo: string;
  creadorUsername: string;
  yaTienesCopia: boolean;
}

interface MarketplacePageResponse {
  items: MarketplaceCharacterResponse[];
  hasMore: boolean;
}

const CHARACTER_DRAG_MIME = "application/x-fosteria-character";

type ChestSourceTab = "mine" | "marketplace";
type ChestContentTab = "characters" | "map";
type ChestTipoTab = "todos" | "personajes" | "enemigos" | "pnj";

const TIPO_BADGE: Record<string, string> = {
  enemigo: "bg-red-900/70 text-red-300 border border-red-500/40",
  pnj: "bg-sky-900/70 text-sky-300 border border-sky-500/40",
  personaje: "bg-violet-900/70 text-violet-300 border border-violet-500/40",
};

export default function Baul({
  campaignId,
  onClose,
  onMapSelect,
  onCharacterClick,
}: BaulProps) {
  const [chestSourceTab, setChestSourceTab] = useState<ChestSourceTab>("mine");
  const [chestContentTab, setChestContentTab] =
    useState<ChestContentTab>("characters");
  const [chestTipoTab, setChestTipoTab] = useState<ChestTipoTab>("todos");
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);
  const [chestSearchQuery, setChestSearchQuery] = useState("");
  const [chestCampaignSystem, setChestCampaignSystem] = useState<string | null>(
    null,
  );

  // ── Mis elementos ───────────────────────────────────────────
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

  // ── Menú de opciones por tarjeta ────────────────────────────
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

  // ── Marketplace ─────────────────────────────────────────────
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

  // ── Cargar personajes propios ────────────────────────────────
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

  // ── Cargar mapas propios ─────────────────────────────────────
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

  // ── Refrescar personajes propios (sin re-resolver la campaña) ──
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

  // ── Cargar personajes del marketplace ────────────────────────
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

        const url = buildApiUrl(
          `/api/marketplace/personajes?nombre=${encodeURIComponent(search)}&tipo=${tipoParam}&page=0&size=100`,
        );
        const res = await fetch(url, {
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

  // ── Cargar mapas del marketplace ─────────────────────────────
  const loadMarketplaceMaps = useCallback(async (search: string) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      setIsMarketplaceMapsLoading(true);
      setMarketplaceMapsError(null);

      const url = buildApiUrl(
        `/api/marketplace/mapas?nombre=${encodeURIComponent(search)}&page=0&size=100`,
      );
      const res = await fetch(url, {
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

  // ── Disparar carga del marketplace con debounce ──────────────
  useEffect(() => {
    if (chestSourceTab !== "marketplace") return;

    if (marketplaceSearchTimer.current) {
      clearTimeout(marketplaceSearchTimer.current);
    }

    marketplaceSearchTimer.current = setTimeout(() => {
      if (chestContentTab === "characters") {
        void loadMarketplaceCharacters(chestSearchQuery, chestTipoTab);
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
    chestTipoTab,
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

  // ── Guardar desde marketplace ────────────────────────────────
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
      // Marcar en marketplace como "ya tienes copia"
      if (saveTarget.type === "character") {
        setMarketplaceCharacters((prev) =>
          prev.map((c) =>
            c.id === saveTarget.id ? { ...c, yaTienesCopia: true } : c,
          ),
        );
        // Refrescar "Tus elementos" para que aparezca el nuevo personaje
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
      // Refrescar la lista completa para reflejar el nuevo estado
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

  // ── Borrar ───────────────────────────────────────────────────
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
        // Refrescar personajes propios y marketplace de personajes
        void refreshCharacters();
        void loadMarketplaceCharacters(chestSearchQuery, chestTipoTab);
      } else {
        // Refrescar mapas propios y marketplace de mapas
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

  // ── Filtros locales (mis elementos) ──────────────────────────
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

  // ── Drag & drop ──────────────────────────────────────────────
  const handleCharacterDragStart = useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      character: {
        id: number;
        nombre: string;
        retrato?: string;
        tipo?: string;
        source?: string;
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
        }),
      );
      event.dataTransfer.setData("text/plain", character.nombre);
    },
    [],
  );

  // ── Helpers de render ────────────────────────────────────────
  const renderCharacterCard = (
    character: {
      id: number;
      nombre: string;
      retrato?: string;
      sistemaDeJuego: string;
      tipo?: string;
      source?: string;
      esPublico?: boolean;
      estaPublicado?: boolean;
      esGuardado?: boolean;
      yaTienesCopia?: boolean;
    },
    extra?: { badge?: string; subtitle?: string; creadorUsername?: string },
  ) => {
    const tipo = (character.tipo ?? "personaje").toLowerCase();
    const isOwn = character.source === "mine";
    const isNpcOrEnemy = tipo === "enemigo" || tipo === "pnj";
    const menuKey = `char-${character.id}`;

    // Own characters are always clickable (editable sheet).
    // Marketplace enemies/PNJs are also clickable (read-only — isOwner will be false inside the sheet).
    const canClick = !!onCharacterClick && (isOwn || (!isOwn && isNpcOrEnemy));

    return (
      <article
        key={character.id}
        draggable
        onDragStart={(event) =>
          handleCharacterDragStart(event, {
            ...character,
            tipo: character.tipo,
            source: character.source,
          })
        }
        onClick={canClick ? () => onCharacterClick(character.id) : undefined}
        className={`relative flex flex-col overflow-hidden rounded-[18px] border border-amber-200/35 bg-zinc-900/95 shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.35)] ${canClick ? "cursor-pointer active:scale-[0.98]" : "cursor-grab active:cursor-grabbing"}`}
      >
        <div className="relative h-[140px] bg-gradient-to-br from-zinc-700 to-zinc-900">
          {character.retrato ? (
            <img
              src={character.retrato}
              alt={character.nombre}
              className="h-full w-full block object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-white/75">
              ⚔
            </div>
          )}
          {extra?.badge && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${TIPO_BADGE[extra.badge] ?? "bg-zinc-800/80 text-zinc-400 border border-zinc-600/40"}`}
            >
              {extra.badge}
            </span>
          )}

          {/* ── Botones Tus elementos: NPC/Enemigo → ⚙ menú; Personaje → 🗑 */}
          {isOwn && isNpcOrEnemy && (
            <div className="absolute top-1.5 right-1.5">
              <button
                type="button"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === menuKey ? null : menuKey);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white/80 text-xs backdrop-blur-sm transition hover:bg-black/80"
              >
                ⚙
              </button>
              {openMenuId === menuKey && (
                <div className="absolute right-0 top-full z-30 mt-1 w-28 overflow-hidden rounded-xl border border-white/20 bg-zinc-900 shadow-2xl">
                  {/* Publicar: solo si no es ya público, no fue publicado y no es guardado del marketplace */}
                  {!character.esPublico && !character.esGuardado && (
                    <button
                      type="button"
                      disabled={character.estaPublicado === true}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setPublishTarget({
                          type: "character",
                          id: character.id,
                          nombre: character.nombre,
                        });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-emerald-300 transition hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🌐 {character.estaPublicado ? "Ya publicado" : "Publicar"}
                    </button>
                  )}
                  {!character.esPublico && !character.esGuardado && (
                    <div className="mx-2 h-px bg-white/10" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setDeleteTarget({
                        type: "character",
                        id: character.id,
                        nombre: character.nombre,
                      });
                      setDeleteConfirmText("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-white/8"
                  >
                    🗑 Borrar
                  </button>
                </div>
              )}
            </div>
          )}

          {isOwn && !isNpcOrEnemy && (
            <button
              type="button"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget({
                  type: "character",
                  id: character.id,
                  nombre: character.nombre,
                });
                setDeleteConfirmText("");
              }}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-red-400/40 bg-black/60 text-red-400 text-xs backdrop-blur-sm transition hover:bg-red-900/60"
            >
              🗑
            </button>
          )}

          {/* ── Botones Marketplace: Guardar (si no es tuyo) o Borrar (si es tuyo) */}
          {!isOwn && isNpcOrEnemy && (
            <>
              {extra?.creadorUsername === currentUsername ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({
                      type: "character",
                      id: character.id,
                      nombre: character.nombre,
                      fromMarketplace: true,
                    });
                    setDeleteConfirmText("");
                  }}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-red-400/40 bg-black/60 text-red-400 text-xs backdrop-blur-sm transition hover:bg-red-900/60"
                >
                  🗑
                </button>
              ) : (
                <button
                  type="button"
                  disabled={character.yaTienesCopia === true}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!character.yaTienesCopia) {
                      setSaveTarget({
                        type: "character",
                        id: character.id,
                        nombre: character.nombre,
                      });
                    }
                  }}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/50 bg-black/60 text-amber-300 text-xs backdrop-blur-sm transition hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    character.yaTienesCopia
                      ? "Ya guardado"
                      : "Guardar en Tus elementos"
                  }
                >
                  💾
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-2.5 py-3">
          <p className="m-0 text-center text-[15px] font-black leading-[1.15] text-white">
            {character.nombre}
          </p>
          {extra?.subtitle ? (
            <p className="mt-1 text-center text-[10px] text-white/45 truncate">
              {extra.subtitle}
            </p>
          ) : (
            <p className="mt-1.5 text-center text-xs font-semibold text-white/90">
              {character.sistemaDeJuego}
            </p>
          )}
        </div>
      </article>
    );
  };

  const renderMapCard = (map: MapSummaryResponse, isOwn = true) => {
    const menuKey = `map-${map.id}`;
    return (
      <article
        key={map.id}
        onClick={() => {
          if (map.mapa && onMapSelect) {
            onMapSelect({ mapaId: map.id, mapaUrl: map.mapa });
          }
        }}
        className="relative flex cursor-pointer flex-col overflow-hidden rounded-[18px] border border-amber-200/35 bg-zinc-900/95 shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.35)]"
      >
        <div className="relative h-[140px] bg-gradient-to-br from-zinc-700 to-zinc-900">
          {map.mapa ? (
            <img
              src={map.mapa}
              alt={map.nombre}
              className="block h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-white/75">
              🗺
            </div>
          )}

          {/* ── Botones Tus mapas → ⚙ menú */}
          {isOwn && (
            <div className="absolute top-1.5 right-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === menuKey ? null : menuKey);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white/80 text-xs backdrop-blur-sm transition hover:bg-black/80"
              >
                ⚙
              </button>
              {openMenuId === menuKey && (
                <div className="absolute right-0 top-full z-30 mt-1 w-28 overflow-hidden rounded-xl border border-white/20 bg-zinc-900 shadow-2xl">
                  {!map.esGuardado && (
                    <button
                      type="button"
                      disabled={map.estaPublicado === true}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setPublishTarget({
                          type: "map",
                          id: map.id,
                          nombre: map.nombre,
                        });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-emerald-300 transition hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🌐 {map.estaPublicado ? "Ya publicado" : "Publicar"}
                    </button>
                  )}
                  {!map.esGuardado && <div className="mx-2 h-px bg-white/10" />}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setDeleteTarget({
                        type: "map",
                        id: map.id,
                        nombre: map.nombre,
                      });
                      setDeleteConfirmText("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-white/8"
                  >
                    🗑 Borrar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Botones Marketplace mapas: Guardar o Borrar según si es tuyo */}
          {!isOwn && (
            <>
              {map.creadorUsername === currentUsername ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({
                      type: "map",
                      id: map.id,
                      nombre: map.nombre,
                      fromMarketplace: true,
                    });
                    setDeleteConfirmText("");
                  }}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-red-400/40 bg-black/60 text-red-400 text-xs backdrop-blur-sm transition hover:bg-red-900/60"
                >
                  🗑
                </button>
              ) : (
                <button
                  type="button"
                  disabled={map.yaTienesCopia === true}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!map.yaTienesCopia) {
                      setSaveTarget({
                        type: "map",
                        id: map.id,
                        nombre: map.nombre,
                      });
                    }
                  }}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/50 bg-black/60 text-amber-300 text-xs backdrop-blur-sm transition hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    map.yaTienesCopia
                      ? "Ya guardado"
                      : "Guardar en Tus elementos"
                  }
                >
                  💾
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-2.5 py-3">
          <p className="m-0 text-center text-[15px] font-black leading-[1.15] text-white">
            {map.nombre}
          </p>
        </div>
      </article>
    );
  };

  const gridClass = "grid gap-2.5";
  const gridStyle = {
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <aside className="absolute left-3.5 top-3.5 bottom-3.5 z-10 w-[clamp(320px,40vw,620px)] flex flex-col gap-3.5 rounded-[14px] border border-white/20 bg-black/85 p-[16px_14px] text-white">
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="m-0 text-[22px] font-black tracking-[0.03em]">Baul</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/24 bg-white/6 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/12"
        >
          Cerrar
        </button>
      </div>

      {/* Fuente: Mis elementos / Marketplace */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setChestSourceTab("mine")}
          className={`flex-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition ${
            chestSourceTab === "mine"
              ? "border border-amber-400/90 bg-amber-700/22 text-amber-100"
              : "border border-white/20 bg-white/5 text-white hover:bg-white/12"
          }`}
        >
          Tus elementos
        </button>
        <button
          type="button"
          onClick={() => setChestSourceTab("marketplace")}
          className={`flex-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition ${
            chestSourceTab === "marketplace"
              ? "border border-amber-400/90 bg-amber-700/22 text-amber-100"
              : "border border-white/20 bg-white/5 text-white hover:bg-white/12"
          }`}
        >
          Marketplace
        </button>
      </div>

      {/* Contenido: Personajes / Mapa */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setChestContentTab("characters")}
          className={`flex-1 rounded-full px-2.5 py-[5px] text-xs font-bold transition ${
            chestContentTab === "characters"
              ? "border border-amber-400/90 bg-amber-700/18 text-amber-100"
              : "border border-white/20 bg-white/3 text-white hover:bg-white/8"
          }`}
        >
          Personajes
        </button>
        <button
          type="button"
          onClick={() => setChestContentTab("map")}
          className={`flex-1 rounded-full px-2.5 py-[5px] text-xs font-bold transition ${
            chestContentTab === "map"
              ? "border border-amber-400/90 bg-amber-700/18 text-amber-100"
              : "border border-white/20 bg-white/3 text-white hover:bg-white/8"
          }`}
        >
          Mapa
        </button>
      </div>

      {/* Filtro por tipo (solo personajes) */}
      {chestContentTab === "characters" && (
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              { key: "todos", label: "Todos" },
              { key: "personajes", label: "Personajes" },
              { key: "enemigos", label: "Enemigos" },
              { key: "pnj", label: "PNJ" },
            ] as { key: ChestTipoTab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setChestTipoTab(key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                chestTipoTab === key
                  ? "border border-amber-400/80 bg-amber-700/20 text-amber-100"
                  : "border border-white/15 bg-white/3 text-white/70 hover:bg-white/8"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Cuerpo principal */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-[12px] border border-white/14 bg-gray-400/20 p-3">
        {/* Barra de búsqueda + acción */}
        <div className="mb-3 flex items-center gap-2">
          <input
            value={chestSearchQuery}
            onChange={(event) => setChestSearchQuery(event.target.value)}
            placeholder="Buscar"
            className="h-9 flex-1 rounded-lg border border-white/22 bg-black/35 px-2.5 text-sm text-white outline-none transition placeholder:text-white/70 focus:border-white/40"
          />
          {chestSourceTab === "mine" && chestContentTab === "characters" ? (
            <button
              type="button"
              onClick={() => setIsNpcModalOpen(true)}
              className="h-9 rounded-lg border border-amber-400/50 bg-amber-700/20 px-3 text-xs font-bold text-amber-100 transition hover:bg-amber-700/35"
            >
              Crear NPC
            </button>
          ) : chestSourceTab === "mine" && chestContentTab === "map" ? (
            <button
              type="button"
              onClick={() => setIsMapUploadModalOpen(true)}
              className="h-9 rounded-lg border border-white/22 bg-white/8 px-3.5 font-bold text-white transition hover:bg-white/12"
            >
              Subir
            </button>
          ) : null}
        </div>

        {/* ── MIS PERSONAJES ── */}
        {chestSourceTab === "mine" && chestContentTab === "characters" && (
          <>
            {isChestLoading && (
              <p className="m-0 text-sm text-stone-100">
                Cargando personajes...
              </p>
            )}
            {!isChestLoading && chestError && (
              <p className="m-0 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
                {chestError}
              </p>
            )}
            {!isChestLoading &&
              !chestError &&
              filteredChestCharacters.length === 0 && (
                <p className="m-0 text-sm text-white/88">
                  No hay personajes para mostrar.
                </p>
              )}
            <div className={gridClass} style={gridStyle}>
              {filteredChestCharacters.map((c) =>
                renderCharacterCard({ ...c, source: "mine" }),
              )}
            </div>
          </>
        )}

        {/* ── MIS MAPAS ── */}
        {chestSourceTab === "mine" && chestContentTab === "map" && (
          <>
            {isChestMapsLoading && (
              <p className="m-0 text-sm text-stone-100">Cargando mapas...</p>
            )}
            {!isChestMapsLoading && chestMapsError && (
              <p className="m-0 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
                {chestMapsError}
              </p>
            )}
            {!isChestMapsLoading &&
              !chestMapsError &&
              filteredChestMaps.length === 0 && (
                <p className="m-0 text-sm text-white/88">
                  No hay mapas para mostrar.
                </p>
              )}
            <div className={gridClass} style={gridStyle}>
              {filteredChestMaps.map((m) => renderMapCard(m, true))}
            </div>
          </>
        )}

        {/* ── MARKETPLACE PERSONAJES ── */}
        {chestSourceTab === "marketplace" &&
          chestContentTab === "characters" && (
            <>
              {isMarketplaceCharactersLoading && (
                <p className="m-0 text-sm text-stone-100">
                  Cargando marketplace...
                </p>
              )}
              {!isMarketplaceCharactersLoading &&
                marketplaceCharactersError && (
                  <p className="m-0 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
                    {marketplaceCharactersError}
                  </p>
                )}
              {!isMarketplaceCharactersLoading &&
                !marketplaceCharactersError &&
                marketplaceCharacters.length === 0 && (
                  <p className="m-0 text-sm text-white/88">
                    No hay personajes públicos disponibles.
                  </p>
                )}
              <div className={gridClass} style={gridStyle}>
                {marketplaceCharacters.map((c) =>
                  renderCharacterCard(
                    { ...c, source: "marketplace" },
                    {
                      badge: c.tipo,
                      subtitle: `por ${c.creadorUsername}`,
                      creadorUsername: c.creadorUsername,
                    },
                  ),
                )}
              </div>
            </>
          )}

        {/* ── MARKETPLACE MAPAS ── */}
        {chestSourceTab === "marketplace" && chestContentTab === "map" && (
          <>
            {isMarketplaceMapsLoading && (
              <p className="m-0 text-sm text-stone-100">
                Cargando mapas públicos...
              </p>
            )}
            {!isMarketplaceMapsLoading && marketplaceMapsError && (
              <p className="m-0 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
                {marketplaceMapsError}
              </p>
            )}
            {!isMarketplaceMapsLoading &&
              !marketplaceMapsError &&
              marketplaceMaps.length === 0 && (
                <p className="m-0 text-sm text-white/88">
                  No hay mapas públicos disponibles.
                </p>
              )}
            <div className={gridClass} style={gridStyle}>
              {marketplaceMaps.map((m) => renderMapCard(m, false))}
            </div>
          </>
        )}
      </div>

      <MapUploadModal
        isOpen={isMapUploadModalOpen}
        isSubmitting={isMapSubmitting}
        onClose={() => setIsMapUploadModalOpen(false)}
        onSubmit={handleSubmitMap}
      />

      <EnemyCreationModal
        isOpen={isNpcModalOpen}
        sistemaDeJuego={chestCampaignSystem ?? "Dungeons and Dragons"}
        onClose={() => setIsNpcModalOpen(false)}
        onCreated={handleNpcCreated}
      />

      {/* ── Modal: Guardar ── */}
      {saveTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[14px] bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl">
            <p className="mb-4 text-base font-bold text-white">
              ¿Guardar{" "}
              <span className="text-amber-200">{saveTarget.nombre}</span> en tus
              elementos?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSaveTarget(null)}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-white/20 bg-white/8 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-amber-500/50 bg-amber-700/30 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-700/50 disabled:opacity-50"
              >
                {isSaving ? "Guardando…" : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Publicar ── */}
      {publishTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[14px] bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl">
            <p className="mb-4 text-base font-bold text-white">
              ¿Seguro quieres publicar{" "}
              <span className="text-amber-200">{publishTarget.nombre}</span>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPublishTarget(null)}
                disabled={isPublishing}
                className="flex-1 rounded-xl border border-white/20 bg-white/8 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={isPublishing}
                className="flex-1 rounded-xl border border-emerald-500/50 bg-emerald-700/30 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-700/50 disabled:opacity-50"
              >
                {isPublishing ? "Publicando…" : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Borrar ── */}
      {deleteTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[14px] bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl">
            <p className="mb-1 text-base font-bold text-white">
              ¿Borrar elemento?
            </p>
            <p className="mb-4 text-sm text-white/70">
              Esta acción es{" "}
              <span className="font-semibold text-red-400">
                permanente e irreversible
              </span>
              . Escribe{" "}
              <span className="font-mono font-bold text-white">borrar</span>{" "}
              para confirmar.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="borrar"
              className="mb-4 h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-white/20 bg-white/8 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting || deleteConfirmText !== "borrar"}
                className="flex-1 rounded-xl border border-red-500/50 bg-red-900/30 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900/50 disabled:opacity-40"
              >
                {isDeleting ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
