import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
  LevelUpDndCharacterRequest,
} from "../../utils/dndApi";
import {
  fetchAbilityCatalog,
  fetchClassSkills,
  fetchClassSubclassSkills,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  fetchSpellDetailByName,
  fetchSpellCatalog,
  type ClassSkillGroup,
} from "../../utils/dndApi";
import type {
  DndClassDetail,
  DndClassSummary,
  DndSubclassDetail,
} from "../../types";
import {
  classWarnings,
  inferCurrentSubclass,
  isAsiLevel,
  normalizeDndText,
  requiresSubclass,
} from "../../utils/dndProgressionRules";
import {
  buildFeatStatBonuses,
  FEAT_ATTRIBUTE_OPTIONS,
  FEAT_OPTIONS,
  getFeatValidity,
} from "../feats";
import {
  EXPERTISE_CHOICE_SECTION_ID,
  getExpertiseChoiceConfig,
  SKILL_EXPERTISE_CHOICE_ID,
  splitExpertiseChoices,
  THIEVES_TOOLS_NAME,
  TOOL_EXPERTISE_CHOICE_ID,
} from "../../utils/dndExpertise";
import { SKILL_ROWS } from "../data";
import { getClassLevel, getProficiencyBonus } from "../utils";

function isInitialClassSkillChoice(choiceId: string) {
  return choiceId.startsWith("class-skill-");
}

function findSubclassById(
  classDetail: DndClassDetail | null,
  subclassId: string,
) {
  return (
    classDetail?.subclases.find(
      (subclass) =>
        normalizeDndText(subclass.id) === normalizeDndText(subclassId),
    ) ?? null
  );
}

function getSubclassTableCounts(
  subclass: DndSubclassDetail | null,
  level: number,
) {
  if (!subclass?.tablas?.length) {
    return { trucos: 0, conjuros: 0 };
  }

  const row = subclass.tablas[0]?.filas.find(
    (entry) => entry[0]?.trim() === String(level),
  );
  if (!row || row.length < 3) {
    return { trucos: 0, conjuros: 0 };
  }

  return { trucos: parseInt(row[1]) || 0, conjuros: parseInt(row[2]) || 0 };
}

function getSubclassMaxSpellLevel(
  subclass: DndSubclassDetail | null,
  level: number,
) {
  if (!subclass?.tablas?.length) {
    return 0;
  }

  const row = subclass.tablas[0]?.filas.find(
    (entry) => entry[0]?.trim() === String(level),
  );
  if (!row) {
    return 0;
  }

  for (let index = row.length - 1; index >= 3; index -= 1) {
    if ((parseInt(row[index]) || 0) > 0) {
      return index - 2;
    }
  }

  return 0;
}

interface UseLevelUpModalStateProps {
  token: string;
  character: DndCharacterDetailResponse;
  classCompetencies: string[];
  isOpen: boolean;
  mode: "up" | "down";
  onClose: () => void;
  onSubmit: (payload: LevelUpDndCharacterRequest) => Promise<void>;
  onLevelDown: (classId: string) => Promise<void>;
}

export const ATTRIBUTE_OPTIONS = FEAT_ATTRIBUTE_OPTIONS;
export type LevelUpModalController = ReturnType<typeof useLevelUpModalState>;

export function useLevelUpModalState({
  token,
  character,
  classCompetencies,
  isOpen,
  mode,
  onClose,
  onSubmit,
  onLevelDown,
}: UseLevelUpModalStateProps) {
  const [selectedSpell, setSelectedSpell] =
    useState<CharacterAbilityResponse | null>(null);
  const [classSummaries, setClassSummaries] = useState<DndClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassDetail, setSelectedClassDetail] =
    useState<DndClassDetail | null>(null);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string | null>(
    null,
  );
  const [classChoices, setClassChoices] = useState<Record<string, string[]>>(
    {},
  );
  const [classSkillGroups, setClassSkillGroups] = useState<ClassSkillGroup[]>(
    [],
  );
  const [subclassSkillGroups, setSubclassSkillGroups] = useState<
    ClassSkillGroup[]
  >([]);
  const [expertiseChoices, setExpertiseChoices] = useState<string[]>([]);
  const [asiMode, setAsiMode] = useState<"double" | "single" | "feat">(
    "double",
  );
  const [asiPrimary, setAsiPrimary] = useState<string>("Fuerza");
  const [asiSecondary, setAsiSecondary] = useState<string>("Destreza");
  const [selectedFeatId, setSelectedFeatId] = useState<string | null>(null);
  const [selectedFeatDetail, setSelectedFeatDetail] = useState<
    (typeof FEAT_OPTIONS)[number] | null
  >(null);
  const [selectedFeatStats, setSelectedFeatStats] = useState<string[]>([]);
  const [selectedFeatCompetencies, setSelectedFeatCompetencies] = useState<
    string[]
  >([]);
  const [selectedFeatSkills, setSelectedFeatSkills] = useState<string[]>([]);
  const [selectedFeatLanguages, setSelectedFeatLanguages] = useState<string[]>(
    [],
  );
  const [selectedFeatSpellClass, setSelectedFeatSpellClass] =
    useState<string>("");
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
  const [missingChoiceErrors, setMissingChoiceErrors] = useState<
    Record<string, string>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const classSectionRef = useRef<HTMLElement | null>(null);
  const classChoicesSectionRef = useRef<HTMLElement | null>(null);
  const subclassSectionRef = useRef<HTMLElement | null>(null);
  const asiSectionRef = useRef<HTMLElement | null>(null);

  const selectedClassLevel = selectedClassDetail
    ? getClassLevel(character.clases, selectedClassDetail.nombre)
    : 0;
  const totalCharacterLevel = character.clases.reduce(
    (sum, item) => sum + item.nivel,
    0,
  );
  const targetLevel = selectedClassLevel + 1;
  const targetLevelAfterDown = Math.max(0, selectedClassLevel - 1);
  const currentSubclass = useMemo(() => {
    const inferredSubclass = inferCurrentSubclass(
      character,
      selectedClassDetail,
    );
    if (
      inferredSubclass &&
      selectedClassLevel < inferredSubclass.nivelDesbloqueo
    ) {
      return null;
    }

    return inferredSubclass;
  }, [character, selectedClassDetail, selectedClassLevel]);
  const effectiveSubclass: DndSubclassDetail | null =
    selectedClassDetail?.subclases.find(
      (item) => item.id === selectedSubclassId,
    ) ?? currentSubclass;
  const featOptions = useMemo(
    () =>
      FEAT_OPTIONS.map((feat) => ({
        feat,
        valid: getFeatValidity(feat, character, classCompetencies),
      })),
    [character, classCompetencies],
  );
  const selectedFeat =
    featOptions.find((entry) => entry.feat.id === selectedFeatId)?.feat ?? null;
  const requiresAsi = selectedClassDetail
    ? isAsiLevel(selectedClassDetail.id, targetLevel)
    : false;
  const needsSubclass = selectedClassDetail
    ? requiresSubclass(selectedClassDetail, targetLevel) && !currentSubclass
    : false;
  const classIsNew = selectedClassLevel === 0;
  const isDownMode = mode === "down";
  const visibleInitialClassChoices = useMemo(() => {
    if (!selectedClassDetail) {
      return [];
    }

    return classIsNew
      ? selectedClassDetail.elecciones.filter(
          (choice) => !isInitialClassSkillChoice(choice.id),
        )
      : selectedClassDetail.elecciones;
  }, [classIsNew, selectedClassDetail]);
  const expertiseChoiceConfig = useMemo(
    () =>
      getExpertiseChoiceConfig(selectedClassDetail?.id ?? null, targetLevel),
    [selectedClassDetail, targetLevel],
  );
  const availableExpertiseOptions = useMemo(() => {
    if (!expertiseChoiceConfig) {
      return [];
    }

    const proficiencyBonus = getProficiencyBonus(character);
    const currentExpertise = new Set(
      SKILL_ROWS.filter((item) => {
        const value = character.estadisticas[item.name] ?? 0;
        return proficiencyBonus > 0 && value >= proficiencyBonus * 2;
      }).map((item) => normalizeDndText(item.name)),
    );

    const availableSkills = SKILL_ROWS.filter((item) => {
      const value = character.estadisticas[item.name] ?? 0;
      return (
        value >= proficiencyBonus &&
        !currentExpertise.has(normalizeDndText(item.name))
      );
    })
      .map((item) => item.name)
      .sort((left, right) => left.localeCompare(right, "es"));

    if (!expertiseChoiceConfig.allowThievesTools) {
      return availableSkills;
    }

    const hasThievesToolsCompetency = character.habilidades.some(
      (ability) =>
        normalizeDndText(ability.nombre) ===
        normalizeDndText(`Competencia: ${THIEVES_TOOLS_NAME}`),
    );
    const hasThievesToolsExpertise = character.habilidades.some(
      (ability) =>
        normalizeDndText(ability.nombre) ===
        normalizeDndText(`Pericia: ${THIEVES_TOOLS_NAME}`),
    );

    if (!hasThievesToolsCompetency || hasThievesToolsExpertise) {
      return availableSkills;
    }

    return [...availableSkills, THIEVES_TOOLS_NAME];
  }, [character, expertiseChoiceConfig]);

  const eaSubclass = useMemo(
    () => findSubclassById(selectedClassDetail, "embaucadorarcano"),
    [selectedClassDetail],
  );
  const eldritchKnightSubclass = useMemo(
    () => findSubclassById(selectedClassDetail, "caballeroarcano"),
    [selectedClassDetail],
  );
  const isActiveEa = useMemo(
    () =>
      !!effectiveSubclass &&
      normalizeDndText(effectiveSubclass.id) === "embaucadorarcano",
    [effectiveSubclass],
  );
  const isGainingEa =
    needsSubclass &&
    normalizeDndText(selectedSubclassId ?? "") === "embaucadorarcano";
  const isActiveEk = useMemo(
    () =>
      !!effectiveSubclass &&
      normalizeDndText(effectiveSubclass.id) === "caballeroarcano",
    [effectiveSubclass],
  );
  const isGainingEk =
    needsSubclass &&
    normalizeDndText(selectedSubclassId ?? "") === "caballeroarcano";
  const isActiveBattleMaster = useMemo(
    () =>
      !!effectiveSubclass &&
      normalizeDndText(effectiveSubclass.id) === "maestrobatalla",
    [effectiveSubclass],
  );
  const isGainingBattleMaster =
    needsSubclass &&
    normalizeDndText(selectedSubclassId ?? "") === "maestrobatalla";

  const getAtTableCounts = useCallback(
    (level: number) => {
      return getSubclassTableCounts(eaSubclass, level);
    },
    [eaSubclass],
  );

  const getEkTableCounts = useCallback(
    (level: number) => getSubclassTableCounts(eldritchKnightSubclass, level),
    [eldritchKnightSubclass],
  );

  const getAtMaxSpellLevel = useCallback(
    (level: number) => {
      return getSubclassMaxSpellLevel(eaSubclass, level);
    },
    [eaSubclass],
  );

  const getEkMaxSpellLevel = useCallback(
    (level: number) => getSubclassMaxSpellLevel(eldritchKnightSubclass, level),
    [eldritchKnightSubclass],
  );

  const eaCantripCount = useMemo(() => {
    if ((!isActiveEa && !isGainingEa) || isDownMode) return 0;
    const cur = getAtTableCounts(targetLevel);
    const prev = isGainingEa
      ? { trucos: 0 }
      : getAtTableCounts(targetLevel - 1);
    return Math.max(0, cur.trucos - prev.trucos);
  }, [isActiveEa, isGainingEa, isDownMode, targetLevel, getAtTableCounts]);

  const eaSpellCount = useMemo(() => {
    if ((!isActiveEa && !isGainingEa) || isDownMode) return 0;
    const cur = getAtTableCounts(targetLevel);
    const prev = isGainingEa
      ? { conjuros: 0 }
      : getAtTableCounts(targetLevel - 1);
    return Math.max(0, cur.conjuros - prev.conjuros);
  }, [isActiveEa, isGainingEa, isDownMode, targetLevel, getAtTableCounts]);

  const ekCantripCount = useMemo(() => {
    if ((!isActiveEk && !isGainingEk) || isDownMode) return 0;
    const cur = getEkTableCounts(targetLevel);
    const prev = isGainingEk
      ? { trucos: 0 }
      : getEkTableCounts(targetLevel - 1);
    return Math.max(0, cur.trucos - prev.trucos);
  }, [isActiveEk, isGainingEk, isDownMode, targetLevel, getEkTableCounts]);

  const ekSpellCount = useMemo(() => {
    if ((!isActiveEk && !isGainingEk) || isDownMode) return 0;
    const cur = getEkTableCounts(targetLevel);
    const prev = isGainingEk
      ? { conjuros: 0 }
      : getEkTableCounts(targetLevel - 1);
    return Math.max(0, cur.conjuros - prev.conjuros);
  }, [isActiveEk, isGainingEk, isDownMode, targetLevel, getEkTableCounts]);

  const battleMasterManeuverCount = useMemo(() => {
    if ((!isActiveBattleMaster && !isGainingBattleMaster) || isDownMode) {
      return 0;
    }

    if (isGainingBattleMaster) {
      return 3;
    }

    return [7, 10, 15].includes(targetLevel) ? 2 : 0;
  }, [isActiveBattleMaster, isGainingBattleMaster, isDownMode, targetLevel]);

  const cantripUpgradeCount = useMemo(() => {
    if (
      !selectedClassDetail?.lanzamientoConjuros ||
      isDownMode ||
      targetLevel < 2
    )
      return 0;
    const niveles = selectedClassDetail.lanzamientoConjuros.niveles;
    const cur =
      niveles.find((n) => n.nivel === targetLevel)?.trucosConocidos ?? 0;
    const prev =
      niveles.find((n) => n.nivel === targetLevel - 1)?.trucosConocidos ?? 0;
    return Math.max(0, cur - prev);
  }, [selectedClassDetail, targetLevel, isDownMode]);

  const levelFeatures =
    classSkillGroups.find((group) => group.nivel === targetLevel)
      ?.habilidades ?? [];
  const subclassFeatures =
    subclassSkillGroups.find((group) => group.nivel === targetLevel)
      ?.habilidades ?? [];
  const visibleClassSummaries = classSummaries.filter(
    (classSummary) =>
      !isDownMode || getClassLevel(character.clases, classSummary.nombre) >= 1,
  );

  const closeSpellDetail = useCallback(() => {
    setSelectedSpell(null);
  }, []);

  const openSpellDetailByName = useCallback(
    async (spellToken: string | null, spellName: string) => {
      if (!spellToken) {
        return;
      }

      try {
        const spell = await fetchSpellDetailByName(spellToken, spellName);
        if (spell) {
          setSelectedSpell(spell);
        }
      } catch {
        // Este modal es auxiliar; no interrumpimos el flujo si falla su carga.
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    const abortController = new AbortController();
    void fetchDndClassSummaries(token, abortController.signal)
      .then(setClassSummaries)
      .catch(() => setClassSummaries([]));
    return () => abortController.abort();
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    setSelectedClassId(null);
    setSelectedClassDetail(null);
    setSelectedSubclassId(null);
    setClassChoices({});
    setClassSkillGroups([]);
    setSubclassSkillGroups([]);
    setExpertiseChoices([]);
    setMissingChoiceErrors({});
    setSelectedFeatDetail(null);
    setSelectedFeatStats([]);
    setSelectedFeatCompetencies([]);
    setSelectedFeatSkills([]);
    setSelectedFeatLanguages([]);
    setSelectedFeatSpellClass("");
    setSelectedFeatCantrips([]);
    setSelectedFeatSpells([]);
    setFeatCantripOptions([]);
    setFeatSpellOptions([]);
    closeSpellDetail();
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
  }, [closeSpellDetail, isOpen]);

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
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
    );
    const abortController = new AbortController();
    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: "mago" },
      abortController.signal,
    )
      .then((options) =>
        setEaCantripOptions(
          options.filter((o) => !knownNames.has(normalizeDndText(o.nombre))),
        ),
      )
      .catch(() => setEaCantripOptions([]));
    return () => abortController.abort();
  }, [
    isDownMode,
    isGainingEa,
    isActiveEa,
    eaCantripCount,
    character.habilidades,
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
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
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
    isDownMode,
    isGainingEa,
    isActiveEa,
    eaSpellCount,
    character.habilidades,
    token,
    targetLevel,
    getAtMaxSpellLevel,
  ]);

  useEffect(() => {
    if (isDownMode || (!isGainingEk && !isActiveEk) || ekCantripCount <= 0) {
      setEkCantripOptions([]);
      return;
    }
    const knownNames = new Set(
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
    );
    const abortController = new AbortController();
    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: "mago" },
      abortController.signal,
    )
      .then((options) =>
        setEkCantripOptions(
          options.filter((o) => !knownNames.has(normalizeDndText(o.nombre))),
        ),
      )
      .catch(() => setEkCantripOptions([]));
    return () => abortController.abort();
  }, [
    isDownMode,
    isGainingEk,
    isActiveEk,
    ekCantripCount,
    character.habilidades,
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
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
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
    isDownMode,
    isGainingEk,
    isActiveEk,
    ekSpellCount,
    character.habilidades,
    token,
    targetLevel,
    getEkMaxSpellLevel,
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
      character.habilidades.map((ability) => normalizeDndText(ability.nombre)),
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
    isDownMode,
    isGainingBattleMaster,
    isActiveBattleMaster,
    battleMasterManeuverCount,
    character.habilidades,
    token,
  ]);

  useEffect(() => {
    if (isDownMode || cantripUpgradeCount <= 0 || !selectedClassDetail) {
      setCantripUpgradeOptions([]);
      return;
    }
    const knownNames = new Set(
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
    );
    const abortController = new AbortController();
    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: selectedClassDetail.id },
      abortController.signal,
    )
      .then((options) =>
        setCantripUpgradeOptions(
          options.filter((o) => !knownNames.has(normalizeDndText(o.nombre))),
        ),
      )
      .catch(() => setCantripUpgradeOptions([]));
    return () => abortController.abort();
  }, [
    isDownMode,
    cantripUpgradeCount,
    selectedClassDetail,
    character.habilidades,
    token,
  ]);

  useEffect(() => {
    if (!expertiseChoiceConfig) {
      setExpertiseChoices([]);
      return;
    }

    setExpertiseChoices((current) =>
      Array.from({ length: expertiseChoiceConfig.count }, (_, index) => {
        const currentValue = current[index] ?? "";
        return availableExpertiseOptions.some(
          (option) =>
            normalizeDndText(option) === normalizeDndText(currentValue),
        )
          ? currentValue
          : "";
      }),
    );
  }, [availableExpertiseOptions, expertiseChoiceConfig]);

  useEffect(() => {
    if (!selectedClassId || !isOpen) return;
    setClassChoices({});
    setSubclassSkillGroups([]);
    setMissingChoiceErrors({});

    const abortController = new AbortController();
    void Promise.all([
      fetchDndClassDetail(token, selectedClassId, abortController.signal),
      fetchClassSkills(token, selectedClassId, abortController.signal),
    ])
      .then(([detail, skills]) => {
        setSelectedClassDetail(detail);
        setClassSkillGroups(skills);
        const inferredSubclass = inferCurrentSubclass(character, detail);
        setSelectedSubclassId(
          inferredSubclass &&
            selectedClassLevel < inferredSubclass.nivelDesbloqueo
            ? null
            : (inferredSubclass?.id ?? null),
        );
      })
      .catch(() => {
        setSelectedClassDetail(null);
        setClassSkillGroups([]);
      });
    return () => abortController.abort();
  }, [character, isOpen, selectedClassId, selectedClassLevel, token]);

  useEffect(() => {
    if (!selectedClassDetail || !effectiveSubclass) {
      setSubclassSkillGroups([]);
      return;
    }

    const selectedExpertiseCount = expertiseChoices.filter(
      (value) => value.trim().length > 0,
    ).length;
    if (
      expertiseChoiceConfig &&
      selectedExpertiseCount < expertiseChoiceConfig.count
    ) {
      setMissingChoiceErrors((current) => ({
        ...current,
        [EXPERTISE_CHOICE_SECTION_ID]: `Faltan ${expertiseChoiceConfig.count - selectedExpertiseCount} selección(es).`,
      }));
      setSubmitError("Completa las selecciones de pericia.");
      const expertiseElement = document.getElementById(
        `levelup-choice-${EXPERTISE_CHOICE_SECTION_ID}`,
      );
      scrollToTarget(expertiseElement ?? classChoicesSectionRef.current);
      return;
    }
    const abortController = new AbortController();
    void fetchClassSubclassSkills(
      token,
      selectedClassDetail.id,
      effectiveSubclass.id,
      abortController.signal,
    )
      .then(setSubclassSkillGroups)
      .catch(() => setSubclassSkillGroups([]));
    return () => abortController.abort();
  }, [effectiveSubclass, selectedClassDetail, token]);

  const scrollToTarget = (element: HTMLElement | null) => {
    if (!element) return;
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async () => {
    if (isDownMode) {
      if (!selectedClassDetail || selectedClassLevel < 1) {
        setSubmitError("Debes elegir una clase válida para bajar de nivel.");
        scrollToTarget(classSectionRef.current);
        return;
      }
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        await onLevelDown(selectedClassDetail.id);
        onClose();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "No se pudo bajar de nivel.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedClassDetail) {
      setSubmitError("Debes elegir la clase que va a subir de nivel.");
      scrollToTarget(classSectionRef.current);
      return;
    }

    if (classIsNew) {
      const nextMissingErrors = Object.fromEntries(
        visibleInitialClassChoices
          .filter(
            (choice) =>
              (classChoices[choice.id] ?? []).length < choice.cantidad,
          )
          .map((choice) => [
            choice.id,
            `Faltan ${choice.cantidad - (classChoices[choice.id] ?? []).length} selección(es).`,
          ]),
      );
      setMissingChoiceErrors(nextMissingErrors);
      if (Object.keys(nextMissingErrors).length > 0) {
        setSubmitError("Completa las elecciones obligatorias de la clase.");
        const firstMissingChoiceId = Object.keys(nextMissingErrors)[0];
        const choiceElement = firstMissingChoiceId
          ? document.getElementById(`levelup-choice-${firstMissingChoiceId}`)
          : null;
        scrollToTarget(choiceElement ?? classChoicesSectionRef.current);
        return;
      }
    }

    if (needsSubclass && !selectedSubclassId) {
      setSubmitError("Debes elegir una subclase para continuar.");
      scrollToTarget(subclassSectionRef.current);
      return;
    }

    if (requiresAsi && asiMode === "feat" && !selectedFeat) {
      setSubmitError("Debes seleccionar una dote.");
      scrollToTarget(asiSectionRef.current);
      return;
    }

    const missingFeatSelection =
      (selectedFeat?.selectableBonus &&
        selectedFeatStats.length < selectedFeat.selectableBonus.count) ||
      (selectedFeat?.selectableCompetencies &&
        selectedFeatCompetencies.filter((value) => value.trim().length > 0)
          .length < selectedFeat.selectableCompetencies.count) ||
      (selectedFeat?.selectableSkills &&
        selectedFeatSkills.filter((value) => value.trim().length > 0).length <
          selectedFeat.selectableSkills.count) ||
      (selectedFeat?.selectableLanguages &&
        selectedFeatLanguages.filter((value) => value.trim().length > 0)
          .length < selectedFeat.selectableLanguages.count);

    if (requiresAsi && missingFeatSelection) {
      setSubmitError("Completa todas las selecciones obligatorias de la dote.");
      scrollToTarget(asiSectionRef.current);
      return;
    }

    if (requiresAsi && selectedFeat?.spellSelection) {
      if (selectedFeat.spellSelection.chooseClass && !selectedFeatSpellClass) {
        setSubmitError("Debes elegir una clase para la dote.");
        scrollToTarget(asiSectionRef.current);
        return;
      }
      if (
        selectedFeatCantrips.filter((value) => value.trim().length > 0).length <
          selectedFeat.spellSelection.cantrips ||
        selectedFeatSpells.filter((value) => value.trim().length > 0).length <
          selectedFeat.spellSelection.spells
      ) {
        setSubmitError("Completa los conjuros de la dote.");
        scrollToTarget(asiSectionRef.current);
        return;
      }
    }

    const payload: LevelUpDndCharacterRequest = {
      claseId: selectedClassDetail.id,
      subclaseId: selectedSubclassId,
      eleccionesClase: classIsNew
        ? Object.fromEntries(
            Object.entries(classChoices).filter(([choiceId]) =>
              visibleInitialClassChoices.some(
                (choice) => choice.id === choiceId,
              ),
            ),
          )
        : undefined,
    };

    if (
      cantripUpgradeCount > 0 &&
      cantripUpgradeChosen.length < cantripUpgradeCount
    ) {
      setSubmitError(`Debes elegir ${cantripUpgradeCount} truco(s) nuevo(s).`);
      return;
    }
    if (
      (isGainingEa || isActiveEa) &&
      eaCantripCount > 0 &&
      eaChosenCantrips.length < eaCantripCount
    ) {
      setSubmitError(
        `Debes elegir ${eaCantripCount} truco(s) del Embaucador Arcano.`,
      );
      return;
    }
    if (
      (isGainingEa || isActiveEa) &&
      eaSpellCount > 0 &&
      eaChosenSpells.length < eaSpellCount
    ) {
      setSubmitError(
        `Debes elegir ${eaSpellCount} conjuro(s) del Embaucador Arcano.`,
      );
      return;
    }
    if (
      (isGainingEk || isActiveEk) &&
      ekCantripCount > 0 &&
      ekChosenCantrips.length < ekCantripCount
    ) {
      setSubmitError(
        `Debes elegir ${ekCantripCount} truco(s) del Caballero Arcano.`,
      );
      return;
    }
    if (
      (isGainingEk || isActiveEk) &&
      ekSpellCount > 0 &&
      ekChosenSpells.length < ekSpellCount
    ) {
      setSubmitError(
        `Debes elegir ${ekSpellCount} conjuro(s) del Caballero Arcano.`,
      );
      return;
    }
    if (
      (isGainingBattleMaster || isActiveBattleMaster) &&
      battleMasterManeuverCount > 0 &&
      battleMasterManeuvers.length < battleMasterManeuverCount
    ) {
      setSubmitError(
        `Debes elegir ${battleMasterManeuverCount} maniobra(s) del Maestro de Batalla.`,
      );
      return;
    }

    const extraElecciones: Record<string, string[]> = {};
    if (expertiseChoices.some((value) => value.trim().length > 0)) {
      const { skillChoices, toolChoices } =
        splitExpertiseChoices(expertiseChoices);
      if (skillChoices.length > 0) {
        extraElecciones[SKILL_EXPERTISE_CHOICE_ID] = skillChoices;
      }
      if (toolChoices.length > 0) {
        extraElecciones[TOOL_EXPERTISE_CHOICE_ID] = toolChoices;
      }
    }
    if (cantripUpgradeChosen.length > 0)
      extraElecciones["class-cantrip-upgrade"] = cantripUpgradeChosen;
    if (eaChosenCantrips.length > 0)
      extraElecciones["ea-cantrip"] = eaChosenCantrips;
    if (eaChosenSpells.length > 0) extraElecciones["ea-spell"] = eaChosenSpells;
    if (ekChosenCantrips.length > 0)
      extraElecciones["ek-cantrip"] = ekChosenCantrips;
    if (ekChosenSpells.length > 0) extraElecciones["ek-spell"] = ekChosenSpells;
    if (battleMasterManeuvers.length > 0)
      extraElecciones["bm-maneuver"] = battleMasterManeuvers;
    if (Object.keys(extraElecciones).length > 0) {
      payload.eleccionesClase = {
        ...(payload.eleccionesClase ?? {}),
        ...extraElecciones,
      };
    }

    if (requiresAsi) {
      if (asiMode === "feat" && selectedFeat) {
        payload.modoMejoraCaracteristica = "dote";
        payload.dote = {
          nombre: selectedFeat.nombre,
          descripcion: selectedFeat.descripcion,
          formula: selectedFeat.formula ?? null,
          bonificacionesCaracteristica: buildFeatStatBonuses(
            selectedFeat,
            selectedFeatStats,
          ),
          competencias: selectedFeatCompetencies.filter(
            (value) => value.trim().length > 0,
          ),
          habilidades: selectedFeatSkills.filter(
            (value) => value.trim().length > 0,
          ),
          idiomas: selectedFeatLanguages.filter(
            (value) => value.trim().length > 0,
          ),
          conjuros: [...selectedFeatCantrips, ...selectedFeatSpells].filter(
            (value) => value.trim().length > 0,
          ),
          claseConjuros: selectedFeatSpellClass || null,
        };
      } else if (asiMode === "single") {
        payload.modoMejoraCaracteristica = "single";
        payload.caracteristicaPrimaria = asiPrimary;
      } else {
        payload.modoMejoraCaracteristica = "double";
        payload.caracteristicaPrimaria = asiPrimary;
        payload.caracteristicaSecundaria = asiSecondary;
      }
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo subir de nivel.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ATTRIBUTE_OPTIONS,
    asiMode,
    asiPrimary,
    asiSecondary,
    asiSectionRef,
    classChoices,
    classChoicesSectionRef,
    classIsNew,
    classSectionRef,
    classSummaries,
    classWarnings,
    currentSubclass,
    effectiveSubclass,
    featCantripOptions,
    featOptions,
    featSpellOptions,
    handleSubmit,
    expertiseChoiceConfig,
    expertiseChoices,
    availableExpertiseOptions,
    isDownMode,
    isSubmitting,
    levelFeatures,
    missingChoiceErrors,
    needsSubclass,
    requiresAsi,
    selectedClassDetail,
    selectedClassId,
    selectedClassLevel,
    selectedFeat,
    selectedFeatCantrips,
    selectedFeatCompetencies,
    selectedFeatDetail,
    selectedFeatId,
    selectedFeatLanguages,
    selectedFeatSkills,
    selectedFeatSpellClass,
    selectedFeatSpells,
    selectedFeatStats,
    selectedSubclassId,
    setAsiMode,
    setAsiPrimary,
    setAsiSecondary,
    setClassChoices,
    setExpertiseChoices,
    setSelectedClassId,
    setSelectedFeatCantrips,
    setSelectedFeatCompetencies,
    setSelectedFeatDetail,
    setSelectedFeatId,
    setSelectedFeatLanguages,
    setSelectedFeatSkills,
    setSelectedFeatSpellClass,
    setSelectedFeatSpells,
    setSelectedFeatStats,
    setSelectedSubclassId,
    closeSpellDetail,
    openSpellDetailByName,
    selectedSpell,
    subclassFeatures,
    subclassSectionRef,
    submitError,
    targetLevel,
    targetLevelAfterDown,
    totalCharacterLevel,
    visibleInitialClassChoices,
    visibleClassSummaries,
    eaChosenCantrips,
    eaChosenSpells,
    eaCantripOptions,
    eaSpellOptions,
    eaCantripCount,
    eaSpellCount,
    ekChosenCantrips,
    ekChosenSpells,
    ekCantripOptions,
    ekSpellOptions,
    ekCantripCount,
    ekSpellCount,
    isGainingEa,
    isActiveEa,
    isGainingEk,
    isActiveEk,
    battleMasterManeuvers,
    battleMasterManeuverOptions,
    battleMasterManeuverCount,
    isGainingBattleMaster,
    isActiveBattleMaster,
    cantripUpgradeChosen,
    cantripUpgradeOptions,
    cantripUpgradeCount,
    setCantripUpgradeChosen,
    setEaChosenCantrips,
    setEaChosenSpells,
    setEkChosenCantrips,
    setEkChosenSpells,
    setBattleMasterManeuvers,
  };
}
