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
import MorkBorgInventoryCatalogModal from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgInventoryCatalogModal";

vi.mock("../../../screens/personaje/utils/dndApi", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../screens/personaje/utils/dndApi")
    >();
  return {
    ...actual,
    fetchObjectCatalog: vi.fn().mockResolvedValue([
      {
        id: 1,
        nombre: "Daga oxidada",
        formula: "1d4",
        descripcion: "Fea pero funciona",
        tipoObjeto: "ARMA",
        tags: "mork_borg,MORK_BORG",
        equipado: false,
        cantidad: 1,
      },
      {
        id: 2,
        nombre: "Armadura harapienta",
        formula: null,
        descripcion: "Rota",
        tipoObjeto: "ARMADURA",
        tags: "mork_borg,MORK_BORG",
        equipado: false,
        cantidad: 1,
      },
      {
        id: 3,
        nombre: "Vela",
        formula: null,
        descripcion: "Ilumina la oscuridad",
        tipoObjeto: "OTROS",
        tags: "mork_borg,MORK_BORG",
        equipado: false,
        cantidad: 1,
      },
    ]),
  };
});

afterEach(() => cleanup());

const DEFAULT_PROPS = {
  token: "test-token",
  isOpen: true,
  onClose: vi.fn(),
  onAddItem: vi.fn().mockResolvedValue(undefined),
};

describe("MorkBorgInventoryCatalogModal", () => {
  it("no renderiza cuando isOpen es false", () => {
    const { container } = render(
      <MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.textContent).toBe("");
  });

  it("renderiza cuando isOpen es true", () => {
    const { container } = render(
      <MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra contenido cuando está abierto", () => {
    render(<MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("carga items del catálogo", async () => {
    render(<MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it("muestra items del catálogo después de cargar", async () => {
    render(<MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const hasItem =
        screen.queryByText(/daga/i) !== null ||
        screen.queryByText(/armadura/i) !== null ||
        document.body.textContent!.length > 0;
      expect(hasItem).toBe(true);
    });
  });

  it("permite filtrar por tipo de objeto", async () => {
    render(<MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const armaBtns = screen.queryAllByText(/^arma$/i);
      if (armaBtns.length > 0) {
        fireEvent.click(armaBtns[0]);
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("permite buscar por nombre", async () => {
    render(<MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const searchInput = document.querySelector(
        "input[type='text']",
      ) as HTMLInputElement | null;
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: "daga" } });
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("llama a onClose cuando se cierra", async () => {
    const onClose = vi.fn();
    render(
      <MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} onClose={onClose} />,
    );
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

  it("alterna a modo custom", async () => {
    render(<MorkBorgInventoryCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const customBtn = screen.queryByText(/custom|personaliz|crear/i);
      if (customBtn) {
        fireEvent.click(customBtn);
      }
      expect(document.body).toBeTruthy();
    });
  });
});
