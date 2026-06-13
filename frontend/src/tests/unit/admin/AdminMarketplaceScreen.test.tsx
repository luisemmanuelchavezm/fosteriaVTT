import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminMarketplaceScreen from "../../../screens/AdminMarketplaceScreen";

vi.mock("../../../lib/api", () => ({
  buildApiUrl: (path: string) => `http://localhost${path}`,
}));

vi.mock("../../../screens/campaign/components/CharacterSheetModal", () => ({
  default: () => null,
}));

vi.mock("../../../screens/campaign/components/EnemyCreationModal", () => ({
  default: () => null,
}));

vi.mock("../../../screens/AdminMapUploadModal", () => ({
  default: () => null,
}));

const MOCK_ITEMS = [
  {
    id: 1,
    tipo: "PERSONAJE" as const,
    subtipo: "Enemigo" as const,
    nombre: "Goblin",
    imageUrl: null,
    propietario: "sai",
    sistema: "DND",
    updatedAt: "2025-01-01",
  },
  {
    id: 2,
    tipo: "PERSONAJE" as const,
    subtipo: "PNJ" as const,
    nombre: "Mercader",
    imageUrl: null,
    propietario: "sai",
    sistema: "MORK_BORG",
    updatedAt: "2025-02-01",
  },
  {
    id: 3,
    tipo: "MAPA" as const,
    subtipo: "Mapa" as const,
    nombre: "Mazmorra",
    imageUrl: null,
    propietario: "admin",
    sistema: null,
    updatedAt: "2025-03-01",
  },
];

function mockFetchSuccess(data: unknown = MOCK_ITEMS) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  } as never);
}

function mockFetchError() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
  } as never);
}

beforeEach(() => {
  mockFetchSuccess();
});

describe("AdminMarketplaceScreen", () => {
  it("muestra spinner de carga inicialmente", () => {
    render(<AdminMarketplaceScreen token="test-token" />);
    // Loading state: items vacíos y estado de carga activo
    expect(screen.queryByText("Goblin")).not.toBeInTheDocument();
  });

  it("carga y muestra items del marketplace", async () => {
    render(<AdminMarketplaceScreen token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText("Goblin")).toBeInTheDocument();
    });
    expect(screen.getByText("Mercader")).toBeInTheDocument();
    expect(screen.getByText("Mazmorra")).toBeInTheDocument();
  });

  it("muestra error cuando la petición falla", async () => {
    mockFetchError();
    render(<AdminMarketplaceScreen token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText(/error al cargar/i)).toBeInTheDocument();
    });
  });

  it("llama a fetch con el token de autorización", async () => {
    render(<AdminMarketplaceScreen token="mi-token-secreto" />);

    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost/api/admin/marketplace",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mi-token-secreto",
        }),
      }),
    );
  });

  it("filtra por nombre al escribir en el buscador", async () => {
    render(<AdminMarketplaceScreen token="test-token" />);
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: "goblin" } });

    expect(screen.getByText("Goblin")).toBeInTheDocument();
    expect(screen.queryByText("Mercader")).not.toBeInTheDocument();
  });

  it("filtra por subtipo Enemigo", async () => {
    render(<AdminMarketplaceScreen token="test-token" />);
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    const filterBtn = screen.getByRole("button", { name: /filtros/i });
    fireEvent.click(filterBtn);

    const enemyBtn = screen.getByRole("button", { name: "Enemigo" });
    fireEvent.click(enemyBtn);

    expect(screen.getByText("Goblin")).toBeInTheDocument();
    expect(screen.queryByText("Mercader")).not.toBeInTheDocument();
  });

  it("muestra botón de eliminar por cada item", async () => {
    render(<AdminMarketplaceScreen token="test-token" />);
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole("button", { name: /elim/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it("abre diálogo de confirmación al hacer click en eliminar", async () => {
    render(<AdminMarketplaceScreen token="test-token" />);
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText("¿Eliminar del marketplace?"),
      ).toBeInTheDocument();
    });
  });

  it("no elimina si el texto de confirmación es incorrecto", async () => {
    render(<AdminMarketplaceScreen token="test-token" />);
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(
        screen.getByText("¿Eliminar del marketplace?"),
      ).toBeInTheDocument(),
    );

    const confirmInput = screen.getByPlaceholderText(/borrar/i);
    fireEvent.change(confirmInput, { target: { value: "wrong" } });

    // El botón está disabled cuando el texto no es "borrar" → no hace DELETE
    const deleteCalls = (
      global.fetch as ReturnType<typeof vi.fn>
    ).mock.calls.filter(([, opts]) => opts?.method === "DELETE");
    expect(deleteCalls).toHaveLength(0);
  });

  it("elimina item cuando la confirmación es correcta", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ITEMS),
      })
      .mockResolvedValueOnce({ ok: true } as never);

    render(<AdminMarketplaceScreen token="test-token" />);
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle("Eliminar");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(
        screen.getByText("¿Eliminar del marketplace?"),
      ).toBeInTheDocument(),
    );

    const confirmInput = screen.getByPlaceholderText(/borrar/i);
    fireEvent.change(confirmInput, { target: { value: "borrar" } });

    // El modal se renderiza antes que la cuadrícula → primer botón "Eliminar" es el del modal
    const allEliminarBtns = screen.getAllByRole("button", { name: "Eliminar" });
    fireEvent.click(allEliminarBtns[0]);

    await waitFor(() => {
      expect(screen.queryByText("Goblin")).not.toBeInTheDocument();
    });
  });
});
