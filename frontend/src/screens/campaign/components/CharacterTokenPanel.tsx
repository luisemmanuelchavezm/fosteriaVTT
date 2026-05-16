import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import {
  fetchDndCharacterDetail,
  updateDndCharacterResources,
  type DndCharacterDetailResponse,
} from "../../personaje/utils/dndApi";
import { getAbilityModifierByName } from "../../personaje/dndcharactersheet/utils/characterAbilities";
import { getCharacterMoney } from "../../personaje/dndcharactersheet/utils/characterInventory";
import { applyDamage } from "../../personaje/dndcharactersheet/utils/characterResources";

interface CampaignPositionResponse {
  id: number;
  pestanaId: number;
  capa: "fichas" | "mapa" | "dm";
  personajeId: number;
  personajeNombre: string;
  retrato?: string;
  posicionX: number;
  posicionY: number;
  largo: number;
  ancho: number;
}

interface CharacterTokenPanelProps {
  positions: CampaignPositionResponse[];
  onOpenCharacterSheet?: (characterId: number) => void;
  onInteract?: () => void;
  iniciativaActiva?: boolean;
  personajesConIniciativa?: Set<number>;
  onTirarIniciativa?: (
    personajeId: number,
    nombre: string,
    retrato: string | undefined,
    bonificacion: number,
  ) => void;
}

const CHARACTER_UPDATED_EVENT = "fosteria:character-updated";
const CHARACTER_REMOTE_UPDATED_EVENT = "fosteria:character-remote-updated";

const MAIN_STATS = [
  { key: "Fuerza", short: "Fue" },
  { key: "Destreza", short: "Des" },
  { key: "Constitucion", short: "Con" },
  { key: "Inteligencia", short: "Int" },
  { key: "Sabiduria", short: "Sab" },
  { key: "Carisma", short: "Car" },
] as const;

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getInitiative(stats: Record<string, number>) {
  if (typeof stats.Iniciativa === "number") {
    return stats.Iniciativa;
  }

  const dexterity = stats.Destreza ?? 10;
  return Math.floor((dexterity - 10) / 2);
}

function getArmorClass(stats: Record<string, number>) {
  return Math.max(0, stats.CA ?? stats["Clase de armadura"] ?? 0);
}

function getMaxHp(stats: Record<string, number>) {
  // Backend persists max HP as "Puntos de vida".
  return Math.max(
    1,
    stats["Puntos de vida"] ?? stats["Vida maxima"] ?? stats["Vida"] ?? 1,
  );
}

function formatStatWithModifier(value: number, modifier: number) {
  if (modifier === 0) {
    return String(value);
  }

  return `${value}(${modifier > 0 ? `+${modifier}` : modifier})`;
}

export default function CharacterTokenPanel({
  positions,
  onOpenCharacterSheet,
  onInteract,
  iniciativaActiva = false,
  personajesConIniciativa,
  onTirarIniciativa,
}: CharacterTokenPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedHealthCharacterId, setSelectedHealthCharacterId] = useState<
    number | null
  >(null);
  const [hpDelta, setHpDelta] = useState("0");
  const [tempHpDelta, setTempHpDelta] = useState("0");
  const [healthSaveError, setHealthSaveError] = useState<string | null>(null);
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [detailsByCharacterId, setDetailsByCharacterId] = useState<
    Record<number, DndCharacterDetailResponse>
  >({});
  const diceRoller = useDiceRoller();

  const visibleTokens = useMemo(
    () => positions.filter((position) => position.capa === "fichas"),
    [positions],
  );

  const visibleCharacterIds = useMemo(
    () => [...new Set(visibleTokens.map((token) => token.personajeId))],
    [visibleTokens],
  );

  const selectedHealthCharacter = useMemo(
    () =>
      selectedHealthCharacterId != null
        ? (detailsByCharacterId[selectedHealthCharacterId] ?? null)
        : null,
    [selectedHealthCharacterId, detailsByCharacterId],
  );

  useEffect(() => {
    const handleCharacterUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<DndCharacterDetailResponse>;
      const detail = customEvent.detail;
      if (!detail?.id) {
        return;
      }

      setDetailsByCharacterId((current) => ({
        ...current,
        [detail.id]: detail,
      }));
    };

    window.addEventListener(
      CHARACTER_UPDATED_EVENT,
      handleCharacterUpdated as EventListener,
    );
    return () => {
      window.removeEventListener(
        CHARACTER_UPDATED_EVENT,
        handleCharacterUpdated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      return;
    }

    const handleRemoteCharacterUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ characterId?: number }>;
      const characterId = customEvent.detail?.characterId;
      if (
        typeof characterId !== "number" ||
        !visibleCharacterIds.includes(characterId)
      ) {
        return;
      }

      const abortController = new AbortController();
      void fetchDndCharacterDetail(token, characterId, abortController.signal)
        .then((detail) => {
          setDetailsByCharacterId((current) => ({
            ...current,
            [characterId]: detail,
          }));
        })
        .catch(() => {
          // Ignorar errores puntuales de sincronización en tiempo real.
        });
    };

    window.addEventListener(
      CHARACTER_REMOTE_UPDATED_EVENT,
      handleRemoteCharacterUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        CHARACTER_REMOTE_UPDATED_EVENT,
        handleRemoteCharacterUpdated as EventListener,
      );
    };
  }, [visibleCharacterIds]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token || visibleCharacterIds.length === 0) {
      return;
    }

    const abortController = new AbortController();

    const loadMissingCharacters = async () => {
      const idsToLoad = visibleCharacterIds.filter(
        (characterId) => !detailsByCharacterId[characterId],
      );

      if (idsToLoad.length === 0) {
        return;
      }

      const loadedDetails = await Promise.all(
        idsToLoad.map((characterId) =>
          fetchDndCharacterDetail(token, characterId, abortController.signal)
            .then((detail) => ({ id: characterId, detail }))
            .catch(() => null),
        ),
      );

      if (abortController.signal.aborted) {
        return;
      }

      setDetailsByCharacterId((current) => {
        const next = { ...current };
        for (const entry of loadedDetails) {
          if (entry) {
            next[entry.id] = entry.detail;
          }
        }
        return next;
      });
    };

    void loadMissingCharacters();

    return () => {
      abortController.abort();
    };
  }, [detailsByCharacterId, visibleCharacterIds]);

  const persistHealthChange = async (
    character: DndCharacterDetailResponse,
    nextCurrentHp: number,
    nextTempHp: number,
  ) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setHealthSaveError("No hay sesión activa.");
      return;
    }

    setIsSavingHealth(true);
    setHealthSaveError(null);

    const nextDetail: DndCharacterDetailResponse = {
      ...character,
      estadisticas: {
        ...character.estadisticas,
        "Vida actual": nextCurrentHp,
        "Vida temporal": nextTempHp,
      },
    };

    setDetailsByCharacterId((current) => ({
      ...current,
      [character.id]: nextDetail,
    }));
    window.dispatchEvent(
      new CustomEvent(CHARACTER_UPDATED_EVENT, { detail: nextDetail }),
    );

    try {
      await updateDndCharacterResources(token, character.id, {
        vidaActual: nextCurrentHp,
        vidaTemporal: nextTempHp,
        espaciosConjuroActuales: {},
        recursosExtraActuales: {},
        dinero: getCharacterMoney(character),
      });
    } catch (error) {
      setHealthSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la vida del personaje.",
      );
    } finally {
      setIsSavingHealth(false);
    }
  };

  const adjustHealth = async (
    mode: "heal" | "damage" | "tempGain" | "tempLose",
  ) => {
    if (!selectedHealthCharacter) {
      return;
    }

    const parsedHpDelta = Number.parseInt(hpDelta, 10);
    const parsedTempHpDelta = Number.parseInt(tempHpDelta, 10);
    const currentHp = Math.max(
      0,
      selectedHealthCharacter.estadisticas["Vida actual"] ?? 0,
    );
    const tempHp = Math.max(
      0,
      selectedHealthCharacter.estadisticas["Vida temporal"] ?? 0,
    );
    const totalHp = getMaxHp(selectedHealthCharacter.estadisticas);

    let nextCurrentHp = currentHp;
    let nextTempHp = tempHp;

    if (mode === "heal") {
      if (!Number.isFinite(parsedHpDelta) || parsedHpDelta <= 0) {
        return;
      }
      nextCurrentHp = Math.min(totalHp, currentHp + parsedHpDelta);
    }

    if (mode === "damage") {
      if (!Number.isFinite(parsedHpDelta) || parsedHpDelta <= 0) {
        return;
      }
      const nextValues = applyDamage(currentHp, tempHp, parsedHpDelta);
      nextCurrentHp = nextValues.currentHp;
      nextTempHp = nextValues.tempHp;
    }

    if (mode === "tempGain") {
      if (!Number.isFinite(parsedTempHpDelta) || parsedTempHpDelta <= 0) {
        return;
      }
      nextTempHp = tempHp + parsedTempHpDelta;
    }

    if (mode === "tempLose") {
      if (!Number.isFinite(parsedTempHpDelta) || parsedTempHpDelta <= 0) {
        return;
      }
      nextTempHp = Math.max(0, tempHp - parsedTempHpDelta);
    }

    await persistHealthChange(
      selectedHealthCharacter,
      nextCurrentHp,
      nextTempHp,
    );
  };

  return (
    <>
      <aside
        className={`absolute bottom-0 right-0 top-0 z-20 flex h-full items-start transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-[calc(100%-40px)]"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="mt-4 h-10 w-10 shrink-0 rounded-l-xl border border-r-0 border-white/20 bg-[linear-gradient(180deg,rgba(22,22,22,0.96)_0%,rgba(10,10,10,0.98)_100%)] text-white/85 shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition hover:bg-[linear-gradient(180deg,rgba(28,28,28,0.96)_0%,rgba(14,14,14,0.98)_100%)]"
          title={isOpen ? "Ocultar panel" : "Mostrar panel"}
        >
          {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="flex h-full w-[360px] rounded-l-2xl border border-white/20 bg-[linear-gradient(180deg,rgba(22,22,22,0.96)_0%,rgba(10,10,10,0.98)_100%)] text-white shadow-[0_20px_48px_rgba(0,0,0,0.55)] backdrop-blur-sm">
          <div className="flex min-h-0 flex-1 flex-col">
            <h2 className="mb-3 px-4 pt-4 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/85">
              Personajes
            </h2>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-0 pb-3">
              {visibleTokens.length === 0 ? (
                <div className="mx-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                  No hay fichas en el tablero.
                </div>
              ) : null}

              {visibleTokens.map((token) => {
                const detail = detailsByCharacterId[token.personajeId];
                const stats = detail?.estadisticas ?? {};
                const maxHp = getMaxHp(stats);
                const currentHp = Math.max(0, stats["Vida actual"] ?? 0);
                const tempHp = Math.max(0, stats["Vida temporal"] ?? 0);
                const hpPercent = clampPercentage((currentHp / maxHp) * 100);
                const tempHpPercent = clampPercentage((tempHp / maxHp) * 100);
                const armorClass = getArmorClass(stats);
                const movement = Math.max(0, stats["Movimiento"] ?? 0);
                const initiative = getInitiative(stats);

                return (
                  <article
                    key={token.id}
                    className="w-full border-y border-white/15 bg-white/[0.06] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCharacterSheet?.(token.personajeId);
                          onInteract?.();
                        }}
                        className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-amber-200/45 bg-zinc-700 transition hover:scale-[1.02] hover:border-amber-300/70"
                        title="Abrir hoja de personaje"
                      >
                        {(detail?.retrato ?? token.retrato) ? (
                          <img
                            src={detail?.retrato ?? token.retrato}
                            alt={detail?.nombre ?? token.personajeNombre}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {detail?.nombre ?? token.personajeNombre}
                        </p>

                        <div className="mt-2 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHealthCharacterId(token.personajeId);
                              setHealthSaveError(null);
                              onInteract?.();
                            }}
                            className="relative block h-5 w-full overflow-hidden rounded-full border border-red-300/35 bg-black/35 text-left transition hover:border-red-200/60"
                            title="Gestionar puntos de vida"
                          >
                            <div
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${hpPercent}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">
                              {currentHp}/{maxHp}
                            </div>
                          </button>

                          {tempHp > 0 ? (
                            <>
                              <div className="flex items-center justify-between text-[11px] text-blue-100/90">
                                <span>Temporal</span>
                                <span>{tempHp}</span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full border border-blue-300/35 bg-black/35">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${tempHpPercent}%` }}
                                />
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-white/10 pt-2.5">
                      <div className="grid grid-cols-6 gap-0 text-center">
                        {MAIN_STATS.map((stat) => (
                          <div key={`${token.id}-${stat.key}`}>
                            <p className="text-[10px] font-semibold text-white/70">
                              {stat.short}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (!detail) {
                                  return;
                                }

                                diceRoller.rollD20Check(
                                  stat.key,
                                  getAbilityModifierByName(detail, stat.key),
                                );
                              }}
                              className="text-sm font-bold text-amber-100"
                              title={`Tirar ${stat.key}`}
                            >
                              {formatStatWithModifier(
                                stats[stat.key] ?? 0,
                                detail
                                  ? getAbilityModifierByName(detail, stat.key)
                                  : 0,
                              )}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-0 border-t border-white/10 pt-2">
                        <div className="text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                            CA
                          </p>
                          <p className="text-sm font-bold text-white">
                            {armorClass}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                            MOV
                          </p>
                          <p className="text-sm font-bold text-white">
                            {movement}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                            INI
                          </p>
                          {iniciativaActiva && onTirarIniciativa ? (
                            <button
                              type="button"
                              onClick={() => {
                                onTirarIniciativa(
                                  token.personajeId,
                                  detail?.nombre ?? token.personajeNombre,
                                  detail?.retrato ?? token.retrato,
                                  initiative,
                                );
                              }}
                              className={[
                                "text-sm font-bold transition-colors",
                                personajesConIniciativa?.has(token.personajeId)
                                  ? "text-amber-300"
                                  : "text-white hover:text-amber-200",
                              ].join(" ")}
                              title="Tirar iniciativa"
                            >
                              {initiative >= 0
                                ? `+${initiative}`
                                : String(initiative)}
                            </button>
                          ) : (
                            <p className="text-sm font-bold text-white">
                              {initiative}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <DiceRollOverlay
          diceBoxHostId={diceRoller.diceBoxHostId}
          diceBoxError={diceRoller.diceBoxError}
          isRolling={diceRoller.isRolling}
          summary={diceRoller.summary}
        />
      </aside>

      {selectedHealthCharacter ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-6 py-8 backdrop-blur-[2px]"
          onClick={() => setSelectedHealthCharacterId(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-[24px] border border-white/15 bg-[linear-gradient(180deg,rgba(20,20,20,0.98)_0%,rgba(10,10,10,0.99)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/75">
                  Puntos de vida
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  {selectedHealthCharacter.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHealthCharacterId(null)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[150px_150px_minmax(0,1fr)]">
              <div className="grid grid-rows-[48px_48px_48px] gap-2">
                <button
                  type="button"
                  onClick={() => void adjustHealth("heal")}
                  className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
                >
                  Curar
                </button>

                <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                  <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setHpDelta((current) =>
                          String(
                            Math.max(
                              0,
                              (Number.parseInt(current, 10) || 0) - 1,
                            ),
                          ),
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hpDelta}
                      onChange={(event) =>
                        setHpDelta(
                          event.target.value.replace(/\D+/g, "") || "0",
                        )
                      }
                      className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setHpDelta((current) =>
                          String((Number.parseInt(current, 10) || 0) + 1),
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void adjustHealth("damage")}
                  className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                >
                  Danio
                </button>
              </div>

              <div className="grid grid-rows-[48px_48px_48px] gap-2">
                <button
                  type="button"
                  onClick={() => void adjustHealth("tempGain")}
                  className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 px-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
                >
                  Temp +
                </button>

                <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                  <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTempHpDelta((current) =>
                          String(
                            Math.max(
                              0,
                              (Number.parseInt(current, 10) || 0) - 1,
                            ),
                          ),
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tempHpDelta}
                      onChange={(event) =>
                        setTempHpDelta(
                          event.target.value.replace(/\D+/g, "") || "0",
                        )
                      }
                      className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTempHpDelta((current) =>
                          String((Number.parseInt(current, 10) || 0) + 1),
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void adjustHealth("tempLose")}
                  className="rounded-[16px] border border-cyan-300/35 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Temp -
                </button>
              </div>

              <div className="flex min-h-[180px] flex-col items-center justify-center px-3 text-center">
                <div className="flex items-center justify-center gap-3">
                  <p className="text-[2.3rem] font-bold leading-none text-white">
                    {Math.max(
                      0,
                      selectedHealthCharacter.estadisticas["Vida actual"] ?? 0,
                    )}
                  </p>
                  <span className="text-[2rem] font-bold leading-none text-white/45">
                    /
                  </span>
                  <p className="text-[2.3rem] font-bold leading-none text-white">
                    {getMaxHp(selectedHealthCharacter.estadisticas)}
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Puntos de vida
                </p>
                <p className="mt-3 text-base font-semibold text-sky-100/90">
                  Temporal:{" "}
                  {Math.max(
                    0,
                    selectedHealthCharacter.estadisticas["Vida temporal"] ?? 0,
                  )}
                </p>
                {isSavingHealth ? (
                  <p className="mt-3 text-xs text-white/60">Guardando...</p>
                ) : null}
                {healthSaveError ? (
                  <p className="mt-3 text-xs text-rose-200">
                    {healthSaveError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
