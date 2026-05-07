export function applyDamage(currentHp: number, tempHp: number, amount: number) {
  const safeAmount = Math.max(0, amount);
  const remainingAfterTemp = Math.max(0, safeAmount - tempHp);
  const nextTempHp = Math.max(0, tempHp - safeAmount);
  const nextCurrentHp = Math.max(0, currentHp - remainingAfterTemp);

  return {
    currentHp: nextCurrentHp,
    tempHp: nextTempHp,
  };
}

export interface ShortRestResolution {
  totalHealed: number;
  rollExpression: string | null;
}

export function resolveShortRestHealing(
  die: string,
  usedDice: number,
  constitutionModifier: number,
  roller: (faces: number) => number,
): ShortRestResolution {
  if (usedDice <= 0) {
    return { totalHealed: 0, rollExpression: null };
  }

  const faces = Number.parseInt(die.replace(/\D+/g, ""), 10);
  if (Number.isNaN(faces) || faces <= 0) {
    return { totalHealed: 0, rollExpression: null };
  }

  const parts: string[] = [];
  let totalHealed = 0;

  for (let index = 0; index < usedDice; index += 1) {
    const roll = roller(faces);
    totalHealed += Math.max(0, roll + constitutionModifier);
    const rollParts = [String(roll)];
    if (constitutionModifier > 0) {
      rollParts.push(`+ ${constitutionModifier}`);
    } else if (constitutionModifier < 0) {
      rollParts.push(`- ${Math.abs(constitutionModifier)}`);
    }
    parts.push(rollParts.join(" "));
  }

  return {
    totalHealed,
    rollExpression: parts.join(" + "),
  };
}

export function recoverHitDiceOnLongRest(
  totalsByDie: Record<string, number>,
  currentByDie: Record<string, number>,
  totalLevel: number,
) {
  const next = { ...currentByDie };
  let remainingRecovery = Math.max(1, Math.floor(Math.max(0, totalLevel) / 2));

  const orderedDice = Object.entries(totalsByDie)
    .map(([die, total]) => ({
      die,
      total,
      current: currentByDie[die] ?? total,
      faces: Number.parseInt(die.replace(/\D+/g, ""), 10) || 0,
    }))
    .sort((left, right) => right.faces - left.faces);

  for (const entry of orderedDice) {
    if (remainingRecovery <= 0) {
      break;
    }

    const missing = Math.max(0, entry.total - entry.current);
    if (missing <= 0) {
      continue;
    }

    const recovered = Math.min(missing, remainingRecovery);
    next[entry.die] = entry.current + recovered;
    remainingRecovery -= recovered;
  }

  return next;
}

export function extractHitDiceStats(stats: Record<string, number>) {
  return Object.entries(stats)
    .filter(([name, value]) => /^Dados de golpe d\d+$/i.test(name) && value > 0)
    .map(([name, value]) => ({
      key: name,
      die: name.replace(/^Dados de golpe\s+/i, ""),
      total: value,
    }));
}

export function extractExtraResources(stats: Record<string, number>) {
  return Array.from({ length: 9 }, (_, index) => index + 1).map(
    (resourceIndex) => ({
      index: resourceIndex,
      current: stats[`Recurso custom dnd actual ${resourceIndex}`] ?? 0,
      max: stats[`Recurso custom dnd maximo ${resourceIndex}`] ?? 0,
    }),
  );
}
