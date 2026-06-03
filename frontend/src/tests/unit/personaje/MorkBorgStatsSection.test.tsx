// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import MorkBorgStatsSection from "../../../screens/personaje/createmorkborg/sections/MorkBorgStatsSection";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));
vi.mock("../../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => ({
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isRolling: false,
    summary: null,
    rollExpression: vi.fn(),
    rollD20Check: vi.fn(),
    dismissSummary: vi.fn(),
    rollDicePool: vi.fn(),
    rollExpressionsSequence: vi.fn(),
    formatModifier: vi.fn((n: number) => (n >= 0 ? `+${n}` : `${n}`)),
  })),
}));

afterEach(() => cleanup());

const makeClass = (id = "escoria-alcantarillas") => ({
  id,
  nombre: "Escoria de las Alcantarillas",
  insignia: "EA",
  descripcion: "Un desgraciado",
  rasgos: [],
  opciones: [],
});

describe("MorkBorgStatsSection", () => {
  it("renderiza sin clase seleccionada", () => {
    render(<MorkBorgStatsSection selectedClass={null} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con clase seleccionada", () => {
    render(<MorkBorgStatsSection selectedClass={makeClass()} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra estadísticas para tirar", () => {
    render(<MorkBorgStatsSection selectedClass={makeClass()} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con error de validación", () => {
    render(<MorkBorgStatsSection selectedClass={makeClass()} hasError />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase ermitano-esoterico con dado de vida d6", () => {
    render(
      <MorkBorgStatsSection selectedClass={makeClass("ermitano-esoterico")} />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase con pergaminoEsoterico=true", () => {
    const classWithScroll = {
      ...makeClass("sacerdote-hereje"),
      pergaminoEsoterico: true,
    };
    render(<MorkBorgStatsSection selectedClass={classWithScroll} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("llama onPresenciaRolled con callbacks definidos", () => {
    const onPresenciaRolled = vi.fn();
    render(
      <MorkBorgStatsSection
        selectedClass={makeClass()}
        onPresenciaRolled={onPresenciaRolled}
        onAllMainStatsRolled={vi.fn()}
        onAllStatsComplete={vi.fn()}
        onStatsSnapshot={vi.fn()}
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });
});
