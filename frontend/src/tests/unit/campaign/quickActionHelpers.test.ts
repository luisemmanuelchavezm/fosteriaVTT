import { describe, expect, it, vi } from "vitest";
import {
  getSpellLevel,
  groupSpellsByLevel,
  getEnemySkillBonus,
  getEnemySaveBonus,
  getSavingThrowTotal,
  getSkillTotal,
} from "../../../screens/campaign/utils/quickActionHelpers";

// Mock characterAbilities to avoid complex imports
vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterAbilities",
  () => ({
    getAbilityModifierByName: vi.fn(() => 0),
    getActionDamageParts: vi.fn(() => ({ expression: null })),
    isActionAbility: vi.fn(() => false),
  }),
);

const makeAbility = (tags: string) => ({
  id: 1,
  nombre: "Test",
  tags,
  tipo: "habilidad",
  formula: null,
  bonificacion: null,
  descripcion: "",
});

describe("getSpellLevel", () => {
  it("retorna 0 para trucos (truco)", () => {
    expect(getSpellLevel(makeAbility("truco"))).toBe(0);
  });

  it("retorna 0 para trucos en mayúsculas", () => {
    expect(getSpellLevel(makeAbility("Truco"))).toBe(0);
  });

  it("retorna el nivel del hechizo para hechizo;1", () => {
    expect(getSpellLevel(makeAbility("hechizo;1"))).toBe(1);
  });

  it("retorna el nivel del hechizo para hechizo;5", () => {
    expect(getSpellLevel(makeAbility("hechizo;5"))).toBe(5);
  });

  it("retorna -1 si no hay etiqueta de hechizo", () => {
    expect(getSpellLevel(makeAbility("otro"))).toBe(-1);
  });

  it("retorna -1 si tags está vacío", () => {
    expect(getSpellLevel(makeAbility(""))).toBe(-1);
  });

  it("parsea correctamente entre múltiples tags separados por coma", () => {
    expect(getSpellLevel(makeAbility("fuego,hechizo;3"))).toBe(3);
  });

  it("retorna -1 si el nivel de hechizo no es número", () => {
    expect(getSpellLevel(makeAbility("hechizo;nivel"))).toBe(-1);
  });

  it("retorna el nivel correcto para hechizo;9 (nivel máximo)", () => {
    expect(getSpellLevel(makeAbility("hechizo;9"))).toBe(9);
  });
});

describe("groupSpellsByLevel", () => {
  it("agrupa hechizos por nivel correctamente", () => {
    const abilities = [
      makeAbility("truco"),
      makeAbility("hechizo;1"),
      makeAbility("hechizo;1"),
      makeAbility("hechizo;3"),
    ];
    abilities[0].id = 1;
    abilities[1].id = 2;
    abilities[2].id = 3;
    abilities[3].id = 4;

    const grouped = groupSpellsByLevel(abilities);
    expect(grouped.get(0)).toHaveLength(1);
    expect(grouped.get(1)).toHaveLength(2);
    expect(grouped.get(3)).toHaveLength(1);
  });

  it("retorna mapa vacío para lista vacía", () => {
    const grouped = groupSpellsByLevel([]);
    expect(grouped.size).toBe(0);
  });

  it("no incluye habilidades sin nivel válido (-1)", () => {
    const abilities = [makeAbility("otro"), makeAbility("accion")];
    const grouped = groupSpellsByLevel(abilities);
    expect(grouped.size).toBe(0);
  });

  it("agrupa trucos en el nivel 0", () => {
    const abilities = [makeAbility("truco"), makeAbility("truco")];
    abilities[0].id = 10;
    abilities[1].id = 11;
    const grouped = groupSpellsByLevel(abilities);
    expect(grouped.get(0)).toHaveLength(2);
  });
});

// ── getEnemySkillBonus ────────────────────────────────────────────────────────

describe("getEnemySkillBonus", () => {
  const skill = { name: "Sigilo", statName: "Destreza" };

  it("devuelve el valor flat cuando está definido y no es 0", () => {
    const detail = { estadisticas: { Sigilo: 5 } } as never;
    expect(getEnemySkillBonus(detail, skill)).toBe(5);
  });

  it("usa getAbilityModifierByName cuando el valor flat es 0", () => {
    // mock devuelve 0 para getAbilityModifierByName
    const detail = { estadisticas: { Sigilo: 0 } } as never;
    expect(getEnemySkillBonus(detail, skill)).toBe(0);
  });

  it("usa getAbilityModifierByName cuando el valor flat no está definido", () => {
    const detail = { estadisticas: {} } as never;
    expect(getEnemySkillBonus(detail, skill)).toBe(0);
  });

  it("devuelve el modificador del mock cuando detail es null", () => {
    expect(getEnemySkillBonus(null, skill)).toBe(0);
  });
});

// ── getEnemySaveBonus ─────────────────────────────────────────────────────────

describe("getEnemySaveBonus", () => {
  it("usa la clave 'Salvacion de' cuando existe y es distinto de 0", () => {
    const detail = { estadisticas: { "Salvacion de Fuerza": 4 } } as never;
    expect(getEnemySaveBonus(detail, "Fuerza")).toBe(4);
  });

  it("usa la clave 'Salvación de' (con tilde) cuando existe", () => {
    const detail = { estadisticas: { "Salvación de Destreza": 3 } } as never;
    expect(getEnemySaveBonus(detail, "Destreza")).toBe(3);
  });

  it("usa getAbilityModifierByName cuando la salvación es 0", () => {
    const detail = { estadisticas: { "Salvacion de Fuerza": 0 } } as never;
    expect(getEnemySaveBonus(detail, "Fuerza")).toBe(0);
  });

  it("usa getAbilityModifierByName cuando no hay clave de salvación", () => {
    const detail = { estadisticas: {} } as never;
    expect(getEnemySaveBonus(detail, "Constitución")).toBe(0);
  });
});

// ── getSavingThrowTotal ───────────────────────────────────────────────────────

describe("getSavingThrowTotal", () => {
  it("añade el bono de competencia si el personaje es competente (stat > 0)", () => {
    // mock devuelve 0 para el modificador; la competencia la da la estadística
    const detail = { estadisticas: { "Salvación de Fuerza": 1 } } as never;
    expect(getSavingThrowTotal(detail, "Fuerza", 3)).toBe(3); // 0 + 3
  });

  it("no añade bono de competencia si no es competente (stat = 0)", () => {
    const detail = { estadisticas: { "Salvacion de Fuerza": 0 } } as never;
    expect(getSavingThrowTotal(detail, "Fuerza", 3)).toBe(0); // 0 + 0
  });

  it("no añade bono de competencia si no existe la clave de salvación", () => {
    const detail = { estadisticas: {} } as never;
    expect(getSavingThrowTotal(detail, "Fuerza", 2)).toBe(0);
  });

  it("devuelve 0 cuando detail es null", () => {
    expect(getSavingThrowTotal(null, "Constitución", 4)).toBe(0);
  });
});

// ── getSkillTotal ─────────────────────────────────────────────────────────────

describe("getSkillTotal", () => {
  const skill = { name: "Percepción", statName: "Sabiduría" };

  it("suma modificador + 0 cuando el personaje no tiene competencia", () => {
    const detail = { estadisticas: { Percepción: 0 } } as never;
    expect(getSkillTotal(detail, skill, 2)).toBe(0); // mod 0 + 0*2
  });

  it("suma modificador + bono cuando tiene competencia (stat > 0)", () => {
    const detail = { estadisticas: { Percepción: 1 } } as never;
    // mock getAbilityModifierByName devuelve 0, proficiencyLevel = 1
    expect(getSkillTotal(detail, skill, 3)).toBe(3); // 0 + 1*3
  });

  it("suma modificador + bono*2 cuando tiene maestría (stat >= bono*2)", () => {
    const detail = { estadisticas: { Percepción: 6 } } as never;
    // proficiencyBonus=3, bono*2=6 → maestría
    expect(getSkillTotal(detail, skill, 3)).toBe(6); // 0 + 2*3
  });

  it("devuelve 0 cuando detail es null", () => {
    expect(getSkillTotal(null, skill, 2)).toBe(0);
  });
});
