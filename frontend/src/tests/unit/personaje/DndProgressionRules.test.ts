import { describe, expect, it } from "vitest";
import {
  classWarnings,
  inferCurrentSubclass,
  isAsiLevel,
  normalizeDndText,
  requiresSubclass,
} from "../../../screens/personaje/utils/dndProgressionRules";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";
import type {
  DndClassDetail,
  DndClassSummary,
} from "../../../screens/personaje/types";

const baseCharacter: DndCharacterDetailResponse = {
  id: 1,
  nombre: "Iria",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "DND",
  raza: "Elfo",
  subraza: "Alto elfo",
  clases: [{ nombre: "Mago", nivel: 3 }],
  caracteristicaLanzamientoConjuros: "Inteligencia",
  estadisticas: {
    Fuerza: 8,
    Destreza: 14,
    Constitucion: 13,
    Inteligencia: 17,
    Sabiduria: 12,
    Carisma: 10,
  },
  habilidades: [
    {
      id: 7,
      nombre: "Esculpir conjuros",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "CMago;2,Subclase;escuela-de-evocacion",
    },
  ],
  mochila: [],
  usado: "2026-04-29T00:00:00",
};

const mageDetail: DndClassDetail = {
  id: "mago",
  nombre: "Mago",
  insignia: "Ma",
  descripcion: "",
  puntosGolpe: {
    dadoGolpe: "1d6",
    primerNivel: "",
    nivelesSuperiores: "",
  },
  competencias: {
    armaduras: [],
    armas: [],
    herramientas: [],
    salvaciones: [],
    habilidades: [],
  },
  lanzamientoConjuros: null,
  subclases: [
    {
      id: "evocacion",
      nombre: "Escuela de evocacion",
      descripcion: "",
      nivelDesbloqueo: 2,
      tablas: [],
    },
  ],
  elecciones: [],
  equipamiento: { fijos: [], gruposEleccion: [] },
};

describe("dndProgressionRules", () => {
  it("normaliza texto y detecta clases que requieren subclase", () => {
    expect(normalizeDndText("Pícaro Arcano")).toBe("picaroarcano");
    expect(requiresSubclass(mageDetail, 1)).toBe(false);
    expect(requiresSubclass(mageDetail, 2)).toBe(true);
    expect(requiresSubclass(null, 10)).toBe(false);
  });

  it("infiere la subclase actual a partir de tags y nombres", () => {
    expect(inferCurrentSubclass(baseCharacter, mageDetail)?.id).toBe(
      "evocacion",
    );
    expect(inferCurrentSubclass(baseCharacter, null)).toBeNull();
  });

  it("detecta niveles de ASI y comprueba advertencias por clase", () => {
    expect(isAsiLevel("guerrero", 6)).toBe(true);
    expect(isAsiLevel("picaro", 10)).toBe(true);
    expect(isAsiLevel("mago", 10)).toBe(false);

    const classChecks: Array<[DndClassSummary, boolean]> = [
      [{ id: "mago", nombre: "Mago", insignia: "Ma" }, true],
      [{ id: "explorador", nombre: "Explorador", insignia: "Ex" }, false],
      [{ id: "desconocida", nombre: "Desconocida", insignia: "?" }, true],
    ];

    classChecks.forEach(([classSummary, expected]) => {
      expect(classWarnings(classSummary, baseCharacter)).toBe(expected);
    });
  });
});
