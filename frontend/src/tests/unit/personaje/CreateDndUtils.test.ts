// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ABILITY_STATS } from "../../../screens/personaje/creatednd/utils/statisticsUtils";
import {
  appendEquipmentErrors,
  buildChoiceErrors,
  buildCreateCharacterPayload,
  scrollToFirstVisibleValidationError,
} from "../../../screens/personaje/creatednd/utils/createDndScreenUtils";
import { buildInitialClassSkillSelections } from "../../../screens/personaje/creatednd/utils/classSkillChoices";
import { useCreateDndCharacter } from "../../../screens/personaje/creatednd/hooks/useCreateDndCharacter";
import type {
  BackgroundSelectionSnapshot,
  CharacterStatisticsSnapshot,
  DndEquipment,
  EquipmentSelectionSnapshot,
  RaceSelectionSnapshot,
} from "../../../screens/personaje/creatednd/types";

function buildStatisticsSelection(): CharacterStatisticsSnapshot {
  return {
    selectedMethod: "custom",
    diceRounds: [],
    standardAssignments: {},
    pointBuyScores: {},
    customScores: {},
    resolvedScores: Object.fromEntries(
      ABILITY_STATS.map((stat, index) => [stat.id, 10 + index]),
    ),
  };
}

describe("creacion de personaje - utilidades", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("construye el payload completo con elecciones, estadisticas y equipamiento", () => {
    const creation = {
      name: "  Elandor  ",
      selectedClass: { id: "wizard", nombre: "Mago", insignia: "sigil" },
      selectedSubclassId: "school-evocation",
      selectedBackgroundId: "sage",
    } as unknown as ReturnType<typeof useCreateDndCharacter>;

    const classSkillChoiceGroups = [
      {
        id: "class-skills",
        etiqueta: "Competencias de clase",
        resumen: "Elige dos habilidades",
        catalogo: "habilidades",
        cantidad: 2,
        opciones: ["Arcano", "Historia", "Investigacion"],
      },
      {
        id: "class-languages",
        etiqueta: "Idioma extra",
        resumen: "Elige un idioma",
        catalogo: "idiomas",
        cantidad: 1,
        opciones: ["Draconico", "Enano"],
      },
    ];

    const raceSelection: RaceSelectionSnapshot = {
      selectedRaceId: "elf",
      selectedRace: null,
      selectedSubraceId: "high-elf",
      selectedSubrace: null,
      selectedChoices: { raceChoice: ["Percepcion"] },
    };

    const backgroundSelection: BackgroundSelectionSnapshot = {
      selectedBackgroundId: "sage",
      selectedBackground: null,
      selectedChoices: { backgroundChoice: ["Draconico"] },
      alignment: "  Neutral bueno  ",
      personalHistory: "  Archivo viviente  ",
    };

    const equipmentSelection: EquipmentSelectionSnapshot = {
      selectedGroups: { "class:arcane-focus": 1 },
      selectedCatalogByGroup: { "class:arcane-focus": 2 },
    };

    const payload = buildCreateCharacterPayload({
      creation,
      classSkillChoiceGroups,
      classSkillSelections: {
        "class-skills": ["Arcano", "Historia"],
        "class-languages": ["Draconico"],
      },
      raceSelection,
      backgroundSelection,
      statisticsSelection: buildStatisticsSelection(),
      equipmentSelection,
    });

    expect(payload).toMatchObject({
      nombre: "Elandor",
      claseId: "wizard",
      subclaseId: "school-evocation",
      trasfondoId: "sage",
      razaId: "elf",
      subrazaId: "high-elf",
      alineamiento: "Neutral bueno",
      historiaPersonal: "Archivo viviente",
      competenciasClase: ["Arcano", "Historia"],
      eleccionesClase: {
        "class-skills": ["Arcano", "Historia"],
        "class-languages": ["Draconico"],
      },
      eleccionesTrasfondo: { backgroundChoice: ["Draconico"] },
      eleccionesRaza: { raceChoice: ["Percepcion"] },
      gruposEquipamiento: { "class:arcane-focus": 1 },
      catalogosEquipamiento: { "class:arcane-focus": 2 },
    });
    expect(payload.estadisticas.strength).toBe(10);
    expect(payload.estadisticas.charisma).toBe(15);
  });

  it("marca errores cuando faltan elecciones y grupos de equipamiento", () => {
    const choiceErrors = buildChoiceErrors(
      [
        {
          id: "language-choice",
          etiqueta: "Idioma",
          resumen: "Elige dos idiomas",
          catalogo: "idiomas",
          cantidad: 2,
          opciones: ["Enano", "Draconico"],
        },
      ],
      { "language-choice": ["Enano", ""] },
    );

    expect(choiceErrors).toEqual({
      "language-choice-1": "Campo obligatorio",
    });

    const equipment: DndEquipment = {
      fijos: [],
      gruposEleccion: [
        {
          id: "weapon",
          etiqueta: "Arma",
          opciones: [
            {
              id: "simple-weapon",
              etiqueta: "Arma simple",
              cantidad: 1,
              objeto: null,
              catalogo: "simple-weapons",
              opcionesCatalogo: [
                {
                  id: 1,
                  nombre: "Daga",
                  descripcion: "Ligera",
                  formula: "1d4",
                  tipoObjeto: "ARMA",
                  indice: "ASimple",
                  cantidad: 1,
                },
              ],
            },
          ],
        },
      ],
    };

    const errors: Record<string, string> = {};
    appendEquipmentErrors("class", equipment, null, errors);
    expect(errors).toEqual({ "class:weapon": "Campo obligatorio" });

    const missingCatalogErrors: Record<string, string> = {};
    appendEquipmentErrors(
      "class",
      equipment,
      {
        selectedGroups: { "class:weapon": 0 },
        selectedCatalogByGroup: { "class:weapon": null },
      },
      missingCatalogErrors,
    );
    expect(missingCatalogErrors).toEqual({
      "class:weapon:catalog": "Campo obligatorio",
    });
  });

  it("inicializa selecciones de competencias y desplaza al primer error visible", () => {
    expect(
      buildInitialClassSkillSelections([
        {
          id: "choice-1",
          etiqueta: "Habilidades",
          resumen: "Elige",
          catalogo: "habilidades",
          cantidad: 1,
          opciones: ["Arcano"],
        },
      ]),
    ).toEqual({ "choice-1": [] });

    const container = document.createElement("section");
    container.setAttribute("data-phase-active", "true");
    const input = document.createElement("input");
    input.setAttribute("data-validation-error", "true");
    input.scrollIntoView = vi.fn();
    input.focus = vi.fn();
    container.appendChild(input);
    document.body.appendChild(container);

    scrollToFirstVisibleValidationError();

    expect(input.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(input.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
