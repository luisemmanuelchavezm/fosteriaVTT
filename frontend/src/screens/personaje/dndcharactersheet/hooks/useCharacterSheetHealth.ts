import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { applyDamage } from "../utils/characterResources";
import {
  HEALTH_TOTAL_STAT,
  MAX_CURRENT_HP,
  MAX_DELTA_VALUE,
  MAX_TEMP_HP,
} from "./characterSheetConstants";

interface UseCharacterSheetHealthOptions {
  character: DndCharacterDetailResponse | null;
  currentHp: number;
  setCurrentHp: Dispatch<SetStateAction<number>>;
  setTempHp: Dispatch<SetStateAction<number>>;
  tempHp: number;
}

export function useCharacterSheetHealth({
  character,
  currentHp,
  setCurrentHp,
  setTempHp,
  tempHp,
}: UseCharacterSheetHealthOptions) {
  const [hpDelta, setHpDelta] = useState("0");
  const [tempHpDelta, setTempHpDelta] = useState("0");

  const totalHp = useMemo(
    () => character?.estadisticas[HEALTH_TOTAL_STAT] ?? 0,
    [character],
  );

  const parsedHpDelta = Number.parseInt(hpDelta, 10);
  const hpStepValue = Number.isNaN(parsedHpDelta) ? 0 : parsedHpDelta;
  const parsedTempHpDelta = Number.parseInt(tempHpDelta, 10);
  const tempHpStepValue = Number.isNaN(parsedTempHpDelta)
    ? 0
    : parsedTempHpDelta;

  const handleHeal = () => {
    if (hpStepValue <= 0) {
      return;
    }
    setCurrentHp((current) =>
      Math.min(Math.min(totalHp, MAX_CURRENT_HP), current + hpStepValue),
    );
    setHpDelta(String(hpStepValue));
  };

  const handleDamage = () => {
    if (hpStepValue <= 0) {
      return;
    }
    const nextValues = applyDamage(currentHp, tempHp, hpStepValue);
    setCurrentHp(Math.max(0, Math.min(MAX_CURRENT_HP, nextValues.currentHp)));
    setTempHp(nextValues.tempHp);
    setHpDelta(String(hpStepValue));
  };

  const handleGainTempHp = () => {
    if (tempHpStepValue <= 0) {
      return;
    }
    setTempHp((current) => Math.min(MAX_TEMP_HP, current + tempHpStepValue));
    setTempHpDelta(String(tempHpStepValue));
  };

  const handleLoseTempHp = () => {
    if (tempHpStepValue <= 0) {
      return;
    }
    setTempHp((current) => Math.max(0, current - tempHpStepValue));
    setTempHpDelta(String(tempHpStepValue));
  };

  const handleIncrementHpDelta = () => {
    setHpDelta((current) =>
      String(Math.min(MAX_DELTA_VALUE, Number.parseInt(current, 10) + 1 || 1)),
    );
  };

  const handleDecrementHpDelta = () => {
    setHpDelta((current) =>
      String(Math.max(0, (Number.parseInt(current, 10) || 0) - 1)),
    );
  };

  const handleIncrementTempHpDelta = () => {
    setTempHpDelta((current) =>
      String(Math.min(MAX_DELTA_VALUE, Number.parseInt(current, 10) + 1 || 1)),
    );
  };

  const handleDecrementTempHpDelta = () => {
    setTempHpDelta((current) =>
      String(Math.max(0, (Number.parseInt(current, 10) || 0) - 1)),
    );
  };

  return {
    handleDamage,
    handleDecrementHpDelta,
    handleDecrementTempHpDelta,
    handleGainTempHp,
    handleHeal,
    handleIncrementHpDelta,
    handleIncrementTempHpDelta,
    handleLoseTempHp,
    hpDelta,
    setHpDelta,
    setTempHpDelta,
    tempHpDelta,
    totalHp,
  };
}
