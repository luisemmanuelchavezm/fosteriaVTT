// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchObjectCatalog: vi.fn().mockResolvedValue([]),
}));

import InventoryCatalogModal from "../../../screens/personaje/dndcharactersheet/components/InventoryCatalogModal";
import * as dndApi from "../../../screens/personaje/utils/dndApi";

const DEFAULT_PROPS = {
  token: "test-token",
  isOpen: true,
  onClose: vi.fn(),
  onAddItem: vi.fn().mockResolvedValue(undefined),
};

describe("InventoryCatalogModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValue([]);
  });

  // ── Visibility ────────────────────────────────────────────────────────────

  it("renders null when isOpen is false", () => {
    const { container } = render(
      <InventoryCatalogModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Añadir nuevo objeto")).toBeInTheDocument();
  });

  it("renders 'Mochila' subtitle", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Mochila")).toBeInTheDocument();
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────

  it("renders Catálogo and Custom tab buttons", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("shows ExistingInventoryCatalogTab by default (Catálogo tab)", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByPlaceholderText("Filtrar por nombre"),
    ).toBeInTheDocument();
  });

  it("does not show Crear button in Catálogo mode", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Crear")).not.toBeInTheDocument();
  });

  it("switches to Custom tab when Custom button is clicked", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Custom"));
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Crear")).toBeInTheDocument();
  });

  it("switches back to Catálogo tab when Catálogo button is clicked", () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Custom"));
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Catálogo"));
    expect(screen.queryByText("Nombre")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Filtrar por nombre"),
    ).toBeInTheDocument();
  });

  // ── Close & Cancel ────────────────────────────────────────────────────────

  it("calls onClose when close (×) button is clicked", () => {
    const onClose = vi.fn();
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Cerrar modal de objetos"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancelar button is clicked", () => {
    const onClose = vi.fn();
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Catalog fetch ─────────────────────────────────────────────────────────

  it("calls fetchObjectCatalog with token when open in catalog mode", async () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(vi.mocked(dndApi.fetchObjectCatalog)).toHaveBeenCalled(),
      { timeout: 2000 },
    );
  });

  it("shows catalog items after fetch resolves", async () => {
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValueOnce([
      {
        id: 1,
        nombre: "Espada larga",
        formula: "1d8",
        descripcion: "Arma de filo.",
        tipoObjeto: "ARMA",
      },
    ]);
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(screen.getByText("Espada larga")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows error message when fetch fails", async () => {
    vi.mocked(dndApi.fetchObjectCatalog).mockRejectedValueOnce(
      new Error("Error de conexión"),
    );
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(screen.getByText("Error de conexión")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows empty state when fetch returns empty array", async () => {
    // beforeEach already sets mockResolvedValue([]) as default; no one-time override needed
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () =>
        expect(
          screen.getByText(
            "No hay objetos que coincidan con el filtro actual.",
          ),
        ).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  // ── Add existing item ─────────────────────────────────────────────────────

  it("calls onAddItem with objetoId and cantidad:1 when Añadir is clicked", async () => {
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValueOnce([
      {
        id: 5,
        nombre: "Poción de curación",
        formula: null,
        descripcion: null,
        tipoObjeto: "CONSUMIBLE",
      },
    ]);
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onAddItem={onAddItem} />);
    await waitFor(
      () => expect(screen.getByText("Poción de curación")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    fireEvent.click(screen.getByText("Añadir"));
    await waitFor(() =>
      expect(onAddItem).toHaveBeenCalledWith({ objetoId: 5, cantidad: 1 }),
    );
  });

  it("closes modal after successfully adding existing item", async () => {
    const onClose = vi.fn();
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValueOnce([
      {
        id: 7,
        nombre: "Antorcha",
        formula: null,
        descripcion: null,
        tipoObjeto: "MISCELANEO",
      },
    ]);
    render(
      <InventoryCatalogModal
        {...DEFAULT_PROPS}
        onClose={onClose}
        onAddItem={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    await waitFor(
      () => expect(screen.getByText("Antorcha")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    fireEvent.click(screen.getByText("Añadir"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows submitError when handleAddExisting fails", async () => {
    const onAddItem = vi
      .fn()
      .mockRejectedValueOnce(new Error("Sin espacio en la mochila"));
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValueOnce([
      {
        id: 3,
        nombre: "Daga",
        formula: "1d4",
        descripcion: null,
        tipoObjeto: "ARMA",
      },
    ]);
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onAddItem={onAddItem} />);
    await waitFor(() => expect(screen.getByText("Daga")).toBeInTheDocument(), {
      timeout: 2000,
    });
    fireEvent.click(screen.getByText("Añadir"));
    await waitFor(() =>
      expect(screen.getByText("Sin espacio en la mochila")).toBeInTheDocument(),
    );
  });

  // ── Custom item creation ──────────────────────────────────────────────────

  it("shows error 'Debes indicar un nombre' when trying to create with empty name", async () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Custom"));
    fireEvent.click(screen.getByText("Crear"));
    await waitFor(() =>
      expect(
        screen.getByText("Debes indicar un nombre para el objeto."),
      ).toBeInTheDocument(),
    );
  });

  it("calls onAddItem when creating custom item with a valid name", async () => {
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onAddItem={onAddItem} />);
    fireEvent.click(screen.getByText("Custom"));
    // Fill in the name (first textbox)
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Amuleto de fuego" } });
    fireEvent.click(screen.getByText("Crear"));
    await waitFor(() => expect(onAddItem).toHaveBeenCalled());
  });

  it("calls onAddItem with correct nombre when creating custom item", async () => {
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onAddItem={onAddItem} />);
    fireEvent.click(screen.getByText("Custom"));
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Orbe arcano" } });
    fireEvent.click(screen.getByText("Crear"));
    await waitFor(() =>
      expect(onAddItem).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: "Orbe arcano", cantidad: 1 }),
      ),
    );
  });

  it("closes modal after successfully creating custom item", async () => {
    const onClose = vi.fn();
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    render(
      <InventoryCatalogModal
        {...DEFAULT_PROPS}
        onClose={onClose}
        onAddItem={onAddItem}
      />,
    );
    fireEvent.click(screen.getByText("Custom"));
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Varita mágica" } });
    fireEvent.click(screen.getByText("Crear"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows error when handleCreateCustom fails", async () => {
    const onAddItem = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fallo al guardar"));
    render(<InventoryCatalogModal {...DEFAULT_PROPS} onAddItem={onAddItem} />);
    fireEvent.click(screen.getByText("Custom"));
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Objeto roto" } });
    fireEvent.click(screen.getByText("Crear"));
    await waitFor(() =>
      expect(screen.getByText("Fallo al guardar")).toBeInTheDocument(),
    );
  });

  // ── doesnt fetch when in custom mode ─────────────────────────────────────

  it("does not call fetchObjectCatalog when in custom mode", async () => {
    render(<InventoryCatalogModal {...DEFAULT_PROPS} />);
    // Switch to custom immediately before the debounce fires
    fireEvent.click(screen.getByText("Custom"));
    // Wait enough time; fetch should NOT have been called
    await new Promise((r) => setTimeout(r, 300));
    expect(vi.mocked(dndApi.fetchObjectCatalog)).not.toHaveBeenCalled();
  });
});
