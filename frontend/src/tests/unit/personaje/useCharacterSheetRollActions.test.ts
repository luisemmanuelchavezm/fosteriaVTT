// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCharacterSheetRollActions } from "../../../screens/personaje/dndcharactersheet/hooks/useCharacterSheetRollActions";

function makeDiceRoller() {
  return {
    rollD20Check: vi.fn(),
    rollExpression: vi.fn(),
  };
}

function makeCharacter(overrides: Record<string, unknown> = {}) {
  return {
    estadisticas: {
      Fuerza: 10,
      Destreza: 16,
      Iniciativa: 3,
      ...overrides,
    },
    clases: [],
    habilidades: [],
    ...overrides,
  } as never;
}

describe("useCharacterSheetRollActions", () => {
  it("calcula initiative desde estadisticas.Iniciativa cuando existe", () => {
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter({ Iniciativa: 5 } as never),
        diceRoller: makeDiceRoller() as never,
      }),
    );
    expect(result.current.initiative).toBe(5);
  });

  it("calcula initiative desde Destreza cuando no hay Iniciativa", () => {
    const character = {
      estadisticas: { Fuerza: 10, Destreza: 14 },
      clases: [],
      habilidades: [],
    } as never;

    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character,
        diceRoller: makeDiceRoller() as never,
      }),
    );
    // (14 - 10) / 2 = 2
    expect(result.current.initiative).toBe(2);
  });

  it("initiative es 0 cuando character es null", () => {
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: null,
        diceRoller: makeDiceRoller() as never,
      }),
    );
    expect(result.current.initiative).toBe(0);
  });

  it("handleRollInitiative llama a rollD20Check con Iniciativa", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter({ Iniciativa: 3 } as never),
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollInitiative();
    expect(diceRoller.rollD20Check).toHaveBeenCalledWith("Iniciativa", 3);
  });

  it("handleRollSavingThrow llama a rollD20Check con el label correcto", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter(),
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollSavingThrow("Fuerza", 2);
    expect(diceRoller.rollD20Check).toHaveBeenCalledWith(
      "Salvacion de Fuerza",
      2,
    );
  });

  it("handleRollSkill llama a rollD20Check con el label dado", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter(),
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollSkill("Sigilo", 4);
    expect(diceRoller.rollD20Check).toHaveBeenCalledWith("Sigilo", 4);
  });

  it("handleRollSpellAttack llama a rollD20Check con el bonus dado", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter(),
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollSpellAttack(7);
    expect(diceRoller.rollD20Check).toHaveBeenCalledWith(
      "Ataque de hechizo",
      7,
    );
  });

  it("handleRollWeaponAttack llama a rollD20Check con el arma y bonus", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter(),
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollWeaponAttack("Espada larga", 5);
    expect(diceRoller.rollD20Check).toHaveBeenCalledWith(
      "Ataque con Espada larga",
      5,
    );
  });

  it("handleRollWeaponAttack no hace nada cuando bonus es null", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter(),
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollWeaponAttack("Daga", null);
    expect(diceRoller.rollD20Check).not.toHaveBeenCalled();
  });

  it("handleRollAbilityCheck no hace nada cuando character es null", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: null,
        diceRoller: diceRoller as never,
      }),
    );

    result.current.handleRollAbilityCheck("Fuerza");
    expect(diceRoller.rollD20Check).not.toHaveBeenCalled();
  });

  it("handleRollAbilityCheck llama con el modificador calculado", () => {
    const diceRoller = makeDiceRoller();
    const { result } = renderHook(() =>
      useCharacterSheetRollActions({
        character: makeCharacter({ Fuerza: 14 } as never),
        diceRoller: diceRoller as never,
      }),
    );

    // modifier de Fuerza 14 = (14-10)/2 = 2
    result.current.handleRollAbilityCheck("Fuerza");
    expect(diceRoller.rollD20Check).toHaveBeenCalledWith("Fuerza", 2);
  });
});
