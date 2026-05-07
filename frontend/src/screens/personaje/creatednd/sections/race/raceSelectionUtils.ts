import { normalizeChoiceCatalog } from "../../../../../components/spells/spellReferenceUtils";
import type {
  DndRaceChoice,
  DndRaceDetail,
  DndSubraceDetail,
} from "../../../types";

export function buildInitialChoiceState(
  race: DndRaceDetail | null,
  subrace: DndSubraceDetail | null,
) {
  const allChoices = [
    ...(race?.elecciones ?? []),
    ...(subrace?.elecciones ?? []),
  ];

  return allChoices.reduce<Record<string, string[]>>((accumulator, choice) => {
    accumulator[choice.id] = Array.from({ length: choice.cantidad }, () => "");
    return accumulator;
  }, {});
}

export function preserveChoiceState(
  race: DndRaceDetail | null,
  subrace: DndSubraceDetail | null,
  currentState: Record<string, string[]>,
) {
  const nextState = buildInitialChoiceState(race, subrace);

  Object.keys(nextState).forEach((choiceId) => {
    if (currentState[choiceId]) {
      nextState[choiceId] = [...currentState[choiceId]];
    }
  });

  return nextState;
}

export function splitRaceChoices(choices: DndRaceChoice[]) {
  return {
    languageChoices: choices.filter(
      (choice) => normalizeChoiceCatalog(choice.catalogo) === "idiomas",
    ),
    abilityChoices: choices.filter(
      (choice) =>
        normalizeChoiceCatalog(choice.catalogo) ===
        "puntuacionescaracteristica",
    ),
    skillChoices: choices.filter(
      (choice) => normalizeChoiceCatalog(choice.catalogo) === "habilidades",
    ),
    competencyChoices: choices.filter((choice) =>
      ["herramientasartesano", "juegos", "instrumentos"].includes(
        normalizeChoiceCatalog(choice.catalogo),
      ),
    ),
    otherChoices: choices.filter(
      (choice) =>
        ![
          "idiomas",
          "puntuacionescaracteristica",
          "habilidades",
          "herramientasartesano",
          "juegos",
          "instrumentos",
          "trucosdemago",
          "ancestrosdraconicos",
        ].includes(normalizeChoiceCatalog(choice.catalogo)),
    ),
    traitChoices: choices.filter(
      (choice) =>
        normalizeChoiceCatalog(choice.catalogo) === "trucosdemago" ||
        normalizeChoiceCatalog(choice.catalogo) === "ancestrosdraconicos" ||
        choice.adjuntarATitulo,
    ),
  };
}

export function getChoiceTargetTitle(choice: DndRaceChoice) {
  return choice.adjuntarATitulo ?? choice.etiqueta;
}

export function removeChoiceDrivenItems(
  items: string[],
  shouldHide: boolean,
  pattern: RegExp,
) {
  if (!shouldHide) {
    return items;
  }

  return items.filter((item) => !pattern.test(item));
}

export function splitCompetencyItems(items: string[]) {
  return {
    skillItems: items
      .filter((item) => item.toLowerCase().startsWith("habilidad:"))
      .map((item) => item.replace(/^habilidad:\s*/i, "")),
    otherItems: items.filter(
      (item) => !item.toLowerCase().startsWith("habilidad:"),
    ),
  };
}
