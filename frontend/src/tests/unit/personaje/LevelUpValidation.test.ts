import { describe, expect, it } from "vitest";
import {
  getExpertiseMissingSelectionResult,
  validateLevelUpSubmission,
} from "../../../screens/personaje/dndcharactersheet/hooks/levelUpValidation";

function baseArgs() {
  return {
    battleMasterManeuverCount: 0,
    battleMasterManeuvers: [],
    cantripUpgradeChosen: [],
    cantripUpgradeCount: 0,
    classChoices: {},
    classIsNew: false,
    eaCantripCount: 0,
    eaChosenCantrips: [],
    eaChosenSpells: [],
    eaSpellCount: 0,
    ekCantripCount: 0,
    ekChosenCantrips: [],
    ekChosenSpells: [],
    ekSpellCount: 0,
    isActiveBattleMaster: false,
    isActiveEa: false,
    isActiveEk: false,
    isDownMode: false,
    isGainingBattleMaster: false,
    isGainingEa: false,
    isGainingEk: false,
    needsSubclass: false,
    requiresAsi: false,
    selectedClassDetailId: "picaro",
    selectedClassLevel: 2,
    selectedFeat: null,
    selectedFeatCantrips: [],
    selectedFeatCompetencies: [],
    selectedFeatLanguages: [],
    selectedFeatSkills: [],
    selectedFeatSpellClass: "",
    selectedFeatSpells: [],
    selectedFeatStats: [],
    selectedSubclassId: null,
    visibleInitialClassChoices: [],
    asiMode: "double" as const,
  };
}

describe("levelUpValidation", () => {
  it("returns class error in down mode when class is invalid", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isDownMode: true,
      selectedClassDetailId: null,
      selectedClassLevel: 0,
    });

    expect(result.error).toMatch(/bajar de nivel/i);
    expect(result.focusTarget).toBe("class");
  });

  it("returns missing initial class choices details", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      classIsNew: true,
      classChoices: {
        "choice-a": ["Arcano"],
      },
      visibleInitialClassChoices: [
        { id: "choice-a", cantidad: 2 },
        { id: "choice-b", cantidad: 1 },
      ],
    });

    expect(result.error).toMatch(/obligatorias/i);
    expect(result.focusTarget).toBe("class-choice");
    expect(result.missingChoiceErrors).toEqual({
      "choice-a": "Faltan 1 selección(es).",
      "choice-b": "Faltan 1 selección(es).",
    });
  });

  it("requires spell class when feat asks for it", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: {
        spellSelection: {
          chooseClass: true,
          cantrips: 0,
          spells: 0,
        },
      },
    });

    expect(result.error).toMatch(/clase para la dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("requires maneuvers for battle master", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isGainingBattleMaster: true,
      battleMasterManeuverCount: 2,
      battleMasterManeuvers: ["Parada"],
    });

    expect(result.error).toMatch(/maniobra/i);
    expect(result.focusTarget).toBe("none");
  });

  it("returns success and empty missing map for valid new class payload", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      classIsNew: true,
      classChoices: {
        "choice-a": ["Arcano"],
      },
      visibleInitialClassChoices: [{ id: "choice-a", cantidad: 1 }],
    });

    expect(result.error).toBeNull();
    expect(result.focusTarget).toBe("none");
    expect(result.missingChoiceErrors).toEqual({});
  });

  it("builds expertise missing selection result", () => {
    const result = getExpertiseMissingSelectionResult(1, 2);

    expect(result.error).toMatch(/pericia/i);
    expect(result.focusTarget).toBe("class-choice");
    expect(result.missingChoiceErrors).toEqual({
      "class-expertise": "Faltan 1 selección(es).",
    });
  });

  it("returns success in down mode when class is valid", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isDownMode: true,
      selectedClassDetailId: "guerrero",
      selectedClassLevel: 3,
    });

    expect(result.error).toBeNull();
    expect(result.focusTarget).toBe("none");
  });

  it("returns class error when no class selected", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      selectedClassDetailId: null,
    });

    expect(result.error).toMatch(/subir de nivel/i);
    expect(result.focusTarget).toBe("class");
  });

  it("returns subclass error when subclass is needed but not selected", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      needsSubclass: true,
      selectedSubclassId: null,
    });

    expect(result.error).toMatch(/subclase/i);
    expect(result.focusTarget).toBe("subclass");
  });

  it("returns asi error when feat mode but no feat selected", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: null,
    });

    expect(result.error).toMatch(/dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("returns asi error when feat requires selectable bonus stats and none chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: { selectableBonus: { count: 1 } },
      selectedFeatStats: [],
    });

    expect(result.error).toMatch(/obligatorias de la dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("returns asi error when feat requires competencies and none chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: { selectableCompetencies: { count: 1 } },
      selectedFeatCompetencies: [],
    });

    expect(result.error).toMatch(/obligatorias de la dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("returns asi error when feat requires skill selection and none chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: { selectableSkills: { count: 1 } },
      selectedFeatSkills: [],
    });

    expect(result.error).toMatch(/obligatorias de la dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("returns asi error when feat requires language selection and none chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: { selectableLanguages: { count: 1 } },
      selectedFeatLanguages: [],
    });

    expect(result.error).toMatch(/obligatorias de la dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("returns error when feat spell cantrips/spells not filled", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      requiresAsi: true,
      asiMode: "feat",
      selectedFeat: {
        spellSelection: { chooseClass: false, cantrips: 1, spells: 1 },
      },
      selectedFeatCantrips: [],
      selectedFeatSpells: [],
    });

    expect(result.error).toMatch(/conjuros de la dote/i);
    expect(result.focusTarget).toBe("asi");
  });

  it("returns error when cantrip upgrade required but not chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      cantripUpgradeCount: 2,
      cantripUpgradeChosen: ["Prestidigitacion"],
    });

    expect(result.error).toMatch(/truco/i);
    expect(result.focusTarget).toBe("none");
  });

  it("returns EA error when gaining EA and cantrips not chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isGainingEa: true,
      eaCantripCount: 2,
      eaChosenCantrips: ["Taumaturgia"],
    });

    expect(result.error).toMatch(/Embaucador Arcano/i);
    expect(result.focusTarget).toBe("none");
  });

  it("returns EA error when active EA and spells not chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isActiveEa: true,
      eaSpellCount: 2,
      eaChosenSpells: [],
    });

    expect(result.error).toMatch(/Embaucador Arcano/i);
    expect(result.focusTarget).toBe("none");
  });

  it("returns EK error when gaining EK and cantrips not chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isGainingEk: true,
      ekCantripCount: 2,
      ekChosenCantrips: ["Rayo de escarcha"],
    });

    expect(result.error).toMatch(/Caballero Arcano/i);
    expect(result.focusTarget).toBe("none");
  });

  it("returns EK error when active EK and spells not chosen", () => {
    const result = validateLevelUpSubmission({
      ...baseArgs(),
      isActiveEk: true,
      ekSpellCount: 2,
      ekChosenSpells: [],
    });

    expect(result.error).toMatch(/Caballero Arcano/i);
    expect(result.focusTarget).toBe("none");
  });

  it("returns success when all requirements met", () => {
    const result = validateLevelUpSubmission(baseArgs());

    expect(result.error).toBeNull();
    expect(result.focusTarget).toBe("none");
  });
});
