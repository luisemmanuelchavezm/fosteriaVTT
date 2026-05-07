import type { LevelUpDndCharacterRequest } from "../../utils/dndApi";
import { FEAT_OPTIONS } from "../feats/catalog";
import { buildFeatStatBonuses } from "../feats/helpers";
import {
  SKILL_EXPERTISE_CHOICE_ID,
  splitExpertiseChoices,
  TOOL_EXPERTISE_CHOICE_ID,
} from "../../utils/dndExpertise";

interface BuildLevelUpPayloadArgs {
  selectedClassId: string;
  selectedSubclassId: string | null;
  classIsNew: boolean;
  classChoices: Record<string, string[]>;
  visibleInitialClassChoiceIds: string[];
  expertiseChoices: string[];
  cantripUpgradeChosen: string[];
  eaChosenCantrips: string[];
  eaChosenSpells: string[];
  ekChosenCantrips: string[];
  ekChosenSpells: string[];
  battleMasterManeuvers: string[];
  requiresAsi: boolean;
  asiMode: "double" | "single" | "feat";
  asiPrimary: string;
  asiSecondary: string;
  selectedFeat: (typeof FEAT_OPTIONS)[number] | null;
  selectedFeatStats: string[];
  selectedFeatCompetencies: string[];
  selectedFeatSkills: string[];
  selectedFeatLanguages: string[];
  selectedFeatCantrips: string[];
  selectedFeatSpells: string[];
  selectedFeatSpellClass: string;
}

export function buildLevelUpPayload({
  selectedClassId,
  selectedSubclassId,
  classIsNew,
  classChoices,
  visibleInitialClassChoiceIds,
  expertiseChoices,
  cantripUpgradeChosen,
  eaChosenCantrips,
  eaChosenSpells,
  ekChosenCantrips,
  ekChosenSpells,
  battleMasterManeuvers,
  requiresAsi,
  asiMode,
  asiPrimary,
  asiSecondary,
  selectedFeat,
  selectedFeatStats,
  selectedFeatCompetencies,
  selectedFeatSkills,
  selectedFeatLanguages,
  selectedFeatCantrips,
  selectedFeatSpells,
  selectedFeatSpellClass,
}: BuildLevelUpPayloadArgs): LevelUpDndCharacterRequest {
  const payload: LevelUpDndCharacterRequest = {
    claseId: selectedClassId,
    subclaseId: selectedSubclassId,
    eleccionesClase: classIsNew
      ? Object.fromEntries(
          Object.entries(classChoices).filter(([choiceId]) =>
            visibleInitialClassChoiceIds.includes(choiceId),
          ),
        )
      : undefined,
  };

  const extraElecciones: Record<string, string[]> = {};
  if (expertiseChoices.some((value) => value.trim().length > 0)) {
    const { skillChoices, toolChoices } =
      splitExpertiseChoices(expertiseChoices);
    if (skillChoices.length > 0) {
      extraElecciones[SKILL_EXPERTISE_CHOICE_ID] = skillChoices;
    }
    if (toolChoices.length > 0) {
      extraElecciones[TOOL_EXPERTISE_CHOICE_ID] = toolChoices;
    }
  }
  if (cantripUpgradeChosen.length > 0) {
    extraElecciones["class-cantrip-upgrade"] = cantripUpgradeChosen;
  }
  if (eaChosenCantrips.length > 0) {
    extraElecciones["ea-cantrip"] = eaChosenCantrips;
  }
  if (eaChosenSpells.length > 0) {
    extraElecciones["ea-spell"] = eaChosenSpells;
  }
  if (ekChosenCantrips.length > 0) {
    extraElecciones["ek-cantrip"] = ekChosenCantrips;
  }
  if (ekChosenSpells.length > 0) {
    extraElecciones["ek-spell"] = ekChosenSpells;
  }
  if (battleMasterManeuvers.length > 0) {
    extraElecciones["bm-maneuver"] = battleMasterManeuvers;
  }
  if (Object.keys(extraElecciones).length > 0) {
    payload.eleccionesClase = {
      ...(payload.eleccionesClase ?? {}),
      ...extraElecciones,
    };
  }

  if (!requiresAsi) {
    return payload;
  }

  if (asiMode === "feat" && selectedFeat) {
    payload.modoMejoraCaracteristica = "dote";
    payload.dote = {
      nombre: selectedFeat.nombre,
      descripcion: selectedFeat.descripcion,
      formula: selectedFeat.formula ?? null,
      bonificacionesCaracteristica: buildFeatStatBonuses(
        selectedFeat,
        selectedFeatStats,
      ),
      competencias: selectedFeatCompetencies.filter(
        (value) => value.trim().length > 0,
      ),
      habilidades: selectedFeatSkills.filter(
        (value) => value.trim().length > 0,
      ),
      idiomas: selectedFeatLanguages.filter((value) => value.trim().length > 0),
      conjuros: [...selectedFeatCantrips, ...selectedFeatSpells].filter(
        (value) => value.trim().length > 0,
      ),
      claseConjuros: selectedFeatSpellClass || null,
    };
    return payload;
  }

  if (asiMode === "single") {
    payload.modoMejoraCaracteristica = "single";
    payload.caracteristicaPrimaria = asiPrimary;
    return payload;
  }

  payload.modoMejoraCaracteristica = "double";
  payload.caracteristicaPrimaria = asiPrimary;
  payload.caracteristicaSecundaria = asiSecondary;
  return payload;
}
