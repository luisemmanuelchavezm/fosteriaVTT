import { useCallback, useEffect, useState } from "react";
import { SPELL_LEVELS } from "../../personaje/dndcharactersheet/data";
import {
  type DndCharacterDetailResponse,
  fetchDndCharacterDetail,
} from "../../personaje/utils/dndApi";
import { getCharacterMoney } from "../../personaje/dndcharactersheet/utils/characterInventory";
import { extractExtraResources } from "../../personaje/dndcharactersheet/utils/characterResources";
import {
  CHARACTER_REMOTE_UPDATED_EVENT,
  type CampaignPositionResponse,
} from "../types";

export type ResourceTab = "spells" | "extra" | "money";

const INITIAL_MONEY: Record<string, number> = { ppt: 0, po: 0, pp: 0, pc: 0 };

export interface UseCharacterDetailReturn {
  detail: DndCharacterDetailResponse | null;
  isLoadingDetail: boolean;
  portraitFailed: boolean;
  setPortraitFailed: (v: boolean) => void;
  resourceTab: ResourceTab;
  setResourceTab: React.Dispatch<React.SetStateAction<ResourceTab>>;
  resourceSpellSlots: Record<number, number>;
  setResourceSpellSlots: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  resourceExtraResources: Record<number, number>;
  setResourceExtraResources: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  resourceMoney: Record<string, number>;
  setResourceMoney: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}

export function useCharacterDetail(
  selectedPosition: CampaignPositionResponse | null,
): UseCharacterDetailReturn {
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [detail, setDetail] = useState<DndCharacterDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [resourceTab, setResourceTab] = useState<ResourceTab>("spells");
  const [resourceSpellSlots, setResourceSpellSlots] = useState<
    Record<number, number>
  >({});
  const [resourceExtraResources, setResourceExtraResources] = useState<
    Record<number, number>
  >({});
  const [resourceMoney, setResourceMoney] =
    useState<Record<string, number>>(INITIAL_MONEY);

  const loadCharacterDetail = useCallback(
    async (
      characterId: number,
      signal: AbortSignal,
      options?: { keepCurrentDetail?: boolean },
    ) => {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        if (!options?.keepCurrentDetail && !signal.aborted) {
          setDetail(null);
          setIsLoadingDetail(false);
        }
        return;
      }

      if (!options?.keepCurrentDetail && !signal.aborted) {
        setIsLoadingDetail(true);
      }

      try {
        const response = await fetchDndCharacterDetail(
          token,
          characterId,
          signal,
        );
        if (signal.aborted) return;

        const loadedSpellSlots = Object.fromEntries(
          SPELL_LEVELS.map((level) => [
            level,
            response.estadisticas[`Hechizos nivel ${level} gastados`] ??
              response.estadisticas[`Hechizos nivel ${level}`] ??
              0,
          ]),
        ) as Record<number, number>;

        const loadedExtraResources = Object.fromEntries(
          extractExtraResources(response.estadisticas).map((entry) => [
            entry.index,
            entry.current,
          ]),
        ) as Record<number, number>;

        setDetail(response);
        setResourceSpellSlots(loadedSpellSlots);
        setResourceExtraResources(loadedExtraResources);
        setResourceMoney(getCharacterMoney(response));
        setPortraitFailed(false);
      } catch {
        if (!signal.aborted && !options?.keepCurrentDetail) {
          setDetail(null);
        }
      } finally {
        if (!signal.aborted && !options?.keepCurrentDetail) {
          setIsLoadingDetail(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    setDetail(null);
    setPortraitFailed(false);
    setResourceTab("spells");
    setResourceSpellSlots({});
    setResourceExtraResources({});
    setResourceMoney(INITIAL_MONEY);
    if (!selectedPosition) return;

    const abortController = new AbortController();
    void loadCharacterDetail(
      selectedPosition.personajeId,
      abortController.signal,
    );
    return () => abortController.abort();
  }, [loadCharacterDetail, selectedPosition]);

  useEffect(() => {
    if (!selectedPosition) return;

    const handleRemoteUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ characterId?: number }>;
      const characterId = customEvent.detail?.characterId;
      if (characterId !== selectedPosition.personajeId) return;

      const abortController = new AbortController();
      void loadCharacterDetail(characterId, abortController.signal, {
        keepCurrentDetail: true,
      });
    };

    window.addEventListener(
      CHARACTER_REMOTE_UPDATED_EVENT,
      handleRemoteUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        CHARACTER_REMOTE_UPDATED_EVENT,
        handleRemoteUpdate as EventListener,
      );
  }, [loadCharacterDetail, selectedPosition]);

  return {
    detail,
    isLoadingDetail,
    portraitFailed,
    setPortraitFailed,
    resourceTab,
    setResourceTab,
    resourceSpellSlots,
    setResourceSpellSlots,
    resourceExtraResources,
    setResourceExtraResources,
    resourceMoney,
    setResourceMoney,
  };
}
