import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDndCharacterAbility,
  addDndCharacterInventoryItem,
  deleteDndCharacter,
  deleteDndCharacterAbility,
  deleteDndCharacterInventoryItem,
  fetchDndCompetencyCatalog,
  fetchDndCharacterDetail,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  levelDownDndCharacter,
  levelUpDndCharacter,
  type AddDndCharacterInventoryItemRequest,
  type CharacterAbilityResponse,
  type CharacterInventoryItemResponse,
  type DndCharacterDetailResponse,
  type LevelDownDndCharacterRequest,
  type LevelUpDndCharacterRequest,
  type UpdateDndCharacterSheetRequest,
  updateDndCharacterExperience,
  updateDndCharacterInventoryItem,
  updateDndCharacterResources,
  updateDndCharacterSheet,
} from "../../utils/dndApi";
import type { DndClassDetail, DndCompetencyCatalog } from "../../types";
import { useSpellDetailInteractions } from "../../utils/useSpellDetailInteractions";
import { buildCharacterSheetState } from "../screenState";
import {
  applyDamage,
  extractExtraResources,
  extractHitDiceStats,
  getActionDamageParts,
  getAbilityModifierByName,
  getCharacterCompetencies,
  getCharacterMoney,
  getStatValue,
  normalizeText,
  resolveCharacterFormula,
  shouldResetAbilityUsageOnRest,
  splitCharacterCompetencies,
  uniqueNormalizedValues,
} from "../utils";
import type { DetailTab } from "../data";

const HEALTH_TOTAL_STAT = "Puntos de vida";
const HEALTH_CURRENT_STAT = "Vida actual";
const HEALTH_TEMP_STAT = "Vida temporal";
const MOVEMENT_STAT = "Movimiento";
const ARMOR_CLASS_STAT = "CA";
const MAX_DELTA_VALUE = 99;
const MAX_CURRENT_HP = 3000;
const MAX_TEMP_HP = 300;

function extractClassCompetencies(detail: DndClassDetail) {
  return [
    ...detail.competencias.armaduras,
    ...detail.competencias.armas,
    ...detail.competencias.herramientas,
  ]
    .map((value) => value.trim())
    .filter(Boolean);
}

function sanitizeNonNegativeNumber(value: string) {
  const digitsOnly = value.replace(/\D+/g, "");
  if (digitsOnly === "") {
    return "0";
  }
  return String(Math.min(MAX_DELTA_VALUE, Number.parseInt(digitsOnly, 10)));
}

export function useDndCharacterSheetController(
  characterId: string,
  onGoCharacters: () => void,
) {
  const [character, setCharacter] = useState<DndCharacterDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hpDelta, setHpDelta] = useState("0");
  const [tempHpDelta, setTempHpDelta] = useState("0");
  const [currentHp, setCurrentHp] = useState(0);
  const [tempHp, setTempHp] = useState(0);
  const [currentSpellSlots, setCurrentSpellSlots] = useState<
    Record<number, number>
  >({});
  const [currentExtraResources, setCurrentExtraResources] = useState<
    Record<number, number>
  >({});
  const [currentMoney, setCurrentMoney] = useState<Record<string, number>>({
    ppt: 0,
    po: 0,
    pp: 0,
    pc: 0,
  });
  const [currentHitDice, setCurrentHitDice] = useState<Record<string, number>>(
    {},
  );
  const [abilityUsage, setAbilityUsage] = useState<Record<number, boolean>>({});
  const [resourceSaveError, setResourceSaveError] = useState<string | null>(
    null,
  );
  const [isShortRestModalOpen, setIsShortRestModalOpen] = useState(false);
  const [shortRestHitDiceCounts, setShortRestHitDiceCounts] = useState<
    Record<string, number>
  >({});
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("actions");
  const [selectedPassive, setSelectedPassive] =
    useState<CharacterAbilityResponse | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<CharacterInventoryItemResponse | null>(null);
  const [isInventoryCatalogOpen, setIsInventoryCatalogOpen] = useState(false);
  const [isSpellCatalogOpen, setIsSpellCatalogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLevelManagementOpen, setIsLevelManagementOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [levelModalMode, setLevelModalMode] = useState<"up" | "down">("up");
  const [isDeleteCharacterConfirmOpen, setIsDeleteCharacterConfirmOpen] =
    useState(false);
  const [editableName, setEditableName] = useState("");
  const [editableAlignment, setEditableAlignment] = useState("");
  const [editablePersonalHistory, setEditablePersonalHistory] = useState("");
  const [editableLanguagesText, setEditableLanguagesText] = useState("");
  const [editableStatScores, setEditableStatScores] = useState<
    Record<string, number>
  >({});
  const [editableMovement, setEditableMovement] = useState(0);
  const [editableMaxHp, setEditableMaxHp] = useState(1);
  const [editableSpellSlotMaximums, setEditableSpellSlotMaximums] = useState<
    Record<number, number>
  >({});
  const [editableExtraResourceMaximums, setEditableExtraResourceMaximums] =
    useState<Record<number, number>>({});
  const [
    editableSavingThrowProficiencies,
    setEditableSavingThrowProficiencies,
  ] = useState<string[]>([]);
  const [editableSkillProficiencies, setEditableSkillProficiencies] = useState<
    string[]
  >([]);
  const [editableWeaponArmorCompetencies, setEditableWeaponArmorCompetencies] =
    useState<string[]>([]);
  const [editableToolCompetencies, setEditableToolCompetencies] = useState<
    string[]
  >([]);
  const [classCompetencies, setClassCompetencies] = useState<string[]>([]);
  const [competencyCatalog, setCompetencyCatalog] =
    useState<DndCompetencyCatalog | null>(null);
  const spellInteractions = useSpellDetailInteractions();
  const resourceSaveSequence = useRef(0);
  const competencySeedKeyRef = useRef<string | null>(null);
  const token = localStorage.getItem("jwtToken") ?? "";

  useEffect(() => {
    const authToken = localStorage.getItem("jwtToken");

    if (!authToken) {
      setCharacter(null);
      setLoadError("No se pudo autenticar la hoja del personaje.");
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadCharacter = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchDndCharacterDetail(
          authToken,
          characterId,
          abortController.signal,
        );
        const sheetState = buildCharacterSheetState(
          data,
          HEALTH_CURRENT_STAT,
          HEALTH_TEMP_STAT,
          HEALTH_TOTAL_STAT,
          MOVEMENT_STAT,
        );

        setCharacter(data);
        setCurrentHp(sheetState.currentHp);
        setTempHp(sheetState.tempHp);
        setCurrentSpellSlots(sheetState.currentSpellSlots);
        setCurrentExtraResources(sheetState.currentExtraResources);
        setCurrentHitDice(sheetState.currentHitDice);
        setCurrentMoney(sheetState.currentMoney);
        setEditableName(sheetState.editableName);
        setEditableAlignment(sheetState.editableAlignment);
        setEditablePersonalHistory(sheetState.editablePersonalHistory);
        setEditableLanguagesText(sheetState.editableLanguagesText);
        setEditableStatScores(sheetState.editableStatScores);
        setEditableMovement(sheetState.editableMovement);
        setEditableMaxHp(sheetState.editableMaxHp);
        setEditableSpellSlotMaximums(sheetState.editableSpellSlotMaximums);
        setEditableExtraResourceMaximums(
          sheetState.editableExtraResourceMaximums,
        );
        setEditableSavingThrowProficiencies(
          sheetState.editableSavingThrowProficiencies,
        );
        setEditableSkillProficiencies(sheetState.editableSkillProficiencies);
        setEditableWeaponArmorCompetencies([]);
        setEditableToolCompetencies([]);
        setAbilityUsage({});
        setResourceSaveError(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setCharacter(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la hoja del personaje.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCharacter();

    return () => {
      abortController.abort();
    };
  }, [characterId]);

  useEffect(() => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken) {
      setCompetencyCatalog(null);
      return;
    }

    const abortController = new AbortController();

    const loadCompetencyCatalog = async () => {
      try {
        const data = await fetchDndCompetencyCatalog(
          authToken,
          abortController.signal,
        );
        setCompetencyCatalog(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setCompetencyCatalog(null);
      }
    };

    void loadCompetencyCatalog();

    return () => {
      abortController.abort();
    };
  }, [characterId]);

  useEffect(() => {
    if (!character) {
      setClassCompetencies([]);
      return;
    }

    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || character.clases.length === 0) {
      setClassCompetencies([]);
      return;
    }

    const abortController = new AbortController();

    const loadClassCompetencies = async () => {
      try {
        const summaries = await fetchDndClassSummaries(
          authToken,
          abortController.signal,
        );
        const summaryByName = new Map(
          summaries.map((summary) => [
            normalizeText(summary.nombre),
            summary.id,
          ]),
        );
        const classIds = character.clases
          .map(
            (entry) => summaryByName.get(normalizeText(entry.nombre)) ?? null,
          )
          .filter((value): value is string => value !== null);

        if (classIds.length === 0) {
          setClassCompetencies([]);
          return;
        }

        const details = await Promise.all(
          classIds.map((classId) =>
            fetchDndClassDetail(authToken, classId, abortController.signal),
          ),
        );
        setClassCompetencies(
          uniqueNormalizedValues(
            details.flatMap(extractClassCompetencies),
          ).sort((left, right) => left.localeCompare(right, "es")),
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setClassCompetencies([]);
      }
    };

    void loadClassCompetencies();

    return () => {
      abortController.abort();
    };
  }, [character]);

  useEffect(() => {
    if (!character || isEditMode) {
      return;
    }
    if (!competencyCatalog) {
      return;
    }

    const seedKey = `${character.id}:${classCompetencies.join("|")}`;
    if (competencySeedKeyRef.current === seedKey) {
      return;
    }

    const competencyGroups = splitCharacterCompetencies(
      getCharacterCompetencies(character, classCompetencies, competencyCatalog),
      competencyCatalog,
    );
    setEditableWeaponArmorCompetencies(competencyGroups.weaponArmor);
    setEditableToolCompetencies(competencyGroups.tools);
    competencySeedKeyRef.current = seedKey;
  }, [character, classCompetencies, competencyCatalog, isEditMode]);

  const totalHp = useMemo(
    () => getStatValue(character, HEALTH_TOTAL_STAT),
    [character],
  );
  const movement = useMemo(
    () => getStatValue(character, MOVEMENT_STAT),
    [character],
  );
  const armorClass = useMemo(
    () => getStatValue(character, ARMOR_CLASS_STAT),
    [character],
  );
  const dexterityScore = useMemo(
    () => getStatValue(character, "Destreza"),
    [character],
  );
  const constitutionModifier = useMemo(
    () => getAbilityModifierByName(character, "Constitucion"),
    [character],
  );
  const hitDiceEntries = useMemo(
    () =>
      extractHitDiceStats(character?.estadisticas ?? {}).map((entry) => ({
        ...entry,
        current: currentHitDice[entry.die] ?? entry.total,
      })),
    [character, currentHitDice],
  );
  const initiative = useMemo(
    () =>
      character?.estadisticas.Iniciativa ??
      Math.floor((dexterityScore - 10) / 2),
    [character, dexterityScore],
  );
  const totalCharacterLevel = useMemo(
    () => character?.clases.reduce((sum, item) => sum + item.nivel, 0) ?? 0,
    [character],
  );
  const persistedSpellSlots = useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => index + 1)
          .map((level) => [
            level,
            character?.estadisticas[`Hechizos nivel ${level} gastados`] ??
              character?.estadisticas[`Hechizos nivel ${level}`] ??
              0,
          ])
          .filter(([, amount]) => amount > 0),
      ),
    [character],
  );
  const persistedMoney = useMemo(
    () => getCharacterMoney(character),
    [character],
  );
  const persistedExtraResources = useMemo(
    () =>
      Object.fromEntries(
        extractExtraResources(character?.estadisticas ?? {})
          .filter((entry) => entry.max > 0)
          .map((entry) => [entry.index, entry.current]),
      ),
    [character],
  );

  useEffect(() => {
    if (!character || isLoading || loadError || isEditMode) {
      return;
    }

    const changedSpellSlots = Object.fromEntries(
      Object.entries(currentSpellSlots).filter(
        ([level, amount]) => persistedSpellSlots[Number(level)] !== amount,
      ),
    ) as Record<number, number>;

    const hasResourceChanges =
      currentHp !== (character.estadisticas[HEALTH_CURRENT_STAT] ?? 0) ||
      tempHp !== (character.estadisticas[HEALTH_TEMP_STAT] ?? 0) ||
      Object.keys(changedSpellSlots).length > 0 ||
      Object.keys(currentExtraResources).some(
        (resourceIndex) =>
          persistedExtraResources[Number(resourceIndex)] !==
          currentExtraResources[Number(resourceIndex)],
      ) ||
      Object.keys(currentMoney).some(
        (currency) => persistedMoney[currency] !== currentMoney[currency],
      );

    if (!hasResourceChanges) {
      return;
    }

    const authToken = localStorage.getItem("jwtToken");
    if (!authToken) {
      return;
    }

    const requestId = resourceSaveSequence.current + 1;
    resourceSaveSequence.current = requestId;
    const timeoutId = window.setTimeout(() => {
      void updateDndCharacterResources(authToken, character.id, {
        vidaActual: currentHp,
        vidaTemporal: tempHp,
        espaciosConjuroActuales: changedSpellSlots,
        recursosExtraActuales: currentExtraResources,
        dinero: currentMoney,
      })
        .then(() => {
          if (resourceSaveSequence.current !== requestId) {
            return;
          }

          setCharacter((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              estadisticas: {
                ...current.estadisticas,
                [HEALTH_CURRENT_STAT]: currentHp,
                [HEALTH_TEMP_STAT]: tempHp,
                ...Object.fromEntries(
                  Object.entries(changedSpellSlots).map(([level, amount]) => [
                    `Hechizos nivel ${level} gastados`,
                    amount,
                  ]),
                ),
              },
            };
          });
          setResourceSaveError(null);
        })
        .catch((error) => {
          if (resourceSaveSequence.current !== requestId) {
            return;
          }

          setResourceSaveError(
            error instanceof Error
              ? error.message
              : "No se pudieron guardar los recursos del personaje.",
          );
        });
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    character,
    currentHp,
    currentExtraResources,
    currentMoney,
    currentSpellSlots,
    isEditMode,
    isLoading,
    loadError,
    persistedExtraResources,
    persistedMoney,
    persistedSpellSlots,
    tempHp,
  ]);

  const syncCharacterDetail = (data: DndCharacterDetailResponse) => {
    const sheetState = buildCharacterSheetState(
      data,
      HEALTH_CURRENT_STAT,
      HEALTH_TEMP_STAT,
      HEALTH_TOTAL_STAT,
      MOVEMENT_STAT,
    );

    setCharacter(data);
    setCurrentHp(sheetState.currentHp);
    setTempHp(sheetState.tempHp);
    setCurrentSpellSlots(sheetState.currentSpellSlots);
    setCurrentExtraResources(sheetState.currentExtraResources);
    setCurrentHitDice(sheetState.currentHitDice);
    setCurrentMoney(sheetState.currentMoney);
    setEditableName(sheetState.editableName);
    setEditableAlignment(sheetState.editableAlignment);
    setEditablePersonalHistory(sheetState.editablePersonalHistory);
    setEditableLanguagesText(sheetState.editableLanguagesText);
    setEditableStatScores(sheetState.editableStatScores);
    setEditableMovement(sheetState.editableMovement);
    setEditableMaxHp(sheetState.editableMaxHp);
    setEditableSpellSlotMaximums(sheetState.editableSpellSlotMaximums);
    setEditableExtraResourceMaximums(sheetState.editableExtraResourceMaximums);
    setEditableSavingThrowProficiencies(
      sheetState.editableSavingThrowProficiencies,
    );
    setEditableSkillProficiencies(sheetState.editableSkillProficiencies);
    if (competencyCatalog) {
      const competencyGroups = splitCharacterCompetencies(
        getCharacterCompetencies(data, classCompetencies, competencyCatalog),
        competencyCatalog,
      );
      setEditableWeaponArmorCompetencies(competencyGroups.weaponArmor);
      setEditableToolCompetencies(competencyGroups.tools);
    }
    setSelectedInventoryItem((current) =>
      current
        ? (data.mochila.find((item) => item.id === current.id) ?? null)
        : current,
    );
  };

  const parsedHpDelta = Number.parseInt(hpDelta, 10);
  const hpStepValue = Number.isNaN(parsedHpDelta) ? 0 : parsedHpDelta;
  const parsedTempHpDelta = Number.parseInt(tempHpDelta, 10);
  const tempHpStepValue = Number.isNaN(parsedTempHpDelta)
    ? 0
    : parsedTempHpDelta;

  const handleHeal = () => {
    if (hpStepValue <= 0) {
      return;
    }
    setCurrentHp((current) =>
      Math.min(Math.min(totalHp, MAX_CURRENT_HP), current + hpStepValue),
    );
    setHpDelta(String(hpStepValue));
  };

  const handleDamage = () => {
    if (hpStepValue <= 0) {
      return;
    }
    const nextValues = applyDamage(currentHp, tempHp, hpStepValue);
    setCurrentHp(Math.max(0, Math.min(MAX_CURRENT_HP, nextValues.currentHp)));
    setTempHp(nextValues.tempHp);
    setHpDelta(String(hpStepValue));
  };

  const handleGainTempHp = () => {
    if (tempHpStepValue <= 0) {
      return;
    }
    setTempHp((current) => Math.min(MAX_TEMP_HP, current + tempHpStepValue));
    setTempHpDelta(String(tempHpStepValue));
  };

  const handleLoseTempHp = () => {
    if (tempHpStepValue <= 0) {
      return;
    }
    setTempHp((current) => Math.max(0, current - tempHpStepValue));
    setTempHpDelta(String(tempHpStepValue));
  };

  const handleIncrementHpDelta = () => {
    setHpDelta((current) =>
      String(Math.min(MAX_DELTA_VALUE, Number.parseInt(current, 10) + 1 || 1)),
    );
  };

  const handleDecrementHpDelta = () => {
    setHpDelta((current) =>
      String(Math.max(0, (Number.parseInt(current, 10) || 0) - 1)),
    );
  };

  const handleIncrementTempHpDelta = () => {
    setTempHpDelta((current) =>
      String(Math.min(MAX_DELTA_VALUE, Number.parseInt(current, 10) + 1 || 1)),
    );
  };

  const handleDecrementTempHpDelta = () => {
    setTempHpDelta((current) =>
      String(Math.max(0, (Number.parseInt(current, 10) || 0) - 1)),
    );
  };

  const handleRollAbilityCheck = (statName: string) => {
    if (!character) {
      return;
    }
    spellInteractions.diceRoller.rollD20Check(
      statName,
      getAbilityModifierByName(character, statName),
    );
  };

  const handleRollInitiative = () => {
    spellInteractions.diceRoller.rollD20Check("Iniciativa", initiative);
  };

  const handleRollSavingThrow = (label: string, total: number) => {
    spellInteractions.diceRoller.rollD20Check(`Salvacion de ${label}`, total);
  };

  const handleRollSkill = (label: string, total: number) => {
    spellInteractions.diceRoller.rollD20Check(label, total);
  };

  const handleRollWeaponAttack = (weaponName: string, bonus: number | null) => {
    if (bonus === null) {
      return;
    }
    spellInteractions.diceRoller.rollD20Check(
      `Ataque con ${weaponName}`,
      bonus,
    );
  };

  const handleRollActionDamage = (action: CharacterAbilityResponse) => {
    if (!character) {
      return;
    }
    const expression = getActionDamageParts(character, action).expression;
    if (!expression) {
      return;
    }
    spellInteractions.diceRoller.rollExpression(
      `Daño de ${action.nombre}`,
      expression,
    );
  };

  const handleAdjustSpellSlot = (level: number, delta: number) => {
    if (!character) {
      return;
    }
    if (isEditMode) {
      const maxSlots = editableSpellSlotMaximums[level] ?? 0;
      setCurrentSpellSlots((current) => ({
        ...current,
        [level]: Math.max(
          0,
          Math.min(maxSlots, (current[level] ?? maxSlots) + delta),
        ),
      }));
      return;
    }

    const totalSlots = character.estadisticas[`Hechizos nivel ${level}`] ?? 0;
    if (totalSlots <= 0) {
      return;
    }

    setCurrentSpellSlots((current) => {
      const nextValue = Math.min(
        totalSlots,
        Math.max(0, (current[level] ?? totalSlots) + delta),
      );
      return { ...current, [level]: nextValue };
    });
  };

  const handleAdjustSpellSlotMax = (level: number, delta: number) => {
    setEditableSpellSlotMaximums((current) => {
      const nextMax = Math.max(0, Math.min(30, (current[level] ?? 0) + delta));
      setCurrentSpellSlots((currentSlots) => ({
        ...currentSlots,
        [level]:
          nextMax === 0 ? 0 : Math.min(nextMax, currentSlots[level] ?? nextMax),
      }));
      return { ...current, [level]: nextMax };
    });
  };

  const handleAdjustExtraResource = (resourceIndex: number, delta: number) => {
    const maxValue = isEditMode
      ? (editableExtraResourceMaximums[resourceIndex] ?? 0)
      : (extractExtraResources(character?.estadisticas ?? {}).find(
          (entry) => entry.index === resourceIndex,
        )?.max ?? 0);
    setCurrentExtraResources((current) => ({
      ...current,
      [resourceIndex]: Math.max(
        0,
        Math.min(maxValue, (current[resourceIndex] ?? maxValue) + delta),
      ),
    }));
  };

  const handleAdjustExtraResourceMax = (
    resourceIndex: number,
    delta: number,
  ) => {
    setEditableExtraResourceMaximums((current) => {
      const nextMax = Math.max(
        0,
        Math.min(30, (current[resourceIndex] ?? 0) + delta),
      );
      setCurrentExtraResources((currentResources) => ({
        ...currentResources,
        [resourceIndex]:
          nextMax === 0
            ? 0
            : Math.min(nextMax, currentResources[resourceIndex] ?? nextMax),
      }));
      return { ...current, [resourceIndex]: nextMax };
    });
  };

  const handleToggleSavingThrowProficiency = (statName: string) => {
    setEditableSavingThrowProficiencies((current) =>
      current.includes(statName)
        ? current.filter((item) => item !== statName)
        : [...current, statName],
    );
  };

  const handleToggleSkillProficiency = (skillName: string) => {
    setEditableSkillProficiencies((current) =>
      current.includes(skillName)
        ? current.filter((item) => item !== skillName)
        : [...current, skillName],
    );
  };

  const handleCancelEdit = () => {
    if (!character) {
      return;
    }
    syncCharacterDetail(character);
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }

    try {
      const payload: UpdateDndCharacterSheetRequest = {
        nombre: editableName.trim() || character.nombre,
        alineamiento: editableAlignment.trim() || null,
        historiaPersonal: editablePersonalHistory.trim() || null,
        idiomasTexto: editableLanguagesText,
        competenciasArmasArmaduras: editableWeaponArmorCompetencies,
        competenciasHerramientas: editableToolCompetencies,
        estadisticasBase: editableStatScores,
        movimiento: editableMovement,
        vidaMaxima: editableMaxHp,
        espaciosConjuroMaximos: editableSpellSlotMaximums,
        espaciosConjuroActuales: currentSpellSlots,
        recursosExtraMaximos: editableExtraResourceMaximums,
        recursosExtraActuales: currentExtraResources,
        salvacionesCompetentes: editableSavingThrowProficiencies,
        habilidadesCompetentes: editableSkillProficiencies,
      };
      const updatedCharacter = await updateDndCharacterSheet(
        authToken,
        character.id,
        payload,
      );
      syncCharacterDetail(updatedCharacter);
      setIsEditMode(false);
      setResourceSaveError(null);
    } catch (error) {
      setResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la edición del personaje.",
      );
    }
  };

  const handleToggleAbilityUsage = (abilityId: number) => {
    setAbilityUsage((current) => ({
      ...current,
      [abilityId]: !(current[abilityId] ?? false),
    }));
  };

  const handleShortRestRecovery = () => {
    if (!character) {
      return;
    }

    setAbilityUsage((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, value]) => {
          const ability = character.habilidades.find(
            (item) => item.id === Number(key),
          );
          if (!ability || !value) {
            return [key, value];
          }
          return [
            key,
            shouldResetAbilityUsageOnRest(ability, "short") ? false : value,
          ];
        }),
      ),
    );
  };

  const handleConfirmShortRest = () => {
    if (hitDiceEntries.length === 0) {
      setIsShortRestModalOpen(false);
      return;
    }

    let totalHealedAmount = 0;
    const nextHitDice = { ...currentHitDice };
    const rollRequests: { title: string; expression: string }[] = [];
    for (const entry of hitDiceEntries) {
      const usedDice = Math.min(
        shortRestHitDiceCounts[entry.die] ?? 0,
        currentHitDice[entry.die] ?? entry.total,
      );
      if (usedDice <= 0) {
        continue;
      }
      const restExpression =
        constitutionModifier === 0
          ? `${usedDice}${entry.die}`
          : constitutionModifier > 0
            ? `${usedDice}${entry.die} + ${constitutionModifier * usedDice}`
            : `${usedDice}${entry.die} - ${Math.abs(constitutionModifier * usedDice)}`;
      const faces = Number.parseInt(entry.die.replace(/\D+/g, ""), 10);
      const rolledTotal = Array.from({ length: usedDice }, () =>
        Number.isNaN(faces) ? 0 : Math.floor(Math.random() * faces) + 1,
      ).reduce((total, value) => total + value, 0);
      totalHealedAmount += Math.max(
        0,
        rolledTotal + constitutionModifier * usedDice,
      );
      nextHitDice[entry.die] = Math.max(
        0,
        (currentHitDice[entry.die] ?? entry.total) - usedDice,
      );
      rollRequests.push({
        title: `Descanso corto ${usedDice}${entry.die}`,
        expression: restExpression,
      });
    }

    if (rollRequests.length > 0) {
      spellInteractions.diceRoller.rollExpressionsSequence(rollRequests);
    }

    setCurrentHitDice(nextHitDice);
    setCurrentHp((current) =>
      Math.min(Math.min(totalHp, MAX_CURRENT_HP), current + totalHealedAmount),
    );
    handleShortRestRecovery();
    setShortRestHitDiceCounts({});
    setIsShortRestModalOpen(false);
  };

  const handleOpenShortRest = () => {
    setShortRestHitDiceCounts({});
    setIsShortRestModalOpen(true);
  };

  const handleLongRest = () => {
    if (!character) {
      return;
    }

    setCurrentHp(Math.min(totalHp, MAX_CURRENT_HP));
    setTempHp(0);
    setCurrentSpellSlots(
      Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => index + 1)
          .map((level) => [
            level,
            character.estadisticas[`Hechizos nivel ${level}`] ?? 0,
          ])
          .filter(([, amount]) => amount > 0),
      ),
    );
    setCurrentHitDice((current) => {
      const next = { ...current };
      for (const entry of extractHitDiceStats(character.estadisticas)) {
        const recovered = Math.max(1, Math.floor(entry.total / 2));
        next[entry.die] = Math.min(
          entry.total,
          (current[entry.die] ?? entry.total) + recovered,
        );
      }
      return next;
    });
    setAbilityUsage((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, value]) => {
          const ability = character.habilidades.find(
            (item) => item.id === Number(key),
          );
          if (!ability || !value) {
            return [key, value];
          }
          return [
            key,
            shouldResetAbilityUsageOnRest(ability, "long") ? false : value,
          ];
        }),
      ),
    );
  };

  const handleRollSpellAttack = (bonus: number) => {
    spellInteractions.diceRoller.rollD20Check("Ataque de hechizo", bonus);
  };

  const handleAdjustMoney = (currency: string, delta: number) => {
    setCurrentMoney((current) => ({
      ...current,
      [currency]: Math.max(0, (current[currency] ?? 0) + delta),
    }));
  };

  const handleToggleInventoryEquip = async (
    itemId: number,
    equipped: boolean,
  ) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }

    try {
      const updatedCharacter = await updateDndCharacterInventoryItem(
        authToken,
        character.id,
        itemId,
        { equipado: equipped },
      );
      syncCharacterDetail(updatedCharacter);
      setResourceSaveError(null);
    } catch (error) {
      setResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el equipamiento del personaje.",
      );
    }
  };

  const handleAddInventoryItem = async (
    payload: AddDndCharacterInventoryItemRequest,
  ) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await addDndCharacterInventoryItem(
      authToken,
      character.id,
      payload,
    );
    syncCharacterDetail(updatedCharacter);
    setResourceSaveError(null);
  };

  const handleDeleteSelectedInventoryItem = async () => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character || !selectedInventoryItem) {
      return;
    }
    try {
      const updatedCharacter = await deleteDndCharacterInventoryItem(
        authToken,
        character.id,
        selectedInventoryItem.id,
      );
      syncCharacterDetail(updatedCharacter);
      setSelectedInventoryItem(null);
      setResourceSaveError(null);
    } catch (error) {
      setResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el objeto de la mochila.",
      );
    }
  };

  const handleUpdateSelectedInventoryQuantity = async (quantity: number) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character || !selectedInventoryItem) {
      return;
    }
    try {
      const updatedCharacter = await updateDndCharacterInventoryItem(
        authToken,
        character.id,
        selectedInventoryItem.id,
        { cantidad: quantity },
      );
      syncCharacterDetail(updatedCharacter);
      setResourceSaveError(null);
    } catch (error) {
      setResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cantidad del objeto.",
      );
    }
  };

  const handleAddSpell = async (abilityId: number) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await addDndCharacterAbility(
      authToken,
      character.id,
      { habilidadId: abilityId },
    );
    syncCharacterDetail(updatedCharacter);
    setResourceSaveError(null);
  };

  const handleDeleteSelectedSpell = async (spell: CharacterAbilityResponse) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }
    try {
      const updatedCharacter = await deleteDndCharacterAbility(
        authToken,
        character.id,
        spell.id,
      );
      syncCharacterDetail(updatedCharacter);
      spellInteractions.closeSpellDetail();
      setResourceSaveError(null);
    } catch (error) {
      setResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el hechizo del personaje.",
      );
    }
  };

  const handleDeleteCharacter = async () => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }
    try {
      await deleteDndCharacter(authToken, character.id);
      setIsDeleteCharacterConfirmOpen(false);
      onGoCharacters();
    } catch (error) {
      setResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el personaje.",
      );
    }
  };

  const handleSaveExperience = async (experience: number) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await updateDndCharacterExperience(
      authToken,
      character.id,
      { experiencia: experience },
    );
    syncCharacterDetail(updatedCharacter);
    setResourceSaveError(null);
  };

  const handleSubmitLevelUp = async (payload: LevelUpDndCharacterRequest) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await levelUpDndCharacter(
      authToken,
      character.id,
      payload,
    );
    syncCharacterDetail(updatedCharacter);
    setResourceSaveError(null);
  };

  const handleLevelDown = async (classId: string) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await levelDownDndCharacter(
      authToken,
      character.id,
      { claseId: classId } as LevelDownDndCharacterRequest,
    );
    syncCharacterDetail(updatedCharacter);
    setResourceSaveError(null);
  };

  return {
    abilityUsage,
    activeDetailTab,
    armorClass,
    character,
    classCompetencies,
    competencyCatalog,
    currentExtraResources,
    currentHp,
    currentHitDice,
    currentMoney,
    currentSpellSlots,
    editableAlignment,
    editableExtraResourceMaximums,
    editableLanguagesText,
    editableMaxHp,
    editableMovement,
    editableName,
    editablePersonalHistory,
    editableSavingThrowProficiencies,
    editableSkillProficiencies,
    editableSpellSlotMaximums,
    editableStatScores,
    editableToolCompetencies,
    editableWeaponArmorCompetencies,
    handleAddInventoryItem,
    handleAddSpell,
    handleAdjustExtraResource,
    handleAdjustExtraResourceMax,
    handleAdjustMoney,
    handleAdjustSpellSlot,
    handleAdjustSpellSlotMax,
    handleCancelEdit,
    handleConfirmShortRest,
    handleDamage,
    handleDecrementHpDelta,
    handleDecrementTempHpDelta,
    handleDeleteCharacter,
    handleDeleteSelectedInventoryItem,
    handleDeleteSelectedSpell,
    handleGainTempHp,
    handleHeal,
    handleIncrementHpDelta,
    handleIncrementTempHpDelta,
    handleLevelDown,
    handleLongRest,
    handleLoseTempHp,
    handleOpenShortRest,
    handleRollAbilityCheck,
    handleRollActionDamage,
    handleRollInitiative,
    handleRollSavingThrow,
    handleRollSkill,
    handleRollSpellAttack,
    handleRollWeaponAttack,
    handleSaveEdit,
    handleSaveExperience,
    handleSubmitLevelUp,
    handleToggleAbilityUsage,
    handleToggleInventoryEquip,
    handleToggleSavingThrowProficiency,
    handleToggleSkillProficiency,
    handleUpdateSelectedInventoryQuantity,
    hitDiceEntries,
    hpDelta,
    initiative,
    isDeleteCharacterConfirmOpen,
    isEditMode,
    isInventoryCatalogOpen,
    isLevelManagementOpen,
    isLevelUpOpen,
    isLoading,
    isShortRestModalOpen,
    isSpellCatalogOpen,
    levelModalMode,
    loadError,
    movement,
    resourceSaveError,
    sanitizeNonNegativeNumber,
    selectedInventoryItem,
    selectedPassive,
    setActiveDetailTab,
    setEditableAlignment,
    setEditableExtraResourceMaximums,
    setEditableLanguagesText,
    setEditableMaxHp,
    setEditableMovement,
    setEditableName,
    setEditablePersonalHistory,
    setEditableSkillProficiencies,
    setEditableStatScores,
    setEditableToolCompetencies,
    setEditableWeaponArmorCompetencies,
    setHpDelta,
    setIsDeleteCharacterConfirmOpen,
    setIsEditMode,
    setIsInventoryCatalogOpen,
    setIsLevelManagementOpen,
    setIsLevelUpOpen,
    setIsShortRestModalOpen,
    setIsSpellCatalogOpen,
    setLevelModalMode,
    setSelectedInventoryItem,
    setSelectedPassive,
    setShortRestHitDiceCounts,
    setTempHpDelta,
    shortRestHitDiceCounts,
    spellInteractions,
    tempHp,
    tempHpDelta,
    token,
    totalCharacterLevel,
    totalHp,
    resolveCharacterFormula,
    normalizeText,
  };
}
