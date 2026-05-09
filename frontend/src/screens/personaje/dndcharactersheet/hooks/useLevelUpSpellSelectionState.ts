import { useEffect, useState } from "react";
import {
  fetchAbilityCatalog,
  fetchSpellCatalog,
  type CharacterAbilityResponse,
} from "../../utils/dndApi";
import type { DndClassDetail } from "../../types";
import { normalizeDndText } from "../../utils/dndProgressionRules";
import { FEAT_OPTIONS } from "../feats/catalog";

interface UseLevelUpSpellSelectionStateOptions {
  token: string;
  isOpen: boolean;
  isDownMode: boolean;
  asiMode: "double" | "single" | "feat";
  characterAbilities: CharacterAbilityResponse[];
  selectedFeat: (typeof FEAT_OPTIONS)[number] | null;
  selectedFeatSpellClass: string;
  selectedClassDetail: DndClassDetail | null;
  targetLevel: number;
  cantripUpgradeCount: number;
  eaCantripCount: number;
  eaSpellCount: number;
  ekCantripCount: number;
  ekSpellCount: number;
  battleMasterManeuverCount: number;
  isGainingEa: boolean;
  isActiveEa: boolean;
  isGainingEk: boolean;
  isActiveEk: boolean;
  isGainingBattleMaster: boolean;
  isActiveBattleMaster: boolean;
  getAtMaxSpellLevel: (level: number) => number;
  getEkMaxSpellLevel: (level: number) => number;
}

export function useLevelUpSpellSelectionState({
  token,
  isOpen,
  isDownMode,
  asiMode,
  characterAbilities,
  selectedFeat,
  selectedFeatSpellClass,
  selectedClassDetail,
  targetLevel,
  cantripUpgradeCount,
  eaCantripCount,
  eaSpellCount,
  ekCantripCount,
  ekSpellCount,
  battleMasterManeuverCount,
  isGainingEa,
  isActiveEa,
  isGainingEk,
  isActiveEk,
  isGainingBattleMaster,
  isActiveBattleMaster,
  getAtMaxSpellLevel,
  getEkMaxSpellLevel,
}: UseLevelUpSpellSelectionStateOptions) {
  const [selectedFeatCantrips, setSelectedFeatCantrips] = useState<string[]>(
    [],
  );
  const [selectedFeatSpells, setSelectedFeatSpells] = useState<string[]>([]);
  const [featCantripOptions, setFeatCantripOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [featSpellOptions, setFeatSpellOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [eaChosenCantrips, setEaChosenCantrips] = useState<string[]>([]);
  const [eaChosenSpells, setEaChosenSpells] = useState<string[]>([]);
  const [eaCantripOptions, setEaCantripOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [eaSpellOptions, setEaSpellOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [ekChosenCantrips, setEkChosenCantrips] = useState<string[]>([]);
  const [ekChosenSpells, setEkChosenSpells] = useState<string[]>([]);
  const [ekCantripOptions, setEkCantripOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [ekSpellOptions, setEkSpellOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [battleMasterManeuverOptions, setBattleMasterManeuverOptions] =
    useState<string[]>([]);
  const [battleMasterManeuvers, setBattleMasterManeuvers] = useState<string[]>(
    [],
  );
  const [cantripUpgradeChosen, setCantripUpgradeChosen] = useState<string[]>(
    [],
  );
  const [cantripUpgradeOptions, setCantripUpgradeOptions] = useState<
    CharacterAbilityResponse[]
  >([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedFeatCantrips([]);
    setSelectedFeatSpells([]);
    setFeatCantripOptions([]);
    setFeatSpellOptions([]);
    setEaChosenCantrips([]);
    setEaChosenSpells([]);
    setEaCantripOptions([]);
    setEaSpellOptions([]);
    setEkChosenCantrips([]);
    setEkChosenSpells([]);
    setEkCantripOptions([]);
    setEkSpellOptions([]);
    setBattleMasterManeuverOptions([]);
    setBattleMasterManeuvers([]);
    setCantripUpgradeChosen([]);
    setCantripUpgradeOptions([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || asiMode !== "feat" || !selectedFeat) {
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
      return;
    }

    const spellSelection = selectedFeat.spellSelection;
    if (!spellSelection) {
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
      return;
    }

    const selectedClass = selectedFeatSpellClass.trim();
    if (spellSelection.chooseClass && !selectedClass) {
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
      return;
    }

    const abortController = new AbortController();
    const loadSpellOptions = async () => {
      try {
        if (spellSelection.cantrips > 0) {
          setFeatCantripOptions(
            await fetchSpellCatalog(
              token,
              { nivel: 0, clase: selectedClass || undefined },
              abortController.signal,
            ),
          );
        } else {
          setFeatCantripOptions([]);
        }

        if (spellSelection.spells > 0) {
          setFeatSpellOptions(
            await fetchSpellCatalog(
              token,
              { nivel: spellSelection.spellLevel ?? 1, clase: selectedClass },
              abortController.signal,
            ),
          );
        } else {
          setFeatSpellOptions([]);
        }
      } catch {
        setFeatCantripOptions([]);
        setFeatSpellOptions([]);
      }
    };

    void loadSpellOptions();
    return () => abortController.abort();
  }, [asiMode, isOpen, selectedFeat, selectedFeatSpellClass, token]);

  useEffect(() => {
    if (isDownMode || (!isGainingEa && !isActiveEa) || eaCantripCount <= 0) {
      setEaCantripOptions([]);
      return;
    }

    const knownNames = new Set(
      characterAbilities.map((ability) => normalizeDndText(ability.nombre)),
    );
    const abortController = new AbortController();

    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: "mago" },
      abortController.signal,
    )
      .then((options) =>
        setEaCantripOptions(
          options.filter(
            (option) => !knownNames.has(normalizeDndText(option.nombre)),
          ),
        ),
      )
      .catch(() => setEaCantripOptions([]));

    return () => abortController.abort();
  }, [
    characterAbilities,
    eaCantripCount,
    isActiveEa,
    isDownMode,
    isGainingEa,
    token,
  ]);

  useEffect(() => {
    if (isDownMode || (!isGainingEa && !isActiveEa) || eaSpellCount <= 0) {
      setEaSpellOptions([]);
      return;
    }

    const maxSpellLevel = getAtMaxSpellLevel(targetLevel);
    if (maxSpellLevel <= 0) {
      setEaSpellOptions([]);
      return;
    }

    const knownNames = new Set(
      characterAbilities.map((ability) => normalizeDndText(ability.nombre)),
    );
    const abortController = new AbortController();
    const loadSpellOptions = async () => {
      const merged = new Map<string, CharacterAbilityResponse>();
      for (let spellLevel = 1; spellLevel <= maxSpellLevel; spellLevel += 1) {
        const options = await fetchSpellCatalog(
          token,
          { nivel: spellLevel, clase: "mago" },
          abortController.signal,
        );
        options.forEach((option) => {
          const normalizedName = normalizeDndText(option.nombre);
          if (!knownNames.has(normalizedName) && !merged.has(normalizedName)) {
            merged.set(normalizedName, option);
          }
        });
      }
      setEaSpellOptions(Array.from(merged.values()));
    };

    void loadSpellOptions().catch(() => setEaSpellOptions([]));
    return () => abortController.abort();
  }, [
    characterAbilities,
    eaSpellCount,
    getAtMaxSpellLevel,
    isActiveEa,
    isDownMode,
    isGainingEa,
    targetLevel,
    token,
  ]);

  useEffect(() => {
    if (isDownMode || (!isGainingEk && !isActiveEk) || ekCantripCount <= 0) {
      setEkCantripOptions([]);
      return;
    }

    const knownNames = new Set(
      characterAbilities.map((ability) => normalizeDndText(ability.nombre)),
    );
    const abortController = new AbortController();

    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: "mago" },
      abortController.signal,
    )
      .then((options) =>
        setEkCantripOptions(
          options.filter(
            (option) => !knownNames.has(normalizeDndText(option.nombre)),
          ),
        ),
      )
      .catch(() => setEkCantripOptions([]));

    return () => abortController.abort();
  }, [
    characterAbilities,
    ekCantripCount,
    isActiveEk,
    isDownMode,
    isGainingEk,
    token,
  ]);

  useEffect(() => {
    if (isDownMode || (!isGainingEk && !isActiveEk) || ekSpellCount <= 0) {
      setEkSpellOptions([]);
      return;
    }

    const maxSpellLevel = getEkMaxSpellLevel(targetLevel);
    if (maxSpellLevel <= 0) {
      setEkSpellOptions([]);
      return;
    }

    const knownNames = new Set(
      characterAbilities.map((ability) => normalizeDndText(ability.nombre)),
    );
    const abortController = new AbortController();
    const loadSpellOptions = async () => {
      const merged = new Map<string, CharacterAbilityResponse>();
      for (let spellLevel = 1; spellLevel <= maxSpellLevel; spellLevel += 1) {
        const options = await fetchSpellCatalog(
          token,
          { nivel: spellLevel, clase: "mago" },
          abortController.signal,
        );
        options.forEach((option) => {
          const normalizedName = normalizeDndText(option.nombre);
          if (!knownNames.has(normalizedName) && !merged.has(normalizedName)) {
            merged.set(normalizedName, option);
          }
        });
      }
      setEkSpellOptions(Array.from(merged.values()));
    };

    void loadSpellOptions().catch(() => setEkSpellOptions([]));
    return () => abortController.abort();
  }, [
    characterAbilities,
    ekSpellCount,
    getEkMaxSpellLevel,
    isActiveEk,
    isDownMode,
    isGainingEk,
    targetLevel,
    token,
  ]);

  useEffect(() => {
    if (
      isDownMode ||
      (!isGainingBattleMaster && !isActiveBattleMaster) ||
      battleMasterManeuverCount <= 0
    ) {
      setBattleMasterManeuverOptions([]);
      return;
    }

    const knownNames = new Set(
      characterAbilities.map((ability) => normalizeDndText(ability.nombre)),
    );
    const abortController = new AbortController();

    const buildBattleMasterOptions = (options: CharacterAbilityResponse[]) =>
      options
        .map((option) => option.nombre)
        .filter((name) => !knownNames.has(normalizeDndText(name)));

    const loadBattleMasterManeuvers = async () => {
      const subclassOptions = await fetchAbilityCatalog(
        token,
        {
          clase: "guerrero",
          subclase: "maestrobatalla",
          etiqueta: "maniobra",
        },
        abortController.signal,
      );

      const fallbackOptions =
        subclassOptions.length > 0
          ? subclassOptions
          : await fetchAbilityCatalog(
              token,
              {
                clase: "guerrero",
                etiqueta: "maniobra",
              },
              abortController.signal,
            );

      setBattleMasterManeuverOptions(buildBattleMasterOptions(fallbackOptions));
    };

    void loadBattleMasterManeuvers().catch(() =>
      setBattleMasterManeuverOptions([]),
    );

    return () => abortController.abort();
  }, [
    battleMasterManeuverCount,
    characterAbilities,
    isActiveBattleMaster,
    isDownMode,
    isGainingBattleMaster,
    token,
  ]);

  useEffect(() => {
    if (isDownMode || cantripUpgradeCount <= 0 || !selectedClassDetail) {
      setCantripUpgradeOptions([]);
      return;
    }

    const knownNames = new Set(
      characterAbilities.map((ability) => normalizeDndText(ability.nombre)),
    );
    const abortController = new AbortController();

    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: selectedClassDetail.id },
      abortController.signal,
    )
      .then((options) =>
        setCantripUpgradeOptions(
          options.filter(
            (option) => !knownNames.has(normalizeDndText(option.nombre)),
          ),
        ),
      )
      .catch(() => setCantripUpgradeOptions([]));

    return () => abortController.abort();
  }, [
    cantripUpgradeCount,
    characterAbilities,
    isDownMode,
    selectedClassDetail,
    token,
  ]);

  return {
    battleMasterManeuverOptions,
    battleMasterManeuvers,
    cantripUpgradeChosen,
    cantripUpgradeOptions,
    eaCantripOptions,
    eaChosenCantrips,
    eaChosenSpells,
    eaSpellOptions,
    ekCantripOptions,
    ekChosenCantrips,
    ekChosenSpells,
    ekSpellOptions,
    featCantripOptions,
    featSpellOptions,
    selectedFeatCantrips,
    selectedFeatSpells,
    setBattleMasterManeuvers,
    setCantripUpgradeChosen,
    setEaChosenCantrips,
    setEaChosenSpells,
    setEkChosenCantrips,
    setEkChosenSpells,
    setSelectedFeatCantrips,
    setSelectedFeatSpells,
  };
}
