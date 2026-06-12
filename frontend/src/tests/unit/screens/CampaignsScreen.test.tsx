// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import CampaignsScreen from "../../../screens/CampaignsScreen";

vi.mock("../../../components/LogoLayout", () => ({
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

vi.mock("../../../components/UserMenu", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <button onClick={onLogout}>Cerrar sesión</button>
  ),
}));

vi.mock("../../../components/HomeNavbar", () => ({
  default: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <nav>
      <button onClick={() => onTabChange("home")}>Inicio</button>
      <button onClick={() => onTabChange("campaigns")}>Campañas</button>
      <button onClick={() => onTabChange("characters")}>Personajes</button>
    </nav>
  ),
}));

vi.mock("../../../lib/api", () => ({
  buildApiUrl: (path: string) => `http://localhost:8080${path}`,
}));

// ─── Default props ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  username: "daria",
  avatarUrl: "https://example.com/avatar.png",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onGoCharacters: vi.fn(),
  onCreateCampaign: vi.fn(),
  onOpenCampaignHome: vi.fn(),
};

const emptyCampaignResponse = {
  ok: true,
  json: async () => ({ items: [], hasMore: false }),
} as Response;

describe("CampaignsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    cleanup();
  });

  // ── Basic rendering ──────────────────────────────────────────────────────

  it("renders 'Campañas' heading", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole("heading", { name: "Campañas" }),
    ).toBeInTheDocument();
  });

  it("renders 'Crear' button", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("renders '+' placeholder button when no campaigns", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Crear una nueva campaña" }),
      ).toBeInTheDocument(),
    );
  });

  it("shows empty state message when no campaigns match", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(
        screen.getByText(
          "No hay campañas que coincidan con la busqueda o los filtros.",
        ),
      ).toBeInTheDocument(),
    );
  });

  // ── Navigation ─────────────────────────────────────────────────────────

  it("calls onGoHome when Inicio tab is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    const onGoHome = vi.fn();
    render(<CampaignsScreen {...DEFAULT_PROPS} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByText("Inicio"));
    expect(onGoHome).toHaveBeenCalled();
  });

  it("calls onGoCampaigns when Campañas tab is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    const onGoCampaigns = vi.fn();
    render(
      <CampaignsScreen {...DEFAULT_PROPS} onGoCampaigns={onGoCampaigns} />,
    );
    // "Campañas" appears in both the h2 heading and the nav button
    // Use getByRole("button") to select only the nav button
    const navBtn = screen.getAllByRole("button", { name: /^Campañas$/ })[0];
    fireEvent.click(navBtn);
    expect(onGoCampaigns).toHaveBeenCalled();
  });

  it("calls onGoCharacters when Personajes tab is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    const onGoCharacters = vi.fn();
    render(
      <CampaignsScreen {...DEFAULT_PROPS} onGoCharacters={onGoCharacters} />,
    );
    fireEvent.click(screen.getByText("Personajes"));
    expect(onGoCharacters).toHaveBeenCalled();
  });

  it("calls onLogout when logout button is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    const onLogout = vi.fn();
    render(<CampaignsScreen {...DEFAULT_PROPS} onLogout={onLogout} />);
    fireEvent.click(screen.getByText("Cerrar sesión"));
    expect(onLogout).toHaveBeenCalled();
  });

  it("calls onGoHome when logo is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    const onGoHome = vi.fn();
    render(<CampaignsScreen {...DEFAULT_PROPS} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByTestId("logo"));
    expect(onGoHome).toHaveBeenCalled();
  });

  // ── Create modal ─────────────────────────────────────────────────────────

  it("opens create modal when 'Crear' button is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    expect(screen.getByText("Elige el sistema de juego")).toBeInTheDocument();
  });

  it("opens create modal when '+' placeholder is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Crear una nueva campaña" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Crear una nueva campaña" }),
    );
    expect(screen.getByText("Elige el sistema de juego")).toBeInTheDocument();
  });

  it("calls onCreateCampaign when a system is selected in modal", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    const onCreateCampaign = vi.fn();
    render(
      <CampaignsScreen
        {...DEFAULT_PROPS}
        onCreateCampaign={onCreateCampaign}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    fireEvent.click(screen.getByText("Dungeons and Dragons"));
    expect(onCreateCampaign).toHaveBeenCalledWith("Dungeons and Dragons");
  });

  it("closes modal when close button is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    expect(screen.getByText("Elige el sistema de juego")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Cerrar modal de creación"));
    expect(
      screen.queryByText("Elige el sistema de juego"),
    ).not.toBeInTheDocument();
  });

  // ── Filter panel ─────────────────────────────────────────────────────────

  it("opens filter panel when filter button is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Filtros adicionales" }),
    );
    expect(screen.getByText("Sistema de juego")).toBeInTheDocument();
  });

  it("toggles system filter when a system button is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Filtros adicionales" }),
    );
    // Click D&D system button in the filter panel
    const dndBtn = screen.getByRole("button", {
      name: /Dungeons and Dragons/i,
    });
    fireEvent.click(dndBtn);
    // Active filter count badge should appear
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("clears filters when 'Limpiar filtros' is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    // Type in the search box first to activate filters
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre"), {
      target: { value: "test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Filtros adicionales" }),
    );
    fireEvent.click(screen.getByText("Limpiar filtros"));
    // Input should be cleared
    expect(
      (screen.getByPlaceholderText("Buscar por nombre") as HTMLInputElement)
        .value,
    ).toBe("");
  });

  it("closes filter panel when clicking outside", async () => {
    vi.mocked(fetch).mockResolvedValue(emptyCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Filtros adicionales" }),
    );
    expect(screen.getByText("Sistema de juego")).toBeInTheDocument();
    // Click outside the filter panel
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Sistema de juego")).not.toBeInTheDocument();
  });

  // ── Campaign list ─────────────────────────────────────────────────────────

  it("carga campañas y aplica busqueda por nombre y dm con debounce", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 1,
              nombre: "Sombras",
              portadaUrl: "https://img/1",
              sistemaDeJuego: "Dungeons and Dragons",
              dmUsername: "sai",
              ultimaVezAccedido: "2026-04-10T10:00:00",
            },
          ],
          hasMore: false,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], hasMore: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], hasMore: false }),
      } as Response);

    render(<CampaignsScreen {...DEFAULT_PROPS} />);

    expect(await screen.findByText("Sombras")).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain(
      "/api/campanas?page=0&size=15",
    );

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre"), {
      target: { value: "som" },
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls[1]?.[0]).toContain("nombre=som");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Filtros adicionales" }),
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre del DM"), {
      target: { value: "sai" },
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls[2]?.[0]).toContain("dm=sai");
    });
  });

  it("renders campaign card with DM and system info", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 42,
            nombre: "La Aventura",
            portadaUrl: "https://img/cover.png",
            sistemaDeJuego: "D&D 5e",
            dmUsername: "dungeon_master",
            ultimaVezAccedido: "2024-01-15T10:00:00Z",
          },
        ],
        hasMore: false,
      }),
    } as Response);

    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText("La Aventura")).toBeInTheDocument(),
    );
    expect(screen.getByText("dungeon_master")).toBeInTheDocument();
    expect(screen.getByText("D&D 5e")).toBeInTheDocument();
  });

  it("calls onOpenCampaignHome when a campaign card is clicked", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 99,
            nombre: "Campaña Click",
            portadaUrl: undefined,
            sistemaDeJuego: "D&D",
            dmUsername: "dm",
            ultimaVezAccedido: "2024-01-01T00:00:00Z",
          },
        ],
        hasMore: false,
      }),
    } as Response);

    const onOpenCampaignHome = vi.fn();
    render(
      <CampaignsScreen
        {...DEFAULT_PROPS}
        onOpenCampaignHome={onOpenCampaignHome}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText("Campaña Click")).toBeInTheDocument(),
    );
    // The campaign card is now a <div> with onClick; clicking the title text triggers the event via bubbling
    fireEvent.click(screen.getByText("Campaña Click"));
    expect(onOpenCampaignHome).toHaveBeenCalledWith("99");
  });

  it("renders placeholder emoji when campaign has no portadaUrl", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 5,
            nombre: "Sin Imagen",
            sistemaDeJuego: "D&D",
            dmUsername: "dm",
            ultimaVezAccedido: "2024-01-01T00:00:00Z",
          },
        ],
        hasMore: false,
      }),
    } as Response);

    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText("Sin Imagen")).toBeInTheDocument(),
    );
    // The emoji placeholder should be visible
    expect(screen.getByText("🗺")).toBeInTheDocument();
  });

  // ── muestra mensaje vacio cuando la peticion falla ─────────────────────

  it("muestra mensaje vacio cuando la peticion falla", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    render(<CampaignsScreen {...DEFAULT_PROPS} />);

    expect(
      await screen.findByText(
        "No hay campañas que coincidan con la busqueda o los filtros.",
      ),
    ).toBeInTheDocument();
  });

  // ── Load more ────────────────────────────────────────────────────────────

  it("shows 'Ver mas' button when hasMore is true and clicking loads more campaigns", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 1,
              nombre: "Primera",
              portadaUrl: undefined,
              sistemaDeJuego: "D&D",
              dmUsername: "dm",
              ultimaVezAccedido: "2024-01-01T00:00:00Z",
            },
          ],
          hasMore: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 2,
              nombre: "Segunda",
              portadaUrl: undefined,
              sistemaDeJuego: "D&D",
              dmUsername: "dm",
              ultimaVezAccedido: "2024-01-02T00:00:00Z",
            },
          ],
          hasMore: false,
        }),
      } as Response);

    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText("Primera")).toBeInTheDocument(),
    );
    const loadMoreBtn = screen.getByText("Ver mas");
    expect(loadMoreBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() =>
      expect(screen.getByText("Segunda")).toBeInTheDocument(),
    );
    // After loading all, "Ver mas" should disappear
    expect(screen.queryByText("Ver mas")).not.toBeInTheDocument();
  });

  // ── No token ──────────────────────────────────────────────────────────────

  it("does not fetch when no jwtToken in localStorage", async () => {
    localStorage.removeItem("jwtToken");
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ── Delete modal ───────────────────────────────────────────────────────────

  const deleteCampaignResponse = {
    ok: true,
    json: async () => ({
      items: [
        {
          id: 7,
          nombre: "Campaña Borrar",
          sistemaDeJuego: "D&D",
          dmUsername: "dm",
          ultimaVezAccedido: "2024-01-01T00:00:00Z",
        },
      ],
      hasMore: false,
    }),
  } as Response;

  it("abre el modal de borrado al hacer clic en el icono de papelera", async () => {
    vi.mocked(fetch).mockResolvedValue(deleteCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("Campaña Borrar"));

    fireEvent.click(screen.getByLabelText("Eliminar campaña"));

    expect(
      screen.getByRole("heading", { name: "Eliminar campaña" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("borrar")).toBeInTheDocument();
  });

  it("cierra el modal de borrado al hacer clic en Cancelar", async () => {
    vi.mocked(fetch).mockResolvedValue(deleteCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("Campaña Borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar campaña"));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancelar"));

    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
  });

  it("cierra el modal de borrado al hacer clic en ×", async () => {
    vi.mocked(fetch).mockResolvedValue(deleteCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("Campaña Borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar campaña"));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();

    fireEvent.click(screen.getByText("×"));

    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
  });

  it("el botón de confirmar borrado está desactivado sin escribir 'borrar'", async () => {
    vi.mocked(fetch).mockResolvedValue(deleteCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("Campaña Borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar campaña"));

    const allDeleteBtns = screen.getAllByRole("button", {
      name: "Eliminar campaña",
    });
    const confirmBtn = allDeleteBtns[allDeleteBtns.length - 1];
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("borrar"), {
      target: { value: "otra cosa" },
    });
    expect(confirmBtn).toBeDisabled();
  });

  it("el botón de confirmar borrado se activa al escribir 'borrar'", async () => {
    vi.mocked(fetch).mockResolvedValue(deleteCampaignResponse);
    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("Campaña Borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar campaña"));

    fireEvent.change(screen.getByPlaceholderText("borrar"), {
      target: { value: "borrar" },
    });

    const allDeleteBtns = screen.getAllByRole("button", {
      name: "Eliminar campaña",
    });
    expect(allDeleteBtns[allDeleteBtns.length - 1]).not.toBeDisabled();
  });

  it("borra la campaña y la elimina de la lista al confirmar", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(deleteCampaignResponse)
      .mockResolvedValueOnce({ ok: true } as Response);

    render(<CampaignsScreen {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("Campaña Borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar campaña"));
    fireEvent.change(screen.getByPlaceholderText("borrar"), {
      target: { value: "borrar" },
    });

    const allDeleteBtns = screen.getAllByRole("button", {
      name: "Eliminar campaña",
    });
    await act(async () => {
      fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);
    });

    await waitFor(() =>
      expect(screen.queryByText("Campaña Borrar")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
  });
});
