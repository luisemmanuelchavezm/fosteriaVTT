// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CreateMorkBorgCharacterScreen from "../../../screens/personaje/createmorkborg/CreateMorkBorgCharacterScreen";

vi.mock(
  "../../../screens/personaje/createmorkborg/hooks/useCreateMorkBorgCharacter",
  () => ({
    useCreateMorkBorgCharacter: vi.fn(() => ({
      name: "",
      setName: vi.fn(),
      portraitFile: null,
      portraitPreview: null,
      selectedClass: null,
      setSelectedClass: vi.fn(),
      allStatsComplete: false,
      equipmentComplete: false,
      rasgosComplete: false,
      activePhaseIndex: 0,
      setActivePhaseIndex: vi.fn(),
      allStatsRolled: false,
      presenciaModifier: null,
    })),
  }),
);

vi.mock("../../../components/HomeNavbar", () => ({
  default: ({ onGoHome }: { onGoHome: () => void }) => (
    <nav>
      <button type="button" onClick={onGoHome}>
        Inicio
      </button>
    </nav>
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
  "../../../screens/personaje/createmorkborg/components/MorkBorgIdentitySection",
  () => ({
    default: () => <div>IdentitySection</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/createmorkborg/sections/MorkBorgClassSelectionSection",
  () => ({
    default: () => <div>ClassSection</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/createmorkborg/sections/MorkBorgStatsSection",
  () => ({
    default: () => <div>StatsSection</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/createmorkborg/sections/MorkBorgEquipmentSection",
  () => ({
    default: () => <div>EquipmentSection</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/createmorkborg/sections/MorkBorgRasgosSection",
  () => ({
    default: () => <div>RasgosSection</div>,
  }),
);

vi.mock("../../../lib/api", () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:8080${path}`),
}));

vi.mock("../../../assets/fondos/calavera.png", () => ({
  default: "calavera.png",
}));
vi.mock("../../../assets/fondos/sol.png", () => ({ default: "sol.png" }));

afterEach(() => cleanup());

const DEFAULT_PROPS = {
  username: "testuser",
  avatarUrl: "",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onGoCharacters: vi.fn(),
  onCharacterCreated: vi.fn(),
};

describe("CreateMorkBorgCharacterScreen", () => {
  it("renderiza sin errores", () => {
    const { container } = render(
      <CreateMorkBorgCharacterScreen {...DEFAULT_PROPS} />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra el contenido del formulario de creación", () => {
    render(<CreateMorkBorgCharacterScreen {...DEFAULT_PROPS} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("renderiza la sección de identidad", () => {
    render(<CreateMorkBorgCharacterScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("IdentitySection")).toBeInTheDocument();
  });

  it("renderiza la sección de clases", () => {
    render(<CreateMorkBorgCharacterScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("ClassSection")).toBeInTheDocument();
  });

  it("renderiza la sección de estadísticas", () => {
    render(<CreateMorkBorgCharacterScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("StatsSection")).toBeInTheDocument();
  });
});
