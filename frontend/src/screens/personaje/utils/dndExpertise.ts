import { normalizeDndText } from "./dndProgressionRules";

export const SKILL_EXPERTISE_CHOICE_ID = "class-expertise-skill-0";
export const TOOL_EXPERTISE_CHOICE_ID = "class-expertise-tool-0";
export const EXPERTISE_CHOICE_SECTION_ID = "class-expertise";
export const THIEVES_TOOLS_NAME = "Herramientas de ladron";

export interface ExpertiseChoiceConfig {
  count: number;
  title: string;
  description: string;
  allowThievesTools: boolean;
}

export function getExpertiseChoiceConfig(
  classId: string | null,
  targetLevel: number,
): ExpertiseChoiceConfig | null {
  const normalizedClassId = normalizeDndText(classId);

  if (normalizedClassId === normalizeDndText("bardo")) {
    if (targetLevel === 3 || targetLevel === 10) {
      return {
        count: 2,
        title: "Pericia",
        description:
          "Elige dos habilidades en las que ya seas competente para duplicar tu bonificador por competencia.",
        allowThievesTools: false,
      };
    }
    return null;
  }

  if (normalizedClassId === normalizeDndText("picaro")) {
    if (targetLevel === 1 || targetLevel === 6) {
      return {
        count: 2,
        title: "Pericia",
        description:
          "Elige dos competencias para ganar pericia. Una de ellas puede ser Herramientas de ladron si tienes competencia con ella.",
        allowThievesTools: true,
      };
    }
  }

  return null;
}

export function splitExpertiseChoices(choices: string[]) {
  const normalizedThievesTools = normalizeDndText(THIEVES_TOOLS_NAME);
  const normalizedChoices = choices.filter(
    (choice) => choice.trim().length > 0,
  );

  return {
    skillChoices: normalizedChoices.filter(
      (choice) => normalizeDndText(choice) !== normalizedThievesTools,
    ),
    toolChoices: normalizedChoices.filter(
      (choice) => normalizeDndText(choice) === normalizedThievesTools,
    ),
  };
}
