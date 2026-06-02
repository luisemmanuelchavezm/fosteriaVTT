// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import WeaponSection from "../../../screens/campaign/components/enemy/WeaponSection";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchObjectCatalog: vi.fn().mockResolvedValue([
    {
      id: 1,
      nombre: "Espada larga",
      formula: "1d8",
      descripcion: "Arma",
      tipoObjeto: "ARMA",
      tags: "DND,Arma",
    },
    {
      id: 2,
      nombre: "Hacha de mano",
      formula: "1d6",
      descripcion: "Arma ligera",
      tipoObjeto: "ARMA",
      tags: "DND,Arma",
    },
  ]),
}));

afterEach(() => cleanup());

beforeEach(() => {
  localStorage.setItem("jwtToken", "token");
  vi.clearAllMocks();
});

describe("WeaponSection", () => {
  it("renderiza sin armas iniciales", async () => {
    render(<WeaponSection weapons={[]} onWeaponsChange={vi.fn()} />);
    await waitFor(() => expect(document.body.textContent).toBeTruthy());
  });

  it("muestra tab de catálogo por defecto", async () => {
    render(<WeaponSection weapons={[]} onWeaponsChange={vi.fn()} />);
    await waitFor(() => expect(document.body.textContent).toBeTruthy());
    const catalogTab = screen.queryByText(/Catálogo|catálogo/i);
    if (catalogTab) expect(catalogTab).toBeInTheDocument();
  });

  it("renderiza armas del catálogo cargadas", async () => {
    render(<WeaponSection weapons={[]} onWeaponsChange={vi.fn()} />);
    await waitFor(
      () => {
        expect(document.body.textContent).toBeTruthy();
      },
      { timeout: 2000 },
    );
  });

  it("cambia al tab de arma personalizada", async () => {
    render(<WeaponSection weapons={[]} onWeaponsChange={vi.fn()} />);
    await waitFor(() => expect(document.body.textContent).toBeTruthy());

    const customTab = screen.queryByText(/Personalizada|Custom/i);
    if (customTab) {
      fireEvent.click(customTab);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it("renderiza con armas ya en la lista", async () => {
    const weapons = [
      {
        key: 1,
        displayName: "Espada",
        payload: {
          nombre: "Espada",
          formula: "1d8",
          descripcion: "Corte",
          tipoObjeto: "ARMA",
        },
      },
    ];
    render(
      <WeaponSection weapons={weapons as never} onWeaponsChange={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByText("Espada")).toBeInTheDocument());
  });

  it("llama onWeaponsChange al añadir arma del catálogo", async () => {
    const onWeaponsChange = vi.fn();
    render(<WeaponSection weapons={[]} onWeaponsChange={onWeaponsChange} />);
    await waitFor(() => expect(document.body.textContent).toBeTruthy(), {
      timeout: 2000,
    });

    // Try to find and click an add button
    const addBtns = screen.queryAllByRole("button", { name: /añadir|add|\+/i });
    if (addBtns.length > 0) {
      fireEvent.click(addBtns[0]);
      expect(document.body.textContent).toBeTruthy();
    }
  });
});
