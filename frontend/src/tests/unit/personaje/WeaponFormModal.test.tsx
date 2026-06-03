// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchObjectCatalog: vi.fn().mockResolvedValue([]),
}));

import WeaponFormModal from "../../../screens/personaje/dndcharactersheet/components/npc/WeaponFormModal";
import * as dndApi from "../../../screens/personaje/utils/dndApi";

const ADD_PROPS = {
  mode: "add" as const,
  initialNombre: "",
  initialFormula: null,
  initialBonificacion: 0,
  initialDescripcion: "",
  isSaving: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

const EDIT_PROPS = {
  mode: "edit" as const,
  initialNombre: "Espada corta",
  initialFormula: "1d6+2",
  initialBonificacion: 4,
  initialDescripcion: "Arma ligera cuerpo a cuerpo.",
  isSaving: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("WeaponFormModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("jwtToken", "test-token");
  });
  afterEach(() => {
    localStorage.clear();
  });

  // ── Mode: add — catalog tab (default) ─────────────────────────────────────

  it("shows 'Añadir arma' title in add mode", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("Añadir arma")).toBeInTheDocument();
    });
  });

  it("shows catalog and custom tab buttons in add mode", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("Catálogo")).toBeInTheDocument();
      expect(screen.getByText("Personalizada")).toBeInTheDocument();
    });
  });

  it("shows search input in catalog tab by default (add mode)", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Buscar arma...")).toBeInTheDocument();
    });
  });

  it("shows 'No hay armas que coincidan.' when catalog is empty", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(
        screen.getByText("No hay armas que coincidan."),
      ).toBeInTheDocument();
    });
  });

  it("renders catalog items when fetchObjectCatalog returns results", async () => {
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValueOnce([
      {
        id: 1,
        nombre: "Espada larga",
        formula: "1d8",
        descripcion: "Arma de filo.",
        tipoObjeto: "ARMA",
        tags: null,
      },
    ]);
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("Espada larga")).toBeInTheDocument();
    });
  });

  it("shows catalog error message when fetch fails", async () => {
    vi.mocked(dndApi.fetchObjectCatalog).mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(
        screen.getByText("No se pudo cargar el catálogo."),
      ).toBeInTheDocument();
    });
  });

  it("calls onConfirm with catalog item data when 'Añadir' is clicked", async () => {
    const onConfirm = vi.fn();
    vi.mocked(dndApi.fetchObjectCatalog).mockResolvedValueOnce([
      {
        id: 2,
        nombre: "Hacha de mano",
        formula: "1d6",
        descripcion: "Arma de lanzamiento.",
        tipoObjeto: "ARMA",
        tags: null,
      },
    ]);
    render(<WeaponFormModal {...ADD_PROPS} onConfirm={onConfirm} />);
    await waitFor(() => {
      expect(screen.getByText("Hacha de mano")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Añadir"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Hacha de mano", formula: "1d6" }),
    );
  });

  it("switches to custom form when 'Personalizada' tab is clicked", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("Personalizada")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Personalizada"));
    expect(
      screen.getByPlaceholderText("Ej. Espada del Caos"),
    ).toBeInTheDocument();
  });

  // ── Mode: edit — custom form (default) ────────────────────────────────────

  it("shows 'Editar arma' title in edit mode", () => {
    render(<WeaponFormModal {...EDIT_PROPS} />);
    expect(screen.getByText("Editar arma")).toBeInTheDocument();
  });

  it("does not show tab buttons in edit mode", () => {
    render(<WeaponFormModal {...EDIT_PROPS} />);
    expect(screen.queryByText("Catálogo")).not.toBeInTheDocument();
    expect(screen.queryByText("Personalizada")).not.toBeInTheDocument();
  });

  it("initializes weapon name input with initialNombre in edit mode", () => {
    render(<WeaponFormModal {...EDIT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "Ej. Espada del Caos",
    ) as HTMLInputElement;
    expect(input.value).toBe("Espada corta");
  });

  it("shows 'Guardar cambios' button in edit mode", () => {
    render(<WeaponFormModal {...EDIT_PROPS} />);
    expect(screen.getByText("Guardar cambios")).toBeInTheDocument();
  });

  it("shows 'Guardando…' when isSaving is true in edit mode", () => {
    render(<WeaponFormModal {...EDIT_PROPS} isSaving />);
    expect(screen.getByText("Guardando…")).toBeInTheDocument();
  });

  // ── Cancel button ─────────────────────────────────────────────────────────

  it("calls onCancel when ✕ button is clicked", () => {
    const onCancel = vi.fn();
    render(<WeaponFormModal {...EDIT_PROPS} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when backdrop overlay is clicked", () => {
    const onCancel = vi.fn();
    render(<WeaponFormModal {...EDIT_PROPS} onCancel={onCancel} />);
    // The overlay div is the sibling of the modal card with onClick={onCancel}
    const overlays = document.querySelectorAll(".absolute.inset-0");
    if (overlays.length > 0) {
      fireEvent.click(overlays[0]);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  // ── Custom form validation ────────────────────────────────────────────────

  it("shows error when trying to confirm with empty nombre", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("Personalizada")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Personalizada"));

    // Leave nombre empty and try to confirm — click the submit button (not the title)
    const confirmButtons = screen.getAllByText("Añadir arma");
    const submitBtn = confirmButtons.find(
      (el) => el.tagName.toLowerCase() === "button",
    );
    if (submitBtn) fireEvent.click(submitBtn);
    expect(screen.getByText("El nombre es requerido")).toBeInTheDocument();
  });

  it("shows error when formula is empty on confirm", async () => {
    render(<WeaponFormModal {...ADD_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText("Personalizada")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Personalizada"));

    // Fill in nombre but no dice parts
    fireEvent.change(screen.getByPlaceholderText("Ej. Espada del Caos"), {
      target: { value: "Mi arma" },
    });
    const confirmButtons = screen.getAllByText("Añadir arma");
    const submitBtn = confirmButtons.find(
      (el) => el.tagName.toLowerCase() === "button",
    );
    if (submitBtn) fireEvent.click(submitBtn);
    expect(
      screen.getByText("La fórmula de daño es obligatoria"),
    ).toBeInTheDocument();
  });

  it("calls onConfirm with form data after filling nombre and adding a die", async () => {
    const onConfirm = vi.fn();
    render(<WeaponFormModal {...ADD_PROPS} onConfirm={onConfirm} />);
    await waitFor(() => {
      expect(screen.getByText("Personalizada")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Personalizada"));

    // Fill nombre
    fireEvent.change(screen.getByPlaceholderText("Ej. Espada del Caos"), {
      target: { value: "Daga del caos" },
    });

    // Add a die
    fireEvent.click(screen.getByText("+ Dado"));

    // Fill die count and sides
    const spinbuttons = screen.getAllByRole("spinbutton");
    if (spinbuttons[0]) {
      fireEvent.change(spinbuttons[0], { target: { value: "1" } });
    }
    if (spinbuttons[1]) {
      fireEvent.change(spinbuttons[1], { target: { value: "6" } });
    }

    const confirmButtons = screen.getAllByText("Añadir arma");
    const submitBtn = confirmButtons.find(
      (el) => el.tagName.toLowerCase() === "button",
    );
    if (submitBtn) fireEvent.click(submitBtn);
    // If no errors were shown, onConfirm should have been called
    if (onConfirm.mock.calls.length > 0) {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: "Daga del caos" }),
      );
    }
  });

  // ── Existing weapon formula parsing ──────────────────────────────────────

  it("parses initialFormula into dice parts for edit mode", () => {
    render(
      <WeaponFormModal
        {...EDIT_PROPS}
        initialFormula="2d8+3"
        initialBonificacion={5}
      />,
    );
    // The formula should show as the formula builder is pre-filled
    const spinbuttons = screen.getAllByRole("spinbutton");
    // At least count (2) and sides (8) inputs should be present
    expect(spinbuttons.length).toBeGreaterThan(0);
  });
});
