// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import CreateDndCharacterScreen from "../../../screens/personaje/creatednd/CreateDndCharacterScreen";
import { ABILITY_STATS } from "../../../screens/personaje/creatednd/utils/statisticsUtils";

const scrollToFirstVisibleValidationErrorMock = vi.hoisted(() => vi.fn());
const createDndCharacterMock = vi.hoisted(() => vi.fn());

const mockStore = vi.hoisted(() => ({
  creation: {} as Record<string, unknown>,
  backgroundSelection: null as Record<string, unknown> | null,
  raceSelection: null as Record<string, unknown> | null,
  statisticsSelection: null as Record<string, unknown> | null,
  equipmentSelection: null as Record<string, unknown> | null,
}));

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  createDndCharacter: createDndCharacterMock,
}));

vi.mock(
  "../../../screens/personaje/creatednd/utils/createDndScreenUtils",
  async () => {
    const actual = await vi.importActual<
      typeof import("../../../screens/personaje/creatednd/utils/createDndScreenUtils")
    >("../../../screens/personaje/creatednd/utils/createDndScreenUtils");

    return {
      ...actual,
      scrollToFirstVisibleValidationError:
        scrollToFirstVisibleValidationErrorMock,
    };
  },
);

vi.mock(
  "../../../screens/personaje/creatednd/hooks/useCreateDndCharacter",
  async () => {
    const ReactModule = await import("react");

    return {
      useCreateDndCharacter: () => {
        const [activePhaseIndex, setActivePhaseIndex] = ReactModule.useState(
          Number(mockStore.creation.activePhaseIndex ?? 0),
        );

        return {
          ...mockStore.creation,
          activePhaseIndex,
          setActivePhaseIndex,
        };
      },
    };
  },
);

vi.mock("../../../components/LogoLayout", () => ({
  default: ({
    children,
    onLogoClick,
  }: {
    children: React.ReactNode;
    onLogoClick: () => void;
  }) => (
    <div>
      <button onClick={onLogoClick}>logo</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/HomeNavbar", () => ({
  default: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <div>
      <button onClick={() => onTabChange("home")}>nav-home</button>
      <button onClick={() => onTabChange("campaigns")}>nav-campaigns</button>
      <button onClick={() => onTabChange("characters")}>nav-characters</button>
    </div>
  ),
}));

vi.mock("../../../components/UserMenu", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <button onClick={onLogout}>logout-menu</button>
  ),
}));

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => <div>dice-overlay</div>,
}));

vi.mock("../../../components/spells/SpellDetailModal", () => ({
  default: () => <div>spell-detail-modal</div>,
}));

vi.mock(
  "../../../screens/personaje/creatednd/components/ClassDetailModal",
  () => ({
    default: () => <div>class-detail-modal</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/components/CharacterIdentitySection",
  () => ({
    default: ({
      nameError,
      portraitError,
    }: {
      nameError?: string;
      portraitError?: string;
    }) => (
      <div>
        <div>identity-section</div>
        {nameError ? <span>{nameError}</span> : null}
        {portraitError ? <span>{portraitError}</span> : null}
      </div>
    ),
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/ClassSelectionSection",
  () => ({
    default: ({ selectionError }: { selectionError?: string }) => (
      <div>
        <div>class-section</div>
        {selectionError ? <span>{selectionError}</span> : null}
      </div>
    ),
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/BackgroundSelectionSection",
  async () => {
    const ReactModule = await import("react");

    function BackgroundSelectionSectionMock({
      onSelectionChange,
    }: {
      onSelectionChange?: (value: unknown) => void;
    }) {
      ReactModule.useEffect(() => {
        if (mockStore.backgroundSelection) {
          onSelectionChange?.(mockStore.backgroundSelection);
        }
      }, [onSelectionChange]);

      return <div>background-section</div>;
    }

    return {
      default: BackgroundSelectionSectionMock,
    };
  },
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/RaceSelectionSection",
  async () => {
    const ReactModule = await import("react");

    function RaceSelectionSectionMock({
      onSelectionChange,
    }: {
      onSelectionChange?: (value: unknown) => void;
    }) {
      ReactModule.useEffect(() => {
        if (mockStore.raceSelection) {
          onSelectionChange?.(mockStore.raceSelection);
        }
      }, [onSelectionChange]);

      return <div>race-section</div>;
    }

    return {
      default: RaceSelectionSectionMock,
    };
  },
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/StatisticsSelectionSection",
  async () => {
    const ReactModule = await import("react");

    function StatisticsSelectionSectionMock({
      onSelectionChange,
    }: {
      onSelectionChange?: (value: unknown) => void;
    }) {
      ReactModule.useEffect(() => {
        if (mockStore.statisticsSelection) {
          onSelectionChange?.(mockStore.statisticsSelection);
        }
      }, [onSelectionChange]);

      return <div>statistics-section</div>;
    }

    return {
      default: StatisticsSelectionSectionMock,
    };
  },
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/EquipmentSelectionSection",
  async () => {
    const ReactModule = await import("react");

    function EquipmentSelectionSectionMock({
      onSelectionChange,
    }: {
      onSelectionChange?: (value: unknown) => void;
    }) {
      ReactModule.useEffect(() => {
        if (mockStore.equipmentSelection) {
          onSelectionChange?.(mockStore.equipmentSelection);
        }
      }, [onSelectionChange]);

      return <div>equipment-section</div>;
    }

    return {
      default: EquipmentSelectionSectionMock,
    };
  },
);

vi.mock("../../../screens/personaje/utils/useSpellDetailInteractions", () => ({
  useSpellDetailInteractions: () => ({
    selectedSpell: null,
    closeSpellDetail: vi.fn(),
    openSpellDetailByName: vi.fn(),
    rollSpellExpression: vi.fn(),
    diceRoller: {
      diceBoxHostId: "dice-box-host",
      diceBoxError: null,
      isRolling: false,
      summary: null,
    },
  }),
}));

function buildCreationState(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: "",
    portraitPreview: null,
    portraitFile: null,
    selectedClass: null,
    selectedClassDetail: null,
    selectedSubclassId: "",
    selectedSubclass: null,
    selectedBackgroundId: "",
    selectedBackgroundDetail: null,
    selectedBackgroundName: "",
    activePhaseIndex: 0,
    filteredClasses: [],
    classSearch: "",
    isLoadingClasses: false,
    classesError: null,
    isLoadingSelectedClassDetail: false,
    selectedClassDetailError: null,
    subclassSkills: [],
    isLoadingSubclassSkills: false,
    subclassSkillsError: null,
    classSkills: [],
    isLoadingClassSkills: false,
    classSkillsError: null,
    availableBackgrounds: [],
    isLoadingBackgrounds: false,
    backgroundsError: null,
    isLoadingSelectedBackgroundDetail: false,
    previewClass: null,
    previewClassDetail: null,
    isClassModalOpen: false,
    isLoadingPreviewClassDetail: false,
    previewClassDetailError: null,
    fileInputRef: { current: null },
    setName: vi.fn(),
    handlePortraitSelection: vi.fn(),
    openFilePicker: vi.fn(),
    setClassSearch: vi.fn(),
    openClassModal: vi.fn(),
    clearSelectedClass: vi.fn(),
    closeClassModal: vi.fn(),
    selectPreviewClass: vi.fn(),
    setSelectedSubclassId: vi.fn(),
    setSelectedBackgroundId: vi.fn(),
    ...overrides,
  };
}

function buildValidStatisticsSelection() {
  const resolvedScores = ABILITY_STATS.reduce<Record<string, number | null>>(
    (accumulator, stat) => {
      accumulator[stat.id] = 12;
      return accumulator;
    },
    {},
  );

  return {
    selectedMethod: "dice",
    diceRounds: [],
    standardAssignments: {},
    pointBuyScores: {},
    customScores: {},
    resolvedScores,
  };
}

function configureValidFlow() {
  mockStore.creation = buildCreationState({
    name: "Aria",
    portraitPreview: "portrait.png",
    portraitFile: new File(["img"], "portrait.png", { type: "image/png" }),
    activePhaseIndex: 4,
    selectedClass: { id: "mago", nombre: "Mago" },
    selectedClassDetail: {
      nombre: "Mago",
      subclases: [],
      elecciones: [],
      equipamiento: null,
    },
    selectedBackgroundId: "sabio",
    selectedBackgroundDetail: {
      nombre: "Sabio",
      elecciones: [],
      equipamiento: null,
    },
    selectedBackgroundName: "Sabio",
  });

  mockStore.backgroundSelection = {
    selectedBackgroundId: "sabio",
    selectedBackground: { elecciones: [] },
    selectedChoices: {},
    alignment: "",
    personalHistory: "",
  };

  mockStore.raceSelection = {
    selectedRaceId: "elf",
    selectedRace: { elecciones: [], subrazas: [] },
    selectedSubraceId: "",
    selectedSubrace: null,
    selectedChoices: {},
  };

  mockStore.statisticsSelection = buildValidStatisticsSelection();
  mockStore.equipmentSelection = {
    selectedGroups: {},
    selectedCatalogByGroup: {},
  };
}

describe("CreateDndCharacterScreen", () => {
  beforeEach(() => {
    mockStore.creation = buildCreationState();
    mockStore.backgroundSelection = null;
    mockStore.raceSelection = null;
    mockStore.statisticsSelection = null;
    mockStore.equipmentSelection = null;
    createDndCharacterMock.mockReset();
    scrollToFirstVisibleValidationErrorMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirige con logo, menú y navegación inferior", () => {
    const onGoHome = vi.fn();
    const onGoCampaigns = vi.fn();
    const onGoCharacters = vi.fn();
    const onLogout = vi.fn();

    render(
      <CreateDndCharacterScreen
        username="Aria"
        avatarUrl="avatar.png"
        onLogout={onLogout}
        onGoHome={onGoHome}
        onGoCampaigns={onGoCampaigns}
        onGoCharacters={onGoCharacters}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "logo" }));
    fireEvent.click(screen.getByRole("button", { name: "logout-menu" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Volver a personajes" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "nav-home" }));
    fireEvent.click(screen.getByRole("button", { name: "nav-campaigns" }));
    fireEvent.click(screen.getByRole("button", { name: "nav-characters" }));

    expect(onGoHome).toHaveBeenCalledTimes(2);
    expect(onGoCampaigns).toHaveBeenCalledTimes(1);
    expect(onGoCharacters).toHaveBeenCalledTimes(2);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("bloquea la creación inválida y hace scroll al primer error", async () => {
    mockStore.creation = buildCreationState({ activePhaseIndex: 4 });
    mockStore.raceSelection = {
      selectedRaceId: "elf",
      selectedRace: { elecciones: [], subrazas: [] },
      selectedSubraceId: "",
      selectedSubrace: null,
      selectedChoices: {},
    };
    mockStore.statisticsSelection = buildValidStatisticsSelection();

    render(
      <CreateDndCharacterScreen
        username="Aria"
        avatarUrl="avatar.png"
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Crear personaje" }));

    await waitFor(() => {
      expect(scrollToFirstVisibleValidationErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(createDndCharacterMock).not.toHaveBeenCalled();
  });

  it("muestra error si falta el token aunque la validación sea correcta", async () => {
    configureValidFlow();

    render(
      <CreateDndCharacterScreen
        username="Aria"
        avatarUrl="avatar.png"
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Crear personaje" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear personaje" }));

    expect(
      await screen.findByText(
        "No se pudo autenticar la creacion del personaje.",
      ),
    ).toBeInTheDocument();
    expect(createDndCharacterMock).not.toHaveBeenCalled();
  });

  it("crea el personaje y notifica el id cuando todo es válido", async () => {
    configureValidFlow();
    localStorage.setItem("jwtToken", "jwt-token");
    createDndCharacterMock.mockResolvedValue({ id: 12, nombre: "Aria" });
    const onCharacterCreated = vi.fn();

    render(
      <CreateDndCharacterScreen
        username="Aria"
        avatarUrl="avatar.png"
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
        onCharacterCreated={onCharacterCreated}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Crear personaje" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear personaje" }));

    await waitFor(() => {
      expect(createDndCharacterMock).toHaveBeenCalledTimes(1);
    });
    expect(createDndCharacterMock).toHaveBeenCalledWith(
      "jwt-token",
      expect.objectContaining({
        nombre: "Aria",
        claseId: "mago",
        trasfondoId: "sabio",
        razaId: "elf",
      }),
      expect.any(File),
    );
    expect(
      await screen.findByText("Personaje creado correctamente: Aria."),
    ).toBeInTheDocument();
    expect(onCharacterCreated).toHaveBeenCalledWith("12");
  });

  it("muestra el error devuelto por la creación remota", async () => {
    configureValidFlow();
    localStorage.setItem("jwtToken", "jwt-token");
    createDndCharacterMock.mockRejectedValue(new Error("fallo remoto"));

    render(
      <CreateDndCharacterScreen
        username="Aria"
        avatarUrl="avatar.png"
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Crear personaje" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear personaje" }));

    expect(await screen.findByText("fallo remoto")).toBeInTheDocument();
  });
});
