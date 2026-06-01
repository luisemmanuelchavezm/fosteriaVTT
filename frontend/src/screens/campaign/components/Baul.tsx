import { useState } from "react";
import MapUploadModal from "./MapUploadModal";
import EnemyCreationModal from "./EnemyCreationModal";
import { TIPO_BADGE } from "./baulTypes";
import type {
  ChestTipoTab,
  MapSummaryResponse,
  MarketplaceCharacterResponse,
  CharacterSummaryResponse,
} from "./baulTypes";
import { useBaulData } from "../hooks/useBaulData";

interface BaulProps {
  campaignId: string;
  isDM?: boolean;
  onClose: () => void;
  onMapSelect?: (payload: { mapaId: number; mapaUrl: string }) => void;
  onCharacterClick?: (characterId: number, sistemaDeJuego: string) => void;
}

export default function Baul({
  campaignId,
  isDM = false,
  onClose,
  onMapSelect,
  onCharacterClick,
}: BaulProps) {
  const [mapBlockedToast, setMapBlockedToast] = useState(false);

  const {
    chestSourceTab,
    setChestSourceTab,
    chestContentTab,
    setChestContentTab,
    chestTipoTab,
    setChestTipoTab,
    chestSearchQuery,
    setChestSearchQuery,
    isChestLoading,
    chestError,
    filteredChestCharacters,
    isChestMapsLoading,
    chestMapsError,
    filteredChestMaps,
    chestCampaignSystem,
    isMarketplaceCharactersLoading,
    marketplaceCharactersError,
    filteredMarketplaceCharacters,
    isMarketplaceMapsLoading,
    marketplaceMapsError,
    filteredMarketplaceMaps,
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
    openMenuId,
    setOpenMenuId,
    saveTarget,
    setSaveTarget,
    isSaving,
    handleSave,
    publishTarget,
    setPublishTarget,
    isPublishing,
    handlePublish,
    deleteTarget,
    setDeleteTarget,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeleting,
    handleDelete,
    isMapUploadModalOpen,
    setIsMapUploadModalOpen,
    isMapSubmitting,
    handleSubmitMap,
    isNpcModalOpen,
    setIsNpcModalOpen,
    handleNpcCreated,
    currentUsername,
    handleCharacterDragStart,
  } = useBaulData(campaignId);

  const gridClass = "grid gap-2.5";
  const gridStyle = {
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  };

  // ── Render character card ────────────────────────────────────
  const renderCharacterCard = (
    character: CharacterSummaryResponse & {
      source?: string;
      yaTienesCopia?: boolean;
    },
    extra?: { badge?: string; subtitle?: string; creadorUsername?: string },
  ) => {
    const tipo = (character.tipo ?? "personaje").toLowerCase();
    const isOwn = character.source === "mine";
    const isNpcOrEnemy = tipo === "enemigo" || tipo === "pnj";
    const menuKey = `char-${character.id}`;
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
        onClick={
          canClick
            ? () =>
                onCharacterClick(character.id, character.sistemaDeJuego ?? "")
            : undefined
        }
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

          {/* Own NPC/Enemy: gear menu */}
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

          {/* Own non-NPC: delete button */}
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

          {/* Marketplace NPC/Enemy: save or delete */}
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
                    if (!character.yaTienesCopia)
                      setSaveTarget({
                        type: "character",
                        id: character.id,
                        nombre: character.nombre,
                      });
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

  // ── Render map card ──────────────────────────────────────────
  const renderMapCard = (map: MapSummaryResponse, isOwn = true) => {
    const menuKey = `map-${map.id}`;
    return (
      <article
        key={map.id}
        onClick={() => {
          if (!map.mapa) return;
          if (!isDM) {
            setMapBlockedToast(true);
            setTimeout(() => setMapBlockedToast(false), 3000);
            return;
          }
          if (onMapSelect) onMapSelect({ mapaId: map.id, mapaUrl: map.mapa });
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

          {/* Own map: gear menu */}
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

          {/* Marketplace map: save or delete */}
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
                    if (!map.yaTienesCopia)
                      setSaveTarget({
                        type: "map",
                        id: map.id,
                        nombre: map.nombre,
                      });
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
          {!isOwn && map.creadorUsername && (
            <p className="mt-1 text-center text-[10px] text-white/45 truncate">
              por {map.creadorUsername}
            </p>
          )}
        </div>
      </article>
    );
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
        {(["mine", "marketplace"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setChestSourceTab(tab)}
            className={`flex-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition ${chestSourceTab === tab ? "border border-amber-400/90 bg-amber-700/22 text-amber-100" : "border border-white/20 bg-white/5 text-white hover:bg-white/12"}`}
          >
            {tab === "mine" ? "Tus elementos" : "Marketplace"}
          </button>
        ))}
      </div>

      {/* Contenido: Personajes / Mapa */}
      <div className="flex gap-2">
        {(["characters", "map"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setChestContentTab(tab)}
            className={`flex-1 rounded-full px-2.5 py-[5px] text-xs font-bold transition ${chestContentTab === tab ? "border border-amber-400/90 bg-amber-700/18 text-amber-100" : "border border-white/20 bg-white/3 text-white hover:bg-white/8"}`}
          >
            {tab === "characters" ? "Personajes" : "Mapa"}
          </button>
        ))}
      </div>

      {/* Filtro por tipo (solo Tus elementos → personajes) */}
      {chestSourceTab === "mine" && chestContentTab === "characters" && (
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
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${chestTipoTab === key ? "border border-amber-400/80 bg-amber-700/20 text-amber-100" : "border border-white/15 bg-white/3 text-white/70 hover:bg-white/8"}`}
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
          ) : chestSourceTab === "marketplace" &&
            chestContentTab === "characters" ? (
            <button
              type="button"
              title="Filtros adicionales"
              onClick={() => setMpCharFilterOpen((v) => !v)}
              className={`h-9 w-9 shrink-0 rounded-lg border text-sm transition ${mpCharFilterOpen ? "border-amber-400/70 bg-amber-700/25 text-amber-200" : "border-white/22 bg-white/8 text-white/70 hover:bg-white/14"}`}
            >
              ☰
            </button>
          ) : chestSourceTab === "marketplace" && chestContentTab === "map" ? (
            <button
              type="button"
              title="Filtros adicionales"
              onClick={() => setMpMapFilterOpen((v) => !v)}
              className={`h-9 w-9 shrink-0 rounded-lg border text-sm transition ${mpMapFilterOpen ? "border-amber-400/70 bg-amber-700/25 text-amber-200" : "border-white/22 bg-white/8 text-white/70 hover:bg-white/14"}`}
            >
              ☰
            </button>
          ) : null}
        </div>

        {/* Panel filtros — Marketplace personajes */}
        {chestSourceTab === "marketplace" &&
          chestContentTab === "characters" &&
          mpCharFilterOpen && (
            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-white/15 bg-white/5 p-3">
              <input
                value={mpCharUserFilter}
                onChange={(e) => setMpCharUserFilter(e.target.value)}
                placeholder="Filtrar por usuario..."
                className="h-8 rounded-lg border border-white/18 bg-black/30 px-2.5 text-xs text-white outline-none transition placeholder:text-white/50 focus:border-white/35"
              />
              <div className="flex gap-1.5">
                <span className="self-center text-[10px] font-bold uppercase tracking-wide text-white/40">
                  Tipo
                </span>
                {(
                  [
                    { v: "", label: "Todos" },
                    { v: "enemigo", label: "Enemigo" },
                    { v: "pnj", label: "PNJ" },
                  ] as { v: "" | "enemigo" | "pnj"; label: string }[]
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMpCharTypeFilter(v)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${mpCharTypeFilter === v ? "border border-amber-400/80 bg-amber-700/20 text-amber-100" : "border border-white/15 bg-white/3 text-white/70 hover:bg-white/8"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Panel filtros — Marketplace mapas */}
        {chestSourceTab === "marketplace" &&
          chestContentTab === "map" &&
          mpMapFilterOpen && (
            <div className="mb-3 rounded-xl border border-white/15 bg-white/5 p-3">
              <input
                value={mpMapUserFilter}
                onChange={(e) => setMpMapUserFilter(e.target.value)}
                placeholder="Filtrar por usuario..."
                className="h-8 w-full rounded-lg border border-white/18 bg-black/30 px-2.5 text-xs text-white outline-none transition placeholder:text-white/50 focus:border-white/35"
              />
            </div>
          )}

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
                filteredMarketplaceCharacters.length === 0 && (
                  <p className="m-0 text-sm text-white/88">
                    No hay personajes públicos disponibles.
                  </p>
                )}
              <div className={gridClass} style={gridStyle}>
                {filteredMarketplaceCharacters.map(
                  (c: MarketplaceCharacterResponse) =>
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
              filteredMarketplaceMaps.length === 0 && (
                <p className="m-0 text-sm text-white/88">
                  No hay mapas públicos disponibles.
                </p>
              )}
            <div className={gridClass} style={gridStyle}>
              {filteredMarketplaceMaps.map((m) => renderMapCard(m, false))}
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

      {/* ── Toast: solo DM puede cambiar el mapa ── */}
      {mapBlockedToast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-400/40 bg-zinc-900/95 px-4 py-2.5 text-sm font-semibold text-amber-300 shadow-2xl">
          Solo el DM puede modificar el mapa
        </div>
      )}
    </aside>
  );
}
