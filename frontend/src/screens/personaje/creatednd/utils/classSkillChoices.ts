import type { ClassSkillChoiceGroup } from "../types";

export function buildInitialClassSkillSelections(
  groups: ClassSkillChoiceGroup[],
) {
  return groups.reduce<Record<string, string[]>>((accumulator, group) => {
    accumulator[group.id] = [];
    return accumulator;
  }, {});
}
