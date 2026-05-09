import { useRef, useState } from "react";
import type {
  DndCharacterDetailResponse,
  LevelUpDndCharacterRequest,
} from "../../utils/dndApi";
import { type ClassSkillGroup } from "../../utils/dndApi";
import type { DndClassSummary, DndClassDetail } from "../../types";
import {
  classWarnings,
  normalizeDndText,
} from "../../utils/dndProgressionRules";
import { FEAT_ATTRIBUTE_OPTIONS } from "../feats/constants";
import { FEAT_OPTIONS } from "../feats/catalog";
import { useLevelUpDerivedState } from "./useLevelUpDerivedState";
import { focusLevelUpValidationTarget } from "./levelUpFocus";
import { buildLevelUpPayload } from "./levelUpSubmission";
import { validateLevelUpSubmission } from "./levelUpValidation";
import { useLevelUpModalSupport } from "./useLevelUpModalSupport";
import { useLevelUpSpellSelectionState } from "./useLevelUpSpellSelectionState";

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
  const [missingChoiceErrors, setMissingChoiceErrors] = useState<
    Record<string, string>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const classSectionRef = useRef<HTMLElement | null>(null);
  const classChoicesSectionRef = useRef<HTMLElement | null>(null);
  const subclassSectionRef = useRef<HTMLElement | null>(null);
  const asiSectionRef = useRef<HTMLElement | null>(null);

  const isDownMode = mode === "down";
  const selectedClassLevel = selectedClassDetail
    ? character.clases
        .filter(
          (item) =>
            normalizeDndText(item.nombre) ===
            normalizeDndText(selectedClassDetail.nombre),
        )
        .reduce((sum, item) => sum + item.nivel, 0)
    : 0;
  const derivedState = useLevelUpDerivedState({
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
  });

  const {
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
  } = useLevelUpSpellSelectionState({
    token,
    isOpen,
    isDownMode,
    asiMode,
    characterAbilities: character.habilidades,
    selectedFeat: derivedState.selectedFeat,
    selectedFeatSpellClass,
    selectedClassDetail,
    targetLevel: derivedState.targetLevel,
    cantripUpgradeCount: derivedState.cantripUpgradeCount,
    eaCantripCount: derivedState.eaCantripCount,
    eaSpellCount: derivedState.eaSpellCount,
    ekCantripCount: derivedState.ekCantripCount,
    ekSpellCount: derivedState.ekSpellCount,
    battleMasterManeuverCount: derivedState.battleMasterManeuverCount,
    isGainingEa: derivedState.isGainingEa,
    isActiveEa: derivedState.isActiveEa,
    isGainingEk: derivedState.isGainingEk,
    isActiveEk: derivedState.isActiveEk,
    isGainingBattleMaster: derivedState.isGainingBattleMaster,
    isActiveBattleMaster: derivedState.isActiveBattleMaster,
    getAtMaxSpellLevel: derivedState.getAtMaxSpellLevel,
    getEkMaxSpellLevel: derivedState.getEkMaxSpellLevel,
  });
  const levelUpSupport = useLevelUpModalSupport({
    availableExpertiseOptions: derivedState.availableExpertiseOptions,
    character,
    classChoicesSectionRef,
    effectiveSubclass: derivedState.effectiveSubclass,
    expertiseChoiceConfig: derivedState.expertiseChoiceConfig,
    expertiseChoices,
    isOpen,
    selectedClassDetail,
    selectedClassId,
    selectedClassLevel,
    setClassChoices,
    setClassSkillGroups,
    setClassSummaries,
    setExpertiseChoices,
    setMissingChoiceErrors,
    setSelectedClassDetail,
    setSelectedClassId,
    setSelectedFeatCompetencies,
    setSelectedFeatDetail,
    setSelectedFeatLanguages,
    setSelectedFeatSkills,
    setSelectedFeatSpellClass,
    setSelectedFeatStats,
    setSelectedSubclassId,
    setSubmitError,
    setSubclassSkillGroups,
    token,
  });

  const handleSubmit = async () => {
    const validation = validateLevelUpSubmission({
      asiMode,
      battleMasterManeuverCount: derivedState.battleMasterManeuverCount,
      battleMasterManeuvers,
      cantripUpgradeChosen,
      cantripUpgradeCount: derivedState.cantripUpgradeCount,
      classChoices,
      classIsNew: derivedState.classIsNew,
      eaCantripCount: derivedState.eaCantripCount,
      eaChosenCantrips,
      eaChosenSpells,
      eaSpellCount: derivedState.eaSpellCount,
      ekCantripCount: derivedState.ekCantripCount,
      ekChosenCantrips,
      ekChosenSpells,
      ekSpellCount: derivedState.ekSpellCount,
      isActiveBattleMaster: derivedState.isActiveBattleMaster,
      isActiveEa: derivedState.isActiveEa,
      isActiveEk: derivedState.isActiveEk,
      isDownMode,
      isGainingBattleMaster: derivedState.isGainingBattleMaster,
      isGainingEa: derivedState.isGainingEa,
      isGainingEk: derivedState.isGainingEk,
      needsSubclass: derivedState.needsSubclass,
      requiresAsi: derivedState.requiresAsi,
      selectedClassDetailId: selectedClassDetail?.id ?? null,
      selectedClassLevel,
      selectedFeat: derivedState.selectedFeat,
      selectedFeatCantrips,
      selectedFeatCompetencies,
      selectedFeatLanguages,
      selectedFeatSkills,
      selectedFeatSpellClass,
      selectedFeatSpells,
      selectedFeatStats,
      selectedSubclassId,
      visibleInitialClassChoices: derivedState.visibleInitialClassChoices,
    });

    if (validation.missingChoiceErrors) {
      setMissingChoiceErrors(validation.missingChoiceErrors);
    }

    if (validation.error) {
      setSubmitError(validation.error);
      focusLevelUpValidationTarget({
        validation,
        asiSectionRef,
        classChoicesSectionRef,
        classSectionRef,
        subclassSectionRef,
      });

      return;
    }

    if (isDownMode) {
      if (!selectedClassDetail) {
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
      return;
    }

    const payload: LevelUpDndCharacterRequest = buildLevelUpPayload({
      selectedClassId: selectedClassDetail.id,
      selectedSubclassId,
      classIsNew: derivedState.classIsNew,
      classChoices,
      visibleInitialClassChoiceIds: derivedState.visibleInitialClassChoices.map(
        (choice) => choice.id,
      ),
      expertiseChoices,
      cantripUpgradeChosen,
      eaChosenCantrips,
      eaChosenSpells,
      ekChosenCantrips,
      ekChosenSpells,
      battleMasterManeuvers,
      requiresAsi: derivedState.requiresAsi,
      asiMode,
      asiPrimary,
      asiSecondary,
      selectedFeat: derivedState.selectedFeat,
      selectedFeatStats,
      selectedFeatCompetencies,
      selectedFeatSkills,
      selectedFeatLanguages,
      selectedFeatCantrips,
      selectedFeatSpells,
      selectedFeatSpellClass,
    });

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
    classIsNew: derivedState.classIsNew,
    classSectionRef,
    classSummaries,
    classWarnings,
    currentSubclass: derivedState.currentSubclass,
    effectiveSubclass: derivedState.effectiveSubclass,
    featCantripOptions,
    featOptions: derivedState.featOptions,
    featSpellOptions,
    handleSubmit,
    expertiseChoiceConfig: derivedState.expertiseChoiceConfig,
    expertiseChoices,
    availableExpertiseOptions: derivedState.availableExpertiseOptions,
    isDownMode,
    isSubmitting,
    levelFeatures: derivedState.levelFeatures,
    missingChoiceErrors,
    needsSubclass: derivedState.needsSubclass,
    requiresAsi: derivedState.requiresAsi,
    selectedClassDetail,
    selectedClassId,
    selectedClassLevel,
    selectedFeat: derivedState.selectedFeat,
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
    closeSpellDetail: levelUpSupport.closeSpellDetail,
    openSpellDetailByName: levelUpSupport.openSpellDetailByName,
    selectedSpell: levelUpSupport.selectedSpell,
    subclassFeatures: derivedState.subclassFeatures,
    subclassSectionRef,
    submitError,
    targetLevel: derivedState.targetLevel,
    targetLevelAfterDown: derivedState.targetLevelAfterDown,
    totalCharacterLevel: derivedState.totalCharacterLevel,
    visibleInitialClassChoices: derivedState.visibleInitialClassChoices,
    visibleClassSummaries: derivedState.visibleClassSummaries,
    eaChosenCantrips,
    eaChosenSpells,
    eaCantripOptions,
    eaSpellOptions,
    eaCantripCount: derivedState.eaCantripCount,
    eaSpellCount: derivedState.eaSpellCount,
    ekChosenCantrips,
    ekChosenSpells,
    ekCantripOptions,
    ekSpellOptions,
    ekCantripCount: derivedState.ekCantripCount,
    ekSpellCount: derivedState.ekSpellCount,
    isGainingEa: derivedState.isGainingEa,
    isActiveEa: derivedState.isActiveEa,
    isGainingEk: derivedState.isGainingEk,
    isActiveEk: derivedState.isActiveEk,
    battleMasterManeuvers,
    battleMasterManeuverOptions,
    battleMasterManeuverCount: derivedState.battleMasterManeuverCount,
    isGainingBattleMaster: derivedState.isGainingBattleMaster,
    isActiveBattleMaster: derivedState.isActiveBattleMaster,
    cantripUpgradeChosen,
    cantripUpgradeOptions,
    cantripUpgradeCount: derivedState.cantripUpgradeCount,
    setCantripUpgradeChosen,
    setEaChosenCantrips,
    setEaChosenSpells,
    setEkChosenCantrips,
    setEkChosenSpells,
    setBattleMasterManeuvers,
  };
}
