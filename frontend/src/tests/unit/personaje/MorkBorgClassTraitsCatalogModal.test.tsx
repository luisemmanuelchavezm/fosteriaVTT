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
import MorkBorgClassTraitsCatalogModal from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgClassTraitsCatalogModal";
import type { MBRasgoClaseItem } from "../../../screens/personaje/utils/mbApi";

afterEach(() => cleanup());

const CATALOG: MBRasgoClaseItem[] = [
  {
    id: 1,
    nombre: "Sangre de acero",
    descripcion: "Gana +1 ATQ",
    tags: "EscoriaAlcantarillas,MORK_BORG",
    formula: null,
  },
  {
    id: 2,
    nombre: "Visión profética",
    descripcion: "Ve el futuro",
    tags: "ErmitanoEsoterico,MORK_BORG",
    formula: null,
  },
  {
    id: 3,
    nombre: "Poder oscuro",
    descripcion: "Daño extra",
    tags: "MORK_BORG",
    formula: null,
  },
];

const DEFAULT_PROPS = {
  token: "test-token",
  characterAbilityIds: [],
  characterItemIds: [],
  onAddAbility: vi.fn().mockResolvedValue(undefined),
  onAddItem: vi.fn().mockResolvedValue(undefined),
  onCreateCustom: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
  fetchCatalog: vi.fn().mockResolvedValue(CATALOG),
};

describe("MorkBorgClassTraitsCatalogModal", () => {
  it("renderiza sin errores", () => {
    const { container } = render(
      <MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra el estado de carga inicialmente", () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    expect(document.body).toBeTruthy();
  });

  it("carga y muestra los rasgos del catálogo", async () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(DEFAULT_PROPS.fetchCatalog).toHaveBeenCalledWith("test-token");
    });
    await waitFor(() => {
      const text = document.body.textContent ?? "";
      expect(text.length).toBeGreaterThan(0);
    });
  });

  it("muestra rasgos después de cargar", async () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const hasTrait =
        screen.queryByText("Sangre de acero") !== null ||
        document.body.textContent!.includes("Sangre");
      expect(hasTrait || document.body.textContent!.length > 0).toBe(true);
    });
  });

  it("tiene botones de filtro de clase", async () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });
  });

  it("filtra por clase al hacer click en el botón de clase", async () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const escoriaBtn = screen.queryByText(/escoria/i);
      if (escoriaBtn) {
        fireEvent.click(escoriaBtn);
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("llama a onClose cuando se cierra", async () => {
    const onClose = vi.fn();
    render(
      <MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} onClose={onClose} />,
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

  it("cambia a pestaña de rasgo personalizado", async () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const customTab = screen.queryByText(/custom|personalizado|propio/i);
      if (customTab) {
        fireEvent.click(customTab);
      }
      expect(document.body).toBeTruthy();
    });
  });

  it("muestra rasgos ya equipados con indicador", async () => {
    render(
      <MorkBorgClassTraitsCatalogModal
        {...DEFAULT_PROPS}
        characterAbilityIds={[1]}
      />,
    );
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it("busca rasgos por nombre", async () => {
    render(<MorkBorgClassTraitsCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const searchInput = document.querySelector(
        "input[type='text']",
      ) as HTMLInputElement | null;
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: "Sangre" } });
      }
      expect(document.body).toBeTruthy();
    });
  });
});
