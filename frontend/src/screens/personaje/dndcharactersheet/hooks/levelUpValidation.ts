import { EXPERTISE_CHOICE_SECTION_ID } from "../../utils/dndExpertise";

interface LevelUpChoiceSummary {
  id: string;
  cantidad: number;
}

interface SelectedFeatValidation {
  selectableBonus?: { count: number };
  selectableCompetencies?: { count: number };
  selectableSkills?: { count: number };
  selectableLanguages?: { count: number };
  spellSelection?: {
    chooseClass?: boolean;
    cantrips: number;
    spells: number;
  };
}

interface ValidateLevelUpSubmissionArgs {
  battleMasterManeuverCount: number;
  battleMasterManeuvers: string[];
  cantripUpgradeChosen: string[];
  cantripUpgradeCount: number;
  classChoices: Record<string, string[]>;
  classIsNew: boolean;
  eaCantripCount: number;
  eaChosenCantrips: string[];
  eaChosenSpells: string[];
  eaSpellCount: number;
  ekCantripCount: number;
  ekChosenCantrips: string[];
  ekChosenSpells: string[];
  ekSpellCount: number;
  isActiveBattleMaster: boolean;
  isActiveEa: boolean;
  isActiveEk: boolean;
  isDownMode: boolean;
  isGainingBattleMaster: boolean;
  isGainingEa: boolean;
  isGainingEk: boolean;
  needsSubclass: boolean;
  requiresAsi: boolean;
  selectedClassDetailId: string | null;
  selectedClassLevel: number;
  selectedFeat: SelectedFeatValidation | null;
  selectedFeatCantrips: string[];
  selectedFeatCompetencies: string[];
  selectedFeatLanguages: string[];
  selectedFeatSkills: string[];
  selectedFeatSpellClass: string;
  selectedFeatSpells: string[];
  selectedFeatStats: string[];
  selectedSubclassId: string | null;
  visibleInitialClassChoices: LevelUpChoiceSummary[];
  asiMode: "double" | "single" | "feat";
}

export interface LevelUpValidationResult {
  error: string | null;
  focusTarget: "asi" | "class" | "class-choice" | "none" | "subclass";
  missingChoiceErrors?: Record<string, string>;
}

export function validateLevelUpSubmission({
  battleMasterManeuverCount,
  battleMasterManeuvers,
  cantripUpgradeChosen,
  cantripUpgradeCount,
  classChoices,
  classIsNew,
  eaCantripCount,
  eaChosenCantrips,
  eaChosenSpells,
  eaSpellCount,
  ekCantripCount,
  ekChosenCantrips,
  ekChosenSpells,
  ekSpellCount,
  isActiveBattleMaster,
  isActiveEa,
  isActiveEk,
  isDownMode,
  isGainingBattleMaster,
  isGainingEa,
  isGainingEk,
  needsSubclass,
  requiresAsi,
  selectedClassDetailId,
  selectedClassLevel,
  selectedFeat,
  selectedFeatCantrips,
  selectedFeatCompetencies,
  selectedFeatLanguages,
  selectedFeatSkills,
  selectedFeatSpellClass,
  selectedFeatSpells,
  selectedFeatStats,
  selectedSubclassId,
  visibleInitialClassChoices,
  asiMode,
}: ValidateLevelUpSubmissionArgs): LevelUpValidationResult {
  if (isDownMode) {
    if (!selectedClassDetailId || selectedClassLevel < 1) {
      return {
        error: "Debes elegir una clase válida para bajar de nivel.",
        focusTarget: "class",
      };
    }

    return { error: null, focusTarget: "none" };
  }

  if (!selectedClassDetailId) {
    return {
      error: "Debes elegir la clase que va a subir de nivel.",
      focusTarget: "class",
    };
  }

  if (classIsNew) {
    const missingChoiceErrors = Object.fromEntries(
      visibleInitialClassChoices
        .filter(
          (choice) => (classChoices[choice.id] ?? []).length < choice.cantidad,
        )
        .map((choice) => [
          choice.id,
          `Faltan ${choice.cantidad - (classChoices[choice.id] ?? []).length} selección(es).`,
        ]),
    );

    if (Object.keys(missingChoiceErrors).length > 0) {
      return {
        error: "Completa las elecciones obligatorias de la clase.",
        focusTarget: "class-choice",
        missingChoiceErrors,
      };
    }
  }

  if (needsSubclass && !selectedSubclassId) {
    return {
      error: "Debes elegir una subclase para continuar.",
      focusTarget: "subclass",
    };
  }

  if (requiresAsi && asiMode === "feat" && !selectedFeat) {
    return {
      error: "Debes seleccionar una dote.",
      focusTarget: "asi",
    };
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
      selectedFeatLanguages.filter((value) => value.trim().length > 0).length <
        selectedFeat.selectableLanguages.count);

  if (requiresAsi && missingFeatSelection) {
    return {
      error: "Completa todas las selecciones obligatorias de la dote.",
      focusTarget: "asi",
    };
  }

  if (requiresAsi && selectedFeat?.spellSelection) {
    if (selectedFeat.spellSelection.chooseClass && !selectedFeatSpellClass) {
      return {
        error: "Debes elegir una clase para la dote.",
        focusTarget: "asi",
      };
    }

    if (
      selectedFeatCantrips.filter((value) => value.trim().length > 0).length <
        selectedFeat.spellSelection.cantrips ||
      selectedFeatSpells.filter((value) => value.trim().length > 0).length <
        selectedFeat.spellSelection.spells
    ) {
      return {
        error: "Completa los conjuros de la dote.",
        focusTarget: "asi",
      };
    }
  }

  if (
    cantripUpgradeCount > 0 &&
    cantripUpgradeChosen.length < cantripUpgradeCount
  ) {
    return {
      error: `Debes elegir ${cantripUpgradeCount} truco(s) nuevo(s).`,
      focusTarget: "none",
    };
  }

  if (
    (isGainingEa || isActiveEa) &&
    eaCantripCount > 0 &&
    eaChosenCantrips.length < eaCantripCount
  ) {
    return {
      error: `Debes elegir ${eaCantripCount} truco(s) del Embaucador Arcano.`,
      focusTarget: "none",
    };
  }

  if (
    (isGainingEa || isActiveEa) &&
    eaSpellCount > 0 &&
    eaChosenSpells.length < eaSpellCount
  ) {
    return {
      error: `Debes elegir ${eaSpellCount} conjuro(s) del Embaucador Arcano.`,
      focusTarget: "none",
    };
  }

  if (
    (isGainingEk || isActiveEk) &&
    ekCantripCount > 0 &&
    ekChosenCantrips.length < ekCantripCount
  ) {
    return {
      error: `Debes elegir ${ekCantripCount} truco(s) del Caballero Arcano.`,
      focusTarget: "none",
    };
  }

  if (
    (isGainingEk || isActiveEk) &&
    ekSpellCount > 0 &&
    ekChosenSpells.length < ekSpellCount
  ) {
    return {
      error: `Debes elegir ${ekSpellCount} conjuro(s) del Caballero Arcano.`,
      focusTarget: "none",
    };
  }

  if (
    (isGainingBattleMaster || isActiveBattleMaster) &&
    battleMasterManeuverCount > 0 &&
    battleMasterManeuvers.length < battleMasterManeuverCount
  ) {
    return {
      error: `Debes elegir ${battleMasterManeuverCount} maniobra(s) del Maestro de Batalla.`,
      focusTarget: "none",
    };
  }

  return {
    error: null,
    focusTarget: "none",
    missingChoiceErrors: classIsNew ? {} : undefined,
  };
}

export function getExpertiseMissingSelectionResult(
  selectedExpertiseCount: number,
  requiredCount: number,
): LevelUpValidationResult {
  return {
    error: "Completa las selecciones de pericia.",
    focusTarget: "class-choice",
    missingChoiceErrors: {
      [EXPERTISE_CHOICE_SECTION_ID]: `Faltan ${requiredCount - selectedExpertiseCount} selección(es).`,
    },
  };
}
