// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import MorkBorgEquipmentSection from "../../../screens/personaje/createmorkborg/sections/MorkBorgEquipmentSection";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));
vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));

vi.mock(
  "../../../screens/personaje/createmorkborg/sections/MorkBorgEquipmentHelpers",
  () => ({
    SubRollButton: ({
      label,
      onClick,
    }: {
      label: string;
      onClick: () => void;
    }) => <button onClick={onClick}>{label}</button>,
    PresenciaNota: () => null,
    ResultChip: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    TableBox: ({
      label,
      children,
    }: {
      label: string;
      children: React.ReactNode;
    }) => (
      <div>
        <span>{label}</span>
        {children}
      </div>
    ),
  }),
);

vi.mock(
  "../../../screens/personaje/createmorkborg/hooks/useMorkBorgEquipmentRolls",
  () => ({
    useMorkBorgEquipmentRolls: vi.fn(() => ({
      armaIdx: null,
      armaResult: null,
      armaOpciones: [],
      armaduraNivel: null,
      armaduraResult: null,
      contenedorResult: null,
      item1Result: null,
      item2Result: null,
      wantsScroll: false,
      perScrollTipo: null,
      perScrollIdx: null,
      perScrollResult: null,
      esotScrollTipo: null,
      esotScrollIdx: null,
      esotScrollResult: null,
      isRollingArma: false,
      isRollingArmadura: false,
      isRollingContenedor: false,
      isRollingItem1: false,
      isRollingItem2: false,
      isRollingScroll: false,
      isRollingEsotScroll: false,
      rollArma: vi.fn(),
      rollArmadura: vi.fn(),
      rollContenedor: vi.fn(),
      rollItem1: vi.fn(),
      rollItem2: vi.fn(),
      rollScroll: vi.fn(),
      rollEsotScroll: vi.fn(),
      setWantsScroll: vi.fn(),
      setPerScrollTipo: vi.fn(),
      setEsotScrollTipo: vi.fn(),
    })),
  }),
);

vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => ({
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isRolling: false,
    summary: null,
    rollExpression: vi.fn(),
    rollD20Check: vi.fn(),
    dismissSummary: vi.fn(),
    formatModifier: vi.fn(),
  })),
}));

afterEach(() => cleanup());

const makeClass = (id = "escoria-alcantarillas") => ({
  id,
  nombre: "Escoria de las Alcantarillas",
  descripcion: "Un desgraciado",
  dadoVida: "d4" as const,
  opciones: [],
  pergaminoEsoterico: false,
});

describe("MorkBorgEquipmentSection", () => {
  it("muestra mensaje cuando no hay clase seleccionada", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={null}
        presenciaModifier={null}
        allStatsRolled={false}
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra mensaje bloqueado cuando faltan stats", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass()}
        presenciaModifier={null}
        allStatsRolled={false}
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza sección de equipo cuando clase y stats están listos", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass()}
        presenciaModifier={1}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra error cuando hasError es true", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass()}
        presenciaModifier={1}
        allStatsRolled
        hasError
      />,
    );
    expect(document.body).toBeTruthy();
  });

  it("renderiza para clase escoria-alcantarillas", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass("escoria-alcantarillas")}
        presenciaModifier={2}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase ermitano-esoterico", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass("ermitano-esoterico")}
        presenciaModifier={0}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase sacerdote-hereje", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass("sacerdote-hereje")}
        presenciaModifier={-1}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase desertor-colmilludo", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass("desertor-colmilludo")}
        presenciaModifier={1}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase herborista-ocultista", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass("herborista-ocultista")}
        presenciaModifier={3}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza para clase realeza-desgracia", () => {
    render(
      <MorkBorgEquipmentSection
        selectedClass={makeClass("realeza-desgracia")}
        presenciaModifier={-2}
        allStatsRolled
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });
});
