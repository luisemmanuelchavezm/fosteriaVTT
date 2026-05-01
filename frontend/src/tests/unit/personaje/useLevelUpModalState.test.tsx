// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  fetchClassSkills: vi.fn(),
  fetchClassSubclassSkills: vi.fn(),
  fetchDndClassDetail: vi.fn(),
  fetchDndClassSummaries: vi.fn(),
  fetchSpellCatalog: vi.fn(),
  fetchSpellDetailByName: vi.fn(),
}));

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  ...apiMocks,
}));

import { useLevelUpModalState } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpModalState";

const rogueSummary = { id: "picaro", nombre: "Pícaro" };

const rogueDetail = {
  id: "picaro",
  nombre: "Pícaro",
  descripcion: "Clase pícara",
  puntosGolpe: { dadoGolpe: "1d8" },
  lanzamientoConjuros: null,
  elecciones: [],
  subclases: [
    {
      id: "embaucadorarcano",
      nombre: "Embaucador Arcano",
      descripcion: "Magia pícaro",
      nivelDesbloqueo: 3,
      tablas: [
        {
          titulo: "Embaucador Arcano",
          columnas: ["nivel", "trucos", "conjuros", "l1", "l2", "l3", "l4"],
          filas: [
            ["2", "0", "0", "0", "0", "0", "0"],
            ["3", "3", "3", "2", "0", "0", "0"],
            ["7", "3", "7", "4", "2", "0", "0"],
          ],
        },
      ],
    },
  ],
};

const cantripOptions = [
  { id: 1, nombre: "Rayo de escarcha" },
  { id: 2, nombre: "Luces danzantes" },
  { id: 3, nombre: "Prestidigitación" },
];
const spellOptions = [
  { id: 10, nombre: "Armadura de mago" },
  { id: 11, nombre: "Dormir" },
  { id: 12, nombre: "Disfrazarse" },
];

const rogueCharacter = {
  nombre: "Nim",
  nivel: 2,
  clases: [{ nombre: "Pícaro", nivel: 2 }],
  habilidades: [],
  estadisticas: {
    Fuerza: 10,
    Destreza: 16,
    Constitución: 12,
    Inteligencia: 14,
    Sabiduría: 10,
    Carisma: 8,
  },
  tags: [],
};

describe("useLevelUpModalState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("jwtToken", "jwt-token");

    apiMocks.fetchDndClassSummaries.mockResolvedValue([rogueSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(rogueDetail);
    apiMocks.fetchClassSkills.mockResolvedValue([]);
    apiMocks.fetchClassSubclassSkills.mockResolvedValue([]);
    apiMocks.fetchSpellDetailByName.mockResolvedValue(null);
    apiMocks.fetchSpellCatalog.mockImplementation(
      async (_token: string, options?: { nivel?: number; clase?: string }) => {
        if (options?.nivel === 0) {
          return cantripOptions;
        }
        if (options?.nivel === 1) {
          return spellOptions;
        }
        return [];
      },
    );
  });

  it("carga opciones de embaucador arcano desde mago y envía elecciones", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: rogueCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose,
        onSubmit,
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("picaro");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("picaro");
    });

    act(() => {
      result.current.setSelectedSubclassId("embaucadorarcano");
    });

    await waitFor(() => {
      expect(result.current.eaCantripCount).toBe(3);
      expect(result.current.eaSpellCount).toBe(3);
    });

    await waitFor(() => {
      expect(apiMocks.fetchSpellCatalog).toHaveBeenCalledWith(
        "jwt-token",
        { nivel: 0, clase: "mago" },
        expect.any(AbortSignal),
      );
      expect(apiMocks.fetchSpellCatalog).toHaveBeenCalledWith(
        "jwt-token",
        { nivel: 1, clase: "mago" },
        expect.any(AbortSignal),
      );
    });

    act(() => {
      result.current.setEaChosenCantrips([
        "Rayo de escarcha",
        "Luces danzantes",
        "Prestidigitación",
      ]);
      result.current.setEaChosenSpells([
        "Armadura de mago",
        "Dormir",
        "Disfrazarse",
      ]);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        claseId: "picaro",
        subclaseId: "embaucadorarcano",
        eleccionesClase: expect.objectContaining({
          "ea-cantrip": [
            "Rayo de escarcha",
            "Luces danzantes",
            "Prestidigitación",
          ],
          "ea-spell": ["Armadura de mago", "Dormir", "Disfrazarse"],
        }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("valida que se completen elecciones de embaucador arcano", async () => {
    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: rogueCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined),
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("picaro");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("picaro");
    });

    act(() => {
      result.current.setSelectedSubclassId("embaucadorarcano");
    });

    await waitFor(() => {
      expect(result.current.eaSpellCount).toBe(3);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.submitError).toMatch(
      /truco\(s\) del Embaucador Arcano/i,
    );
  });
});
