import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import MapUploadModal from "./MapUploadModal";

interface BaulProps {
  campaignId: string;
  onClose: () => void;
  onMapSelect?: (payload: { mapaId: number; mapaUrl: string }) => void;
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
}

interface CharacterPageResponse {
  items: CharacterSummaryResponse[];
}

interface MapSummaryResponse {
  id: number;
  nombre: string;
  mapa?: string;
}

interface MapPageResponse {
  items: MapSummaryResponse[];
}

interface CreateMapResponse {
  id: number;
  nombre: string;
  mapa?: string;
}

const CHARACTER_DRAG_MIME = "application/x-fosteria-character";

type ChestSourceTab = "mine" | "marketplace";
type ChestContentTab = "characters" | "map";

export default function Baul({ campaignId, onClose, onMapSelect }: BaulProps) {
  const [chestSourceTab, setChestSourceTab] = useState<ChestSourceTab>("mine");
  const [chestContentTab, setChestContentTab] =
    useState<ChestContentTab>("characters");
  const [chestSearchQuery, setChestSearchQuery] = useState("");
  const [chestCampaignSystem, setChestCampaignSystem] = useState<string | null>(
    null,
  );
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

  const filteredChestCharacters = useMemo(() => {
    const query = chestSearchQuery.trim().toLowerCase();
    if (!query) {
      return chestCharacters;
    }

    return chestCharacters.filter((character) =>
      character.nombre.toLowerCase().includes(query),
    );
  }, [chestCharacters, chestSearchQuery]);

  const filteredChestMaps = useMemo(() => {
    const query = chestSearchQuery.trim().toLowerCase();
    if (!query) {
      return chestMaps;
    }

    return chestMaps.filter((map) => map.nombre.toLowerCase().includes(query));
  }, [chestMaps, chestSearchQuery]);

  const handleCharacterDragStart = useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      character: CharacterSummaryResponse,
    ) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        CHARACTER_DRAG_MIME,
        JSON.stringify({
          id: character.id,
          nombre: character.nombre,
          retrato: character.retrato,
        }),
      );
      event.dataTransfer.setData("text/plain", character.nombre);
    },
    [],
  );

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

      <div className="flex-1 min-h-0 overflow-y-auto rounded-[12px] border border-white/14 bg-gray-400/20 p-3">
        <div className="mb-3 flex items-center gap-2">
          <input
            value={chestSearchQuery}
            onChange={(event) => setChestSearchQuery(event.target.value)}
            placeholder="Buscar"
            className="h-9 flex-1 rounded-lg border border-white/22 bg-black/35 px-2.5 text-sm text-white outline-none transition placeholder:text-white/70 focus:border-white/40"
          />
          <button
            type="button"
            onClick={() => {
              if (chestSourceTab === "mine" && chestContentTab === "map") {
                setIsMapUploadModalOpen(true);
              }
            }}
            disabled={!(chestSourceTab === "mine" && chestContentTab === "map")}
            className="h-9 rounded-lg border border-white/22 bg-white/8 px-3.5 font-bold text-white transition hover:bg-white/12"
          >
            Subir
          </button>
        </div>

        {chestSourceTab === "mine" && chestContentTab === "characters" ? (
          <>
            {isChestLoading ? (
              <p className="m-0 text-sm text-stone-100">
                Cargando personajes...
              </p>
            ) : null}

            {!isChestLoading && chestError ? (
              <p className="m-0 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
                {chestError}
              </p>
            ) : null}

            {!isChestLoading && !chestError && chestCampaignSystem
              ? null
              : null}

            {!isChestLoading &&
            !chestError &&
            filteredChestCharacters.length === 0 ? (
              <p className="m-0 text-sm text-white/88">
                No hay personajes para mostrar.
              </p>
            ) : null}

            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              }}
            >
              {filteredChestCharacters.map((character) => (
                <article
                  key={character.id}
                  draggable
                  onDragStart={(event) =>
                    handleCharacterDragStart(event, character)
                  }
                  className="flex cursor-grab flex-col overflow-hidden rounded-[18px] border border-amber-200/35 bg-zinc-900/95 shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.35)] active:cursor-grabbing"
                >
                  <div className="h-[140px] bg-gradient-to-br from-zinc-700 to-zinc-900">
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
                  </div>

                  <div className="px-2.5 py-3">
                    <p className="m-0 text-center text-[15px] font-black leading-[1.15] text-white">
                      {character.nombre}
                    </p>

                    <p className="mt-1.5 text-center text-xs font-semibold text-white/90">
                      {character.sistemaDeJuego}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : chestSourceTab === "mine" && chestContentTab === "map" ? (
          <>
            {isChestMapsLoading ? (
              <p className="m-0 text-sm text-stone-100">Cargando mapas...</p>
            ) : null}

            {!isChestMapsLoading && chestMapsError ? (
              <p className="m-0 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
                {chestMapsError}
              </p>
            ) : null}

            {!isChestMapsLoading &&
            !chestMapsError &&
            filteredChestMaps.length === 0 ? (
              <p className="m-0 text-sm text-white/88">
                No hay mapas para mostrar.
              </p>
            ) : null}

            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              }}
            >
              {filteredChestMaps.map((map) => (
                <article
                  key={map.id}
                  onClick={() => {
                    if (map.mapa && onMapSelect) {
                      onMapSelect({ mapaId: map.id, mapaUrl: map.mapa });
                    }
                  }}
                  className="flex flex-col overflow-hidden rounded-[18px] border border-amber-200/35 bg-zinc-900/95 shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.35)] cursor-pointer"
                >
                  <div className="h-[140px] bg-gradient-to-br from-zinc-700 to-zinc-900">
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
                  </div>

                  <div className="px-2.5 py-3">
                    <p className="m-0 text-center text-[15px] font-black leading-[1.15] text-white">
                      {map.nombre}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="m-0 text-sm text-white/82">
            Esta sección estará disponible en el siguiente paso.
          </p>
        )}
      </div>

      <MapUploadModal
        isOpen={isMapUploadModalOpen}
        isSubmitting={isMapSubmitting}
        onClose={() => setIsMapUploadModalOpen(false)}
        onSubmit={handleSubmitMap}
      />
    </aside>
  );
}
