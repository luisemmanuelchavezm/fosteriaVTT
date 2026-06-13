import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPELL_LEVELS } from "../../personaje/dndcharactersheet/data";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import SpellDetailModal from "../../../components/spells/SpellDetailModal";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import {
  fetchDndCharacterDetail,
  type CharacterAbilityResponse,
  type DndCharacterDetailResponse,
} from "../../personaje/utils/dndApi";
import { getAbilityModifierByName } from "../../personaje/dndcharactersheet/utils/characterAbilities";
import { getProficiencyBonus } from "../../personaje/dndcharactersheet/utils/characterCore";
import { getCharacterMoney } from "../../personaje/dndcharactersheet/utils/characterInventory";
import { extractExtraResources } from "../../personaje/dndcharactersheet/utils/characterResources";
import { groupSpellsByLevel } from "../utils/quickActionHelpers";
import {
  getWeaponOptions,
  getMBWeaponOptions,
  getMBEnemyWeaponOptions,
} from "./quickactions/attackTypes";
import ActionButton from "./quickactions/ActionButton";
import { ACTIONS, type ActionKind } from "./quickactions/actionConfig";
import { useAttackRollActions } from "./quickactions/useAttackRollActions";
import AttackPanel from "./quickactions/AttackPanel";
import SkillPanel from "./quickactions/SkillPanel";
import RasgosPanel from "./quickactions/RasgosPanel";
import MBEstadisticasPanel from "./quickactions/MBEstadisticasPanel";
import MBRasgosClasePanel from "./quickactions/MBRasgosClasePanel";
import EspecialidadPanel from "./quickactions/EspecialidadPanel";
import LootPanel from "./quickactions/LootPanel";
import SpellsPanel from "./quickactions/SpellsPanel";
import ResourcesPanel from "./quickactions/ResourcesPanel";
import AdvantageResultOverlay from "./quickactions/AdvantageResultOverlay";
import { CHARACTER_REMOTE_UPDATED_EVENT } from "../types";

interface CampaignPositionResponse {
  id: number;
  personajeId: number;
  personajeNombre: string;
  retrato?: string;
}

interface QuickActionBarProps {
  selectedPosition: CampaignPositionResponse | null;
  onClose: () => void;
  onRollResult?: (text: string) => void;
}

export default function QuickActionBar({
  selectedPosition,
  onClose,
  onRollResult,
}: QuickActionBarProps) {
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DndCharacterDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedSpell, setSelectedSpell] =
    useState<CharacterAbilityResponse | null>(null);
  const [resourceTab, setResourceTab] = useState<"spells" | "extra" | "money">(
    "spells",
  );
  const [resourceSpellSlots, setResourceSpellSlots] = useState<
    Record<number, number>
  >({});
  const [resourceExtraResources, setResourceExtraResources] = useState<
    Record<number, number>
  >({});
  const [resourceMoney, setResourceMoney] = useState<Record<string, number>>({
    ppt: 0,
    po: 0,
    pp: 0,
    pc: 0,
  });

  const attackMenuWrapperRef = useRef<HTMLDivElement | null>(null);
  const diceRoller = useDiceRoller();

  const loadCharacterDetail = useCallback(
    async (
      characterId: number,
      signal: AbortSignal,
      options?: { keepCurrentDetail?: boolean },
    ) => {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        if (!options?.keepCurrentDetail && !signal.aborted) {
          setDetail(null);
          setIsLoadingDetail(false);
        }
        return;
      }

      if (!options?.keepCurrentDetail && !signal.aborted) {
        setIsLoadingDetail(true);
      }

      try {
        const response = await fetchDndCharacterDetail(
          token,
          characterId,
          signal,
        );
        if (signal.aborted) return;

        const loadedSpellSlots = Object.fromEntries(
          SPELL_LEVELS.map((level) => [
            level,
            response.estadisticas[`Hechizos nivel ${level} gastados`] ??
              response.estadisticas[`Hechizos nivel ${level}`] ??
              0,
          ]),
        ) as Record<number, number>;
        const loadedExtraResources = Object.fromEntries(
          extractExtraResources(response.estadisticas).map((entry) => [
            entry.index,
            entry.current,
          ]),
        ) as Record<number, number>;

        setDetail(response);
        setResourceSpellSlots(loadedSpellSlots);
        setResourceExtraResources(loadedExtraResources);
        setResourceMoney(getCharacterMoney(response));
        setPortraitFailed(false);
      } catch {
        if (!signal.aborted && !options?.keepCurrentDetail) {
          setDetail(null);
        }
      } finally {
        if (!signal.aborted && !options?.keepCurrentDetail) {
          setIsLoadingDetail(false);
        }
      }
    },
    [],
  );

  const isMB = detail?.sistemaDeJuego === "Mork Borg";
  const isEnemy = detail?.tipo === "enemigo" || detail?.tipo === "PNJ";
  const isMBEnemy = isMB && isEnemy;

  const weaponOptions = useMemo(
    () =>
      isMBEnemy
        ? getMBEnemyWeaponOptions(detail)
        : isMB
          ? getMBWeaponOptions(detail)
          : getWeaponOptions(detail),
    [detail, isMB, isMBEnemy],
  );

  const selectedWeaponNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedWeaponId === null) {
      selectedWeaponNameRef.current = null;
      return;
    }
    const found = weaponOptions.find((w) => w.id === selectedWeaponId);
    if (found) {
      selectedWeaponNameRef.current = found.name;
    } else if (selectedWeaponNameRef.current !== null) {
      const byName = weaponOptions.find(
        (w) => w.name === selectedWeaponNameRef.current,
      );
      setSelectedWeaponId(byName ? byName.id : null);
      selectedWeaponNameRef.current = byName ? byName.name : null;
    } else {
      setSelectedWeaponId(null);
    }
  }, [weaponOptions, selectedWeaponId]);

  const selectedWeapon = useMemo(
    () => weaponOptions.find((w) => w.id === selectedWeaponId) ?? null,
    [weaponOptions, selectedWeaponId],
  );

  const {
    attackRollActions,
    critDisplaySummary,
    advantageResult,
    clearAdvantage,
  } = useAttackRollActions({
    selectedWeapon,
    isMB,
    isMBEnemy,
    diceRoller,
    onRollResult,
  });

  useEffect(() => {
    setActiveAction(null);
    setSelectedWeaponId(null);
    setDetail(null);
    setPortraitFailed(false);
    clearAdvantage();
    setResourceTab("spells");
    setResourceSpellSlots({});
    setResourceExtraResources({});
    setResourceMoney({ ppt: 0, po: 0, pp: 0, pc: 0 });
    if (!selectedPosition) return;

    const abortController = new AbortController();
    void loadCharacterDetail(
      selectedPosition.personajeId,
      abortController.signal,
    );

    return () => {
      abortController.abort();
    };
  }, [clearAdvantage, loadCharacterDetail, selectedPosition]);

  useEffect(() => {
    if (!selectedPosition) return;

    const handleRemoteCharacterUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ characterId?: number }>;
      const characterId = customEvent.detail?.characterId;
      if (characterId !== selectedPosition.personajeId) return;

      const abortController = new AbortController();
      void loadCharacterDetail(characterId, abortController.signal, {
        keepCurrentDetail: true,
      });
    };

    window.addEventListener(
      CHARACTER_REMOTE_UPDATED_EVENT,
      handleRemoteCharacterUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        CHARACTER_REMOTE_UPDATED_EVENT,
        handleRemoteCharacterUpdated as EventListener,
      );
    };
  }, [loadCharacterDetail, selectedPosition]);

  useEffect(() => {
    if (!selectedPosition) return;
    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (attackMenuWrapperRef.current?.contains(targetNode)) return;
      if (activeAction !== null) {
        setActiveAction(null);
        setSelectedWeaponId(null);
      } else {
        onClose();
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [selectedPosition, activeAction, onClose]);

  const visibleActions = useMemo(() => {
    if (isEnemy) {
      return ACTIONS.filter(
        (a) =>
          a.key !== "hechizos" &&
          a.key !== "recursos" &&
          a.key !== "rasgos-clase",
      );
    }
    if (isMB) {
      return ACTIONS.filter(
        (a) =>
          a.key !== "hechizos" &&
          a.key !== "recursos" &&
          a.key !== "especialidad" &&
          a.key !== "botin",
      );
    }
    return ACTIONS.filter(
      (a) =>
        a.key !== "especialidad" &&
        a.key !== "botin" &&
        a.key !== "rasgos-clase",
    );
  }, [isEnemy, isMB]);

  const spellsByLevel = useMemo(
    () => groupSpellsByLevel(detail?.habilidades ?? []),
    [detail],
  );
  const spellcastingModifier = useMemo(() => {
    if (!detail?.caracteristicaLanzamientoConjuros) return null;
    return getAbilityModifierByName(
      detail,
      detail.caracteristicaLanzamientoConjuros,
    );
  }, [detail]);
  const spellAttackBonus = useMemo(
    () =>
      spellcastingModifier === null
        ? null
        : spellcastingModifier + getProficiencyBonus(detail),
    [spellcastingModifier, detail],
  );
  const spellSaveDc = useMemo(
    () => (spellAttackBonus === null ? null : 8 + spellAttackBonus),
    [spellAttackBonus],
  );
  const spellSlotMaximums = useMemo(
    () =>
      Object.fromEntries(
        SPELL_LEVELS.map((level) => [
          level,
          detail?.estadisticas[`Hechizos nivel ${level}`] ?? 0,
        ]),
      ) as Record<number, number>,
    [detail],
  );
  const extraResourceRows = useMemo(
    () =>
      extractExtraResources(detail?.estadisticas ?? {})
        .filter((r) => r.max > 0)
        .map((r) => ({
          ...r,
          valor: resourceExtraResources[r.index] ?? r.current,
        })),
    [detail, resourceExtraResources],
  );

  if (!selectedPosition) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-4 pointer-events-none">
      <div
        ref={attackMenuWrapperRef}
        className="pointer-events-auto relative flex items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-5 py-3 backdrop-blur-sm shadow-2xl"
      >
        {/* Portrait + character name */}
        <div className="flex items-center gap-2 mr-2">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-amber-400/40 bg-white/10 flex items-center justify-center shrink-0">
            {selectedPosition.retrato && !portraitFailed ? (
              <img
                src={selectedPosition.retrato}
                alt={selectedPosition.personajeNombre}
                className="h-full w-full object-cover"
                onError={() => setPortraitFailed(true)}
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-white/40"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 uppercase tracking-wider leading-none mb-0.5">
              Seleccionado
            </span>
            <span className="text-sm font-semibold text-amber-200 max-w-[110px] truncate leading-tight">
              {selectedPosition.personajeNombre}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-white/15 mx-1" />

        {/* Action tabs */}
        {visibleActions.map((action) => {
          if (action.key === "ataque") {
            return (
              <div key={action.key}>
                {activeAction === "ataque" && (
                  <AttackPanel
                    isLoadingDetail={isLoadingDetail}
                    weaponOptions={weaponOptions}
                    selectedWeapon={selectedWeapon}
                    attackRollActions={attackRollActions}
                    onSelectWeapon={setSelectedWeaponId}
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() => {
                    setSelectedWeaponId(null);
                    setActiveAction((c) => (c === "ataque" ? null : "ataque"));
                  }}
                />
              </div>
            );
          }
          if (action.key === "habilidad") {
            const isMBPlayer = isMB && !isEnemy;
            return (
              <div key={action.key}>
                {activeAction === "habilidad" &&
                  (isEnemy ? (
                    <RasgosPanel
                      detail={detail}
                      isLoadingDetail={isLoadingDetail}
                    />
                  ) : isMBPlayer ? (
                    <MBEstadisticasPanel
                      detail={detail}
                      isLoadingDetail={isLoadingDetail}
                      onRollStat={(nombre, modifier) =>
                        diceRoller.rollD20Check(nombre, modifier)
                      }
                    />
                  ) : (
                    <SkillPanel
                      detail={detail}
                      isLoadingDetail={isLoadingDetail}
                      isEnemy={isEnemy}
                      onRollSkill={(name, total) =>
                        diceRoller.rollD20Check(name, total)
                      }
                    />
                  ))}
                <ActionButton
                  action={action}
                  label={isMBPlayer ? "Estadísticas" : undefined}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "habilidad" ? null : "habilidad",
                    )
                  }
                />
              </div>
            );
          }
          if (action.key === "rasgos-clase") {
            return (
              <div key={action.key}>
                {activeAction === "rasgos-clase" && (
                  <MBRasgosClasePanel
                    detail={detail}
                    isLoadingDetail={isLoadingDetail}
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "rasgos-clase" ? null : "rasgos-clase",
                    )
                  }
                />
              </div>
            );
          }
          if (action.key === "especialidad") {
            return (
              <div key={action.key}>
                {activeAction === "especialidad" && (
                  <EspecialidadPanel
                    detail={detail}
                    isLoadingDetail={isLoadingDetail}
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "especialidad" ? null : "especialidad",
                    )
                  }
                />
              </div>
            );
          }
          if (action.key === "botin") {
            return (
              <div key={action.key}>
                {activeAction === "botin" && (
                  <LootPanel
                    detail={detail}
                    isLoadingDetail={isLoadingDetail}
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) => (c === "botin" ? null : "botin"))
                  }
                />
              </div>
            );
          }
          if (action.key === "recursos") {
            return (
              <div key={action.key}>
                {activeAction === "recursos" && detail && (
                  <ResourcesPanel
                    resourceTab={resourceTab}
                    spellSlotMaximums={spellSlotMaximums}
                    resourceSpellSlots={resourceSpellSlots}
                    extraResourceRows={extraResourceRows}
                    resourceMoney={resourceMoney}
                    onTabChange={setResourceTab}
                    onSpellSlotChange={(level, delta) =>
                      setResourceSpellSlots((cur) => {
                        const max = spellSlotMaximums[level] ?? 0;
                        return {
                          ...cur,
                          [level]: Math.max(
                            0,
                            Math.min(max, (cur[level] ?? max) + delta),
                          ),
                        };
                      })
                    }
                    onExtraResourceChange={(index, delta) =>
                      setResourceExtraResources((cur) => {
                        const row = extraResourceRows.find(
                          (r) => r.index === index,
                        );
                        const max = row?.max ?? 0;
                        return {
                          ...cur,
                          [index]: Math.max(
                            0,
                            Math.min(
                              max,
                              (cur[index] ?? row?.valor ?? 0) + delta,
                            ),
                          ),
                        };
                      })
                    }
                    onMoneyChange={(key, delta) =>
                      setResourceMoney((cur) => ({
                        ...cur,
                        [key]: Math.max(0, (cur[key] ?? 0) + delta),
                      }))
                    }
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "recursos" ? null : "recursos",
                    )
                  }
                />
              </div>
            );
          }
          if (action.key === "hechizos") {
            return (
              <div key={action.key}>
                {activeAction === "hechizos" && detail && (
                  <SpellsPanel
                    detail={detail}
                    spellsByLevel={spellsByLevel}
                    spellcastingModifier={spellcastingModifier}
                    spellAttackBonus={spellAttackBonus}
                    spellSaveDc={spellSaveDc}
                    onCastSpell={setSelectedSpell}
                    onRollSpellAttack={(bonus) =>
                      diceRoller.rollD20Check("Ataque de hechizo", bonus)
                    }
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "hechizos" ? null : "hechizos",
                    )
                  }
                />
              </div>
            );
          }
          const _exhaustiveCheck: never = action as never;
          return _exhaustiveCheck;
        })}

        <div className="h-10 w-px bg-white/15 mx-1" />

        {/* Close button */}
        <button
          onClick={onClose}
          title="Deseleccionar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-150"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <DiceRollOverlay
        diceBoxHostId={diceRoller.diceBoxHostId}
        diceBoxError={diceRoller.diceBoxError}
        isRolling={diceRoller.isRolling}
        summary={critDisplaySummary ?? diceRoller.summary}
        onDismiss={diceRoller.dismissSummary}
      />

      {advantageResult && (
        <AdvantageResultOverlay advantageResult={advantageResult} />
      )}

      <SpellDetailModal
        spell={selectedSpell}
        isOpen={selectedSpell !== null}
        onClose={() => setSelectedSpell(null)}
        onRollExpression={(spellName, expression) =>
          diceRoller.rollExpression(spellName, expression)
        }
      />
    </div>
  );
}
