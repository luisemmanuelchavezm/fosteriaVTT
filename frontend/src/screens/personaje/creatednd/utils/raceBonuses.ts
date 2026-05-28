import { normalizeChoiceCatalog } from "../../../../components/spells/spellReferenceUtils";
import type { DndRaceChoice, RaceSelectionSnapshot } from "../../types";
import { ABILITY_STATS, createInitialAssignments } from "./statisticsUtils";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const ABILITY_NAME_TO_ID = ABILITY_STATS.reduce<Record<string, string>>(
  (accumulator, stat) => {
    accumulator[normalizeText(stat.name)] = stat.id;
    return accumulator;
  },
  {},
);

function resolveAbilityId(label: string) {
  return ABILITY_NAME_TO_ID[normalizeText(label)] ?? null;
}

function addBonus(
  bonuses: Record<string, number>,
  abilityId: string,
  amount: number,
) {
  bonuses[abilityId] += amount;
}

function applyFixedBonuses(lines: string[], bonuses: Record<string, number>) {
  lines.forEach((line) => {
    const normalized = normalizeText(line);
    const amountMatch = line.match(/\+(\d+)/);
    const amount = amountMatch ? Number(amountMatch[1]) : 0;

    if (!amount) {
      return;
    }

    if (normalized.includes("a todas las caracteristicas")) {
      ABILITY_STATS.forEach((stat) => addBonus(bonuses, stat.id, amount));
      return;
    }

    const abilityMatch = line.match(/^\+\d+\s+(.+)$/);

    if (!abilityMatch) {
      return;
    }

    const abilityId = resolveAbilityId(abilityMatch[1]);

    if (abilityId) {
      addBonus(bonuses, abilityId, amount);
    }
  });
}

function applyChoiceBonuses(
  choices: DndRaceChoice[],
  selectedChoices: Record<string, string[]>,
  bonuses: Record<string, number>,
) {
  choices
    .filter(
      (choice) =>
        normalizeChoiceCatalog(choice.catalogo) ===
        "puntuacionescaracteristica",
    )
    .forEach((choice) => {
      const amountMatch = choice.resumen.match(/\+(\d+)/);
      const amount = amountMatch ? Number(amountMatch[1]) : 1;

      (selectedChoices[choice.id] ?? []).forEach((pickedValue) => {
        if (!pickedValue) {
          return;
        }

        const abilityId = resolveAbilityId(pickedValue);

        if (abilityId) {
          addBonus(bonuses, abilityId, amount);
        }
      });
    });
}

export function computeRaceAbilityBonuses(
  selection: RaceSelectionSnapshot | null,
) {
  const bonuses = createInitialAssignments(0);

  if (!selection?.selectedRace) {
    return { bonuses, summary: [] as string[] };
  }

  applyFixedBonuses(selection.selectedRace.aumentoCaracteristicas, bonuses);
  applyChoiceBonuses(
    selection.selectedRace.elecciones,
    selection.selectedChoices,
    bonuses,
  );

  if (selection.selectedSubrace) {
    applyFixedBonuses(
      selection.selectedSubrace.aumentoCaracteristicas,
      bonuses,
    );
    applyChoiceBonuses(
      selection.selectedSubrace.elecciones,
      selection.selectedChoices,
      bonuses,
    );
  }

  return {
    bonuses,
    summary: ABILITY_STATS.flatMap((stat) =>
      bonuses[stat.id] > 0 ? [`${stat.displayName} +${bonuses[stat.id]}`] : [],
    ),
  };
}
