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

describe("CampaignsScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    cleanup();
  });

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

    render(
      <CampaignsScreen
        username="daria"
        avatarUrl="https://example.com/avatar.png"
        onLogout={vi.fn()}
        onGoHome={vi.fn()}
        onGoCampaigns={vi.fn()}
        onGoCharacters={vi.fn()}
      />,
    );

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

  it("muestra mensaje vacio cuando la peticion falla", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    render(
      <CampaignsScreen
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
        "No hay campañas que coincidan con la busqueda o los filtros.",
      ),
    ).toBeInTheDocument();
  });
});
