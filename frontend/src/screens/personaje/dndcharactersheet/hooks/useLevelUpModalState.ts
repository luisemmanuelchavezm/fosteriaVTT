import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
  LevelUpDndCharacterRequest,
} from "../../utils/dndApi";
import {
  fetchClassSkills,
  fetchClassSubclassSkills,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  fetchSpellDetailByName,
  fetchSpellCatalog,
  type ClassSkillGroup,
} from "../../utils/dndApi";
import type {
  DndClassDetail,
  DndClassSummary,
  DndSubclassDetail,
} from "../../types";
import {
  classWarnings,
  inferCurrentSubclass,
  isAsiLevel,
  normalizeDndText,
  requiresSubclass,
} from "../../utils/dndProgressionRules";
import {
  buildFeatStatBonuses,
  FEAT_ATTRIBUTE_OPTIONS,
  FEAT_OPTIONS,
  getFeatValidity,
} from "../feats";
import { getClassLevel } from "../utils";

interface UseLevelUpModalStateProps {
  token: string;
  character: DndCharacterDetailResponse;
  classCompetencies: string[];
  isOpen: boolean;
  mode: "up" | "down";
  onClose: () => void;
  onSubmit: (payload: LevelUpDndCharacterRequest) => Promise<void>;
  onLevelDown: (classId: string) => Promise<void>;
}

export const ATTRIBUTE_OPTIONS = FEAT_ATTRIBUTE_OPTIONS;
export type LevelUpModalController = ReturnType<typeof useLevelUpModalState>;

export function useLevelUpModalState({
  token,
  character,
  classCompetencies,
  isOpen,
  mode,
  onClose,
  onSubmit,
  onLevelDown,
}: UseLevelUpModalStateProps) {
  const [selectedSpell, setSelectedSpell] =
    useState<CharacterAbilityResponse | null>(null);
  const [classSummaries, setClassSummaries] = useState<DndClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassDetail, setSelectedClassDetail] =
    useState<DndClassDetail | null>(null);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string | null>(
    null,
  );
  const [classChoices, setClassChoices] = useState<Record<string, string[]>>(
    {},
  );
  const [classSkillGroups, setClassSkillGroups] = useState<ClassSkillGroup[]>(
    [],
  );
  const [subclassSkillGroups, setSubclassSkillGroups] = useState<
    ClassSkillGroup[]
  >([]);
  const [asiMode, setAsiMode] = useState<"double" | "single" | "feat">(
    "double",
  );
  const [asiPrimary, setAsiPrimary] = useState<string>("Fuerza");
  const [asiSecondary, setAsiSecondary] = useState<string>("Destreza");
  const [selectedFeatId, setSelectedFeatId] = useState<string | null>(null);
  const [selectedFeatDetail, setSelectedFeatDetail] = useState<
    (typeof FEAT_OPTIONS)[number] | null
  >(null);
  const [selectedFeatStats, setSelectedFeatStats] = useState<string[]>([]);
  const [selectedFeatCompetencies, setSelectedFeatCompetencies] = useState<
    string[]
  >([]);
  const [selectedFeatSkills, setSelectedFeatSkills] = useState<string[]>([]);
  const [selectedFeatLanguages, setSelectedFeatLanguages] = useState<string[]>(
    [],
  );
  const [selectedFeatSpellClass, setSelectedFeatSpellClass] =
    useState<string>("");
  const [selectedFeatCantrips, setSelectedFeatCantrips] = useState<string[]>(
    [],
  );
  const [selectedFeatSpells, setSelectedFeatSpells] = useState<string[]>([]);
  const [featCantripOptions, setFeatCantripOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [featSpellOptions, setFeatSpellOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [missingChoiceErrors, setMissingChoiceErrors] = useState<
    Record<string, string>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eaChosenCantrips, setEaChosenCantrips] = useState<string[]>([]);
  const [eaChosenSpells, setEaChosenSpells] = useState<string[]>([]);
  const [eaCantripOptions, setEaCantripOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [eaSpellOptions, setEaSpellOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const [cantripUpgradeChosen, setCantripUpgradeChosen] = useState<string[]>(
    [],
  );
  const [cantripUpgradeOptions, setCantripUpgradeOptions] = useState<
    CharacterAbilityResponse[]
  >([]);
  const classSectionRef = useRef<HTMLElement | null>(null);
  const classChoicesSectionRef = useRef<HTMLElement | null>(null);
  const subclassSectionRef = useRef<HTMLElement | null>(null);
  const asiSectionRef = useRef<HTMLElement | null>(null);

  const selectedClassLevel = selectedClassDetail
    ? getClassLevel(character.clases, selectedClassDetail.nombre)
    : 0;
  const totalCharacterLevel = character.clases.reduce(
    (sum, item) => sum + item.nivel,
    0,
  );
  const targetLevel = selectedClassLevel + 1;
  const targetLevelAfterDown = Math.max(0, selectedClassLevel - 1);
  const currentSubclass = useMemo(
    () => inferCurrentSubclass(character, selectedClassDetail),
    [character, selectedClassDetail],
  );
  const effectiveSubclass: DndSubclassDetail | null =
    selectedClassDetail?.subclases.find(
      (item) => item.id === selectedSubclassId,
    ) ?? currentSubclass;
  const featOptions = useMemo(
    () =>
      FEAT_OPTIONS.map((feat) => ({
        feat,
        valid: getFeatValidity(feat, character, classCompetencies),
      })),
    [character, classCompetencies],
  );
  const selectedFeat =
    featOptions.find((entry) => entry.feat.id === selectedFeatId)?.feat ?? null;
  const requiresAsi = selectedClassDetail
    ? isAsiLevel(selectedClassDetail.id, targetLevel)
    : false;
  const needsSubclass = selectedClassDetail
    ? requiresSubclass(selectedClassDetail, targetLevel) && !currentSubclass
    : false;
  const classIsNew = selectedClassLevel === 0;
  const isDownMode = mode === "down";

  const eaSubclass = useMemo(
    () =>
      selectedClassDetail?.subclases.find(
        (s) => normalizeDndText(s.id) === "embaucadorarcano",
      ) ?? null,
    [selectedClassDetail],
  );
  const isActiveEa = useMemo(
    () =>
      !!effectiveSubclass &&
      normalizeDndText(effectiveSubclass.id) === "embaucadorarcano",
    [effectiveSubclass],
  );
  const isGainingEa =
    needsSubclass &&
    normalizeDndText(selectedSubclassId ?? "") === "embaucadorarcano";

  const getAtTableCounts = useCallback(
    (level: number) => {
      if (!eaSubclass || !eaSubclass.tablas || eaSubclass.tablas.length === 0)
        return { trucos: 0, conjuros: 0 };
      const tabla = eaSubclass.tablas[0];
      const row = tabla.filas.find((r) => r[0]?.trim() === String(level));
      if (!row || row.length < 3) return { trucos: 0, conjuros: 0 };
      return { trucos: parseInt(row[1]) || 0, conjuros: parseInt(row[2]) || 0 };
    },
    [eaSubclass],
  );

  const getAtMaxSpellLevel = useCallback(
    (level: number) => {
      if (!eaSubclass || !eaSubclass.tablas || eaSubclass.tablas.length === 0) {
        return 0;
      }
      const tabla = eaSubclass.tablas[0];
      const row = tabla.filas.find((r) => r[0]?.trim() === String(level));
      if (!row) {
        return 0;
      }
      for (let i = row.length - 1; i >= 3; i -= 1) {
        if ((parseInt(row[i]) || 0) > 0) {
          return i - 2;
        }
      }
      return 0;
    },
    [eaSubclass],
  );

  const eaCantripCount = useMemo(() => {
    if ((!isActiveEa && !isGainingEa) || isDownMode) return 0;
    const cur = getAtTableCounts(targetLevel);
    const prev = isGainingEa
      ? { trucos: 0 }
      : getAtTableCounts(targetLevel - 1);
    return Math.max(0, cur.trucos - prev.trucos);
  }, [isActiveEa, isGainingEa, isDownMode, targetLevel, getAtTableCounts]);

  const eaSpellCount = useMemo(() => {
    if ((!isActiveEa && !isGainingEa) || isDownMode) return 0;
    const cur = getAtTableCounts(targetLevel);
    const prev = isGainingEa
      ? { conjuros: 0 }
      : getAtTableCounts(targetLevel - 1);
    return Math.max(0, cur.conjuros - prev.conjuros);
  }, [isActiveEa, isGainingEa, isDownMode, targetLevel, getAtTableCounts]);

  const cantripUpgradeCount = useMemo(() => {
    if (
      !selectedClassDetail?.lanzamientoConjuros ||
      isDownMode ||
      targetLevel < 2
    )
      return 0;
    const niveles = selectedClassDetail.lanzamientoConjuros.niveles;
    const cur =
      niveles.find((n) => n.nivel === targetLevel)?.trucosConocidos ?? 0;
    const prev =
      niveles.find((n) => n.nivel === targetLevel - 1)?.trucosConocidos ?? 0;
    return Math.max(0, cur - prev);
  }, [selectedClassDetail, targetLevel, isDownMode]);

  const levelFeatures =
    classSkillGroups.find((group) => group.nivel === targetLevel)
      ?.habilidades ?? [];
  const subclassFeatures =
    subclassSkillGroups.find((group) => group.nivel === targetLevel)
      ?.habilidades ?? [];
  const visibleClassSummaries = classSummaries.filter(
    (classSummary) =>
      !isDownMode || getClassLevel(character.clases, classSummary.nombre) >= 1,
  );

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
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    setSelectedClassId(null);
    setSelectedClassDetail(null);
    setSelectedSubclassId(null);
    setClassChoices({});
    setClassSkillGroups([]);
    setSubclassSkillGroups([]);
    setMissingChoiceErrors({});
    setSelectedFeatDetail(null);
    setSelectedFeatStats([]);
    setSelectedFeatCompetencies([]);
    setSelectedFeatSkills([]);
    setSelectedFeatLanguages([]);
    setSelectedFeatSpellClass("");
    setSelectedFeatCantrips([]);
    setSelectedFeatSpells([]);
    setFeatCantripOptions([]);
    setFeatSpellOptions([]);
    closeSpellDetail();
    setEaChosenCantrips([]);
    setEaChosenSpells([]);
    setEaCantripOptions([]);
    setEaSpellOptions([]);
    setCantripUpgradeChosen([]);
    setCantripUpgradeOptions([]);
  }, [closeSpellDetail, isOpen]);

  useEffect(() => {
    if (!isOpen || asiMode !== "feat" || !selectedFeat) {
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
      return;
    }

    const spellSelection = selectedFeat.spellSelection;
    if (!spellSelection) {
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
      return;
    }

    const selectedClass = selectedFeatSpellClass.trim();
    if (spellSelection.chooseClass && !selectedClass) {
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
      return;
    }

    const abortController = new AbortController();
    const loadSpellOptions = async () => {
      try {
        if (spellSelection.cantrips > 0) {
          setFeatCantripOptions(
            await fetchSpellCatalog(
              token,
              { nivel: 0, clase: selectedClass || undefined },
              abortController.signal,
            ),
          );
        } else {
          setFeatCantripOptions([]);
        }
        if (spellSelection.spells > 0) {
          setFeatSpellOptions(
            await fetchSpellCatalog(
              token,
              { nivel: spellSelection.spellLevel ?? 1, clase: selectedClass },
              abortController.signal,
            ),
          );
        } else {
          setFeatSpellOptions([]);
        }
      } catch {
        setFeatCantripOptions([]);
        setFeatSpellOptions([]);
      }
    };
    void loadSpellOptions();
    return () => abortController.abort();
  }, [asiMode, isOpen, selectedFeat, selectedFeatSpellClass, token]);

  useEffect(() => {
    if (isDownMode || (!isGainingEa && !isActiveEa) || eaCantripCount <= 0) {
      setEaCantripOptions([]);
      return;
    }
    const knownNames = new Set(
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
    );
    const abortController = new AbortController();
    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: "mago" },
      abortController.signal,
    )
      .then((options) =>
        setEaCantripOptions(
          options.filter((o) => !knownNames.has(normalizeDndText(o.nombre))),
        ),
      )
      .catch(() => setEaCantripOptions([]));
    return () => abortController.abort();
  }, [
    isDownMode,
    isGainingEa,
    isActiveEa,
    eaCantripCount,
    character.habilidades,
    token,
  ]);

  useEffect(() => {
    if (isDownMode || (!isGainingEa && !isActiveEa) || eaSpellCount <= 0) {
      setEaSpellOptions([]);
      return;
    }
    const maxSpellLevel = getAtMaxSpellLevel(targetLevel);
    if (maxSpellLevel <= 0) {
      setEaSpellOptions([]);
      return;
    }
    const knownNames = new Set(
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
    );
    const abortController = new AbortController();
    const loadSpellOptions = async () => {
      const merged = new Map<string, CharacterAbilityResponse>();
      for (let spellLevel = 1; spellLevel <= maxSpellLevel; spellLevel += 1) {
        const options = await fetchSpellCatalog(
          token,
          { nivel: spellLevel, clase: "mago" },
          abortController.signal,
        );
        options.forEach((option) => {
          const normalizedName = normalizeDndText(option.nombre);
          if (!knownNames.has(normalizedName) && !merged.has(normalizedName)) {
            merged.set(normalizedName, option);
          }
        });
      }
      setEaSpellOptions(Array.from(merged.values()));
    };
    void loadSpellOptions().catch(() => setEaSpellOptions([]));
    return () => abortController.abort();
  }, [
    isDownMode,
    isGainingEa,
    isActiveEa,
    eaSpellCount,
    character.habilidades,
    token,
    targetLevel,
    getAtMaxSpellLevel,
  ]);

  useEffect(() => {
    if (isDownMode || cantripUpgradeCount <= 0 || !selectedClassDetail) {
      setCantripUpgradeOptions([]);
      return;
    }
    const knownNames = new Set(
      character.habilidades.map((h) => normalizeDndText(h.nombre)),
    );
    const abortController = new AbortController();
    void fetchSpellCatalog(
      token,
      { nivel: 0, clase: selectedClassDetail.id },
      abortController.signal,
    )
      .then((options) =>
        setCantripUpgradeOptions(
          options.filter((o) => !knownNames.has(normalizeDndText(o.nombre))),
        ),
      )
      .catch(() => setCantripUpgradeOptions([]));
    return () => abortController.abort();
  }, [
    isDownMode,
    cantripUpgradeCount,
    selectedClassDetail,
    character.habilidades,
    token,
  ]);

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
        setSelectedSubclassId(inferredSubclass?.id ?? null);
      })
      .catch(() => {
        setSelectedClassDetail(null);
        setClassSkillGroups([]);
      });
    return () => abortController.abort();
  }, [character, isOpen, selectedClassId, token]);

  useEffect(() => {
    if (!selectedClassDetail || !effectiveSubclass) {
      setSubclassSkillGroups([]);
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
  }, [effectiveSubclass, selectedClassDetail, token]);

  const scrollToTarget = (element: HTMLElement | null) => {
    if (!element) return;
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async () => {
    if (isDownMode) {
      if (!selectedClassDetail || selectedClassLevel < 1) {
        setSubmitError("Debes elegir una clase válida para bajar de nivel.");
        scrollToTarget(classSectionRef.current);
        return;
      }
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        await onLevelDown(selectedClassDetail.id);
        onClose();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "No se pudo bajar de nivel.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedClassDetail) {
      setSubmitError("Debes elegir la clase que va a subir de nivel.");
      scrollToTarget(classSectionRef.current);
      return;
    }

    if (classIsNew) {
      const nextMissingErrors = Object.fromEntries(
        selectedClassDetail.elecciones
          .filter(
            (choice) =>
              (classChoices[choice.id] ?? []).length < choice.cantidad,
          )
          .map((choice) => [
            choice.id,
            `Faltan ${choice.cantidad - (classChoices[choice.id] ?? []).length} selección(es).`,
          ]),
      );
      setMissingChoiceErrors(nextMissingErrors);
      if (Object.keys(nextMissingErrors).length > 0) {
        setSubmitError("Completa las elecciones obligatorias de la clase.");
        const firstMissingChoiceId = Object.keys(nextMissingErrors)[0];
        const choiceElement = firstMissingChoiceId
          ? document.getElementById(`levelup-choice-${firstMissingChoiceId}`)
          : null;
        scrollToTarget(choiceElement ?? classChoicesSectionRef.current);
        return;
      }
    }

    if (needsSubclass && !selectedSubclassId) {
      setSubmitError("Debes elegir una subclase para continuar.");
      scrollToTarget(subclassSectionRef.current);
      return;
    }

    if (requiresAsi && asiMode === "feat" && !selectedFeat) {
      setSubmitError("Debes seleccionar una dote.");
      scrollToTarget(asiSectionRef.current);
      return;
    }

    const missingFeatSelection =
      (selectedFeat?.selectableBonus &&
        selectedFeatStats.length < selectedFeat.selectableBonus.count) ||
      (selectedFeat?.selectableCompetencies &&
        selectedFeatCompetencies.filter((value) => value.trim().length > 0)
          .length < selectedFeat.selectableCompetencies.count) ||
      (selectedFeat?.selectableSkills &&
        selectedFeatSkills.filter((value) => value.trim().length > 0).length <
          selectedFeat.selectableSkills.count) ||
      (selectedFeat?.selectableLanguages &&
        selectedFeatLanguages.filter((value) => value.trim().length > 0)
          .length < selectedFeat.selectableLanguages.count);

    if (requiresAsi && missingFeatSelection) {
      setSubmitError("Completa todas las selecciones obligatorias de la dote.");
      scrollToTarget(asiSectionRef.current);
      return;
    }

    if (requiresAsi && selectedFeat?.spellSelection) {
      if (selectedFeat.spellSelection.chooseClass && !selectedFeatSpellClass) {
        setSubmitError("Debes elegir una clase para la dote.");
        scrollToTarget(asiSectionRef.current);
        return;
      }
      if (
        selectedFeatCantrips.filter((value) => value.trim().length > 0).length <
          selectedFeat.spellSelection.cantrips ||
        selectedFeatSpells.filter((value) => value.trim().length > 0).length <
          selectedFeat.spellSelection.spells
      ) {
        setSubmitError("Completa los conjuros de la dote.");
        scrollToTarget(asiSectionRef.current);
        return;
      }
    }

    const payload: LevelUpDndCharacterRequest = {
      claseId: selectedClassDetail.id,
      subclaseId: selectedSubclassId,
      eleccionesClase: classIsNew ? classChoices : undefined,
    };

    if (
      cantripUpgradeCount > 0 &&
      cantripUpgradeChosen.length < cantripUpgradeCount
    ) {
      setSubmitError(`Debes elegir ${cantripUpgradeCount} truco(s) nuevo(s).`);
      return;
    }
    if (
      (isGainingEa || isActiveEa) &&
      eaCantripCount > 0 &&
      eaChosenCantrips.length < eaCantripCount
    ) {
      setSubmitError(
        `Debes elegir ${eaCantripCount} truco(s) del Embaucador Arcano.`,
      );
      return;
    }
    if (
      (isGainingEa || isActiveEa) &&
      eaSpellCount > 0 &&
      eaChosenSpells.length < eaSpellCount
    ) {
      setSubmitError(
        `Debes elegir ${eaSpellCount} conjuro(s) del Embaucador Arcano.`,
      );
      return;
    }

    const extraElecciones: Record<string, string[]> = {};
    if (cantripUpgradeChosen.length > 0)
      extraElecciones["class-cantrip-upgrade"] = cantripUpgradeChosen;
    if (eaChosenCantrips.length > 0)
      extraElecciones["ea-cantrip"] = eaChosenCantrips;
    if (eaChosenSpells.length > 0) extraElecciones["ea-spell"] = eaChosenSpells;
    if (Object.keys(extraElecciones).length > 0) {
      payload.eleccionesClase = {
        ...(payload.eleccionesClase ?? {}),
        ...extraElecciones,
      };
    }

    if (requiresAsi) {
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
          idiomas: selectedFeatLanguages.filter(
            (value) => value.trim().length > 0,
          ),
          conjuros: [...selectedFeatCantrips, ...selectedFeatSpells].filter(
            (value) => value.trim().length > 0,
          ),
          claseConjuros: selectedFeatSpellClass || null,
        };
      } else if (asiMode === "single") {
        payload.modoMejoraCaracteristica = "single";
        payload.caracteristicaPrimaria = asiPrimary;
      } else {
        payload.modoMejoraCaracteristica = "double";
        payload.caracteristicaPrimaria = asiPrimary;
        payload.caracteristicaSecundaria = asiSecondary;
      }
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo subir de nivel.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ATTRIBUTE_OPTIONS,
    asiMode,
    asiPrimary,
    asiSecondary,
    asiSectionRef,
    classChoices,
    classChoicesSectionRef,
    classIsNew,
    classSectionRef,
    classSummaries,
    classWarnings,
    currentSubclass,
    effectiveSubclass,
    featCantripOptions,
    featOptions,
    featSpellOptions,
    handleSubmit,
    isDownMode,
    isSubmitting,
    levelFeatures,
    missingChoiceErrors,
    needsSubclass,
    requiresAsi,
    selectedClassDetail,
    selectedClassId,
    selectedClassLevel,
    selectedFeat,
    selectedFeatCantrips,
    selectedFeatCompetencies,
    selectedFeatDetail,
    selectedFeatId,
    selectedFeatLanguages,
    selectedFeatSkills,
    selectedFeatSpellClass,
    selectedFeatSpells,
    selectedFeatStats,
    selectedSubclassId,
    setAsiMode,
    setAsiPrimary,
    setAsiSecondary,
    setClassChoices,
    setSelectedClassId,
    setSelectedFeatCantrips,
    setSelectedFeatCompetencies,
    setSelectedFeatDetail,
    setSelectedFeatId,
    setSelectedFeatLanguages,
    setSelectedFeatSkills,
    setSelectedFeatSpellClass,
    setSelectedFeatSpells,
    setSelectedFeatStats,
    setSelectedSubclassId,
    closeSpellDetail,
    openSpellDetailByName,
    selectedSpell,
    subclassFeatures,
    subclassSectionRef,
    submitError,
    targetLevel,
    targetLevelAfterDown,
    totalCharacterLevel,
    visibleClassSummaries,
    eaChosenCantrips,
    eaChosenSpells,
    eaCantripOptions,
    eaSpellOptions,
    eaCantripCount,
    eaSpellCount,
    isGainingEa,
    isActiveEa,
    cantripUpgradeChosen,
    cantripUpgradeOptions,
    cantripUpgradeCount,
    setCantripUpgradeChosen,
    setEaChosenCantrips,
    setEaChosenSpells,
  };
}
