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

vi.mock("../../../components/LogoLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../../../components/UserMenu", () => ({
  default: () => <div>user menu</div>,
}));

vi.mock("../../../components/HomeNavbar", () => ({
  default: () => <div>navbar</div>,
}));

describe("CharactersScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    cleanup();
  });

  it("carga personajes, busca por nombre y carga mas resultados", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 1,
              nombre: "Aria",
              retrato: "https://img/1",
              sistemaDeJuego: "Dungeons and Dragons",
              usado: "2026-04-10T10:00:00",
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
              nombre: "Bram",
              retrato: "https://img/2",
              sistemaDeJuego: "Call Of Cthulhu",
              usado: "2026-04-09T10:00:00",
            },
          ],
          hasMore: false,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], hasMore: false }),
      } as Response);

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

    expect(await screen.findByText("Aria")).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain(
      "/api/personajes?page=0&size=15",
    );

    fireEvent.click(screen.getByRole("button", { name: "Mostrar mas" }));
    expect(await screen.findByText("Bram")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre"), {
      target: { value: "zzz" },
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls[2]?.[0]).toContain("nombre=zzz");
    });
  });

  it("muestra mensaje vacio cuando la carga falla", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

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

    expect(
      await screen.findByText(
        "No hay personajes que coincidan con la busqueda o los filtros.",
      ),
    ).toBeInTheDocument();
  });
});
