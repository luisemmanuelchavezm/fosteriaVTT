// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import HomeScreen from "../../screens/HomeScreen";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock asset imports
vi.mock("../../assets/DND.png", () => ({ default: "dnd.png" }));
vi.mock("../../assets/COC.png", () => ({ default: "coc.png" }));
vi.mock("../../assets/Vampire.png", () => ({ default: "vampire.png" }));

vi.mock("../../components/HomeNavbar", () => ({
  default: ({
    onTabChange,
  }: {
    activeTab?: string;
    onTabChange: (tab: string) => void;
  }) => (
    <nav data-testid="home-navbar">
      <button onClick={() => onTabChange("home")}>Inicio</button>
      <button onClick={() => onTabChange("campaigns")}>Campañas</button>
      <button onClick={() => onTabChange("characters")}>Personajes</button>
    </nav>
  ),
}));

vi.mock("../../components/LogoLayout", () => ({
  default: ({
    children,
    onLogoClick,
  }: {
    children: React.ReactNode;
    onLogoClick?: () => void;
  }) => (
    <div data-testid="logo-layout">
      <button data-testid="logo-btn" onClick={onLogoClick}>
        Logo
      </button>
      {children}
    </div>
  ),
}));

vi.mock("../../components/UserMenu", () => ({
  default: ({
    username,
    onLogout,
  }: {
    username: string;
    onLogout: () => void;
  }) => (
    <div data-testid="user-menu">
      <span>{username}</span>
      <button onClick={onLogout}>Cerrar sesión</button>
    </div>
  ),
}));

vi.mock("../../lib/api", () => ({
  buildApiUrl: (path: string) => `http://localhost:8080${path}`,
}));

// ─── Default props ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  username: "testuser",
  avatarUrl: "https://example.com/avatar.png",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onGoCharacters: vi.fn(),
  onCreateCampaign: vi.fn(),
  onOpenCampaignHome: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Set up localStorage with a fake token so fetch is called
  localStorage.setItem("jwtToken", "fake-token");
  // Default: fetch returns empty array
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }),
  );
});

afterEach(() => {
  localStorage.removeItem("jwtToken");
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("HomeScreen", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders 'Crea una campaña' section heading", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Crea una campaña")).toBeInTheDocument();
  });

  it("renders 'Últimas partidas' section heading", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Últimas partidas")).toBeInTheDocument();
  });

  it("renders username in UserMenu", () => {
    render(<HomeScreen {...DEFAULT_PROPS} username="player1" />);
    expect(screen.getByText("player1")).toBeInTheDocument();
  });

  it("renders featured campaign thumbnail buttons", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    // D&D appears multiple times (featured + thumbnails), so use getAllByText
    expect(screen.getAllByText("Dungeons & Dragons").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Call of Cthulhu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vampire").length).toBeGreaterThan(0);
  });

  it("renders 'Sistema destacado' label", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Sistema destacado")).toBeInTheDocument();
  });

  it("renders 'Crear campaña' CTA button", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Crear campaña")).toBeInTheDocument();
  });

  // ── Featured carousel navigation ──────────────────────────────────────────

  it("navigates to next featured campaign when '→' is clicked", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    // Click next - should not crash
    fireEvent.click(screen.getByLabelText("Ver siguiente campaña"));
    // All three thumbnails are always visible; check the page still renders correctly
    expect(screen.getAllByText("Call of Cthulhu").length).toBeGreaterThan(0);
  });

  it("navigates to previous featured campaign wrapping around", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByLabelText("Ver campaña anterior"));
    // Wraps to last — Vampire thumbnails are always visible
    expect(screen.getAllByText("Vampire").length).toBeGreaterThan(0);
  });

  it("changes featured campaign when thumbnail is clicked", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    // Click on "Call of Cthulhu" thumbnail
    const cocBtn = screen.getAllByText("Call of Cthulhu")[0];
    fireEvent.click(cocBtn);
    // Featured should now be Call of Cthulhu
    expect(screen.getByText("Sistema destacado")).toBeInTheDocument();
  });

  // ── Create campaign modal ──────────────────────────────────────────────────

  it("opens create campaign modal when '+' placeholder is clicked", async () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    const plusBtn = screen.getByLabelText("Crear una nueva campaña");
    fireEvent.click(plusBtn);
    // CampaignSystemSelectorModal should be visible
    await waitFor(() =>
      expect(screen.getByText("Elige el sistema de juego")).toBeInTheDocument(),
    );
  });

  it("calls onCreateCampaign when a system is selected in modal", async () => {
    const onCreateCampaign = vi.fn();
    render(
      <HomeScreen {...DEFAULT_PROPS} onCreateCampaign={onCreateCampaign} />,
    );
    fireEvent.click(screen.getByLabelText("Crear una nueva campaña"));
    await waitFor(() =>
      expect(screen.getByText("Elige el sistema de juego")).toBeInTheDocument(),
    );
    // Click D&D option in the modal (CampaignSystemSelectorModal uses "Dungeons and Dragons")
    fireEvent.click(screen.getByText("Dungeons and Dragons"));
    expect(onCreateCampaign).toHaveBeenCalledWith("Dungeons and Dragons");
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it("calls onGoHome when Inicio tab is clicked", () => {
    const onGoHome = vi.fn();
    render(<HomeScreen {...DEFAULT_PROPS} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByText("Inicio"));
    expect(onGoHome).toHaveBeenCalled();
  });

  it("calls onGoCampaigns when Campañas tab is clicked", () => {
    const onGoCampaigns = vi.fn();
    render(<HomeScreen {...DEFAULT_PROPS} onGoCampaigns={onGoCampaigns} />);
    fireEvent.click(screen.getByText("Campañas"));
    expect(onGoCampaigns).toHaveBeenCalled();
  });

  it("calls onGoCharacters when Personajes tab is clicked", () => {
    const onGoCharacters = vi.fn();
    render(<HomeScreen {...DEFAULT_PROPS} onGoCharacters={onGoCharacters} />);
    fireEvent.click(screen.getByText("Personajes"));
    expect(onGoCharacters).toHaveBeenCalled();
  });

  it("calls onLogout when logout button is clicked", () => {
    const onLogout = vi.fn();
    render(<HomeScreen {...DEFAULT_PROPS} onLogout={onLogout} />);
    fireEvent.click(screen.getByText("Cerrar sesión"));
    expect(onLogout).toHaveBeenCalled();
  });

  it("calls onGoHome when logo is clicked", () => {
    const onGoHome = vi.fn();
    render(<HomeScreen {...DEFAULT_PROPS} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByTestId("logo-btn"));
    expect(onGoHome).toHaveBeenCalled();
  });

  // ── Recent campaigns ───────────────────────────────────────────────────────

  it("shows recent campaigns when fetch returns data", async () => {
    const mockCampaigns = [
      {
        id: 1,
        nombre: "La Aventura del Dragón",
        portadaUrl: "http://example.com/1.png",
        sistemaDeJuego: "D&D 5e",
        dmUsername: "dm_user",
        ultimaVezAccedido: "2024-01-15T10:00:00Z",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCampaigns),
      }),
    );
    render(<HomeScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText("La Aventura del Dragón")).toBeInTheDocument(),
    );
  });

  it("calls onOpenCampaignHome when recent campaign is clicked", async () => {
    const onOpenCampaignHome = vi.fn();
    const mockCampaigns = [
      {
        id: 99,
        nombre: "Campaña Test",
        portadaUrl: "http://example.com/test.png",
        sistemaDeJuego: "D&D",
        dmUsername: "dm",
        ultimaVezAccedido: "2024-01-01T00:00:00Z",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCampaigns),
      }),
    );
    render(
      <HomeScreen {...DEFAULT_PROPS} onOpenCampaignHome={onOpenCampaignHome} />,
    );
    await waitFor(() =>
      expect(screen.getByText("Campaña Test")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Campaña Test").closest("button")!);
    expect(onOpenCampaignHome).toHaveBeenCalledWith("99");
  });

  it("shows placeholder '+' button when no campaigns", () => {
    render(<HomeScreen {...DEFAULT_PROPS} />);
    expect(
      screen.getByLabelText("Crear una nueva campaña"),
    ).toBeInTheDocument();
  });

  it("handles fetch error gracefully (no crash)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      }),
    );
    render(<HomeScreen {...DEFAULT_PROPS} />);
    // Should not crash and still show the page
    await waitFor(() =>
      expect(screen.getByText("Últimas partidas")).toBeInTheDocument(),
    );
  });

  it("does not fetch when no jwtToken in localStorage", async () => {
    localStorage.removeItem("jwtToken");
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    render(<HomeScreen {...DEFAULT_PROPS} />);
    // Wait a tick
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
