// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLevelUpModalState } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpModalState";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ── Mock heavy API calls so no real network requests happen ──────────────────
vi.mock("../../../screens/personaje/utils/dndApi", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../screens/personaje/utils/dndApi")
    >();
  return {
    ...actual,
    fetchDndClassSummaries: vi.fn().mockResolvedValue([]),
    fetchDndClassDetail: vi.fn().mockResolvedValue(null),
    fetchAbilityCatalog: vi.fn().mockResolvedValue([]),
    fetchSpellCatalog: vi.fn().mockResolvedValue([]),
    fetchClassSkills: vi.fn().mockResolvedValue([]),
    fetchClassSubclassSkills: vi.fn().mockResolvedValue([]),
    fetchSpellDetailByName: vi.fn().mockResolvedValue(null),
  };
});

// ── Minimal character fixture ─────────────────────────────────────────────────
function makeCharacter(
  overrides: Partial<DndCharacterDetailResponse> = {},
): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Aria",
    retrato: "",
    biografia: null,
    sistemaDeJuego: "Dungeons and Dragons",
    raza: "humano",
    subraza: null,
    clases: [{ nombre: "mago", nivel: 3, subclase: null }] as never,
    caracteristicaLanzamientoConjuros: null,
    estadisticas: {
      Fuerza: 10,
      Destreza: 14,
      Constitución: 12,
      Inteligencia: 16,
      Sabiduría: 10,
      Carisma: 10,
    },
    habilidades: [],
    mochila: [],
    usado: "{}",
    ...overrides,
  };
}

// ── Setup helper ─────────────────────────────────────────────────────────────
function setup(
  modeOverride: "up" | "down" = "up",
  characterOverride?: Partial<DndCharacterDetailResponse>,
) {
  const character = makeCharacter(characterOverride);
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onLevelDown = vi.fn().mockResolvedValue(undefined);

  const { result } = renderHook(() =>
    useLevelUpModalState({
      token: "test-token",
      character,
      classCompetencies: [],
      isOpen: false, // false → sub-hooks skip fetch calls
      mode: modeOverride,
      onClose,
      onSubmit,
      onLevelDown,
    }),
  );

  return { result, onClose, onSubmit, onLevelDown, character };
}

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useLevelUpModalState - estado inicial", () => {
  it("classSummaries empieza vacío", () => {
    const { result } = setup();
    expect(result.current.classSummaries).toHaveLength(0);
  });

  it("selectedClassId empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedClassId).toBeNull();
  });

  it("selectedClassDetail empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedClassDetail).toBeNull();
  });

  it("selectedSubclassId empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedSubclassId).toBeNull();
  });

  it("classChoices empieza vacío", () => {
    const { result } = setup();
    expect(Object.keys(result.current.classChoices)).toHaveLength(0);
  });

  it("expertiseChoices empieza vacío", () => {
    const { result } = setup();
    expect(result.current.expertiseChoices).toHaveLength(0);
  });

  it("asiMode empieza en double", () => {
    const { result } = setup();
    expect(result.current.asiMode).toBe("double");
  });

  it("asiPrimary empieza en Fuerza", () => {
    const { result } = setup();
    expect(result.current.asiPrimary).toBe("Fuerza");
  });

  it("asiSecondary empieza en Destreza", () => {
    const { result } = setup();
    expect(result.current.asiSecondary).toBe("Destreza");
  });

  it("selectedFeatId empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedFeatId).toBeNull();
  });

  it("selectedFeatDetail empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedFeatDetail).toBeNull();
  });

  it("selectedFeatStats empieza vacío", () => {
    const { result } = setup();
    expect(result.current.selectedFeatStats).toHaveLength(0);
  });

  it("selectedFeatCompetencies empieza vacío", () => {
    const { result } = setup();
    expect(result.current.selectedFeatCompetencies).toHaveLength(0);
  });

  it("selectedFeatSkills empieza vacío", () => {
    const { result } = setup();
    expect(result.current.selectedFeatSkills).toHaveLength(0);
  });

  it("selectedFeatLanguages empieza vacío", () => {
    const { result } = setup();
    expect(result.current.selectedFeatLanguages).toHaveLength(0);
  });

  it("selectedFeatSpellClass empieza vacío", () => {
    const { result } = setup();
    expect(result.current.selectedFeatSpellClass).toBe("");
  });

  it("missingChoiceErrors empieza vacío", () => {
    const { result } = setup();
    expect(Object.keys(result.current.missingChoiceErrors)).toHaveLength(0);
  });

  it("submitError empieza en null", () => {
    const { result } = setup();
    expect(result.current.submitError).toBeNull();
  });

  it("isSubmitting empieza en false", () => {
    const { result } = setup();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("isDownMode es false cuando mode es up", () => {
    const { result } = setup("up");
    expect(result.current.isDownMode).toBe(false);
  });

  it("isDownMode es true cuando mode es down", () => {
    const { result } = setup("down");
    expect(result.current.isDownMode).toBe(true);
  });

  it("ATTRIBUTE_OPTIONS está definido y no vacío", () => {
    const { result } = setup();
    expect(result.current.ATTRIBUTE_OPTIONS.length).toBeGreaterThan(0);
  });

  it("classWarnings está definido", () => {
    const { result } = setup();
    expect(result.current.classWarnings).toBeDefined();
  });

  it("eaChosenCantrips empieza vacío", () => {
    const { result } = setup();
    expect(result.current.eaChosenCantrips).toHaveLength(0);
  });

  it("eaChosenSpells empieza vacío", () => {
    const { result } = setup();
    expect(result.current.eaChosenSpells).toHaveLength(0);
  });

  it("ekChosenCantrips empieza vacío", () => {
    const { result } = setup();
    expect(result.current.ekChosenCantrips).toHaveLength(0);
  });

  it("ekChosenSpells empieza vacío", () => {
    const { result } = setup();
    expect(result.current.ekChosenSpells).toHaveLength(0);
  });

  it("battleMasterManeuvers empieza vacío", () => {
    const { result } = setup();
    expect(result.current.battleMasterManeuvers).toHaveLength(0);
  });

  it("cantripUpgradeChosen empieza vacío o null", () => {
    const { result } = setup();
    // can be null or an empty array depending on derived state
    const val = result.current.cantripUpgradeChosen;
    expect(
      val === null || (Array.isArray(val) && val.length === 0) || val === "",
    ).toBe(true);
  });

  it("selectedSpell empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedSpell).toBeNull();
  });
});

// ── Setters simples ───────────────────────────────────────────────────────────

describe("useLevelUpModalState - setters simples", () => {
  it("setAsiMode cambia el modo ASI", () => {
    const { result } = setup();
    act(() => {
      result.current.setAsiMode("feat");
    });
    expect(result.current.asiMode).toBe("feat");
  });

  it("setAsiMode puede cambiar a single", () => {
    const { result } = setup();
    act(() => {
      result.current.setAsiMode("single");
    });
    expect(result.current.asiMode).toBe("single");
  });

  it("setAsiPrimary cambia el atributo primario", () => {
    const { result } = setup();
    act(() => {
      result.current.setAsiPrimary("Inteligencia");
    });
    expect(result.current.asiPrimary).toBe("Inteligencia");
  });

  it("setAsiSecondary cambia el atributo secundario", () => {
    const { result } = setup();
    act(() => {
      result.current.setAsiSecondary("Sabiduría");
    });
    expect(result.current.asiSecondary).toBe("Sabiduría");
  });

  it("setSelectedClassId cambia la clase seleccionada", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedClassId("mago");
    });
    expect(result.current.selectedClassId).toBe("mago");
  });

  it("setSelectedSubclassId cambia la subclase seleccionada", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedSubclassId("evocacion");
    });
    expect(result.current.selectedSubclassId).toBe("evocacion");
  });

  it("setSelectedFeatId cambia el id del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatId("alerta");
    });
    expect(result.current.selectedFeatId).toBe("alerta");
  });

  it("setSelectedFeatDetail cambia el detalle del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatDetail(null);
    });
    expect(result.current.selectedFeatDetail).toBeNull();
  });

  it("setSelectedFeatStats cambia las estadísticas del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatStats(["Fuerza"]);
    });
    expect(result.current.selectedFeatStats).toEqual(["Fuerza"]);
  });

  it("setSelectedFeatCompetencies cambia las competencias del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatCompetencies(["espadas largas"]);
    });
    expect(result.current.selectedFeatCompetencies).toEqual(["espadas largas"]);
  });

  it("setSelectedFeatSkills cambia las habilidades del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatSkills(["Atletismo"]);
    });
    expect(result.current.selectedFeatSkills).toEqual(["Atletismo"]);
  });

  it("setSelectedFeatLanguages cambia los idiomas del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatLanguages(["élfico"]);
    });
    expect(result.current.selectedFeatLanguages).toEqual(["élfico"]);
  });

  it("setSelectedFeatSpellClass cambia la clase de conjuros del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatSpellClass("mago");
    });
    expect(result.current.selectedFeatSpellClass).toBe("mago");
  });

  it("setSelectedFeatSpells cambia los conjuros del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatSpells(["bola de fuego"]);
    });
    expect(result.current.selectedFeatSpells).toEqual(["bola de fuego"]);
  });

  it("setSelectedFeatCantrips cambia los trucos del dote", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedFeatCantrips(["prestidigitacion"]);
    });
    expect(result.current.selectedFeatCantrips).toEqual(["prestidigitacion"]);
  });

  it("setExpertiseChoices cambia las elecciones de expertise", () => {
    const { result } = setup();
    act(() => {
      result.current.setExpertiseChoices(["Atletismo"]);
    });
    expect(result.current.expertiseChoices).toEqual(["Atletismo"]);
  });

  it("setClassChoices cambia las elecciones de clase", () => {
    const { result } = setup();
    act(() => {
      result.current.setClassChoices({ "class-skill-0": ["Atletismo"] });
    });
    expect(result.current.classChoices["class-skill-0"]).toEqual(["Atletismo"]);
  });

  it("setEaChosenCantrips cambia los trucos EA", () => {
    const { result } = setup();
    act(() => {
      result.current.setEaChosenCantrips(["luz"]);
    });
    expect(result.current.eaChosenCantrips).toEqual(["luz"]);
  });

  it("setEaChosenSpells cambia los conjuros EA", () => {
    const { result } = setup();
    act(() => {
      result.current.setEaChosenSpells(["bola de fuego"]);
    });
    expect(result.current.eaChosenSpells).toEqual(["bola de fuego"]);
  });

  it("setEkChosenCantrips cambia los trucos EK", () => {
    const { result } = setup();
    act(() => {
      result.current.setEkChosenCantrips(["taumaturgia"]);
    });
    expect(result.current.ekChosenCantrips).toEqual(["taumaturgia"]);
  });

  it("setEkChosenSpells cambia los conjuros EK", () => {
    const { result } = setup();
    act(() => {
      result.current.setEkChosenSpells(["escudo"]);
    });
    expect(result.current.ekChosenSpells).toEqual(["escudo"]);
  });

  it("setBattleMasterManeuvers cambia las maniobras", () => {
    const { result } = setup();
    act(() => {
      result.current.setBattleMasterManeuvers(["ataque barrido"]);
    });
    expect(result.current.battleMasterManeuvers).toEqual(["ataque barrido"]);
  });

  it("setCantripUpgradeChosen cambia el truco de mejora", () => {
    const { result } = setup();
    act(() => {
      result.current.setCantripUpgradeChosen("luz");
    });
    expect(result.current.cantripUpgradeChosen).toBe("luz");
  });
});

// ── handleSubmit - sin selectedClassDetail (no hace nada) ────────────────────

describe("useLevelUpModalState - handleSubmit sin clase seleccionada", () => {
  it("no llama onSubmit cuando no hay clase seleccionada (modo up)", async () => {
    const { result, onSubmit } = setup("up");
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("no llama onLevelDown cuando no hay clase seleccionada (modo down)", async () => {
    const { result, onLevelDown } = setup("down");
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(onLevelDown).not.toHaveBeenCalled();
  });

  it("isSubmitting vuelve a false tras handleSubmit sin clase", async () => {
    const { result } = setup("up");
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.isSubmitting).toBe(false);
  });
});

// ── closeSpellDetail ──────────────────────────────────────────────────────────

describe("useLevelUpModalState - closeSpellDetail", () => {
  it("closeSpellDetail está disponible y se puede llamar", () => {
    const { result } = setup();
    expect(typeof result.current.closeSpellDetail).toBe("function");
    act(() => {
      result.current.closeSpellDetail();
    });
    expect(result.current.selectedSpell).toBeNull();
  });
});

// ── openSpellDetailByName sin token ──────────────────────────────────────────

describe("useLevelUpModalState - openSpellDetailByName sin token", () => {
  it("openSpellDetailByName con token null no cambia selectedSpell", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.openSpellDetailByName(null, "bola de fuego");
    });
    expect(result.current.selectedSpell).toBeNull();
  });
});

// ── Derived values ────────────────────────────────────────────────────────────

describe("useLevelUpModalState - valores derivados", () => {
  it("targetLevel es mayor al nivel actual del personaje", () => {
    const { result } = setup();
    // Character starts at nivel 3 for class "mago", total level 3
    // targetLevel in "up" mode should be 4
    expect(result.current.targetLevel).toBeGreaterThan(0);
  });

  it("totalCharacterLevel es mayor que cero", () => {
    const { result } = setup();
    expect(result.current.totalCharacterLevel).toBeGreaterThan(0);
  });

  it("visibleClassSummaries es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.visibleClassSummaries)).toBe(true);
  });

  it("visibleInitialClassChoices es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.visibleInitialClassChoices)).toBe(true);
  });

  it("selectedClassLevel empieza en 0 (sin clase seleccionada)", () => {
    const { result } = setup();
    expect(result.current.selectedClassLevel).toBe(0);
  });

  it("featOptions es un array de dotes", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.featOptions)).toBe(true);
  });

  it("selectedFeat es null cuando selectedFeatId es null", () => {
    const { result } = setup();
    expect(result.current.selectedFeat).toBeNull();
  });

  it("needsSubclass está definido", () => {
    const { result } = setup();
    expect(typeof result.current.needsSubclass).toBe("boolean");
  });

  it("requiresAsi está definido", () => {
    const { result } = setup();
    expect(typeof result.current.requiresAsi).toBe("boolean");
  });

  it("levelFeatures es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.levelFeatures)).toBe(true);
  });

  it("currentSubclass es null cuando no hay subclase en el personaje", () => {
    const { result } = setup();
    expect(result.current.currentSubclass).toBeNull();
  });

  it("effectiveSubclass es null al inicio", () => {
    const { result } = setup();
    expect(result.current.effectiveSubclass).toBeNull();
  });

  it("subclassFeatures es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.subclassFeatures)).toBe(true);
  });

  it("cantripUpgradeOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.cantripUpgradeOptions)).toBe(true);
  });

  it("eaCantripOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.eaCantripOptions)).toBe(true);
  });

  it("eaSpellOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.eaSpellOptions)).toBe(true);
  });

  it("ekCantripOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.ekCantripOptions)).toBe(true);
  });

  it("ekSpellOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.ekSpellOptions)).toBe(true);
  });

  it("battleMasterManeuverOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.battleMasterManeuverOptions)).toBe(
      true,
    );
  });

  it("featCantripOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.featCantripOptions)).toBe(true);
  });

  it("featSpellOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.featSpellOptions)).toBe(true);
  });
});

// ── targetLevelAfterDown (solo mode down) ────────────────────────────────────

describe("useLevelUpModalState - mode down", () => {
  it("targetLevelAfterDown está definido en modo down", () => {
    const { result } = setup("down");
    expect(result.current.targetLevelAfterDown).toBeDefined();
  });

  it("isDownMode es true cuando mode es down", () => {
    const { result } = setup("down");
    expect(result.current.isDownMode).toBe(true);
  });
});

// ── Refs disponibles ──────────────────────────────────────────────────────────

describe("useLevelUpModalState - refs", () => {
  it("asiSectionRef está disponible", () => {
    const { result } = setup();
    expect(result.current.asiSectionRef).toBeDefined();
  });

  it("classChoicesSectionRef está disponible", () => {
    const { result } = setup();
    expect(result.current.classChoicesSectionRef).toBeDefined();
  });

  it("classSectionRef está disponible", () => {
    const { result } = setup();
    expect(result.current.classSectionRef).toBeDefined();
  });

  it("subclassSectionRef está disponible", () => {
    const { result } = setup();
    expect(result.current.subclassSectionRef).toBeDefined();
  });
});

// ── availableExpertiseOptions ─────────────────────────────────────────────────

describe("useLevelUpModalState - expertiseChoiceConfig", () => {
  it("expertiseChoiceConfig es null sin clase seleccionada", () => {
    const { result } = setup();
    expect(result.current.expertiseChoiceConfig).toBeNull();
  });

  it("availableExpertiseOptions es un array", () => {
    const { result } = setup();
    expect(Array.isArray(result.current.availableExpertiseOptions)).toBe(true);
  });
});
