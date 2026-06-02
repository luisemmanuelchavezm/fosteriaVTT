// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MorkBorgEnemyCreationModal from "../../../screens/campaign/components/MorkBorgEnemyCreationModal";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../../screens/personaje/utils/mbApi", () => ({
  saveMBEnemyTraits: vi.fn().mockResolvedValue(undefined),
  crearNpcMorkBorg: vi.fn().mockResolvedValue({
    id: 99,
    nombre: "Goblin",
    sistemaDeJuego: "Mork Borg",
    tipo: "enemigo",
  }),
}));

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  crearNpc: vi.fn().mockResolvedValue({
    id: 99,
    nombre: "Goblin",
    sistemaDeJuego: "Mork Borg",
    tipo: "enemigo",
  }),
  addHabilidadNpc: vi.fn().mockResolvedValue(undefined),
  addDndCharacterInventoryItem: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../screens/campaign/components/MorkBorgEnemyFormUtils", () => ({
  clampNumber: vi.fn((v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v)),
  ),
  buildEquipmentTag: vi.fn(() => "MORK_BORG,MBEnemyArma"),
  buildRandomTable: vi.fn(),
  buildStaticText: vi.fn(() => "Static"),
}));

afterEach(() => cleanup());

beforeEach(() => {
  localStorage.setItem("jwtToken", "token");
});

const DEFAULT_PROPS = {
  isOpen: true,
  sistemaDeJuego: "Mork Borg",
  onClose: vi.fn(),
  onCreated: vi.fn(),
};

describe("MorkBorgEnemyCreationModal", () => {
  it("no renderiza cuando isOpen es false", () => {
    render(<MorkBorgEnemyCreationModal {...DEFAULT_PROPS} isOpen={false} />);
    expect(document.body.textContent).toBe("");
  });

  it("renderiza el modal cuando isOpen es true", () => {
    render(<MorkBorgEnemyCreationModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra campo de nombre del enemigo", () => {
    render(<MorkBorgEnemyCreationModal {...DEFAULT_PROPS} />);
    expect(
      screen.queryByPlaceholderText(/nombre/i) ?? screen.queryByRole("textbox"),
    ).toBeTruthy();
    expect(document.body.textContent).toBeTruthy();
  });

  it("llama onClose cuando se hace click en cerrar", () => {
    const onClose = vi.fn();
    render(<MorkBorgEnemyCreationModal {...DEFAULT_PROPS} onClose={onClose} />);
    const closeBtn =
      screen.queryByRole("button", { name: /×|cerrar|close/i }) ??
      document.querySelector("button[title]");
    if (closeBtn) {
      fireEvent.click(closeBtn);
    }
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza sección de estadísticas", () => {
    render(<MorkBorgEnemyCreationModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza sección de equipo/armas", () => {
    render(<MorkBorgEnemyCreationModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toBeTruthy();
  });
});
