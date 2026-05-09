import { useCallback, useEffect, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import {
  fetchClassSkills,
  fetchClassSubclassSkills,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  fetchSpellDetailByName,
  type ClassSkillGroup,
} from "../../utils/dndApi";
import type {
  DndClassDetail,
  DndClassSummary,
  DndSubclassDetail,
} from "../../types";
import {
  inferCurrentSubclass,
  normalizeDndText,
} from "../../utils/dndProgressionRules";
import { EXPERTISE_CHOICE_SECTION_ID } from "../../utils/dndExpertise";
import { FEAT_OPTIONS } from "../feats/catalog";
import { scrollToTarget } from "./levelUpFocus";
import { getExpertiseMissingSelectionResult } from "./levelUpValidation";

interface UseLevelUpModalSupportOptions {
  availableExpertiseOptions: string[];
  character: DndCharacterDetailResponse;
  classChoicesSectionRef: MutableRefObject<HTMLElement | null>;
  effectiveSubclass: DndSubclassDetail | null;
  expertiseChoiceConfig: { count: number } | null;
  expertiseChoices: string[];
  isOpen: boolean;
  selectedClassDetail: DndClassDetail | null;
  selectedClassId: string | null;
  selectedClassLevel: number;
  setClassChoices: Dispatch<SetStateAction<Record<string, string[]>>>;
  setClassSkillGroups: Dispatch<SetStateAction<ClassSkillGroup[]>>;
  setClassSummaries: Dispatch<SetStateAction<DndClassSummary[]>>;
  setExpertiseChoices: Dispatch<SetStateAction<string[]>>;
  setMissingChoiceErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setSelectedClassDetail: Dispatch<SetStateAction<DndClassDetail | null>>;
  setSelectedClassId: Dispatch<SetStateAction<string | null>>;
  setSelectedFeatCompetencies: Dispatch<SetStateAction<string[]>>;
  setSelectedFeatDetail: Dispatch<
    SetStateAction<(typeof FEAT_OPTIONS)[number] | null>
  >;
  setSelectedFeatLanguages: Dispatch<SetStateAction<string[]>>;
  setSelectedFeatSkills: Dispatch<SetStateAction<string[]>>;
  setSelectedFeatSpellClass: Dispatch<SetStateAction<string>>;
  setSelectedFeatStats: Dispatch<SetStateAction<string[]>>;
  setSelectedSubclassId: Dispatch<SetStateAction<string | null>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  setSubclassSkillGroups: Dispatch<SetStateAction<ClassSkillGroup[]>>;
  token: string;
}

export function useLevelUpModalSupport({
  availableExpertiseOptions,
  character,
  classChoicesSectionRef,
  effectiveSubclass,
  expertiseChoiceConfig,
  expertiseChoices,
  isOpen,
  selectedClassDetail,
  selectedClassId,
  selectedClassLevel,
  setClassChoices,
  setClassSkillGroups,
  setClassSummaries,
  setExpertiseChoices,
  setMissingChoiceErrors,
  setSelectedClassDetail,
  setSelectedClassId,
  setSelectedFeatCompetencies,
  setSelectedFeatDetail,
  setSelectedFeatLanguages,
  setSelectedFeatSkills,
  setSelectedFeatSpellClass,
  setSelectedFeatStats,
  setSelectedSubclassId,
  setSubmitError,
  setSubclassSkillGroups,
  token,
}: UseLevelUpModalSupportOptions) {
  const [selectedSpell, setSelectedSpell] =
    useState<CharacterAbilityResponse | null>(null);

  const closeSpellDetail = useCallback(() => {
    setSelectedSpell(null);
  }, []);

  const openSpellDetailByName = useCallback(
    async (spellToken: string | null, spellName: string) => {
      if (!spellToken) {
        return;
      }

      try {
        const spell = await fetchSpellDetailByName(spellToken, spellName);
        if (spell) {
          setSelectedSpell(spell);
        }
      } catch {
        // Este modal es auxiliar; no interrumpimos el flujo si falla su carga.
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    const abortController = new AbortController();
    void fetchDndClassSummaries(token, abortController.signal)
      .then(setClassSummaries)
      .catch(() => setClassSummaries([]));
    return () => abortController.abort();
  }, [isOpen, setClassSummaries, token]);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    setSelectedClassId(null);
    setSelectedClassDetail(null);
    setSelectedSubclassId(null);
    setClassChoices({});
    setClassSkillGroups([]);
    setSubclassSkillGroups([]);
    setExpertiseChoices([]);
    setMissingChoiceErrors({});
    setSelectedFeatDetail(null);
    setSelectedFeatStats([]);
    setSelectedFeatCompetencies([]);
    setSelectedFeatSkills([]);
    setSelectedFeatLanguages([]);
    setSelectedFeatSpellClass("");
    closeSpellDetail();
  }, [
    closeSpellDetail,
    isOpen,
    setClassChoices,
    setClassSkillGroups,
    setExpertiseChoices,
    setMissingChoiceErrors,
    setSelectedClassDetail,
    setSelectedClassId,
    setSelectedFeatCompetencies,
    setSelectedFeatDetail,
    setSelectedFeatLanguages,
    setSelectedFeatSkills,
    setSelectedFeatSpellClass,
    setSelectedFeatStats,
    setSelectedSubclassId,
    setSubmitError,
    setSubclassSkillGroups,
  ]);

  useEffect(() => {
    if (!expertiseChoiceConfig) {
      setExpertiseChoices([]);
      return;
    }

    setExpertiseChoices((current) =>
      Array.from({ length: expertiseChoiceConfig.count }, (_, index) => {
        const currentValue = current[index] ?? "";
        return availableExpertiseOptions.some(
          (option) =>
            normalizeDndText(option) === normalizeDndText(currentValue),
        )
          ? currentValue
          : "";
      }),
    );
  }, [availableExpertiseOptions, expertiseChoiceConfig, setExpertiseChoices]);

  useEffect(() => {
    if (!selectedClassId || !isOpen) return;
    setClassChoices({});
    setSubclassSkillGroups([]);
    setMissingChoiceErrors({});

    const abortController = new AbortController();
    void Promise.all([
      fetchDndClassDetail(token, selectedClassId, abortController.signal),
      fetchClassSkills(token, selectedClassId, abortController.signal),
    ])
      .then(([detail, skills]) => {
        setSelectedClassDetail(detail);
        setClassSkillGroups(skills);
        const inferredSubclass = inferCurrentSubclass(character, detail);
        setSelectedSubclassId(
          inferredSubclass &&
            selectedClassLevel < inferredSubclass.nivelDesbloqueo
            ? null
            : (inferredSubclass?.id ?? null),
        );
      })
      .catch(() => {
        setSelectedClassDetail(null);
        setClassSkillGroups([]);
      });
    return () => abortController.abort();
  }, [
    character,
    isOpen,
    selectedClassId,
    selectedClassLevel,
    setClassChoices,
    setClassSkillGroups,
    setMissingChoiceErrors,
    setSelectedClassDetail,
    setSelectedSubclassId,
    setSubclassSkillGroups,
    token,
  ]);

  useEffect(() => {
    if (!selectedClassDetail || !effectiveSubclass) {
      setSubclassSkillGroups([]);
      return;
    }

    const selectedExpertiseCount = expertiseChoices.filter(
      (value) => value.trim().length > 0,
    ).length;
    if (
      expertiseChoiceConfig &&
      selectedExpertiseCount < expertiseChoiceConfig.count
    ) {
      const validation = getExpertiseMissingSelectionResult(
        selectedExpertiseCount,
        expertiseChoiceConfig.count,
      );
      setMissingChoiceErrors((current) => ({
        ...current,
        ...(validation.missingChoiceErrors ?? {}),
      }));
      setSubmitError(validation.error);
      const expertiseElement = document.getElementById(
        `levelup-choice-${EXPERTISE_CHOICE_SECTION_ID}`,
      );
      scrollToTarget(expertiseElement ?? classChoicesSectionRef.current);
      return;
    }

    const abortController = new AbortController();
    void fetchClassSubclassSkills(
      token,
      selectedClassDetail.id,
      effectiveSubclass.id,
      abortController.signal,
    )
      .then(setSubclassSkillGroups)
      .catch(() => setSubclassSkillGroups([]));
    return () => abortController.abort();
  }, [
    classChoicesSectionRef,
    effectiveSubclass,
    expertiseChoiceConfig,
    expertiseChoices,
    selectedClassDetail,
    setMissingChoiceErrors,
    setSubmitError,
    setSubclassSkillGroups,
    token,
  ]);

  return {
    closeSpellDetail,
    openSpellDetailByName,
    selectedSpell,
  };
}
