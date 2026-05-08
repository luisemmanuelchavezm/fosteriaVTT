import { describe, expect, it, vi } from "vitest";
import {
  SKILL_EXPERTISE_CHOICE_ID,
  THIEVES_TOOLS_NAME,
  TOOL_EXPERTISE_CHOICE_ID,
} from "../../../screens/personaje/utils/dndExpertise";
import { buildLevelUpPayload } from "../../../screens/personaje/dndcharactersheet/hooks/levelUpSubmission";

function baseArgs() {
  return {
    selectedClassId: "picaro",
    selectedSubclassId: null,
    classIsNew: false,
    classChoices: {},
    visibleInitialClassChoiceIds: [] as string[],
    expertiseChoices: [] as string[],
    cantripUpgradeChosen: [] as string[],
    eaChosenCantrips: [] as string[],
    eaChosenSpells: [] as string[],
    ekChosenCantrips: [] as string[],
    ekChosenSpells: [] as string[],
    battleMasterManeuvers: [] as string[],
    requiresAsi: false,
    asiMode: "double" as const,
    asiPrimary: "Fuerza",
    asiSecondary: "Destreza",
    selectedFeat: null,
    selectedFeatStats: [] as string[],
    selectedFeatCompetencies: [] as string[],
    selectedFeatSkills: [] as string[],
    selectedFeatLanguages: [] as string[],
    selectedFeatCantrips: [] as string[],
    selectedFeatSpells: [] as string[],
    selectedFeatSpellClass: "",
  };
}

describe("levelUpSubmission", () => {
  it("filters initial class choices and merges extra class selections", () => {
    const payload = buildLevelUpPayload({
      ...baseArgs(),
      classIsNew: true,
      classChoices: {
        "choice-a": ["Arcano"],
        "choice-hidden": ["Nope"],
      },
      visibleInitialClassChoiceIds: ["choice-a"],
      expertiseChoices: ["Acrobacias", THIEVES_TOOLS_NAME],
      cantripUpgradeChosen: ["Luz"],
      battleMasterManeuvers: ["Parada"],
    });

    expect(payload.claseId).toBe("picaro");
    expect(payload.eleccionesClase).toEqual({
      "choice-a": ["Arcano"],
      [SKILL_EXPERTISE_CHOICE_ID]: ["Acrobacias"],
      [TOOL_EXPERTISE_CHOICE_ID]: [THIEVES_TOOLS_NAME],
      "class-cantrip-upgrade": ["Luz"],
      "bm-maneuver": ["Parada"],
    });
  });

  it("builds feat payload in ASI feat mode with filtered inputs", () => {
    const payload = buildLevelUpPayload({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: {
        id: "feat-1",
        nombre: "Adepto",
        descripcion: "Dote de prueba",
        requisitos: [],
        formula: null,
        fixedBonuses: { Inteligencia: 1 },
        selectableBonus: {
          count: 1,
          amount: 1,
          options: ["Sabiduria", "Carisma"],
        },
        validate: vi.fn(() => true),
      },
      selectedFeatStats: ["Sabiduria"],
      selectedFeatCompetencies: ["Herramientas", ""],
      selectedFeatSkills: ["Historia", "   "],
      selectedFeatLanguages: ["Comun"],
      selectedFeatCantrips: ["Luz"],
      selectedFeatSpells: ["Dormir", ""],
      selectedFeatSpellClass: "mago",
    });

    expect(payload.modoMejoraCaracteristica).toBe("dote");
    expect(payload.dote).toEqual(
      expect.objectContaining({
        nombre: "Adepto",
        bonificacionesCaracteristica: {
          Inteligencia: 1,
          Sabiduria: 1,
        },
        competencias: ["Herramientas"],
        habilidades: ["Historia"],
        idiomas: ["Comun"],
        conjuros: ["Luz", "Dormir"],
        claseConjuros: "mago",
      }),
    );
  });

  it("builds single and double ASI payload modes", () => {
    const singlePayload = buildLevelUpPayload({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "single",
      asiPrimary: "Constitucion",
    });

    const doublePayload = buildLevelUpPayload({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "double",
      asiPrimary: "Fuerza",
      asiSecondary: "Sabiduria",
    });

    expect(singlePayload).toEqual(
      expect.objectContaining({
        modoMejoraCaracteristica: "single",
        caracteristicaPrimaria: "Constitucion",
      }),
    );

    expect(doublePayload).toEqual(
      expect.objectContaining({
        modoMejoraCaracteristica: "double",
        caracteristicaPrimaria: "Fuerza",
        caracteristicaSecundaria: "Sabiduria",
      }),
    );
  });
});
