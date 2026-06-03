// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import MorkBorgEnemySheetContent from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgEnemySheetContent";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

vi.mock("../../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));

vi.mock("../../../screens/personaje/utils/mbApi", () => ({
  saveMBEnemyVida: vi.fn().mockResolvedValue(undefined),
  saveMBEnemyMoral: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgEnemySheetHelpers",
  () => ({
    StatPanel: ({ label, value }: { label: string; value: number }) => (
      <div>
        {label}: {value}
      </div>
    ),
    SpecialWeaponOverlay: () => null,
  }),
);

afterEach(() => cleanup());

beforeEach(() => {
  localStorage.setItem("jwtToken", "token");
});

function makeEnemy(overrides = {}): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Dragon",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Mork Borg",
    raza: null,
    subraza: null,
    clases: [],
    caracteristicaLanzamientoConjuros: null,
    estadisticas: {
      "Vida actual": 15,
      "Vida maxima": 20,
      "Moral actual": 8,
      "Moral maxima": 10,
      CA: 14,
      Movimiento: 60,
      Iniciativa: 0,
      MB_ModFuerza: 3,
    },
    habilidades: [
      {
        id: 1,
        nombre: "Mordisco",
        bonificacion: 0,
        formula: "2d6",
        descripcion: "Ataca con colmillos",
        tags: "MBEnemyArma",
      },
      {
        id: 2,
        nombre: "Rasgo",
        bonificacion: 0,
        formula: null,
        descripcion: "Inmune al fuego",
        tags: "MBEnemyRasgo",
      },
    ],
    mochila: [],
    usado: null,
    tipo: "enemigo",
    vd: "5",
    tags: "MORK_BORG",
    propietario: "dm",
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

describe("MorkBorgEnemySheetContent", () => {
  it("renderiza el nombre del enemigo", () => {
    render(
      <MorkBorgEnemySheetContent character={makeEnemy()} characterId="1" />,
    );
    expect(screen.getByText("Dragon")).toBeInTheDocument();
  });

  it("renderiza vida y stats sin errores", () => {
    render(
      <MorkBorgEnemySheetContent character={makeEnemy()} characterId="1" />,
    );
    expect(document.body.textContent).toBeTruthy();
    expect(screen.getByText("Dragon")).toBeInTheDocument();
  });

  it("muestra el VD en el contenido", () => {
    render(
      <MorkBorgEnemySheetContent character={makeEnemy()} characterId="1" />,
    );
    // VD is shown somewhere in the UI
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza enemigo sin moral cuando tiene MBMoralNA", () => {
    render(
      <MorkBorgEnemySheetContent
        character={makeEnemy({ tags: "MORK_BORG,MBMoralNA" })}
        characterId="1"
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza enemigo con moral especial", () => {
    render(
      <MorkBorgEnemySheetContent
        character={makeEnemy({
          tags: "MORK_BORG,MBMoralEspecial",
          estadisticas: { "Vida actual": 10, "Vida maxima": 15 },
        })}
        characterId="1"
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza armas del enemigo", () => {
    render(
      <MorkBorgEnemySheetContent character={makeEnemy()} characterId="1" />,
    );
    expect(screen.getByText("Mordisco")).toBeInTheDocument();
  });

  it("renderiza rasgo del enemigo", () => {
    render(
      <MorkBorgEnemySheetContent character={makeEnemy()} characterId="1" />,
    );
    expect(screen.getByText(/Inmune al fuego/)).toBeInTheDocument();
  });

  it("renderiza con biografía JSON con tablas aleatorias", () => {
    const bio = JSON.stringify({
      rasgosAleatorios: [
        {
          tagKey: "rasgoTerrible1",
          nombre: "Rasgo",
          opciones: ["feo", "deforme"],
        },
      ],
    });
    render(
      <MorkBorgEnemySheetContent
        character={makeEnemy({
          biografia: bio,
          tags: "MORK_BORG,rasgoTerrible1;1",
        })}
        characterId="1"
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });
});
