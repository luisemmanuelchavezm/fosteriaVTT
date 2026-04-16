import type { ClassSkillChoiceGroup, DndClassDetail } from "../types";

const NUMBER_WORDS: Record<string, number> = {
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
};

const CLASS_SKILL_CHOICE_PATTERN =
  /elige\s+(\d+|una|uno|dos|tres|cuatro|cinco|seis)\s+entre\s+(.+)/i;

function parseChoiceAmount(value: string) {
  const normalized = value.trim().toLowerCase();
  const fromWords = NUMBER_WORDS[normalized];

  if (fromWords) {
    return fromWords;
  }

  const numericValue = Number.parseInt(normalized, 10);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function splitChoiceOptions(value: string) {
  return value
    .replace(/\.$/, "")
    .replace(/\s+y\s+/gi, ", ")
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
}

export function parseClassSkillChoiceGroups(
  classDetail: DndClassDetail | null,
): ClassSkillChoiceGroup[] {
  if (!classDetail) {
    return [];
  }

  return classDetail.competencias.habilidades.flatMap((entry, index) => {
    const match = entry.match(CLASS_SKILL_CHOICE_PATTERN);

    if (!match) {
      const options = splitChoiceOptions(entry);
      if (!options.length) {
        return [];
      }

      return [
        {
          id: `class-skill-${index}`,
          etiqueta: "Competencias de clase",
          cantidad: options.length,
          opciones: options,
        },
      ];
    }

    const amount = parseChoiceAmount(match[1]);
    const options = splitChoiceOptions(match[2]);

    if (!amount || !options.length) {
      return [];
    }

    return [
      {
        id: `class-skill-${index}`,
        etiqueta: entry,
        cantidad: amount,
        opciones: options,
      },
    ];
  });
}

export function buildInitialClassSkillSelections(
  groups: ClassSkillChoiceGroup[],
) {
  return groups.reduce<Record<string, string[]>>((accumulator, group) => {
    accumulator[group.id] = Array.from({ length: group.cantidad }, () => "");
    return accumulator;
  }, {});
}
