import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { normalizeText, uniqueNormalizedValues } from "./characterText";

export function getCharacterLanguages(character: DndCharacterDetailResponse) {
  return uniqueNormalizedValues(
    character.habilidades
      .map((ability) => ability.nombre)
      .filter((name) => normalizeText(name).startsWith(normalizeText("Idioma")))
      .map((name) => name.replace(/^Idioma(?:\s+dote)?\s*:\s*/i, "").trim())
      .filter((name) => !/\bidioma\s+a\s+eleccion\b/i.test(normalizeText(name)))
      .filter(
        (name) => !/^\d+\s+idioma\s+a\s+eleccion$/i.test(normalizeText(name)),
      ),
  );
}
