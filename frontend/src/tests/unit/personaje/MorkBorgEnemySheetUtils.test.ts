import { describe, expect, it } from "vitest";
import {
  hasTag,
  extractTagNumber,
  hasExactTag,
  getWeapons,
  getArmaduras,
  getRasgo,
  getEspecial,
  getLoot,
  isEspecialTable,
  parseBiografia,
  resolveRandomTraits,
  resolveRandomWeapon,
} from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgEnemySheetUtils";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

function makeChar(
  habilidades: {
    tags: string | null;
    descripcion?: string | null;
    nombre?: string;
  }[],
): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Enemy",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Mork Borg",
    raza: null,
    subraza: null,
    clases: [],
    caracteristicaLanzamientoConjuros: null,
    estadisticas: {},
    habilidades: habilidades.map((h, i) => ({
      id: i,
      nombre: h.nombre ?? "skill",
      bonificacion: 0,
      formula: null,
      descripcion: h.descripcion ?? null,
      tags: h.tags,
    })),
    mochila: [],
    usado: null,
    tipo: "enemigo",
    vd: null,
  } as unknown as DndCharacterDetailResponse;
}

describe("MorkBorgEnemySheetUtils - tag helpers", () => {
  it("hasTag retorna true cuando el tag está incluido", () => {
    expect(hasTag("MORK_BORG,MBEnemyArma", "MBEnemyArma")).toBe(true);
  });

  it("hasTag retorna false para tags nulos o ausentes", () => {
    expect(hasTag(null, "MBEnemyArma")).toBe(false);
    expect(hasTag(undefined, "MBEnemyArma")).toBe(false);
    expect(hasTag("MORK_BORG", "MBEnemyArma")).toBe(false);
  });

  it("extractTagNumber extrae el número de un tag", () => {
    expect(extractTagNumber("rasgoTerrible1;3", "rasgoTerrible1")).toBe(3);
  });

  it("extractTagNumber retorna null si no hay match", () => {
    expect(extractTagNumber(null, "rasgoTerrible1")).toBeNull();
    expect(extractTagNumber("sin-numeros", "rasgoTerrible1")).toBeNull();
  });

  it("hasExactTag retorna true solo para match exacto", () => {
    expect(hasExactTag("MORK_BORG,MBEnemyArma", "MBEnemyArma")).toBe(true);
  });

  it("hasExactTag retorna false para tags parciales", () => {
    expect(hasExactTag("MBEnemyArmaEspecial", "MBEnemyArma")).toBe(false);
    expect(hasExactTag(null, "MBEnemyArma")).toBe(false);
  });
});

describe("MorkBorgEnemySheetUtils - character getters", () => {
  it("getWeapons filtra armas del personaje", () => {
    const char = makeChar([
      { tags: "MORK_BORG,MBEnemyArma" },
      { tags: "MORK_BORG,MBEnemyArmadura" },
      { tags: "MORK_BORG,MBEnemyArmaEspecial" },
    ]);
    expect(getWeapons(char)).toHaveLength(2);
  });

  it("getArmaduras filtra armaduras del personaje", () => {
    const char = makeChar([
      { tags: "MORK_BORG,MBEnemyArmadura" },
      { tags: "MORK_BORG,MBEnemyArma" },
    ]);
    expect(getArmaduras(char)).toHaveLength(1);
  });

  it("getRasgo devuelve descripcion de rasgo", () => {
    const char = makeChar([
      { tags: "MBEnemyRasgo", descripcion: "Inmune al fuego" },
    ]);
    expect(getRasgo(char)).toBe("Inmune al fuego");
  });

  it("getRasgo retorna null si no hay rasgo", () => {
    const char = makeChar([{ tags: "MBEnemyArma" }]);
    expect(getRasgo(char)).toBeNull();
  });

  it("getEspecial devuelve descripcion especial", () => {
    const char = makeChar([
      { tags: "MBEnemyEspecial", descripcion: "Ataque especial" },
    ]);
    expect(getEspecial(char)).toBe("Ataque especial");
  });

  it("getLoot devuelve descripcion de botín", () => {
    const char = makeChar([{ tags: "MBEnemyLoot", descripcion: "5 plata" }]);
    expect(getLoot(char)).toBe("5 plata");
  });

  it("getLoot retorna null si no hay loot", () => {
    expect(getLoot(makeChar([]))).toBeNull();
  });
});

describe("MorkBorgEnemySheetUtils - random tables", () => {
  it("isEspecialTable detecta tag especial", () => {
    expect(
      isEspecialTable({
        tagKey: "MBEspecialIdx",
        nombre: "Especial",
        dados: "d6",
        opciones: [],
      }),
    ).toBe(true);
    expect(
      isEspecialTable({
        tagKey: "rasgoTerrible",
        nombre: "Rasgo",
        dados: "d6",
        opciones: [],
      }),
    ).toBe(false);
  });

  it("parseBiografia parsea JSON válido", () => {
    const result = parseBiografia('{"rasgosAleatorios":[]}');
    expect(result).toEqual({ rasgosAleatorios: [] });
  });

  it("parseBiografia retorna null para JSON inválido", () => {
    expect(parseBiografia("{invalid")).toBeNull();
    expect(parseBiografia(null)).toBeNull();
    expect(parseBiografia(undefined)).toBeNull();
    expect(parseBiografia("")).toBeNull();
  });

  it("resolveRandomTraits resuelve índices de tablas", () => {
    const tables = [
      {
        tagKey: "rasgoTerrible1",
        nombre: "Rasgo",
        dados: "d6",
        opciones: ["feo", "deforme", "tuerto"],
      },
    ];
    const result = resolveRandomTraits(tables, "rasgoTerrible1;2");
    expect(result[0]).toEqual({ nombre: "Rasgo", resultado: "deforme" });
  });

  it("resolveRandomTraits retorna null si no hay índice", () => {
    const tables = [
      {
        tagKey: "rasgoTerrible1",
        nombre: "Rasgo",
        dados: "d6",
        opciones: ["feo"],
      },
    ];
    expect(resolveRandomTraits(tables, null)[0]).toBeNull();
    expect(resolveRandomTraits(tables, "otro;1")[0]).toBeNull();
  });

  it("resolveRandomWeapon resuelve arma aleatoria", () => {
    const table = {
      tagKey: "ArmaAleatoria",
      nombre: "Arma",
      dados: "d4",
      opciones: [
        { nombre: "Espada", formula: "1d6" },
        { nombre: "Hacha", formula: "1d8" },
      ],
    };
    const result = resolveRandomWeapon(table, "ArmaAleatoria;2");
    expect(result).toEqual({ nombre: "Hacha", formula: "1d8" });
  });

  it("resolveRandomWeapon retorna null si no hay match", () => {
    const table = {
      tagKey: "ArmaAleatoria",
      nombre: "Arma",
      dados: "d4",
      opciones: [],
    };
    expect(resolveRandomWeapon(table, null)).toBeNull();
    expect(resolveRandomWeapon(table, "otro;1")).toBeNull();
  });
});
