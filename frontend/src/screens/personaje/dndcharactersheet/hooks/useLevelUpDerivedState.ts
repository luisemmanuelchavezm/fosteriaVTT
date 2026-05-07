import { useCallback, useMemo } from "react";
import type { ClassSkillGroup } from "../../utils/dndApi";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import type {
  DndClassDetail,
  DndClassSummary,
  DndSubclassDetail,
} from "../../types";
import {
  inferCurrentSubclass,
  isAsiLevel,
  normalizeDndText,
  requiresSubclass,
} from "../../utils/dndProgressionRules";
import { FEAT_OPTIONS } from "../feats/catalog";
import { getFeatValidity } from "../feats/helpers";
import {
  getExpertiseChoiceConfig,
  THIEVES_TOOLS_NAME,
} from "../../utils/dndExpertise";
import { SKILL_ROWS } from "../data";
import { getClassLevel, getProficiencyBonus } from "../utils/characterCore";

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

interface UseLevelUpDerivedStateOptions {
  character: DndCharacterDetailResponse;
  classCompetencies: string[];
  classSkillGroups: ClassSkillGroup[];
  classSummaries: DndClassSummary[];
  isDownMode: boolean;
  selectedClassDetail: DndClassDetail | null;
  selectedClassLevel: number;
  selectedFeatId: string | null;
  selectedSubclassId: string | null;
  subclassSkillGroups: ClassSkillGroup[];
}

export function useLevelUpDerivedState({
  character,
  classCompetencies,
  classSkillGroups,
  classSummaries,
  isDownMode,
  selectedClassDetail,
  selectedClassLevel,
  selectedFeatId,
  selectedSubclassId,
  subclassSkillGroups,
}: UseLevelUpDerivedStateOptions) {
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
    (level: number) => getSubclassTableCounts(eaSubclass, level),
    [eaSubclass],
  );

  const getEkTableCounts = useCallback(
    (level: number) => getSubclassTableCounts(eldritchKnightSubclass, level),
    [eldritchKnightSubclass],
  );

  const getAtMaxSpellLevel = useCallback(
    (level: number) => getSubclassMaxSpellLevel(eaSubclass, level),
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
  }, [getAtTableCounts, isActiveEa, isDownMode, isGainingEa, targetLevel]);

  const eaSpellCount = useMemo(() => {
    if ((!isActiveEa && !isGainingEa) || isDownMode) return 0;
    const cur = getAtTableCounts(targetLevel);
    const prev = isGainingEa
      ? { conjuros: 0 }
      : getAtTableCounts(targetLevel - 1);
    return Math.max(0, cur.conjuros - prev.conjuros);
  }, [getAtTableCounts, isActiveEa, isDownMode, isGainingEa, targetLevel]);

  const ekCantripCount = useMemo(() => {
    if ((!isActiveEk && !isGainingEk) || isDownMode) return 0;
    const cur = getEkTableCounts(targetLevel);
    const prev = isGainingEk
      ? { trucos: 0 }
      : getEkTableCounts(targetLevel - 1);
    return Math.max(0, cur.trucos - prev.trucos);
  }, [getEkTableCounts, isActiveEk, isDownMode, isGainingEk, targetLevel]);

  const ekSpellCount = useMemo(() => {
    if ((!isActiveEk && !isGainingEk) || isDownMode) return 0;
    const cur = getEkTableCounts(targetLevel);
    const prev = isGainingEk
      ? { conjuros: 0 }
      : getEkTableCounts(targetLevel - 1);
    return Math.max(0, cur.conjuros - prev.conjuros);
  }, [getEkTableCounts, isActiveEk, isDownMode, isGainingEk, targetLevel]);

  const battleMasterManeuverCount = useMemo(() => {
    if ((!isActiveBattleMaster && !isGainingBattleMaster) || isDownMode) {
      return 0;
    }

    if (isGainingBattleMaster) {
      return 3;
    }

    return [7, 10, 15].includes(targetLevel) ? 2 : 0;
  }, [isActiveBattleMaster, isDownMode, isGainingBattleMaster, targetLevel]);

  const cantripUpgradeCount = useMemo(() => {
    if (
      !selectedClassDetail?.lanzamientoConjuros ||
      isDownMode ||
      targetLevel < 2
    ) {
      return 0;
    }

    const niveles = selectedClassDetail.lanzamientoConjuros.niveles;
    const cur =
      niveles.find((n) => n.nivel === targetLevel)?.trucosConocidos ?? 0;
    const prev =
      niveles.find((n) => n.nivel === targetLevel - 1)?.trucosConocidos ?? 0;
    return Math.max(0, cur - prev);
  }, [isDownMode, selectedClassDetail, targetLevel]);

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

  return {
    availableExpertiseOptions,
    battleMasterManeuverCount,
    cantripUpgradeCount,
    classIsNew,
    currentSubclass,
    eaCantripCount,
    eaSpellCount,
    effectiveSubclass,
    ekCantripCount,
    ekSpellCount,
    expertiseChoiceConfig,
    featOptions,
    getAtMaxSpellLevel,
    getEkMaxSpellLevel,
    isActiveBattleMaster,
    isActiveEa,
    isActiveEk,
    isGainingBattleMaster,
    isGainingEa,
    isGainingEk,
    levelFeatures,
    needsSubclass,
    requiresAsi,
    selectedFeat,
    subclassFeatures,
    targetLevel,
    targetLevelAfterDown,
    totalCharacterLevel,
    visibleClassSummaries,
    visibleInitialClassChoices,
  };
}
