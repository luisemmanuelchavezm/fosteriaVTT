// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  useMorkBorgEquipmentRolls,
  Z_PLATA,
} from "../../../screens/personaje/createmorkborg/sections/useMorkBorgEquipmentRolls";
import type { MorkBorgClass } from "../../../screens/personaje/createmorkborg/utils/morkBorgUtils";

// ── Mock useDiceRoller ─────────────────────────────────────────────────────────

const mockRollExpression = vi.fn();
let mockSummary: { total: number } | null = null;
let mockIsRolling = false;

vi.mock("../../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: () => ({
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isRolling: mockIsRolling,
    summary: mockSummary,
    rollExpression: mockRollExpression,
  }),
}));

// Also mock the path relative to the hook file
vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: () => ({
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isRolling: mockIsRolling,
    summary: mockSummary,
    rollExpression: mockRollExpression,
  }),
}));

const escoriaClass: MorkBorgClass = {
  id: "escoria-alcantarillas",
  name: "Escoria de las Alcantarillas",
  description: "",
  specialAbilities: [],
  startingItems: [],
  defaultItems: [],
};

function setup(
  selectedClass: MorkBorgClass | null = escoriaClass,
  disabled = false,
) {
  const onEquipmentComplete = vi.fn();
  const { result, rerender } = renderHook(() =>
    useMorkBorgEquipmentRolls({ selectedClass, disabled, onEquipmentComplete }),
  );
  return { result, rerender, onEquipmentComplete };
}

describe("useMorkBorgEquipmentRolls", () => {
  beforeEach(() => {
    mockSummary = null;
    mockIsRolling = false;
    mockRollExpression.mockClear();
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────

  it("inicia con todos los valores en null/false", () => {
    const { result } = setup();
    expect(result.current.plataValue).toBeNull();
    expect(result.current.comidaValue).toBeNull();
    expect(result.current.armaResult).toBeNull();
    expect(result.current.armaduraResult).toBeNull();
    expect(result.current.armaduraRolled).toBe(false);
    expect(result.current.contenedor).toBeNull();
    expect(result.current.item1).toBeNull();
    expect(result.current.item2).toBeNull();
    expect(result.current.wantsScroll).toBe(false);
    expect(result.current.activeZone).toBeNull();
  });

  it("devuelve las expressions correctas", () => {
    const { result } = setup();
    expect(typeof result.current.plataExpr).toBe("string");
    expect(typeof result.current.comidaExpr).toBe("string");
    expect(typeof result.current.armaExpr).toBe("string");
    expect(typeof result.current.armaduraExpr).toBe("string");
  });

  it("isZ devuelve false cuando no hay zona activa", () => {
    const { result } = setup();
    expect(result.current.isZ(Z_PLATA)).toBe(false);
  });

  // ── roll dispatcher ────────────────────────────────────────────────────────

  it("roll llama a rollExpression con la expresión correcta", () => {
    const { result } = setup();
    act(() => result.current.roll(Z_PLATA, "1d6", "Tirada de Plata"));
    expect(mockRollExpression).toHaveBeenCalledWith("Tirada de Plata", "1d6");
    expect(result.current.activeZone).toBe(Z_PLATA);
  });

  it("roll no hace nada cuando disabled=true", () => {
    const { result } = setup(escoriaClass, true);
    act(() => result.current.roll(Z_PLATA, "1d6", "test"));
    expect(mockRollExpression).not.toHaveBeenCalled();
  });

  it("roll no hace nada cuando isRolling=true", () => {
    mockIsRolling = true;
    const { result } = renderHook(() =>
      useMorkBorgEquipmentRolls({
        selectedClass: escoriaClass,
        disabled: false,
      }),
    );
    act(() => result.current.roll(Z_PLATA, "1d6", "test"));
    expect(mockRollExpression).not.toHaveBeenCalled();
  });

  // ── Reset en cambio de clase ───────────────────────────────────────────────

  it("resetea el estado cuando cambia la clase", () => {
    const { result, rerender } = renderHook(
      ({ cls }) =>
        useMorkBorgEquipmentRolls({ selectedClass: cls, disabled: false }),
      { initialProps: { cls: escoriaClass } },
    );

    // Simular que el hook tiene estado previo con zona activa
    act(() => result.current.roll(Z_PLATA, "1d6", "test"));
    expect(result.current.activeZone).toBe(Z_PLATA);

    const otraClase: MorkBorgClass = {
      ...escoriaClass,
      id: "desertor-colmilludo",
    };
    rerender({ cls: otraClase });

    expect(result.current.activeZone).toBeNull();
    expect(result.current.plataValue).toBeNull();
    expect(result.current.armaResult).toBeNull();
  });

  // ── setWantsScroll ────────────────────────────────────────────────────────

  it("setWantsScroll(true) cambia wantsScroll y limpia armadura", () => {
    const { result } = setup();
    act(() => result.current.setWantsScroll(true));
    expect(result.current.wantsScroll).toBe(true);
    expect(result.current.armaduraResult).toBeNull();
    expect(result.current.armaduraRolled).toBe(false);
  });

  it("setWantsScroll(false) limpia perScrollTipo y perScrollIdx", () => {
    const { result } = setup();
    act(() => result.current.setWantsScroll(true));
    act(() => result.current.setWantsScroll(false));
    expect(result.current.wantsScroll).toBe(false);
    expect(result.current.perScrollTipo).toBeNull();
    expect(result.current.perScrollIdx).toBeNull();
  });

  // ── resetScrollState ──────────────────────────────────────────────────────

  it("resetScrollState limpia perScrollTipo y perScrollIdx", () => {
    const { result } = setup();
    act(() => result.current.setWantsScroll(true));
    // Manually set perScrollIdx/Tipo via roll then reset
    act(() => result.current.resetScrollState());
    expect(result.current.perScrollTipo).toBeNull();
    expect(result.current.perScrollIdx).toBeNull();
  });

  // ── setContenedorChoice ───────────────────────────────────────────────────

  it("setContenedorChoice actualiza la elección de contenedor", () => {
    const { result } = setup();
    act(() => result.current.setContenedorChoice("burro"));
    expect(result.current.contenedorChoice).toBe("burro");
  });

  // ── showArmaModal / showArmModal ──────────────────────────────────────────

  it("setShowArmaModal(true) abre el modal de arma", () => {
    const { result } = setup();
    act(() => result.current.setShowArmaModal(true));
    expect(result.current.showArmaModal).toBe(true);
  });

  it("setShowArmModal(true) abre el modal de armadura", () => {
    const { result } = setup();
    act(() => result.current.setShowArmModal(true));
    expect(result.current.showArmModal).toBe(true);
  });

  // ── notificaciones de equipmentComplete ──────────────────────────────────

  it("onEquipmentComplete(false) cuando no hay clase", () => {
    const onEquipmentComplete = vi.fn();
    renderHook(() =>
      useMorkBorgEquipmentRolls({
        selectedClass: null,
        disabled: false,
        onEquipmentComplete,
      }),
    );
    expect(onEquipmentComplete).toHaveBeenCalledWith(false);
  });

  // ── effectiveArmaduraExpr ─────────────────────────────────────────────────

  it("effectiveArmaduraExpr es 1d2 cuando wantsScroll es true", () => {
    const { result } = setup();
    act(() => result.current.setWantsScroll(true));
    expect(result.current.effectiveArmaduraExpr).toBe("1d2");
  });

  it("effectiveArmaduraExpr es armaduraExpr cuando wantsScroll es false", () => {
    const { result } = setup();
    act(() => result.current.setWantsScroll(false));
    expect(result.current.effectiveArmaduraExpr).toBe(
      result.current.armaduraExpr,
    );
  });
});
