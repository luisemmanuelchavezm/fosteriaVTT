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
import CharactersScreen from "../../../screens/CharactersScreen";

const markCharacterAsUsed = vi.fn();

vi.mock("../../../components/LogoLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../../../components/UserMenu", () => ({
  default: () => <div>user menu</div>,
}));

vi.mock("../../../components/HomeNavbar", () => ({
  default: ({
    onTabChange,
  }: {
    onTabChange: (tab: "home" | "campaigns" | "characters") => void;
  }) => (
    <div>
      <button onClick={() => onTabChange("home")}>nav home</button>
      <button onClick={() => onTabChange("campaigns")}>nav campaigns</button>
      <button onClick={() => onTabChange("characters")}>nav characters</button>
    </div>
  ),
}));

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  markCharacterAsUsed: (...args: unknown[]) => markCharacterAsUsed(...args),
}));

describe("CharactersScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "token");
    markCharacterAsUsed.mockReset();
    markCharacterAsUsed.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    cleanup();
  });

  it("carga personajes, aplica filtros y permite cargar más", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okCharactersResponse(
          [
            {
              id: 1,
              nombre: "Iria",
              retrato: "https://img/1",
              sistemaDeJuego: "Dungeons and Dragons",
              usado: "2026-04-10T10:00:00",
            },
          ],
          true,
        ),
      )
      .mockResolvedValueOnce(
        okCharactersResponse(
          [
            {
              id: 1,
              nombre: "Iria",
              retrato: "https://img/1",
              sistemaDeJuego: "Dungeons and Dragons",
              usado: "2026-04-10T10:00:00",
            },
          ],
          true,
        ),
      )
      .mockResolvedValueOnce(
        okCharactersResponse(
          [
            {
              id: 2,
              nombre: "Nora",
              retrato: "https://img/2",
              sistemaDeJuego: "Dungeons and Dragons",
              usado: "2026-04-11T10:00:00",
            },
          ],
          false,
        ),
      );

    render(
      <CharactersScreen
        username="daria"
        avatarUrl="https://example.com/avatar.png"
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );

    expect(await screen.findByText("Iria")).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain(
      "/api/personajes?page=0&size=15",
    );

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre"), {
      target: { value: "iri" },
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls[1]?.[0]).toContain("nombre=iri");
    });

    fireEvent.click(screen.getByRole("button", { name: /Mostrar m[aá]s/i }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls[2]?.[0]).toContain("page=1");
    });
  });

  it("renders '+' placeholder button and opens filter panel", async () => {
    vi.mocked(fetch).mockResolvedValue(okCharactersResponse([], false));
    render(
      <CharactersScreen
        username="daria"
        avatarUrl=""
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );
    // Filter panel opens
    const filterBtn = await screen.findByRole("button", {
      name: "Filtros adicionales",
    });
    fireEvent.click(filterBtn);
    expect(screen.getByText("Sistema de juego")).toBeInTheDocument();
    // Toggle a system
    fireEvent.click(
      screen.getByRole("button", { name: /Dungeons and Dragons/i }),
    );
    expect(screen.getByText("1")).toBeInTheDocument(); // filter badge
    // Clear filters
    fireEvent.click(screen.getByText("Limpiar filtros"));
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("closes filter panel when clicking outside", async () => {
    vi.mocked(fetch).mockResolvedValue(okCharactersResponse([], false));
    render(
      <CharactersScreen
        username="daria"
        avatarUrl=""
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );
    const filterBtn = await screen.findByRole("button", {
      name: "Filtros adicionales",
    });
    fireEvent.click(filterBtn);
    expect(screen.getByText("Sistema de juego")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Sistema de juego")).not.toBeInTheDocument();
  });

  it("renders emoji placeholder for character without portrait", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okCharactersResponse(
        [
          {
            id: 10,
            nombre: "Sienna",
            retrato: undefined,
            sistemaDeJuego: "Dungeons and Dragons",
            usado: "2024-01-01T00:00:00Z",
          },
        ],
        false,
      ),
    );
    render(
      <CharactersScreen
        username="daria"
        avatarUrl=""
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );
    await waitFor(() => expect(screen.getByText("Sienna")).toBeInTheDocument());
    expect(screen.getByText("⚔")).toBeInTheDocument();
  });

  it("abre el modal de creación y navega al personaje DnD marcándolo como usado", async () => {
    const onCreateDndCharacter = vi.fn();
    const onOpenDndCharacterSheet = vi.fn();
    const onGoHome = vi.fn();
    const onGoCampaigns = vi.fn();
    const onGoCharacters = vi.fn();

    vi.mocked(fetch).mockResolvedValueOnce(
      okCharactersResponse(
        [
          {
            id: 1,
            nombre: "Iria",
            retrato: "https://img/1",
            sistemaDeJuego: "Dungeons and Dragons",
            usado: "2026-04-10T10:00:00",
          },
          {
            id: 2,
            nombre: "Marcus",
            retrato: "https://img/2",
            sistemaDeJuego: "Call Of Cthulhu",
            usado: "2026-04-10T10:00:00",
          },
        ],
        false,
      ),
    );

    render(
      <CharactersScreen
        username="daria"
        avatarUrl="https://example.com/avatar.png"
        onLogout={vi.fn()}
        onGoHome={onGoHome}
        onGoCampaigns={onGoCampaigns}
        onGoCharacters={onGoCharacters}
        onCreateDndCharacter={onCreateDndCharacter}
        onOpenDndCharacterSheet={onOpenDndCharacterSheet}
      />,
    );

    expect(await screen.findByText("Iria")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Crear" })[0]);
    expect(
      await screen.findByText("Elige el sistema de juego"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen
        .getByText("Crear personaje por fases.")
        .closest("button") as HTMLButtonElement,
    );
    expect(onCreateDndCharacter).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Iria/i }));

    await waitFor(() => {
      expect(markCharacterAsUsed).toHaveBeenCalledWith("token", "1");
      expect(onOpenDndCharacterSheet).toHaveBeenCalledWith("1");
    });

    expect(screen.getByRole("button", { name: /Marcus/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "nav home" }));
    fireEvent.click(screen.getByRole("button", { name: "nav campaigns" }));
    fireEvent.click(screen.getByRole("button", { name: "nav characters" }));

    expect(onGoHome).toHaveBeenCalledTimes(1);
    expect(onGoCampaigns).toHaveBeenCalledTimes(1);
    expect(onGoCharacters).toHaveBeenCalledTimes(1);
  });
});

function okCharactersResponse(items: unknown[], hasMore: boolean): Response {
  return new Response(JSON.stringify({ items, hasMore }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
