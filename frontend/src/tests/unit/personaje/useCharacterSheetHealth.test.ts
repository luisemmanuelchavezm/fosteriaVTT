// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCharacterSheetHealth } from "../../../screens/personaje/dndcharactersheet/hooks/useCharacterSheetHealth";

function makeCharacter(totalHp: number) {
  return {
    estadisticas: { "Puntos de vida": totalHp },
  } as never;
}

function setup(totalHp = 20, currentHp = 20, tempHp = 0) {
  let hp = currentHp;
  let temp = tempHp;

  const { result } = renderHook(() =>
    useCharacterSheetHealth({
      character: makeCharacter(totalHp),
      currentHp: hp,
      setCurrentHp: (fn) => {
        hp = typeof fn === "function" ? fn(hp) : fn;
      },
      setTempHp: (fn) => {
        temp = typeof fn === "function" ? fn(temp) : fn;
      },
      tempHp: temp,
    }),
  );

  return result;
}

describe("useCharacterSheetHealth", () => {
  it("calcula totalHp desde el personaje", () => {
    const result = setup(30);
    expect(result.current.totalHp).toBe(30);
    expect(result.current.hpDelta).toBe("0");
  });

  it("handleIncrementHpDelta sube el delta de 0 a 1", () => {
    const result = setup();
    act(() => result.current.handleIncrementHpDelta());
    expect(result.current.hpDelta).toBe("1");
  });

  it("handleIncrementHpDelta encadena multiples incrementos", () => {
    const result = setup();
    act(() => {
      result.current.handleIncrementHpDelta();
      result.current.handleIncrementHpDelta();
      result.current.handleIncrementHpDelta();
    });
    expect(result.current.hpDelta).toBe("3");
  });

  it("handleDecrementHpDelta no baja de 0", () => {
    const result = setup();
    act(() => result.current.handleDecrementHpDelta());
    expect(result.current.hpDelta).toBe("0");
  });

  it("handleDecrementHpDelta baja desde un valor positivo", () => {
    const result = setup();
    act(() => {
      result.current.setHpDelta("5");
    });
    act(() => result.current.handleDecrementHpDelta());
    expect(result.current.hpDelta).toBe("4");
  });

  it("handleGainTempHp no hace nada si el delta es 0", () => {
    const result = setup(20, 20, 5);
    act(() => result.current.handleGainTempHp());
    // tempHpDelta empieza en "0" → no debe dispararse
    expect(result.current.tempHpDelta).toBe("0");
  });

  it("handleIncrementTempHpDelta incrementa el delta de vida temporal", () => {
    const result = setup();
    act(() => result.current.handleIncrementTempHpDelta());
    expect(result.current.tempHpDelta).toBe("1");
  });

  it("handleDecrementTempHpDelta no baja de 0", () => {
    const result = setup();
    act(() => result.current.handleDecrementTempHpDelta());
    expect(result.current.tempHpDelta).toBe("0");
  });

  it("sin personaje totalHp es 0", () => {
    const { result } = renderHook(() =>
      useCharacterSheetHealth({
        character: null,
        currentHp: 10,
        setCurrentHp: () => {},
        setTempHp: () => {},
        tempHp: 0,
      }),
    );
    expect(result.current.totalHp).toBe(0);
  });
});
