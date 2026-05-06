// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  fetchAbilityCatalog: vi.fn(),
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
const wizardSummary = { id: "mago", nombre: "Mago" };
const fighterSummary = { id: "guerrero", nombre: "Guerrero" };
const bardSummary = { id: "bardo", nombre: "Bardo" };

const rogueDetail = {
  id: "picaro",
  nombre: "Pícaro",
  descripcion: "Clase pícara",
  puntosGolpe: { dadoGolpe: "1d8" },
  lanzamientoConjuros: null,
  competencias: {
    herramientas: ["Herramientas de ladron"],
  },
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

const wizardDetail = {
  id: "mago",
  nombre: "Mago",
  descripcion: "Clase maga",
  puntosGolpe: { dadoGolpe: "1d6" },
  lanzamientoConjuros: null,
  elecciones: [
    {
      id: "class-skill-0",
      etiqueta: "Competencias de clase",
      resumen:
        "Elige dos entre Arcano, Historia, Investigacion, Medicina, Perspicacia y Religión",
      catalogo: "habilidades",
      cantidad: 2,
      opciones: [
        "Arcano",
        "Historia",
        "Investigacion",
        "Medicina",
        "Perspicacia",
        "Religión",
      ],
    },
    {
      id: "wizard-cantrip",
      etiqueta: "Trucos de mago",
      resumen: "Elige 3 trucos de mago",
      catalogo: "wizardcantrips",
      cantidad: 3,
      opciones: ["Rayo de escarcha", "Luces danzantes", "Prestidigitación"],
    },
    {
      id: "wizard-spellbook",
      etiqueta: "Conjuros de mago",
      resumen: "Elige 6 conjuros de mago",
      catalogo: "wizardspells",
      cantidad: 6,
      opciones: [
        "Armadura de mago",
        "Dormir",
        "Disfrazarse",
        "Detectar magia",
        "Escudo",
        "Misil mágico",
      ],
    },
  ],
  subclases: [],
};

const fighterDetail = {
  id: "guerrero",
  nombre: "Guerrero",
  descripcion: "Clase guerrero",
  puntosGolpe: { dadoGolpe: "1d10" },
  lanzamientoConjuros: null,
  elecciones: [],
  subclases: [
    {
      id: "maestrobatalla",
      nombre: "Maestro de Batalla",
      descripcion: "Tactico marcial",
      nivelDesbloqueo: 3,
      tablas: [],
    },
    {
      id: "caballeroarcano",
      nombre: "Caballero Arcano",
      descripcion: "Guerrero magico",
      nivelDesbloqueo: 3,
      tablas: [
        {
          titulo: "Caballero Arcano",
          columnas: ["nivel", "trucos", "conjuros", "l1", "l2", "l3", "l4"],
          filas: [
            ["2", "0", "0", "0", "0", "0", "0"],
            ["3", "2", "3", "2", "0", "0", "0"],
            ["7", "2", "5", "4", "2", "0", "0"],
            ["10", "3", "7", "4", "3", "0", "0"],
          ],
        },
      ],
    },
  ],
};

const bardDetail = {
  id: "bardo",
  nombre: "Bardo",
  descripcion: "Clase bardo",
  puntosGolpe: { dadoGolpe: "1d8" },
  lanzamientoConjuros: null,
  competencias: {
    herramientas: [],
  },
  elecciones: [],
  subclases: [],
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
    Acrobacias: 2,
    Sigilo: 2,
    Investigacion: 2,
    Percepcion: 4,
    "Bonificador por competencia": 2,
  },
  tags: [],
};

const fighterCharacter = {
  nombre: "Bran",
  nivel: 1,
  clases: [{ nombre: "Guerrero", nivel: 1 }],
  habilidades: [],
  estadisticas: {
    Fuerza: 15,
    Destreza: 12,
    Constitución: 14,
    Inteligencia: 13,
    Sabiduría: 10,
    Carisma: 8,
    "Bonificador por competencia": 2,
  },
  tags: [],
};

const fighterLevelTwoCharacter = {
  ...fighterCharacter,
  nivel: 2,
  clases: [{ nombre: "Guerrero", nivel: 2 }],
};

const fighterLevelTwoWithStaleSubclassTagCharacter = {
  ...fighterLevelTwoCharacter,
  tags: ["Subclase;Maestro de Batalla"],
  habilidades: [
    {
      id: 301,
      nombre: "Parada",
      tags: "DND,Guerrero,MaestroDeBatalla,Maniobra,Defensa,Reaccion",
    },
  ],
};

const fighterLevelSixCharacter = {
  ...fighterCharacter,
  nivel: 6,
  clases: [{ nombre: "Guerrero", nivel: 6 }],
  tags: ["Subclase;Maestro de Batalla"],
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
    apiMocks.fetchAbilityCatalog.mockResolvedValue([
      { id: 201, nombre: "Parada" },
      { id: 202, nombre: "Finta" },
      { id: 203, nombre: "Ataque Preciso" },
    ]);
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

  it("envia pericia de habilidades al subir a picaro 6", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: {
          ...rogueCharacter,
          nivel: 5,
          clases: [{ nombre: "Pícaro", nivel: 5 }],
        } as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
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
      expect(result.current.expertiseChoiceConfig?.count).toBe(2);
    });

    act(() => {
      result.current.setExpertiseChoices(["Acrobacias", "Sigilo"]);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        claseId: "picaro",
        eleccionesClase: expect.objectContaining({
          "class-expertise-skill-0": ["Acrobacias", "Sigilo"],
        }),
      }),
    );
  });

  it("separa la pericia de herramientas de ladron en una eleccion propia", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: {
          ...rogueCharacter,
          nivel: 5,
          clases: [{ nombre: "Pícaro", nivel: 5 }],
          habilidades: [
            {
              id: 1,
              nombre: "Competencia: Herramientas de ladron",
            },
          ],
        } as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
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
      expect(result.current.availableExpertiseOptions).toContain(
        "Herramientas de ladron",
      );
    });

    act(() => {
      result.current.setExpertiseChoices([
        "Historia",
        "Herramientas de ladron",
      ]);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        claseId: "picaro",
        eleccionesClase: expect.objectContaining({
          "class-expertise-skill-0": ["Historia"],
          "class-expertise-tool-0": ["Herramientas de ladron"],
        }),
      }),
    );
  });

  it("muestra pericia para bardo al subir a nivel 3", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([bardSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(bardDetail);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: {
          ...rogueCharacter,
          nivel: 2,
          clases: [{ nombre: "Bardo", nivel: 2 }],
        } as never,
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
      result.current.setSelectedClassId("bardo");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("bardo");
      expect(result.current.expertiseChoiceConfig).toEqual(
        expect.objectContaining({
          count: 2,
          allowThievesTools: false,
        }),
      );
    });
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

  it("detecta maestro de batalla desde los tags del personaje para mostrar maniobras al subir de nivel", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterLevelSixCharacter as never,
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
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
    });

    await waitFor(() => {
      expect(result.current.battleMasterManeuverCount).toBe(2);
      expect(result.current.battleMasterManeuverOptions).toContain("Parada");
    });
  });

  it("mantiene trucos y conjuros al multiclasear a mago, pero excluye competencias iniciales de habilidades", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([wizardSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(wizardDetail);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
        onSubmit,
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("mago");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("mago");
      expect(result.current.visibleInitialClassChoices).toHaveLength(2);
      expect(
        result.current.visibleInitialClassChoices.map((choice) => choice.id),
      ).toEqual(["wizard-cantrip", "wizard-spellbook"]);
    });

    act(() => {
      result.current.setClassChoices({
        "wizard-cantrip": [
          "Rayo de escarcha",
          "Luces danzantes",
          "Prestidigitación",
        ],
        "wizard-spellbook": [
          "Armadura de mago",
          "Dormir",
          "Disfrazarse",
          "Detectar magia",
          "Escudo",
          "Misil mágico",
        ],
        "class-skill-0": ["Arcano", "Historia"],
      });
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        claseId: "mago",
        eleccionesClase: {
          "wizard-cantrip": [
            "Rayo de escarcha",
            "Luces danzantes",
            "Prestidigitación",
          ],
          "wizard-spellbook": [
            "Armadura de mago",
            "Dormir",
            "Disfrazarse",
            "Detectar magia",
            "Escudo",
            "Misil mágico",
          ],
        },
      }),
    );
  });

  it("carga trucos y conjuros de caballero arcano y los envía en el payload", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterLevelTwoCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
        onSubmit,
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
    });

    act(() => {
      result.current.setSelectedSubclassId("caballeroarcano");
    });

    await waitFor(() => {
      expect(result.current.ekCantripCount).toBe(2);
      expect(result.current.ekSpellCount).toBe(3);
    });

    act(() => {
      result.current.setEkChosenCantrips([
        "Rayo de escarcha",
        "Luces danzantes",
      ]);
      result.current.setEkChosenSpells([
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
        claseId: "guerrero",
        subclaseId: "caballeroarcano",
        eleccionesClase: expect.objectContaining({
          "ek-cantrip": ["Rayo de escarcha", "Luces danzantes"],
          "ek-spell": ["Armadura de mago", "Dormir", "Disfrazarse"],
        }),
      }),
    );
  });

  it("expone 3 maniobras al subir guerrero de nivel 2 a 3 y elegir maestro de batalla", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterLevelTwoCharacter as never,
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
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
    });

    act(() => {
      result.current.setSelectedSubclassId("maestrobatalla");
    });

    await waitFor(() => {
      expect(result.current.battleMasterManeuverCount).toBe(3);
      expect(result.current.battleMasterManeuverOptions).toContain("Parada");
      expect(result.current.battleMasterManeuverOptions).toContain("Finta");
    });
  });

  it("recupera maniobras de maestro de batalla con un fallback sin subclase si el catalogo filtrado llega vacio", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);
    apiMocks.fetchAbilityCatalog
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 201, nombre: "Parada" },
        { id: 202, nombre: "Finta" },
        { id: 203, nombre: "Ataque Preciso" },
      ]);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterLevelTwoCharacter as never,
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
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
    });

    act(() => {
      result.current.setSelectedSubclassId("maestrobatalla");
    });

    await waitFor(() => {
      expect(result.current.battleMasterManeuverOptions).toContain("Parada");
      expect(result.current.battleMasterManeuverOptions).toContain("Finta");
    });

    expect(apiMocks.fetchAbilityCatalog).toHaveBeenNthCalledWith(
      1,
      "jwt-token",
      {
        clase: "guerrero",
        subclase: "maestrobatalla",
        etiqueta: "maniobra",
      },
      expect.any(AbortSignal),
    );
    expect(apiMocks.fetchAbilityCatalog).toHaveBeenNthCalledWith(
      2,
      "jwt-token",
      {
        clase: "guerrero",
        etiqueta: "maniobra",
      },
      expect.any(AbortSignal),
    );
  });

  it("expone maniobras de maestro de batalla en los niveles de progreso", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterLevelSixCharacter as never,
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
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
    });

    act(() => {
      result.current.setSelectedSubclassId("maestrobatalla");
    });

    await waitFor(() => {
      expect(result.current.battleMasterManeuverCount).toBe(2);
      expect(result.current.battleMasterManeuverOptions).toContain("Parada");
      expect(result.current.battleMasterManeuverOptions).toContain("Finta");
    });
    expect(apiMocks.fetchAbilityCatalog).toHaveBeenCalledWith(
      "jwt-token",
      {
        clase: "guerrero",
        subclase: "maestrobatalla",
        etiqueta: "maniobra",
      },
      expect.any(AbortSignal),
    );
  });

  it("permite volver a elegir subclase si el personaje bajo de nivel por debajo del desbloqueo", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: fighterLevelTwoWithStaleSubclassTagCharacter as never,
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
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
    });

    expect(result.current.currentSubclass).toBeNull();
    expect(result.current.needsSubclass).toBe(true);
    expect(result.current.battleMasterManeuverCount).toBe(0);
  });
});
