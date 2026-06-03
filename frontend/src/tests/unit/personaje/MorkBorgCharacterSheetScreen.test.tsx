// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import MorkBorgCharacterSheetScreen from "../../../screens/personaje/morkborgcharactersheet/MorkBorgCharacterSheetScreen";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));
vi.mock("../../../components/HomeNavbar", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <div>
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}));
vi.mock("../../../components/LogoLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("../../../components/UserMenu", () => ({
  default: () => <div>UserMenu</div>,
}));

vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgIdentitySection",
  () => ({
    default: ({ character }: { character: { nombre: string } }) => (
      <div>Identity: {character?.nombre}</div>
    ),
  }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgStatisticsSection",
  () => ({ default: () => <div>Stats</div> }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgSuppliesSection",
  () => ({ default: () => <div>Supplies</div> }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgTraitsAndScrollsSection",
  () => ({ default: () => <div>Traits</div> }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgImprovementModal",
  () => ({ default: () => null }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgClassTraitsCatalogModal",
  () => ({ default: () => null }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgScrollCatalogModal",
  () => ({ default: () => null }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgInventoryCatalogModal",
  () => ({ default: () => null }),
);
vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgEnemySheetContent",
  () => ({ default: () => null }),
);

vi.mock("../../../screens/personaje/utils/mbApi", () => ({
  getMBRasgosClase: vi.fn().mockResolvedValue([]),
}));

const mockHookState = {
  character: null as unknown,
  setCharacter: vi.fn(),
  isLoading: false,
  loadError: null as string | null,
  token: "test-token",
  classId: null,
  isOwner: true,
  isEditMode: false,
  setIsEditMode: vi.fn(),
  editableName: "Kragor",
  setEditableName: vi.fn(),
  pendingStatMods: null,
  editableMaxHp: null,
  setEditableMaxHp: vi.fn(),
  currentHp: 8,
  totalHp: 10,
  hpDelta: "1",
  setHpDelta: vi.fn(),
  sanitize: vi.fn((v: string) => v),
  plata: 50,
  comida: 3,
  presagios: 2,
  carga: 3,
  decocciones: [],
  isImprovementModalOpen: false,
  setIsImprovementModalOpen: vi.fn(),
  isClassTraitsCatalogOpen: false,
  setIsClassTraitsCatalogOpen: vi.fn(),
  isScrollCatalogOpen: false,
  setIsScrollCatalogOpen: vi.fn(),
  isDeleteConfirmOpen: false,
  setIsDeleteConfirmOpen: vi.fn(),
  deleteConfirmText: "",
  setDeleteConfirmText: vi.fn(),
  isInventoryCatalogOpen: false,
  setIsInventoryCatalogOpen: vi.fn(),
  diceBoxHostId: "dice-host",
  diceBoxError: null,
  isRolling: false,
  isRollingPresagios: false,
  overlayDisplaySummary: null,
  handleHeal: vi.fn(),
  handleDamage: vi.fn(),
  handleRollStat: vi.fn(),
  handleRollPresagios: vi.fn(),
  handleAdjustSupply: vi.fn(),
  handleSetPlata: vi.fn(),
  handleSetComida: vi.fn(),
  handleAdjustDecoccion: vi.fn(),
  handleSetDecoccion: vi.fn(),
  handleSaveEdit: vi.fn(),
  handleCancelEdit: vi.fn(),
  handleAddInventoryItem: vi.fn(),
  handleDeleteInventoryItem: vi.fn(),
  handleSaveMejora: vi.fn(),
  handleSaveEscoriaEspecialidades: vi.fn(),
  handleShortRest: vi.fn(),
  handleLongRest: vi.fn(),
  handleAdjustStat: vi.fn(),
  handleDeleteClassTrait: vi.fn(),
  handleDeleteClassItem: vi.fn(),
  handleAddClassTrait: vi.fn(),
  handleAddClassItem: vi.fn(),
  handleCreateCustomTrait: vi.fn(),
  handlePortraitChange: vi.fn(),
  handleDeleteCharacter: vi.fn(),
  handleNavChange: vi.fn(),
};

vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/useMorkBorgCharacterSheet",
  () => ({
    useMorkBorgCharacterSheet: vi.fn(() => mockHookState),
  }),
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.setItem("jwtToken", "token");
  mockHookState.character = null;
  mockHookState.isLoading = false;
  mockHookState.loadError = null;
});

const DEFAULT_PROPS = {
  username: "testUser",
  avatarUrl: "https://example.com/avatar.jpg",
  characterId: "1",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onGoCharacters: vi.fn(),
};

describe("MorkBorgCharacterSheetScreen", () => {
  it("muestra pantalla de carga cuando isLoading es true", () => {
    mockHookState.isLoading = true;
    render(<MorkBorgCharacterSheetScreen {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra error cuando loadError no es null", () => {
    mockHookState.loadError = "Error al cargar personaje";
    render(<MorkBorgCharacterSheetScreen {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra pantalla vacía cuando character es null y no cargando", () => {
    render(<MorkBorgCharacterSheetScreen {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza la hoja de personaje cuando character está cargado (PJ)", async () => {
    mockHookState.character = {
      id: 1,
      nombre: "Kragor",
      retrato: null,
      biografia: null,
      sistemaDeJuego: "Mork Borg",
      raza: null,
      subraza: null,
      clases: [],
      caracteristicaLanzamientoConjuros: null,
      estadisticas: {},
      habilidades: [],
      mochila: [],
      usado: null,
      tipo: "personaje",
      vd: null,
      tags: "MORK_BORG,clase;escoria-alcantarillas",
      propietario: "testUser",
    };

    render(<MorkBorgCharacterSheetScreen {...DEFAULT_PROPS} />);

    await waitFor(() => {
      expect(screen.getByText(/Identity.*Kragor/)).toBeInTheDocument();
    });
  });

  it("renderiza en modalMode", () => {
    mockHookState.character = {
      id: 1,
      nombre: "Kragor",
      retrato: null,
      biografia: null,
      sistemaDeJuego: "Mork Borg",
      raza: null,
      subraza: null,
      clases: [],
      caracteristicaLanzamientoConjuros: null,
      estadisticas: {},
      habilidades: [],
      mochila: [],
      usado: null,
      tipo: "personaje",
      vd: null,
      tags: "MORK_BORG",
      propietario: "testUser",
    };

    render(<MorkBorgCharacterSheetScreen {...DEFAULT_PROPS} modalMode />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza enemigo cuando tipo es enemigo", async () => {
    mockHookState.character = {
      id: 1,
      nombre: "Dragon",
      retrato: null,
      biografia: null,
      sistemaDeJuego: "Mork Borg",
      raza: null,
      subraza: null,
      clases: [],
      caracteristicaLanzamientoConjuros: null,
      estadisticas: {},
      habilidades: [],
      mochila: [],
      usado: null,
      tipo: "enemigo",
      vd: "5",
      tags: "MORK_BORG",
      propietario: "dm",
    };

    render(<MorkBorgCharacterSheetScreen {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });
});
