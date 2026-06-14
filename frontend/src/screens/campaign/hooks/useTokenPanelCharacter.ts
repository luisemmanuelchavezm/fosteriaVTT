import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchDndCharacterDetail,
  updateDndCharacterResources,
  type DndCharacterDetailResponse,
} from "../../personaje/utils/dndApi";
import { saveCurrentHpMB } from "../../personaje/utils/mbApi";
import { getCharacterMoney } from "../../personaje/dndcharactersheet/utils/characterInventory";
import { applyDamage } from "../../personaje/dndcharactersheet/utils/characterResources";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { serializeRollMessage } from "../components/chatRollUtils";
import type { CampaignPositionResponse } from "../types";

const CHARACTER_UPDATED_EVENT = "fosteria:character-updated";
import { CHARACTER_REMOTE_UPDATED_EVENT } from "../types";

export function getMaxHp(stats: Record<string, number>) {
  return Math.max(
    1,
    stats["MB_VidaMaxima"] ??
      stats["Puntos de vida"] ??
      stats["Vida maxima"] ??
      stats["Vida"] ??
      1,
  );
}

function isMorkBorg(character: DndCharacterDetailResponse) {
  return character.sistemaDeJuego === "Mork Borg";
}

export function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function getInitiative(stats: Record<string, number>) {
  if (typeof stats.Iniciativa === "number") return stats.Iniciativa;
  const dexterity = stats.Destreza ?? 10;
  return Math.floor((dexterity - 10) / 2);
}

export function getArmorClass(stats: Record<string, number>) {
  return Math.max(0, stats.CA ?? stats["Clase de armadura"] ?? 0);
}

export function formatStatWithModifier(value: number, modifier: number) {
  if (modifier === 0) return String(value);
  return `${value}(${modifier > 0 ? `+${modifier}` : modifier})`;
}

export interface UseTokenPanelCharacterReturn {
  detailsByCharacterId: Record<number, DndCharacterDetailResponse>;
  visibleTokens: CampaignPositionResponse[];
  selectedHealthCharacter: DndCharacterDetailResponse | null;
  selectedHealthCharacterId: number | null;
  setSelectedHealthCharacterId: (id: number | null) => void;
  hpDelta: string;
  setHpDelta: (v: string) => void;
  tempHpDelta: string;
  setTempHpDelta: (v: string) => void;
  healthSaveError: string | null;
  setHealthSaveError: (v: string | null) => void;
  isSavingHealth: boolean;
  adjustHealth: (
    mode: "heal" | "damage" | "tempGain" | "tempLose",
  ) => Promise<void>;
  updateCharacterStat: (
    characterId: number,
    statUpdates: Record<string, number>,
  ) => void;
  diceRoller: ReturnType<typeof useDiceRoller>;
}

export function useTokenPanelCharacter(
  positions: CampaignPositionResponse[],
  onSendMessage: (text: string) => Promise<void>,
  isDM: boolean,
): UseTokenPanelCharacterReturn {
  const onSendMessageRef = useRef(onSendMessage);
  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  const diceRoller = useDiceRoller();
  const lastSeenSummaryIdRef = useRef(-1);

  useEffect(() => {
    if (!diceRoller.summary) return;
    if (diceRoller.summary.id === lastSeenSummaryIdRef.current) return;
    lastSeenSummaryIdRef.current = diceRoller.summary.id;
    const { title, expression, diceValues, modifier, total } =
      diceRoller.summary;
    void onSendMessageRef
      .current(
        serializeRollMessage(
          title,
          diceValues,
          modifier,
          total,
          undefined,
          expression,
        ),
      )
      .catch(() => {});
  }, [diceRoller.summary]);

  const visibleTokens = useMemo(() => {
    if (isDM) {
      return positions.filter((p) => p.capa === "fichas" || p.capa === "dm");
    }
    return positions.filter((p) => {
      if (p.capa !== "fichas") return false;
      const tipo = (p.tipo ?? "personaje").toLowerCase();
      return tipo !== "enemigo";
    });
  }, [positions, isDM]);

  const visibleCharacterIds = useMemo(
    () => [...new Set(visibleTokens.map((token) => token.personajeId))],
    [visibleTokens],
  );

  const [detailsByCharacterId, setDetailsByCharacterId] = useState<
    Record<number, DndCharacterDetailResponse>
  >({});
  const [selectedHealthCharacterId, setSelectedHealthCharacterId] = useState<
    number | null
  >(null);
  const [hpDelta, setHpDelta] = useState("0");
  const [tempHpDelta, setTempHpDelta] = useState("0");
  const [healthSaveError, setHealthSaveError] = useState<string | null>(null);
  const [isSavingHealth, setIsSavingHealth] = useState(false);

  const selectedHealthCharacter = useMemo(
    () =>
      selectedHealthCharacterId != null
        ? (detailsByCharacterId[selectedHealthCharacterId] ?? null)
        : null,
    [selectedHealthCharacterId, detailsByCharacterId],
  );

  // Listen for local character updates
  useEffect(() => {
    const handleCharacterUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<DndCharacterDetailResponse>;
      const detail = customEvent.detail;
      if (!detail?.id) return;
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

  // Listen for remote character updates
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

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
        .catch(() => {});
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

  // Load missing character details
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token || visibleCharacterIds.length === 0) return;

    const abortController = new AbortController();

    const loadMissingCharacters = async () => {
      const idsToLoad = visibleCharacterIds.filter(
        (characterId) => !detailsByCharacterId[characterId],
      );
      if (idsToLoad.length === 0) return;

      const loadedDetails = await Promise.all(
        idsToLoad.map((characterId) =>
          fetchDndCharacterDetail(token, characterId, abortController.signal)
            .then((detail) => ({ id: characterId, detail }))
            .catch(() => null),
        ),
      );

      if (abortController.signal.aborted) return;

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

    const mb = isMorkBorg(character);
    const hpStatKey = mb ? "MB_VidaActual" : "Vida actual";
    const updatedStats: Record<string, number> = {
      ...character.estadisticas,
      [hpStatKey]: nextCurrentHp,
    };
    if (!mb) {
      updatedStats["Vida temporal"] = nextTempHp;
    }

    const nextDetail: DndCharacterDetailResponse = {
      ...character,
      estadisticas: updatedStats,
    };

    setDetailsByCharacterId((current) => ({
      ...current,
      [character.id]: nextDetail,
    }));
    window.dispatchEvent(
      new CustomEvent(CHARACTER_UPDATED_EVENT, { detail: nextDetail }),
    );

    try {
      if (mb) {
        await saveCurrentHpMB(token, character.id, nextCurrentHp);
      } else {
        await updateDndCharacterResources(token, character.id, {
          vidaActual: nextCurrentHp,
          vidaTemporal: nextTempHp,
          espaciosConjuroActuales: {},
          recursosExtraActuales: {},
          dinero: getCharacterMoney(character),
        });
      }
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
    if (!selectedHealthCharacter) return;

    const mb = isMorkBorg(selectedHealthCharacter);
    const hpStatKey = mb ? "MB_VidaActual" : "Vida actual";
    const parsedHpDelta = Number.parseInt(hpDelta, 10);
    const parsedTempHpDelta = Number.parseInt(tempHpDelta, 10);
    const currentHp = Math.max(
      0,
      selectedHealthCharacter.estadisticas[hpStatKey] ?? 0,
    );
    const tempHp = mb
      ? 0
      : Math.max(0, selectedHealthCharacter.estadisticas["Vida temporal"] ?? 0);
    const totalHp = getMaxHp(selectedHealthCharacter.estadisticas);

    let nextCurrentHp = currentHp;
    let nextTempHp = tempHp;

    if (mode === "heal") {
      if (!Number.isFinite(parsedHpDelta) || parsedHpDelta <= 0) return;
      nextCurrentHp = Math.min(totalHp, currentHp + parsedHpDelta);
    }
    if (mode === "damage") {
      if (!Number.isFinite(parsedHpDelta) || parsedHpDelta <= 0) return;
      const nextValues = applyDamage(currentHp, tempHp, parsedHpDelta);
      nextCurrentHp = nextValues.currentHp;
      nextTempHp = nextValues.tempHp;
    }
    if (mode === "tempGain") {
      if (!Number.isFinite(parsedTempHpDelta) || parsedTempHpDelta <= 0) return;
      nextTempHp = tempHp + parsedTempHpDelta;
    }
    if (mode === "tempLose") {
      if (!Number.isFinite(parsedTempHpDelta) || parsedTempHpDelta <= 0) return;
      nextTempHp = Math.max(0, tempHp - parsedTempHpDelta);
    }

    await persistHealthChange(
      selectedHealthCharacter,
      nextCurrentHp,
      nextTempHp,
    );
  };

  const updateCharacterStat = (
    characterId: number,
    statUpdates: Record<string, number>,
  ) => {
    setDetailsByCharacterId((current) => {
      const existing = current[characterId];
      if (!existing) return current;
      return {
        ...current,
        [characterId]: {
          ...existing,
          estadisticas: { ...existing.estadisticas, ...statUpdates },
        },
      };
    });
  };

  return {
    detailsByCharacterId,
    visibleTokens,
    selectedHealthCharacter,
    selectedHealthCharacterId,
    setSelectedHealthCharacterId,
    hpDelta,
    setHpDelta,
    tempHpDelta,
    setTempHpDelta,
    healthSaveError,
    setHealthSaveError,
    isSavingHealth,
    adjustHealth,
    updateCharacterStat,
    diceRoller,
  };
}
