// @vitest-environment jsdom
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import CreateCampaignScreen from "../../screens/CreateCampaignScreen";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../components/HomeNavbar", () => ({
  default: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
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
    <div>
      <button data-testid="logo" onClick={onLogoClick}>
        Logo
      </button>
      {children}
    </div>
  ),
}));

vi.mock("../../components/UserMenu", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <button onClick={onLogout}>Cerrar sesión</button>
  ),
}));

vi.mock("../../lib/api", () => ({
  buildApiUrl: (path: string) => `http://localhost:8080${path}`,
}));

// ─── Default props ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  username: "dm_user",
  avatarUrl: "https://example.com/avatar.png",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onGoCharacters: vi.fn(),
  initialSystem: "Dungeons and Dragons" as const,
  onCampaignCreated: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("jwtToken", "fake-token");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 7 }),
      headers: { get: () => "application/json" },
    }),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:fake-url"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  localStorage.removeItem("jwtToken");
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CreateCampaignScreen", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders 'Creación de campaña' heading", () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Creación de campaña")).toBeInTheDocument();
  });

  it("renders campaign name input with placeholder", () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    expect(
      screen.getByPlaceholderText("Escribe el nombre de la campaña"),
    ).toBeInTheDocument();
  });

  it("renders 'Crear campaña' submit button", () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Crear campaña")).toBeInTheDocument();
  });

  it("renders system selector with initial system", () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Dungeons and Dragons");
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it("calls onGoHome when Inicio tab is clicked", () => {
    const onGoHome = vi.fn();
    render(<CreateCampaignScreen {...DEFAULT_PROPS} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByText("Inicio"));
    expect(onGoHome).toHaveBeenCalled();
  });

  it("calls onGoCampaigns when Campañas tab is clicked", () => {
    const onGoCampaigns = vi.fn();
    render(
      <CreateCampaignScreen {...DEFAULT_PROPS} onGoCampaigns={onGoCampaigns} />,
    );
    fireEvent.click(screen.getByText("Campañas"));
    expect(onGoCampaigns).toHaveBeenCalled();
  });

  it("calls onGoCharacters when Personajes tab is clicked", () => {
    const onGoCharacters = vi.fn();
    render(
      <CreateCampaignScreen
        {...DEFAULT_PROPS}
        onGoCharacters={onGoCharacters}
      />,
    );
    fireEvent.click(screen.getByText("Personajes"));
    expect(onGoCharacters).toHaveBeenCalled();
  });

  it("calls onLogout when logout button is clicked", () => {
    const onLogout = vi.fn();
    render(<CreateCampaignScreen {...DEFAULT_PROPS} onLogout={onLogout} />);
    fireEvent.click(screen.getByText("Cerrar sesión"));
    expect(onLogout).toHaveBeenCalled();
  });

  it("calls onGoHome when logo is clicked", () => {
    const onGoHome = vi.fn();
    render(<CreateCampaignScreen {...DEFAULT_PROPS} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByTestId("logo"));
    expect(onGoHome).toHaveBeenCalled();
  });

  // ── Input interaction ──────────────────────────────────────────────────────

  it("updates campaign name when user types", () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "La Maldición del Dragón" } });
    expect(input.value).toBe("La Maldición del Dragón");
  });

  it("updates system when select changes", () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Call Of Cthulhu" } });
    expect(select.value).toBe("Call Of Cthulhu");
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it("shows error when submitting without a campaign name", async () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    expect(
      screen.getByText("El nombre de la campaña es obligatorio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rellena los campos obligatorios antes de continuar."),
    ).toBeInTheDocument();
  });

  it("clears name error when user starts typing", async () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    expect(
      screen.getByText("El nombre de la campaña es obligatorio"),
    ).toBeInTheDocument();
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Nueva campaña" } });
    expect(
      screen.queryByText("El nombre de la campaña es obligatorio"),
    ).not.toBeInTheDocument();
  });

  // ── Successful creation ────────────────────────────────────────────────────

  it("calls fetch with correct method and URL on submit", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 42 }),
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Mi campaña" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/campanas",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows 'Campaña creada con éxito.' after successful creation", async () => {
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Mi campaña" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    await waitFor(() =>
      expect(screen.getByText("Campaña creada con éxito.")).toBeInTheDocument(),
    );
  });

  it("calls onCampaignCreated with campaign ID after successful creation", async () => {
    vi.useFakeTimers();
    const onCampaignCreated = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 99 }),
        headers: { get: () => "application/json" },
      }),
    );
    render(
      <CreateCampaignScreen
        {...DEFAULT_PROPS}
        onCampaignCreated={onCampaignCreated}
      />,
    );
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Test Campaign" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(onCampaignCreated).toHaveBeenCalledWith("99");
    vi.useRealTimers();
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("shows error message when fetch fails with JSON error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({ message: "Nombre duplicado" }),
      }),
    );
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Mi campaña" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    await waitFor(() =>
      expect(screen.getByText("Nombre duplicado")).toBeInTheDocument(),
    );
  });

  it("shows error message when fetch fails with text error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => "text/plain" },
        text: () => Promise.resolve("Server error occurred"),
      }),
    );
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Mi campaña" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    await waitFor(() =>
      expect(screen.getByText("Server error occurred")).toBeInTheDocument(),
    );
  });

  it("shows error when no token in localStorage", async () => {
    localStorage.removeItem("jwtToken");
    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Mi campaña" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    expect(
      screen.getByText("Tu sesión no es válida. Vuelve a iniciar sesión."),
    ).toBeInTheDocument();
  });

  it("shows 'Creando campaña...' while submitting", async () => {
    let resolvePromise: (value: unknown) => void;
    const slowFetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );
    vi.stubGlobal("fetch", slowFetch);

    render(<CreateCampaignScreen {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Escribe el nombre de la campaña",
    );
    fireEvent.change(input, { target: { value: "Mi campaña" } });
    act(() => {
      fireEvent.click(screen.getByText("Crear campaña"));
    });
    await waitFor(() =>
      expect(screen.getByText("Creando campaña...")).toBeInTheDocument(),
    );
    // Resolve the promise to clean up
    act(() => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
        headers: { get: () => "application/json" },
      });
    });
  });

  // ── System changes ─────────────────────────────────────────────────────────

  it("uses initialSystem prop for the initial selected system", () => {
    render(
      <CreateCampaignScreen
        {...DEFAULT_PROPS}
        initialSystem={"Call Of Cthulhu" as const}
      />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Call Of Cthulhu");
  });
});
