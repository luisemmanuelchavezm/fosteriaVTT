// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Minimal controller state shared across tests
// ---------------------------------------------------------------------------
const mockController = vi.hoisted(() => ({
  abilityUsage: {} as Record<string, boolean>,
  activeDetailTab: "acciones" as string,
  armorClass: 14,
  character: null as Record<string, unknown> | null,
  classCompetencies: [] as unknown[],
  competencyCatalog: [] as unknown[],
  currentExtraResources: {} as Record<string, number>,
  currentHp: 20,
  currentHitDice: {} as Record<string, number>,
  currentMoney: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
  currentSpellSlots: {} as Record<string, number>,
  editableAlignment: "Neutral",
  editableExtraResourceMaximums: {} as Record<string, number>,
  editableLanguagesText: "Common",
  editableMaxHp: 30,
  editableMovement: 30,
  editableName: "Hero",
  editablePersonalHistory: "",
  editableSavingThrowProficiencies: [] as unknown[],
  editableSkillProficiencies: [] as unknown[],
  editableSpellSlotMaximums: {} as Record<string, number>,
  editableStatScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  editableToolCompetencies: [] as string[],
  editableWeaponArmorCompetencies: [] as string[],
  handleAddInventoryItem: vi.fn(),
  handleAddSpell: vi.fn(),
  handleAdjustExtraResource: vi.fn(),
  handleAdjustExtraResourceMax: vi.fn(),
  handleAdjustMoney: vi.fn(),
  handleAdjustSpellSlot: vi.fn(),
  handleAdjustSpellSlotMax: vi.fn(),
  handleCancelEdit: vi.fn(),
  handleConfirmShortRest: vi.fn(),
  handleDamage: vi.fn(),
  handleDecrementHpDelta: vi.fn(),
  handleDecrementTempHpDelta: vi.fn(),
  handleDeleteCharacter: vi.fn(),
  handleDeleteSelectedInventoryItem: vi.fn(),
  handleDeleteSelectedSpell: vi.fn(),
  handleGainTempHp: vi.fn(),
  handleHeal: vi.fn(),
  handleIncrementHpDelta: vi.fn(),
  handleIncrementTempHpDelta: vi.fn(),
  handleLevelDown: vi.fn(),
  handleLongRest: vi.fn(),
  handleLoseTempHp: vi.fn(),
  handleOpenShortRest: vi.fn(),
  handleRollAbilityCheck: vi.fn(),
  handleRollActionDamage: vi.fn(),
  handleRollInitiative: vi.fn(),
  handleRollSavingThrow: vi.fn(),
  handleRollSkill: vi.fn(),
  handleRollSpellAttack: vi.fn(),
  handleRollWeaponAttack: vi.fn(),
  handleSaveEdit: vi.fn(),
  handleSaveExperience: vi.fn(),
  handleSubmitLevelUp: vi.fn(),
  handleToggleAbilityUsage: vi.fn(),
  handleToggleInventoryEquip: vi.fn(),
  handleToggleSavingThrowProficiency: vi.fn(),
  handleToggleSkillProficiency: vi.fn(),
  handleUpdateSelectedInventoryQuantity: vi.fn(),
  hitDiceEntries: [] as unknown[],
  hpDelta: 0,
  initiative: 2,
  isDeleteCharacterConfirmOpen: false,
  isEditMode: false,
  isInventoryCatalogOpen: false,
  isLevelManagementOpen: false,
  isLevelUpOpen: false,
  isShortRestModalOpen: false,
  isSpellCatalogOpen: false,
  isLoading: false,
  levelModalMode: "levelUp" as string,
  loadError: null as string | null,
  movement: 30,
  normalizeText: (t: string) => t,
  resourceSaveError: null as string | null,
  sanitizeNonNegativeNumber: (v: number) => v,
  selectedInventoryItem: null,
  selectedPassive: null,
  setActiveDetailTab: vi.fn(),
  setEditableAlignment: vi.fn(),
  setEditableLanguagesText: vi.fn(),
  setEditableMaxHp: vi.fn(),
  setEditableMovement: vi.fn(),
  setEditableName: vi.fn(),
  setEditablePersonalHistory: vi.fn(),
  setEditableStatScores: vi.fn(),
  setEditableToolCompetencies: vi.fn(),
  setEditableWeaponArmorCompetencies: vi.fn(),
  setHpDelta: vi.fn(),
  setIsDeleteCharacterConfirmOpen: vi.fn(),
  setIsEditMode: vi.fn(),
  setIsInventoryCatalogOpen: vi.fn(),
  setIsLevelManagementOpen: vi.fn(),
  setIsLevelUpOpen: vi.fn(),
  setIsShortRestModalOpen: vi.fn(),
  setIsSpellCatalogOpen: vi.fn(),
  setLevelModalMode: vi.fn(),
  setSelectedInventoryItem: vi.fn(),
  setSelectedPassive: vi.fn(),
  setShortRestHitDiceCounts: vi.fn(),
  setTempHpDelta: vi.fn(),
  shortRestHitDiceCounts: {} as Record<string, number>,
  spellInteractions: {
    openSpellDetail: vi.fn(),
    rollSpellExpression: vi.fn(),
  },
  tempHp: 0,
  tempHpDelta: 0,
  token: "tok",
  totalCharacterLevel: 1,
  totalHp: 30,
}));

// ---------------------------------------------------------------------------
// Heavy hook mock – avoids OOM loading the real implementation
// ---------------------------------------------------------------------------
vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/useDndCharacterSheetController",
  () => ({
    useDndCharacterSheetController: () => mockController,
  }),
);

// ---------------------------------------------------------------------------
// Child component mocks
// ---------------------------------------------------------------------------
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/CharacterSheetOverlays",
  () => ({
    default: () => <div data-testid="overlays" />,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/ShortRestModal",
  () => ({
    default: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="short-rest-modal" /> : null,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/IdentitySection",
  () => ({
    default: () => <div data-testid="identity-section" />,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/StatisticsSection",
  () => ({
    default: () => <div data-testid="statistics-section" />,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/ResourcesSection",
  () => ({
    default: () => <div data-testid="resources-section" />,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/ChecksSection",
  () => ({
    default: () => <div data-testid="checks-section" />,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/DetailTabsSection",
  () => ({
    default: () => <div data-testid="detail-tabs-section" />,
  }),
);

vi.mock("../../../components/HomeNavbar", () => ({
  default: ({
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <nav data-testid="home-navbar">
      <button onClick={() => onTabChange("home")}>home</button>
      <button onClick={() => onTabChange("campaigns")}>campaigns</button>
      <button onClick={() => onTabChange("characters")}>characters</button>
    </nav>
  ),
}));

vi.mock("../../../components/LogoLayout", () => ({
  default: ({
    children,
    onLogoClick,
  }: {
    children: React.ReactNode;
    onLogoClick: () => void;
  }) => (
    <div data-testid="logo-layout">
      <button data-testid="logo-btn" onClick={onLogoClick}>
        logo
      </button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/UserMenu", () => ({
  default: () => <div data-testid="user-menu" />,
}));

// ---------------------------------------------------------------------------
// Import under test (after all mocks are set up)
// ---------------------------------------------------------------------------
import DndCharacterSheetScreen from "../../../screens/personaje/dndcharactersheet/DndCharacterSheetScreen";

const defaultProps = {
  username: "player1",
  avatarUrl: "https://example.com/avatar.png",
  characterId: "char-1",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onGoCharacters: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DndCharacterSheetScreen", () => {
  it("shows loading indicator while isLoading is true", () => {
    mockController.isLoading = true;
    mockController.loadError = null;
    mockController.character = null;

    render(<DndCharacterSheetScreen {...defaultProps} />);

    expect(
      screen.getByText("Cargando hoja del personaje..."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("identity-section")).not.toBeInTheDocument();
  });

  it("shows load error when not loading and loadError is set", () => {
    mockController.isLoading = false;
    mockController.loadError = "Error de red al cargar personaje";
    mockController.character = null;

    render(<DndCharacterSheetScreen {...defaultProps} />);

    expect(
      screen.getByText("Error de red al cargar personaje"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("identity-section")).not.toBeInTheDocument();
  });

  it("shows character sections when character is loaded", () => {
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.character = { id: "char-1", name: "Hero" };

    render(<DndCharacterSheetScreen {...defaultProps} />);

    expect(screen.getByTestId("identity-section")).toBeInTheDocument();
    expect(screen.getByTestId("statistics-section")).toBeInTheDocument();
    expect(screen.getByTestId("checks-section")).toBeInTheDocument();
    expect(screen.getByTestId("detail-tabs-section")).toBeInTheDocument();
  });

  it("shows resourceSaveError banner when character is loaded and there is a save error", () => {
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.resourceSaveError = "No se pudo guardar el recurso";
    mockController.character = { id: "char-1", name: "Hero" };

    render(<DndCharacterSheetScreen {...defaultProps} />);

    expect(
      screen.getByText("No se pudo guardar el recurso"),
    ).toBeInTheDocument();
  });

  it("calls onGoHome when home nav tab is pressed", () => {
    const onGoHome = vi.fn();
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.character = null;

    render(<DndCharacterSheetScreen {...defaultProps} onGoHome={onGoHome} />);

    fireEvent.click(screen.getByText("home"));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it("calls onGoCampaigns when campaigns nav tab is pressed", () => {
    const onGoCampaigns = vi.fn();
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.character = null;

    render(
      <DndCharacterSheetScreen
        {...defaultProps}
        onGoCampaigns={onGoCampaigns}
      />,
    );

    fireEvent.click(screen.getByText("campaigns"));
    expect(onGoCampaigns).toHaveBeenCalledTimes(1);
  });

  it("calls onGoCharacters when characters nav tab is pressed", () => {
    const onGoCharacters = vi.fn();
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.character = null;

    render(
      <DndCharacterSheetScreen
        {...defaultProps}
        onGoCharacters={onGoCharacters}
      />,
    );

    fireEvent.click(screen.getByText("characters"));
    expect(onGoCharacters).toHaveBeenCalledTimes(1);
  });

  it("calls onGoCharacters when back button is clicked", () => {
    const onGoCharacters = vi.fn();
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.character = null;

    render(
      <DndCharacterSheetScreen
        {...defaultProps}
        onGoCharacters={onGoCharacters}
      />,
    );

    fireEvent.click(screen.getByText("Volver a personajes"));
    expect(onGoCharacters).toHaveBeenCalledTimes(1);
  });

  it("calls onGoHome when logo is clicked", () => {
    const onGoHome = vi.fn();
    mockController.isLoading = false;
    mockController.loadError = null;
    mockController.character = null;

    render(<DndCharacterSheetScreen {...defaultProps} onGoHome={onGoHome} />);

    fireEvent.click(screen.getByTestId("logo-btn"));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
