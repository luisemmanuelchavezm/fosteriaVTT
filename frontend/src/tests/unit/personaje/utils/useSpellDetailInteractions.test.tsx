// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSpellDetailInteractions } from "../../../../screens/personaje/utils/useSpellDetailInteractions";
import type { CharacterAbilityResponse } from "../../../../screens/personaje/utils/dndApi";

const mocks = vi.hoisted(() => ({
  rollExpression: vi.fn(),
  fetchSpellDetailByName: vi.fn(),
}));

vi.mock("../../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: () => ({
    rollExpression: mocks.rollExpression,
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isDiceBoxReady: true,
    isRolling: false,
    summary: null,
  }),
}));

vi.mock("../../../../screens/personaje/utils/dndApi", async () => {
  const actual = await vi.importActual(
    "../../../../screens/personaje/utils/dndApi",
  );

  return {
    ...actual,
    fetchSpellDetailByName: mocks.fetchSpellDetailByName,
  };
});

const spell: CharacterAbilityResponse = {
  id: 7,
  nombre: "Escudo",
  bonificacion: null,
  formula: null,
  descripcion: "Aumentas la CA hasta tu siguiente turno.",
  tags: "Hechizo;1",
};

describe("useSpellDetailInteractions", () => {
  beforeEach(() => {
    mocks.rollExpression.mockReset();
    mocks.fetchSpellDetailByName.mockReset();
  });

  it("abre y cierra el modal de hechizo manualmente", () => {
    const { result } = renderHook(() => useSpellDetailInteractions());

    expect(result.current.selectedSpell).toBeNull();

    act(() => {
      result.current.openSpellDetail(spell);
    });
    expect(result.current.selectedSpell).toEqual(spell);

    act(() => {
      result.current.closeSpellDetail();
    });
    expect(result.current.selectedSpell).toBeNull();
  });

  it("busca hechizo por nombre solo con token y tolera errores", async () => {
    mocks.fetchSpellDetailByName.mockResolvedValueOnce(spell);

    const { result } = renderHook(() => useSpellDetailInteractions());

    await act(async () => {
      await result.current.openSpellDetailByName(null, "Escudo");
    });
    expect(mocks.fetchSpellDetailByName).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.openSpellDetailByName("token-ok", "Escudo");
    });

    expect(mocks.fetchSpellDetailByName).toHaveBeenCalledWith(
      "token-ok",
      "Escudo",
    );
    expect(result.current.selectedSpell).toEqual(spell);

    mocks.fetchSpellDetailByName.mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      await result.current.openSpellDetailByName("token-ok", "Fallo");
    });

    expect(result.current.selectedSpell).toEqual(spell);
  });

  it("envía tiradas al dice roller con el prefijo esperado", () => {
    const { result } = renderHook(() => useSpellDetailInteractions());

    act(() => {
      result.current.rollSpellExpression("Escudo", "1d20 + 4");
    });

    expect(mocks.rollExpression).toHaveBeenCalledWith(
      "Hechizo: Escudo",
      "1d20 + 4",
    );
  });
});
