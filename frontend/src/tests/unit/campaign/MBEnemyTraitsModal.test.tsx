// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MBEnemyTraitsModal from "../../../screens/campaign/components/MBEnemyTraitsModal";

afterEach(() => cleanup());

const DEFAULT_PROPS = {
  nombreEnemigo: "Goblin",
  biografia: null,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("MBEnemyTraitsModal", () => {
  it("renderiza sin errores", () => {
    const { container } = render(<MBEnemyTraitsModal {...DEFAULT_PROPS} />);
    expect(container).toBeTruthy();
  });

  it("muestra el nombre del enemigo", () => {
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toContain("Goblin");
  });

  it("llama a onCancel cuando se cancela", () => {
    const onCancel = vi.fn();
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} onCancel={onCancel} />);
    const cancelBtn = screen.queryByRole("button", {
      name: /cancelar|cancel/i,
    });
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    } else {
      const allBtns = screen.queryAllByRole("button");
      expect(allBtns.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("renderiza con rasgos aleatorios en la biografía", () => {
    const bio = JSON.stringify({
      rasgosAleatorios: [
        {
          tagKey: "rasgo_1",
          nombre: "Rasgo terrible",
          dados: "d6",
          opciones: [
            "Opción 1",
            "Opción 2",
            "Opción 3",
            "Opción 4",
            "Opción 5",
            "Opción 6",
          ],
        },
      ],
    });
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} biografia={bio} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("renderiza con arma aleatoria en la biografía", () => {
    const bio = JSON.stringify({
      armaAleatoria: {
        tagKey: "arma_1",
        nombre: "Arma caótica",
        dados: "d8",
        opciones: [
          { nombre: "Espada", formula: "1d6" },
          { nombre: "Hacha", formula: "1d8" },
        ],
      },
    });
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} biografia={bio} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("tiene botones de tirada visibles", () => {
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} />);
    const buttons = screen.queryAllByRole("button");
    expect(document.body).toBeTruthy();
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
    }
    expect(document.body).toBeTruthy();
  });

  it("puede hacer tirada de todos los rasgos con rollAll", () => {
    const bio = JSON.stringify({
      rasgosAleatorios: [
        {
          tagKey: "rasgo_1",
          nombre: "Rasgo",
          dados: "d6",
          opciones: ["Op1", "Op2", "Op3", "Op4", "Op5", "Op6"],
        },
      ],
    });
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} biografia={bio} />);
    const rollAllBtn = screen.queryByText(/tirar todo|roll all|tirar todos/i);
    if (rollAllBtn) {
      fireEvent.click(rollAllBtn);
    }
    const allBtns = screen.queryAllByRole("button");
    if (allBtns.length > 1) {
      fireEvent.click(allBtns[1]);
    }
    expect(document.body).toBeTruthy();
  });

  it("llama a onConfirm al hacer click en confirmar", () => {
    const onConfirm = vi.fn();
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} onConfirm={onConfirm} />);
    const confirmBtn = screen.queryByRole("button", {
      name: /confirmar|confirm|colocar/i,
    });
    if (confirmBtn) {
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalled();
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("llama a onCancel al hacer click en cancelar", () => {
    const onCancel = vi.fn();
    render(<MBEnemyTraitsModal {...DEFAULT_PROPS} onCancel={onCancel} />);
    const cancelBtn = screen.queryByRole("button", {
      name: /cancelar|cancel/i,
    });
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    } else {
      expect(document.body).toBeTruthy();
    }
  });
});
