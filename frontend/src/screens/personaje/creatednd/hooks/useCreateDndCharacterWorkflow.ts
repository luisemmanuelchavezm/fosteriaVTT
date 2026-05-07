import { useEffect, useMemo, useState } from "react";
import { normalizeChoiceCatalog } from "../../../../components/spells/spellReferenceUtils";
import {
  EXPERTISE_CHOICE_SECTION_ID,
  getExpertiseChoiceConfig,
  THIEVES_TOOLS_NAME,
} from "../../utils/dndExpertise";
import { normalizeDndText } from "../../utils/dndProgressionRules";
import type {
  BackgroundSelectionSnapshot,
  CharacterStatisticsSnapshot,
  EquipmentSelectionSnapshot,
  RaceSelectionSnapshot,
} from "../../types";
import { createDndCharacter } from "../../utils/dndApi";
import { buildInitialClassSkillSelections } from "../utils/classSkillChoices";
import {
  appendEquipmentErrors,
  buildChoiceErrors,
  buildCreateCharacterPayload,
  CREATION_PHASES,
  scrollToFirstVisibleValidationError,
} from "../utils/createDndScreenUtils";
import { ABILITY_STATS } from "../utils/statisticsUtils";
import { useCreateDndCharacter } from "./useCreateDndCharacter";

interface UseCreateDndCharacterWorkflowArgs {
  creation: ReturnType<typeof useCreateDndCharacter>;
  onCharacterCreated?: (characterId: string) => void;
}

export function useCreateDndCharacterWorkflow({
  creation,
  onCharacterCreated,
}: UseCreateDndCharacterWorkflowArgs) {
  const [raceSelection, setRaceSelection] =
    useState<RaceSelectionSnapshot | null>(null);
  const [backgroundSelection, setBackgroundSelection] =
    useState<BackgroundSelectionSnapshot | null>(null);
  const [classSkillSelections, setClassSkillSelections] = useState<
    Record<string, string[]>
  >({});
  const [classExpertiseSelections, setClassExpertiseSelections] = useState<
    string[]
  >([]);
  const [statisticsSelection, setStatisticsSelection] =
    useState<CharacterStatisticsSnapshot | null>(null);
  const [equipmentSelection, setEquipmentSelection] =
    useState<EquipmentSelectionSnapshot | null>(null);
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [creationMessage, setCreationMessage] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSucceeded, setCreationSucceeded] = useState(false);

  const classSkillChoiceGroups = useMemo(
    () => creation.selectedClassDetail?.elecciones ?? [],
    [creation.selectedClassDetail],
  );

  const classExpertiseChoiceConfig = useMemo(
    () =>
      getExpertiseChoiceConfig(
        creation.selectedClassDetail?.id ?? creation.selectedClass?.id ?? null,
        1,
      ),
    [creation.selectedClass, creation.selectedClassDetail],
  );

  const availableClassExpertiseOptions = useMemo(() => {
    if (!classExpertiseChoiceConfig) {
      return [];
    }

    const selectedSkillChoices = classSkillChoiceGroups
      .filter(
        (group) => normalizeChoiceCatalog(group.catalogo) === "habilidades",
      )
      .flatMap((group) => classSkillSelections[group.id] ?? [])
      .filter((value) => value.trim().length > 0);

    const uniqueSkillChoices = [...new Set(selectedSkillChoices)].sort(
      (left, right) => left.localeCompare(right, "es"),
    );

    if (!classExpertiseChoiceConfig.allowThievesTools) {
      return uniqueSkillChoices;
    }

    const hasThievesToolsCompetency = (
      creation.selectedClassDetail?.competencias.herramientas ?? []
    ).some(
      (entry) =>
        normalizeDndText(entry) === normalizeDndText(THIEVES_TOOLS_NAME),
    );

    return hasThievesToolsCompetency
      ? [...uniqueSkillChoices, THIEVES_TOOLS_NAME]
      : uniqueSkillChoices;
  }, [
    classExpertiseChoiceConfig,
    classSkillChoiceGroups,
    classSkillSelections,
    creation.selectedClassDetail,
  ]);

  useEffect(() => {
    setClassSkillSelections(
      buildInitialClassSkillSelections(classSkillChoiceGroups),
    );
  }, [classSkillChoiceGroups]);

  useEffect(() => {
    if (!classExpertiseChoiceConfig) {
      setClassExpertiseSelections([]);
      return;
    }

    setClassExpertiseSelections((current) =>
      Array.from({ length: classExpertiseChoiceConfig.count }, (_, index) => {
        const currentValue = current[index] ?? "";
        return availableClassExpertiseOptions.some(
          (option) =>
            normalizeDndText(option) === normalizeDndText(currentValue),
        )
          ? currentValue
          : "";
      }),
    );
  }, [availableClassExpertiseOptions, classExpertiseChoiceConfig]);

  const validation = useMemo(() => {
    const nameError = creation.name.trim() ? null : "Campo obligatorio";
    const portraitError = creation.portraitPreview ? null : "Campo obligatorio";

    const classErrors: Record<string, string> = creation.selectedClass
      ? {}
      : { class: "Campo obligatorio" };

    if (creation.selectedClass) {
      const initialSubclasses =
        creation.selectedClassDetail?.subclases.filter(
          (item) => item.nivelDesbloqueo <= 1,
        ) ?? [];

      if (initialSubclasses.length > 0 && !creation.selectedSubclassId) {
        classErrors.subclass = "Debes seleccionar una subclase";
      }

      classSkillChoiceGroups.forEach((group) => {
        const selectedValues = classSkillSelections[group.id] ?? [];
        if (selectedValues.length !== group.cantidad) {
          classErrors[group.id] = "Debes completar esta elección";
        }
      });

      if (classExpertiseChoiceConfig) {
        const selectedExpertiseCount = classExpertiseSelections.filter(
          (value) => value.trim().length > 0,
        ).length;

        if (selectedExpertiseCount !== classExpertiseChoiceConfig.count) {
          classErrors[EXPERTISE_CHOICE_SECTION_ID] =
            "Debes completar esta elección";
        }
      }
    }

    const selectedBackground =
      backgroundSelection?.selectedBackground ??
      creation.selectedBackgroundDetail;
    const backgroundChoices = backgroundSelection?.selectedChoices ?? {};
    const backgroundErrors: Record<string, string> = {};

    if (!creation.selectedBackgroundId) {
      backgroundErrors.background = "Campo obligatorio";
    }

    if (selectedBackground) {
      Object.assign(
        backgroundErrors,
        buildChoiceErrors(selectedBackground.elecciones, backgroundChoices),
      );
    }

    const speciesErrors: Record<string, string> = {};
    if (!raceSelection?.selectedRaceId) {
      speciesErrors.race = "Campo obligatorio";
    }

    if (raceSelection?.selectedRace) {
      Object.assign(
        speciesErrors,
        buildChoiceErrors(
          raceSelection.selectedRace.elecciones,
          raceSelection.selectedChoices,
        ),
      );

      if (
        raceSelection.selectedRace.subrazas.length > 0 &&
        !raceSelection.selectedSubraceId
      ) {
        speciesErrors.subrace = "Campo obligatorio";
      }

      if (raceSelection.selectedSubrace) {
        Object.assign(
          speciesErrors,
          buildChoiceErrors(
            raceSelection.selectedSubrace.elecciones,
            raceSelection.selectedChoices,
          ),
        );
      }
    }

    const skillsErrors: Record<string, string> = {};
    if (!statisticsSelection) {
      ABILITY_STATS.forEach((stat) => {
        skillsErrors[stat.id] = "Campo obligatorio";
      });
    } else if (statisticsSelection.selectedMethod === "standard") {
      ABILITY_STATS.forEach((stat) => {
        if (!statisticsSelection.standardAssignments[stat.id]) {
          skillsErrors[stat.id] = "Campo obligatorio";
        }
      });
    } else if (statisticsSelection.selectedMethod === "custom") {
      ABILITY_STATS.forEach((stat) => {
        if (!statisticsSelection.customScores[stat.id]) {
          skillsErrors[stat.id] = "Campo obligatorio";
        }
      });
    } else if (statisticsSelection.selectedMethod === "dice") {
      ABILITY_STATS.forEach((stat) => {
        if (statisticsSelection.resolvedScores[stat.id] === null) {
          skillsErrors[stat.id] = "Campo obligatorio";
        }
      });
    }

    const equipmentErrors: Record<string, string> = {};
    appendEquipmentErrors(
      "class",
      creation.selectedClassDetail?.equipamiento ?? null,
      equipmentSelection,
      equipmentErrors,
    );
    appendEquipmentErrors(
      "background",
      creation.selectedBackgroundDetail?.equipamiento ?? null,
      equipmentSelection,
      equipmentErrors,
    );

    const hasClassPhaseErrors =
      nameError !== null ||
      portraitError !== null ||
      Object.keys(classErrors).length > 0;

    const invalidPhases = CREATION_PHASES.filter((phase) => {
      if (phase.id === "class") {
        return hasClassPhaseErrors;
      }

      if (phase.id === "background") {
        return Object.keys(backgroundErrors).length > 0;
      }

      if (phase.id === "species") {
        return Object.keys(speciesErrors).length > 0;
      }

      if (phase.id === "skills") {
        return Object.keys(skillsErrors).length > 0;
      }

      return Object.keys(equipmentErrors).length > 0;
    }).map((phase) => phase.id);

    const firstInvalidPhaseIndex = CREATION_PHASES.findIndex((phase) =>
      invalidPhases.includes(phase.id),
    );

    return {
      nameError,
      portraitError,
      classErrors,
      backgroundErrors,
      speciesErrors,
      skillsErrors,
      equipmentErrors,
      invalidPhases,
      firstInvalidPhaseIndex:
        firstInvalidPhaseIndex >= 0 ? firstInvalidPhaseIndex : null,
      isValid:
        nameError === null &&
        portraitError === null &&
        invalidPhases.length === 0,
    };
  }, [
    backgroundSelection,
    classExpertiseChoiceConfig,
    classExpertiseSelections,
    classSkillChoiceGroups,
    classSkillSelections,
    creation.name,
    creation.portraitPreview,
    creation.selectedBackgroundDetail,
    creation.selectedBackgroundId,
    creation.selectedClass,
    creation.selectedClassDetail,
    creation.selectedSubclassId,
    equipmentSelection,
    raceSelection,
    statisticsSelection,
  ]);

  useEffect(() => {
    setCreationMessage(null);
    setCreationError(null);
    setCreationSucceeded(false);
  }, [
    backgroundSelection,
    creation.name,
    creation.portraitFile,
    creation.selectedBackgroundId,
    creation.selectedClass,
    creation.selectedSubclassId,
    classExpertiseSelections,
    classSkillSelections,
    equipmentSelection,
    raceSelection,
    statisticsSelection,
  ]);

  const handleCreateCharacter = async () => {
    setHasAttemptedCreation(true);

    if (!validation.isValid) {
      if (validation.firstInvalidPhaseIndex !== null) {
        creation.setActivePhaseIndex(validation.firstInvalidPhaseIndex);
      }
      scrollToFirstVisibleValidationError();
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setCreationError("No se pudo autenticar la creacion del personaje.");
      return;
    }

    if (!creation.portraitFile) {
      setCreationError("Debes seleccionar un retrato para el personaje.");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreationError(null);

      const payload = buildCreateCharacterPayload({
        creation,
        classSkillChoiceGroups,
        classSkillSelections,
        classExpertiseSelections,
        raceSelection,
        backgroundSelection,
        statisticsSelection,
        equipmentSelection,
      });
      const createdCharacter = await createDndCharacter(
        token,
        payload,
        creation.portraitFile,
      );

      setCreationSucceeded(true);
      setCreationMessage(
        `Personaje creado correctamente: ${createdCharacter.nombre}.`,
      );
      onCharacterCreated?.(String(createdCharacter.id));
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el personaje.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassSkillChoiceChange = (choiceId: string, values: string[]) => {
    setClassSkillSelections((current) => ({
      ...current,
      [choiceId]: values,
    }));
  };

  return {
    raceSelection,
    setRaceSelection,
    backgroundSelection,
    setBackgroundSelection,
    classSkillSelections,
    classExpertiseSelections,
    setClassExpertiseSelections,
    statisticsSelection,
    setStatisticsSelection,
    equipmentSelection,
    setEquipmentSelection,
    hasAttemptedCreation,
    creationMessage,
    creationError,
    isSubmitting,
    creationSucceeded,
    classSkillChoiceGroups,
    classExpertiseChoiceConfig,
    availableClassExpertiseOptions,
    validation,
    handleCreateCharacter,
    handleClassSkillChoiceChange,
  };
}
