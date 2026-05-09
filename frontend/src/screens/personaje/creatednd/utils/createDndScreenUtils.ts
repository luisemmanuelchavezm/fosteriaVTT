import { normalizeChoiceCatalog } from "../../../../components/spells/spellReferenceUtils";
import type {
  BackgroundSelectionSnapshot,
  CharacterStatisticsSnapshot,
  ClassSkillChoiceGroup,
  CreateDndCharacterRequest,
  DndBackgroundChoice,
  DndEquipment,
  DndRaceChoice,
  EquipmentSelectionSnapshot,
  RaceSelectionSnapshot,
} from "../../types";
import { useCreateDndCharacter } from "../hooks/useCreateDndCharacter";
import { ABILITY_STATS } from "./statisticsUtils";
import { buildEquipmentCatalogSelectionKeys } from "./equipmentUtils";
import {
  SKILL_EXPERTISE_CHOICE_ID,
  splitExpertiseChoices,
  TOOL_EXPERTISE_CHOICE_ID,
} from "../../utils/dndExpertise";

export interface CreationPhase {
  id: string;
  title: string;
}

export const CREATION_PHASES: CreationPhase[] = [
  { id: "class", title: "1. clase" },
  { id: "background", title: "2. trasfondo" },
  { id: "species", title: "3. raza" },
  { id: "skills", title: "4. estadísticas" },
  { id: "equipment", title: "5. equipamiento" },
];

export function buildChoiceErrors(
  choices: Array<DndBackgroundChoice | DndRaceChoice>,
  selectedChoices: Record<string, string[]>,
) {
  return choices.reduce<Record<string, string>>((errors, choice) => {
    Array.from({ length: choice.cantidad }).forEach((_, index) => {
      if (!(selectedChoices[choice.id]?.[index] ?? "").trim()) {
        errors[`${choice.id}-${index}`] = "Campo obligatorio";
      }
    });

    return errors;
  }, {});
}

export function buildCreateCharacterPayload({
  creation,
  classSkillChoiceGroups,
  classSkillSelections,
  classExpertiseSelections,
  raceSelection,
  backgroundSelection,
  statisticsSelection,
  equipmentSelection,
}: {
  creation: ReturnType<typeof useCreateDndCharacter>;
  classSkillChoiceGroups: ClassSkillChoiceGroup[];
  classSkillSelections: Record<string, string[]>;
  classExpertiseSelections: string[];
  raceSelection: RaceSelectionSnapshot | null;
  backgroundSelection: BackgroundSelectionSnapshot | null;
  statisticsSelection: CharacterStatisticsSnapshot | null;
  equipmentSelection: EquipmentSelectionSnapshot | null;
}): CreateDndCharacterRequest {
  if (!creation.selectedClass) {
    throw new Error("Debes seleccionar una clase");
  }

  if (!creation.selectedBackgroundId) {
    throw new Error("Debes seleccionar un trasfondo");
  }

  if (!raceSelection?.selectedRaceId) {
    throw new Error("Debes seleccionar una raza");
  }

  const classChoices = classSkillChoiceGroups.reduce<Record<string, string[]>>(
    (accumulator, group) => {
      accumulator[group.id] = classSkillSelections[group.id] ?? [];
      return accumulator;
    },
    {},
  );
  const { skillChoices, toolChoices } = splitExpertiseChoices(
    classExpertiseSelections,
  );

  if (skillChoices.length > 0) {
    classChoices[SKILL_EXPERTISE_CHOICE_ID] = skillChoices;
  }
  if (toolChoices.length > 0) {
    classChoices[TOOL_EXPERTISE_CHOICE_ID] = toolChoices;
  }

  return {
    nombre: creation.name.trim(),
    claseId: creation.selectedClass.id,
    subclaseId: creation.selectedSubclassId || null,
    trasfondoId: creation.selectedBackgroundId,
    razaId: raceSelection.selectedRaceId,
    subrazaId: raceSelection.selectedSubraceId || null,
    alineamiento: backgroundSelection?.alignment.trim() || null,
    historiaPersonal: backgroundSelection?.personalHistory.trim() || null,
    estadisticas: buildCharacterStatisticsPayload(statisticsSelection),
    competenciasClase: classSkillChoiceGroups
      .filter(
        (group) => normalizeChoiceCatalog(group.catalogo) === "habilidades",
      )
      .flatMap((group) => classSkillSelections[group.id] ?? []),
    eleccionesClase: classChoices,
    eleccionesTrasfondo: backgroundSelection?.selectedChoices ?? {},
    eleccionesRaza: raceSelection.selectedChoices,
    gruposEquipamiento: compactNumericSelections(
      equipmentSelection?.selectedGroups,
    ),
    catalogosEquipamiento: compactNumericSelections(
      equipmentSelection?.selectedCatalogByGroup,
    ),
  };
}

export function appendEquipmentErrors(
  originId: string,
  equipment: DndEquipment | null,
  selection: EquipmentSelectionSnapshot | null,
  errors: Record<string, string>,
) {
  if (!equipment) {
    return;
  }

  equipment.gruposEleccion.forEach((group) => {
    const selectionKey = buildEquipmentSelectionKey(originId, group.id);
    const selectedOptionIndex = selection?.selectedGroups[selectionKey] ?? null;

    if (selectedOptionIndex === null) {
      errors[selectionKey] = "Campo obligatorio";
      return;
    }

    const selectedOption = group.opciones[selectedOptionIndex] ?? null;

    if (selectedOption?.opcionesCatalogo.length) {
      buildEquipmentCatalogSelectionKeys(selectionKey, selectedOption).forEach(
        (catalogSelectionKey) => {
          if (
            !(selection?.selectedCatalogByGroup[catalogSelectionKey] ?? null)
          ) {
            errors[`${catalogSelectionKey}:catalog`] = "Campo obligatorio";
          }
        },
      );
    }
  });
}

export function scrollToFirstVisibleValidationError() {
  window.requestAnimationFrame(() => {
    const activePhase = document.querySelector('[data-phase-active="true"]');
    const errorTarget = activePhase?.querySelector(
      '[data-validation-error="true"]',
    );

    if (errorTarget instanceof HTMLElement) {
      errorTarget.scrollIntoView({ behavior: "smooth", block: "center" });

      const focusTarget = errorTarget.matches("input, select, button, textarea")
        ? errorTarget
        : errorTarget.querySelector("input, select, button, textarea");

      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus({ preventScroll: true });
      }
      return;
    }

    if (activePhase instanceof HTMLElement) {
      activePhase.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function buildEquipmentSelectionKey(originId: string, groupId: string) {
  return `${originId}:${groupId}`;
}

function compactNumericSelections<T extends number | null>(
  values: Record<string, T> | undefined,
) {
  return Object.entries(values ?? {}).reduce<Record<string, number>>(
    (accumulator, [key, value]) => {
      if (value !== null) {
        accumulator[key] = value;
      }
      return accumulator;
    },
    {},
  );
}

function buildCharacterStatisticsPayload(
  statisticsSelection: CharacterStatisticsSnapshot | null,
) {
  if (!statisticsSelection) {
    throw new Error("Debes completar las estadísticas del personaje");
  }

  return ABILITY_STATS.reduce<Record<string, number>>((accumulator, stat) => {
    const value = statisticsSelection.resolvedScores[stat.id];

    if (value === null) {
      throw new Error("Debes completar las estadísticas del personaje");
    }

    accumulator[stat.id] = value;
    return accumulator;
  }, {});
}
