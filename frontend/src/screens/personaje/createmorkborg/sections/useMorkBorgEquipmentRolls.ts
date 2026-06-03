import { useEffect, useRef, useState } from "react";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import {
  MB_SIN_CLASE_CONTAINER_TABLE,
  MB_SIN_CLASE_ITEM_TABLE_1,
  MB_SIN_CLASE_ITEM_TABLE_2,
  getMbArmaExpression,
  getMbArmaduraExpression,
  getMbComidaExpression,
  getMbPlataExpression,
  getMbTableEntry,
  getMbWeaponByIdx,
  getMbArmorByRoll,
  type MbTableEntry,
  type MbWeapon,
  type MbArmor,
  type MorkBorgClass,
} from "../utils/morkBorgUtils";
import type { MbEquipmentSnapshot } from "../hooks/useCreateMorkBorgCharacter";

// ── Zone IDs ──────────────────────────────────────────────────────────────────
export const Z_PLATA = "plata";
export const Z_COMIDA = "comida";
export const Z_ARMA = "arma";
export const Z_ARMADURA = "armadura";
export const Z_CONTENEDOR = "contenedor";
export const Z_ITEM1 = "item1";
export const Z_ITEM2 = "item2";
export const Z_IMPURO_IDX = "impuro-idx";
export const Z_VENENO_CANT = "veneno-cant";
export const Z_SAGRADO_IDX = "sagrado-idx";
export const Z_ELIXIR_CANT = "elixir-cant";
export const Z_MONOS_CANT = "monos-cant";
export const Z_PER_TIPO = "per-tipo";
export const Z_PER_IDX = "per-idx";
export const Z_ESOT_TIPO = "esot-tipo";
export const Z_ESOT_IDX = "esot-idx";

interface UseMorkBorgEquipmentRollsProps {
  selectedClass: MorkBorgClass | null;
  disabled: boolean;
  onEquipmentComplete?: (
    complete: boolean,
    snapshot?: MbEquipmentSnapshot,
  ) => void;
}

export interface EquipmentRollsState {
  // Dice roller
  diceBoxHostId: string;
  diceBoxError: string | null;
  isRolling: boolean;
  // Zone tracking
  activeZone: string | null;
  isZ: (z: string) => boolean;
  // Roll dispatcher
  roll: (zone: string, expression: string, title: string) => void;
  // Expressions
  plataExpr: string;
  comidaExpr: string;
  armaExpr: string;
  armaduraExpr: string;
  effectiveArmaduraExpr: string;
  // State values
  plataValue: number | null;
  comidaValue: number | null;
  armaResult: MbWeapon | null;
  armaduraResult: MbArmor | null;
  armaduraRolled: boolean;
  armaduraIsReroll: boolean;
  contenedor: MbTableEntry | null;
  contenedorChoice: string;
  setContenedorChoice: (v: string) => void;
  item1: MbTableEntry | null;
  impuroIdx: number | null;
  venenoCant: number | null;
  item2: MbTableEntry | null;
  sagradoIdx: number | null;
  elixirCant: number | null;
  monosCant: number | null;
  wantsScroll: boolean;
  setWantsScroll: (v: boolean) => void;
  perScrollTipo: number | null;
  perScrollIdx: number | null;
  esotScrollTipo: number | null;
  esotScrollIdx: number | null;
  // Modal toggles
  showArmaModal: boolean;
  setShowArmaModal: (v: boolean | ((prev: boolean) => boolean)) => void;
  showArmModal: boolean;
  setShowArmModal: (v: boolean | ((prev: boolean) => boolean)) => void;
  // Armadura roll handler (needs D2 ref logic)
  rollArmadura: () => void;
  // Scroll reset helpers
  resetScrollState: () => void;
}

export function useMorkBorgEquipmentRolls({
  selectedClass,
  disabled,
  onEquipmentComplete,
}: UseMorkBorgEquipmentRollsProps): EquipmentRollsState {
  const classId = selectedClass?.id;

  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  const activeZoneRef = useRef<string | null>(null);
  const rollingD2ArmaduraRef = useRef(false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [plataValue, setPlataValue] = useState<number | null>(null);
  const [comidaValue, setComidaValue] = useState<number | null>(null);
  const [armaResult, setArmaResult] = useState<MbWeapon | null>(null);
  const [armaduraResult, setArmaduraResult] = useState<MbArmor | null>(null);
  const [armaduraRolled, setArmaduraRolled] = useState(false);
  const [contenedor, setContenedor] = useState<MbTableEntry | null>(null);
  const [contenedorChoice, setContenedorChoice] = useState<string>("");
  const [item1, setItem1] = useState<MbTableEntry | null>(null);
  const [impuroIdx, setImpuroIdx] = useState<number | null>(null);
  const [venenoCant, setVenenoCant] = useState<number | null>(null);
  const [item2, setItem2] = useState<MbTableEntry | null>(null);
  const [sagradoIdx, setSagradoIdx] = useState<number | null>(null);
  const [elixirCant, setElixirCant] = useState<number | null>(null);
  const [monosCant, setMonosCant] = useState<number | null>(null);
  const [wantsScroll, setWantsScrollState] = useState(false);
  const [perScrollTipo, setPerScrollTipo] = useState<number | null>(null);
  const [perScrollIdx, setPerScrollIdx] = useState<number | null>(null);
  const [showArmaModal, setShowArmaModal] = useState(false);
  const [showArmModal, setShowArmModal] = useState(false);
  const [armaduraIsReroll, setArmaduraIsReroll] = useState(false);
  const [esotScrollTipo, setEsotScrollTipo] = useState<number | null>(null);
  const [esotScrollIdx, setEsotScrollIdx] = useState<number | null>(null);

  // ── Reset on class change ──────────────────────────────────────────────────
  useEffect(() => {
    setActiveZone(null);
    setPlataValue(null);
    setComidaValue(null);
    setArmaResult(null);
    setArmaduraResult(null);
    setArmaduraRolled(false);
    setContenedor(null);
    setContenedorChoice("");
    setItem1(null);
    setImpuroIdx(null);
    setVenenoCant(null);
    setItem2(null);
    setSagradoIdx(null);
    setElixirCant(null);
    setMonosCant(null);
    setWantsScrollState(false);
    setPerScrollTipo(null);
    setPerScrollIdx(null);
    setArmaduraIsReroll(false);
    setEsotScrollTipo(null);
    setEsotScrollIdx(null);
    activeZoneRef.current = null;
  }, [selectedClass?.id]);

  // ── Equipment completeness notification ────────────────────────────────────
  useEffect(() => {
    if (!classId) {
      onEquipmentComplete?.(false);
      return;
    }

    const base =
      armaResult !== null &&
      armaduraRolled &&
      plataValue !== null &&
      comidaValue !== null;

    const basicEquip = contenedor !== null && item1 !== null && item2 !== null;

    const scrollOk =
      !wantsScroll || (perScrollTipo !== null && perScrollIdx !== null);

    const esotOk = classId !== "ermitano-esoterico" || esotScrollIdx !== null;

    const complete = base && basicEquip && scrollOk && esotOk;
    if (complete) {
      onEquipmentComplete?.(true, {
        plata: plataValue!,
        comida: comidaValue!,
        armaIdx: armaResult!.idx,
        armaduraNivel: armaduraResult?.nivel ?? 0,
        contenedorResult: contenedor?.result ?? null,
        item1Result: item1?.result ?? null,
        item2Result: item2?.result ?? null,
        wantsScroll,
        perScrollTipo,
        perScrollIdx,
        esotScrollTipo,
        esotScrollIdx,
      });
    } else {
      onEquipmentComplete?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    armaResult,
    armaduraRolled,
    plataValue,
    comidaValue,
    contenedor,
    item1,
    item2,
    wantsScroll,
    perScrollTipo,
    perScrollIdx,
    esotScrollIdx,
    classId,
  ]);

  // ── Capture roll result ────────────────────────────────────────────────────
  useEffect(() => {
    const zone = activeZoneRef.current;
    if (!summary || isRolling || !zone) return;

    switch (zone) {
      case Z_PLATA:
        setPlataValue(summary.total * 10);
        break;
      case Z_COMIDA:
        setComidaValue(summary.total);
        break;
      case Z_ARMA:
        setArmaResult(getMbWeaponByIdx(summary.total));
        break;

      case Z_ARMADURA: {
        let roll = summary.total;
        if (rollingD2ArmaduraRef.current) roll = roll > 2 ? roll - 2 : roll;
        setArmaduraResult(getMbArmorByRoll(roll));
        setArmaduraRolled(true);
        break;
      }

      case Z_CONTENEDOR:
        setContenedor(
          getMbTableEntry(MB_SIN_CLASE_CONTAINER_TABLE, summary.total),
        );
        setContenedorChoice("");
        break;
      case Z_ITEM1:
        setItem1(getMbTableEntry(MB_SIN_CLASE_ITEM_TABLE_1, summary.total));
        setImpuroIdx(null);
        setVenenoCant(null);
        break;
      case Z_ITEM2:
        setItem2(getMbTableEntry(MB_SIN_CLASE_ITEM_TABLE_2, summary.total));
        setSagradoIdx(null);
        setElixirCant(null);
        setMonosCant(null);
        break;

      case Z_IMPURO_IDX:
        setImpuroIdx(summary.total);
        break;
      case Z_VENENO_CANT:
        setVenenoCant(summary.total);
        break;
      case Z_SAGRADO_IDX:
        setSagradoIdx(summary.total);
        break;
      case Z_ELIXIR_CANT:
        setElixirCant(summary.total);
        break;
      case Z_MONOS_CANT:
        setMonosCant(summary.total);
        break;

      case Z_PER_TIPO: {
        const raw = summary.total;
        setPerScrollTipo(raw > 2 ? raw - 2 : raw); // d4 → d2
        setPerScrollIdx(null);
        break;
      }
      case Z_PER_IDX:
        setPerScrollIdx(summary.total);
        break;

      case Z_ESOT_TIPO: {
        const raw = summary.total;
        setEsotScrollTipo(raw > 2 ? raw - 2 : raw); // d4 → d2
        setEsotScrollIdx(null);
        break;
      }
      case Z_ESOT_IDX:
        setEsotScrollIdx(summary.total);
        break;
    }

    activeZoneRef.current = null;
    setActiveZone(null);
  }, [summary, isRolling]);

  // ── Roll dispatcher ────────────────────────────────────────────────────────
  function roll(zone: string, expression: string, title: string) {
    if (isRolling || disabled) return;
    activeZoneRef.current = zone;
    setActiveZone(zone);
    rollExpression(title, expression);
  }

  const isZ = (z: string) => activeZone === z && isRolling;

  // ── Derived expressions ────────────────────────────────────────────────────
  const plataExpr = getMbPlataExpression(classId);
  const comidaExpr = getMbComidaExpression();
  const armaExpr = getMbArmaExpression(classId);
  const armaduraExpr = getMbArmaduraExpression(classId);
  const effectiveArmaduraExpr = wantsScroll ? "1d2" : armaduraExpr;

  // ── Armadura roll handler (handles D2 ref) ─────────────────────────────────
  function rollArmadura() {
    if (armaduraRolled) setArmaduraIsReroll(true);
    const isD2 = effectiveArmaduraExpr === "1d2";
    rollingD2ArmaduraRef.current = isD2;
    roll(
      Z_ARMADURA,
      isD2 ? "1d4" : effectiveArmaduraExpr,
      "Tirada de Armadura",
    );
  }

  // ── setWantsScroll with side effects ──────────────────────────────────────
  function setWantsScroll(checked: boolean) {
    setWantsScrollState(checked);
    setArmaduraResult(null);
    setArmaduraRolled(false);
    setArmaduraIsReroll(false);
    if (!checked) {
      setPerScrollTipo(null);
      setPerScrollIdx(null);
    }
  }

  function resetScrollState() {
    setPerScrollTipo(null);
    setPerScrollIdx(null);
  }

  return {
    diceBoxHostId,
    diceBoxError,
    isRolling,
    activeZone,
    isZ,
    roll,
    plataExpr,
    comidaExpr,
    armaExpr,
    armaduraExpr,
    effectiveArmaduraExpr,
    plataValue,
    comidaValue,
    armaResult,
    armaduraResult,
    armaduraRolled,
    armaduraIsReroll,
    contenedor,
    contenedorChoice,
    setContenedorChoice,
    item1,
    impuroIdx,
    venenoCant,
    item2,
    sagradoIdx,
    elixirCant,
    monosCant,
    wantsScroll,
    setWantsScroll,
    perScrollTipo,
    perScrollIdx,
    esotScrollTipo,
    esotScrollIdx,
    showArmaModal,
    setShowArmaModal,
    showArmModal,
    setShowArmModal,
    rollArmadura,
    resetScrollState,
  };
}
