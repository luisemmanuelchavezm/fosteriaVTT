// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDndCharacterSheetController } from "../../../screens/personaje/dndcharactersheet/hooks/useDndCharacterSheetController";

// ── Mock all API calls ────────────────────────────────────────────────────────
vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchDndCharacterDetail: vi.fn().mockResolvedValue(null),
  fetchDndCompetencyCatalog: vi.fn().mockResolvedValue(null),
  fetchDndClassSummaries: vi.fn().mockResolvedValue([]),
  fetchDndClassDetail: vi.fn().mockResolvedValue(null),
  updateDndCharacterResources: vi.fn().mockResolvedValue(undefined),
  updateDndCharacterBasicInfo: vi.fn().mockResolvedValue(undefined),
  addDndCharacterInventoryItem: vi.fn().mockResolvedValue(undefined),
  removeDndCharacterInventoryItem: vi.fn().mockResolvedValue(undefined),
  updateDndCharacterInventoryItem: vi.fn().mockResolvedValue(undefined),
  addDndCharacterAbility: vi.fn().mockResolvedValue(undefined),
  removeDndCharacterAbility: vi.fn().mockResolvedValue(undefined),
  deletePersonaje: vi.fn().mockResolvedValue(undefined),
  updateDndCharacterLevel: vi.fn().mockResolvedValue(undefined),
  fetchAbilityCatalog: vi.fn().mockResolvedValue([]),
  fetchSpellCatalog: vi.fn().mockResolvedValue([]),
  fetchSpellDetailByName: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../../screens/personaje/utils/useSpellDetailInteractions", () => ({
  useSpellDetailInteractions: vi.fn(() => ({
    diceRoller: { summary: null, roll: vi.fn(), clearSummary: vi.fn() },
    selectedSpell: null,
    openSpellDetailByName: vi.fn(),
    closeSpellDetail: vi.fn(),
  })),
}));

vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => ({
    summary: null,
    roll: vi.fn(),
    clearSummary: vi.fn(),
  })),
}));

// ── Setup ─────────────────────────────────────────────────────────────────────
function setup(characterId = "1") {
  const onGoCharacters = vi.fn();
  const { result } = renderHook(() =>
    useDndCharacterSheetController(characterId, onGoCharacters),
  );
  return { result, onGoCharacters };
}

// ── Estado inicial (sin token) ────────────────────────────────────────────────

describe("useDndCharacterSheetController - estado inicial sin token", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("character empieza en null cuando no hay token", async () => {
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.character).toBeNull();
  });

  it("loadError está disponible", async () => {
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // With no token, there's either null or an auth error
    expect(result.current.loadError !== undefined).toBe(true);
  });

  it("activeDetailTab empieza en actions", () => {
    const { result } = setup();
    expect(result.current.activeDetailTab).toBe("actions");
  });

  it("selectedPassive empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedPassive).toBeNull();
  });

  it("isInventoryCatalogOpen empieza en false", () => {
    const { result } = setup();
    expect(result.current.isInventoryCatalogOpen).toBe(false);
  });

  it("isSpellCatalogOpen empieza en false", () => {
    const { result } = setup();
    expect(result.current.isSpellCatalogOpen).toBe(false);
  });

  it("isEditMode empieza en false", () => {
    const { result } = setup();
    expect(result.current.isEditMode).toBe(false);
  });

  it("isLevelManagementOpen empieza en false", () => {
    const { result } = setup();
    expect(result.current.isLevelManagementOpen).toBe(false);
  });

  it("isLevelUpOpen empieza en false", () => {
    const { result } = setup();
    expect(result.current.isLevelUpOpen).toBe(false);
  });

  it("levelModalMode empieza en up", () => {
    const { result } = setup();
    expect(result.current.levelModalMode).toBe("up");
  });

  it("isDeleteCharacterConfirmOpen empieza en false", () => {
    const { result } = setup();
    expect(result.current.isDeleteCharacterConfirmOpen).toBe(false);
  });

  it("classCompetencies empieza vacío", () => {
    const { result } = setup();
    expect(result.current.classCompetencies).toHaveLength(0);
  });

  it("competencyCatalog empieza en null", () => {
    const { result } = setup();
    expect(result.current.competencyCatalog).toBeNull();
  });

  it("token es string vacío cuando no hay jwtToken", () => {
    const { result } = setup();
    expect(result.current.token).toBe("");
  });

  it("editableSavingThrowProficiencies empieza vacío", () => {
    const { result } = setup();
    expect(result.current.editableSavingThrowProficiencies).toHaveLength(0);
  });

  it("editableSkillProficiencies empieza vacío", () => {
    const { result } = setup();
    expect(result.current.editableSkillProficiencies).toHaveLength(0);
  });

  it("editableSkillExpertise empieza vacío", () => {
    const { result } = setup();
    expect(result.current.editableSkillExpertise).toHaveLength(0);
  });

  it("currentExtraResources empieza vacío", () => {
    const { result } = setup();
    expect(Object.keys(result.current.currentExtraResources)).toHaveLength(0);
  });

  it("spellInteractions está disponible", () => {
    const { result } = setup();
    expect(result.current.spellInteractions).toBeDefined();
  });

  it("resolveCharacterFormula es función", () => {
    const { result } = setup();
    expect(typeof result.current.resolveCharacterFormula).toBe("function");
  });

  it("normalizeText es función", () => {
    const { result } = setup();
    expect(typeof result.current.normalizeText).toBe("function");
  });

  it("sanitizeNonNegativeNumber es función", () => {
    const { result } = setup();
    expect(typeof result.current.sanitizeNonNegativeNumber).toBe("function");
  });

  it("syncCharacterDetail es función", () => {
    const { result } = setup();
    expect(typeof result.current.syncCharacterDetail).toBe("function");
  });
});

// ── Setters de modales ────────────────────────────────────────────────────────

describe("useDndCharacterSheetController - setters de modales", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("setIsInventoryCatalogOpen abre el catálogo de inventario", () => {
    const { result } = setup();
    act(() => {
      result.current.setIsInventoryCatalogOpen(true);
    });
    expect(result.current.isInventoryCatalogOpen).toBe(true);
  });

  it("setIsSpellCatalogOpen abre el catálogo de conjuros", () => {
    const { result } = setup();
    act(() => {
      result.current.setIsSpellCatalogOpen(true);
    });
    expect(result.current.isSpellCatalogOpen).toBe(true);
  });

  it("setIsEditMode activa el modo edición", () => {
    const { result } = setup();
    act(() => {
      result.current.setIsEditMode(true);
    });
    expect(result.current.isEditMode).toBe(true);
  });

  it("setIsLevelManagementOpen abre la gestión de nivel", () => {
    const { result } = setup();
    act(() => {
      result.current.setIsLevelManagementOpen(true);
    });
    expect(result.current.isLevelManagementOpen).toBe(true);
  });

  it("setIsLevelUpOpen abre el modal de subida de nivel", () => {
    const { result } = setup();
    act(() => {
      result.current.setIsLevelUpOpen(true);
    });
    expect(result.current.isLevelUpOpen).toBe(true);
  });

  it("setLevelModalMode cambia el modo a down", () => {
    const { result } = setup();
    act(() => {
      result.current.setLevelModalMode("down");
    });
    expect(result.current.levelModalMode).toBe("down");
  });

  it("setIsDeleteCharacterConfirmOpen abre el modal de confirmación", () => {
    const { result } = setup();
    act(() => {
      result.current.setIsDeleteCharacterConfirmOpen(true);
    });
    expect(result.current.isDeleteCharacterConfirmOpen).toBe(true);
  });

  it("setActiveDetailTab cambia la pestaña activa", () => {
    const { result } = setup();
    act(() => {
      result.current.setActiveDetailTab("inventory");
    });
    expect(result.current.activeDetailTab).toBe("inventory");
  });

  it("setSelectedPassive cambia la pasiva seleccionada", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedPassive({
        id: 1,
        nombre: "Darkvision",
      } as never);
    });
    expect(result.current.selectedPassive?.nombre).toBe("Darkvision");
  });
});

// ── Setters editables ─────────────────────────────────────────────────────────

describe("useDndCharacterSheetController - setters editables", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("setEditableName cambia el nombre editable", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableName("Lyra");
    });
    expect(result.current.editableName).toBe("Lyra");
  });

  it("setEditableAlignment cambia el alineamiento editable", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableAlignment("Caótico Bueno");
    });
    expect(result.current.editableAlignment).toBe("Caótico Bueno");
  });

  it("setEditableMovement cambia el movimiento editable", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableMovement("35");
    });
    expect(result.current.editableMovement).toBe("35");
  });

  it("setEditableMaxHp cambia el HP máximo editable", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableMaxHp("50");
    });
    expect(result.current.editableMaxHp).toBe("50");
  });

  it("setEditableLanguagesText cambia el texto de idiomas", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableLanguagesText("Común, Élfico");
    });
    expect(result.current.editableLanguagesText).toBe("Común, Élfico");
  });

  it("setEditablePersonalHistory cambia la historia personal", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditablePersonalHistory("Era un aventurero...");
    });
    expect(result.current.editablePersonalHistory).toBe("Era un aventurero...");
  });

  it("setEditableStatScores cambia las puntuaciones editables", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableStatScores({ Fuerza: 18 });
    });
    expect(result.current.editableStatScores.Fuerza).toBe(18);
  });

  it("setEditableSkillProficiencies cambia las competencias de habilidad", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableSkillProficiencies(["Atletismo"]);
    });
    expect(result.current.editableSkillProficiencies).toEqual(["Atletismo"]);
  });

  it("setEditableSkillExpertise cambia la expertise", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableSkillExpertise(["Atletismo"]);
    });
    expect(result.current.editableSkillExpertise).toEqual(["Atletismo"]);
  });

  it("setEditableWeaponArmorCompetencies cambia competencias de arma/armadura", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableWeaponArmorCompetencies([
        "Espadas simples",
        "Armaduras ligeras",
      ]);
    });
    expect(result.current.editableWeaponArmorCompetencies).toEqual([
      "Espadas simples",
      "Armaduras ligeras",
    ]);
  });

  it("setEditableToolCompetencies cambia competencias de herramienta", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditableToolCompetencies(["Herramientas de ladrón"]);
    });
    expect(result.current.editableToolCompetencies).toEqual([
      "Herramientas de ladrón",
    ]);
  });
});

// ── handleToggleSavingThrowProficiency ────────────────────────────────────────

describe("useDndCharacterSheetController - handleToggleSavingThrowProficiency", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("agrega una competencia de salvación cuando no existe", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleSavingThrowProficiency("Fuerza");
    });
    expect(result.current.editableSavingThrowProficiencies).toContain("Fuerza");
  });

  it("elimina una competencia de salvación cuando ya existe", () => {
    const { result } = setup();
    // Add Fuerza via toggle
    act(() => {
      result.current.handleToggleSavingThrowProficiency("Fuerza");
    });
    act(() => {
      result.current.handleToggleSavingThrowProficiency("Destreza");
    });
    // Now toggle Fuerza off
    act(() => {
      result.current.handleToggleSavingThrowProficiency("Fuerza");
    });
    expect(result.current.editableSavingThrowProficiencies).not.toContain(
      "Fuerza",
    );
    expect(result.current.editableSavingThrowProficiencies).toContain(
      "Destreza",
    );
  });
});

// ── handleToggleSkillProficiency ──────────────────────────────────────────────

describe("useDndCharacterSheetController - handleToggleSkillProficiency", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("cicla la competencia de habilidad de 0 a 1", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleSkillProficiency("Atletismo");
    });
    expect(result.current.editableSkillProficiencies).toContain("Atletismo");
    // Level 1: competente
    expect(result.current.editableSkillProficiencyLevels["Atletismo"]).toBe(1);
  });

  it("cicla la competencia de habilidad de 1 a 2 (expertise)", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleSkillProficiency("Atletismo");
    });
    act(() => {
      result.current.handleToggleSkillProficiency("Atletismo");
    });
    // Level 2: expertise
    expect(result.current.editableSkillProficiencyLevels["Atletismo"]).toBe(2);
    expect(result.current.editableSkillExpertise).toContain("Atletismo");
  });

  it("cicla la competencia de habilidad de 2 a 0 (sin competencia)", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleSkillProficiency("Atletismo");
    });
    act(() => {
      result.current.handleToggleSkillProficiency("Atletismo");
    });
    act(() => {
      result.current.handleToggleSkillProficiency("Atletismo");
    });
    // Level 0: removed
    expect(result.current.editableSkillProficiencies).not.toContain(
      "Atletismo",
    );
    expect(result.current.editableSkillExpertise).not.toContain("Atletismo");
  });
});

// ── handleToggleAbilityUsage ──────────────────────────────────────────────────

describe("useDndCharacterSheetController - handleToggleAbilityUsage", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("activa el uso de habilidad cuando está inactivo", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleAbilityUsage(5);
    });
    expect(result.current.abilityUsage[5]).toBe(true);
  });

  it("desactiva el uso de habilidad cuando está activo", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleAbilityUsage(5);
    });
    act(() => {
      result.current.handleToggleAbilityUsage(5);
    });
    expect(result.current.abilityUsage[5]).toBe(false);
  });
});

// ── token se obtiene de localStorage ─────────────────────────────────────────

describe("useDndCharacterSheetController - token", () => {
  it("token refleja el valor de localStorage", () => {
    localStorage.setItem("jwtToken", "mi-token-de-prueba");
    const { result } = setup();
    expect(result.current.token).toBe("mi-token-de-prueba");
    localStorage.removeItem("jwtToken");
  });
});
