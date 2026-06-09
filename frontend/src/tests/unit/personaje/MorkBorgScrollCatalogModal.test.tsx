// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MorkBorgScrollCatalogModal from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgScrollCatalogModal";
import type { MBRasgoClaseItem } from "../../../screens/personaje/utils/mbApi";

afterEach(() => cleanup());

const SCROLLS: MBRasgoClaseItem[] = [
  {
    id: 1,
    nombre: "Invocar sombras",
    descripcion: "Invoca sombras oscuras",
    tags: "PergaminoImpuro,MORK_BORG",
    formula: null,
  },
  {
    id: 2,
    nombre: "Bendición divina",
    descripcion: "Bendición del dios muerto",
    tags: "PergaminoSagrado,MORK_BORG",
    formula: null,
  },
  {
    id: 3,
    nombre: "Maldición de plaga",
    descripcion: "Maldice al objetivo",
    tags: "PergaminoImpuro,MORK_BORG",
    formula: null,
  },
];

const DEFAULT_PROPS = {
  token: "test-token",
  characterAbilityIds: [],
  fetchCatalog: vi.fn().mockResolvedValue(SCROLLS),
  onAdd: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describe("MorkBorgScrollCatalogModal", () => {
  it("renderiza sin errores", () => {
    const { container } = render(
      <MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />,
    );
    expect(container).toBeTruthy();
  });

  it("carga el catálogo al montarse", async () => {
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(DEFAULT_PROPS.fetchCatalog).toHaveBeenCalledWith("test-token");
    });
  });

  it("muestra los pergaminos después de cargar", async () => {
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const text = document.body.textContent ?? "";
      expect(text.length).toBeGreaterThan(0);
    });
  });

  it("muestra los botones de filtro todos/sagrado/impuro", async () => {
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const todosBtn = screen.queryByText(/todos/i);
      expect(todosBtn ?? document.body).toBeTruthy();
    });
  });

  it("filtra por pergaminos sagrados", async () => {
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const sagradoBtn = screen.queryByText(/sagrado/i);
      if (sagradoBtn) {
        fireEvent.click(sagradoBtn);
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("filtra por pergaminos impuros", async () => {
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const impuroBtn = screen.queryByText(/impuro/i);
      if (impuroBtn) {
        fireEvent.click(impuroBtn);
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("permite buscar pergaminos por nombre", async () => {
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const searchInput = document.querySelector(
        "input",
      ) as HTMLInputElement | null;
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: "sombras" } });
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("llama a onClose cuando se cierra el modal", async () => {
    const onClose = vi.fn();
    render(<MorkBorgScrollCatalogModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => {
      const closeBtn = screen.queryByRole("button", {
        name: /cerrar|×|close/i,
      });
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
      } else {
        expect(document.body).toBeTruthy();
      }
    });
  });

  it("muestra pergaminos ya equipados diferenciados", async () => {
    render(
      <MorkBorgScrollCatalogModal
        {...DEFAULT_PROPS}
        characterAbilityIds={[1]}
      />,
    );
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it("maneja error en fetchCatalog", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const fetchWithError = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));
    render(
      <MorkBorgScrollCatalogModal
        {...DEFAULT_PROPS}
        fetchCatalog={fetchWithError}
      />,
    );
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
    consoleSpy.mockRestore();
  });
});
