import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SPELL_LEVELS } from "../../personaje/dndcharactersheet/data";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import SpellDetailModal from "../../../components/spells/SpellDetailModal";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { type CharacterAbilityResponse } from "../../personaje/utils/dndApi";
import { getAbilityModifierByName } from "../../personaje/dndcharactersheet/utils/characterAbilities";
import { getProficiencyBonus } from "../../personaje/dndcharactersheet/utils/characterCore";
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
import CharacterPortrait from "./CharacterPortrait";
import { useCharacterDetail } from "../hooks/useCharacterDetail";
import type { CampaignPositionResponse } from "../types";

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
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState<number | null>(null);
  const [selectedSpell, setSelectedSpell] =
    useState<CharacterAbilityResponse | null>(null);

  const attackMenuWrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedWeaponNameRef = useRef<string | null>(null);
  const diceRoller = useDiceRoller();

  const {
    detail,
    isLoadingDetail,
    portraitFailed,
    setPortraitFailed,
    resourceTab,
    setResourceTab,
    resourceSpellSlots,
    setResourceSpellSlots,
    resourceExtraResources,
    setResourceExtraResources,
    resourceMoney,
    setResourceMoney,
  } = useCharacterDetail(selectedPosition);

  const isMB = detail?.sistemaDeJuego === "Mork Borg";
  const isEnemy = detail?.tipo === "enemigo" || detail?.tipo === "PNJ";
  const isMBEnemy = isMB && isEnemy;
  const isMBPlayer = isMB && !isEnemy;

  const weaponOptions = useMemo(
    () =>
      isMBEnemy
        ? getMBEnemyWeaponOptions(detail)
        : isMB
          ? getMBWeaponOptions(detail)
          : getWeaponOptions(detail),
    [detail, isMB, isMBEnemy],
  );

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

  const { resetRolling } = diceRoller;

  useEffect(() => {
    setActiveAction(null);
    setSelectedWeaponId(null);
    setSelectedSpell(null);
    clearAdvantage();
    if (selectedPosition) resetRolling();
  }, [clearAdvantage, resetRolling, selectedPosition]);

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

  const handleActionClick = useCallback((key: ActionKind) => {
    if (key === "ataque") setSelectedWeaponId(null);
    setActiveAction((c) => (c === key ? null : key));
  }, []);

  const renderPanel = (key: ActionKind): ReactNode => {
    switch (key) {
      case "ataque":
        return (
          <AttackPanel
            isLoadingDetail={isLoadingDetail}
            weaponOptions={weaponOptions}
            selectedWeapon={selectedWeapon}
            attackRollActions={attackRollActions}
            onSelectWeapon={setSelectedWeaponId}
          />
        );
      case "habilidad":
        if (isEnemy)
          return (
            <RasgosPanel detail={detail} isLoadingDetail={isLoadingDetail} />
          );
        if (isMBPlayer)
          return (
            <MBEstadisticasPanel
              detail={detail}
              isLoadingDetail={isLoadingDetail}
              onRollStat={(nombre, modifier) =>
                diceRoller.rollD20Check(nombre, modifier)
              }
            />
          );
        return (
          <SkillPanel
            detail={detail}
            isLoadingDetail={isLoadingDetail}
            isEnemy={isEnemy}
            onRollSkill={(name, total) => diceRoller.rollD20Check(name, total)}
          />
        );
      case "rasgos-clase":
        return (
          <MBRasgosClasePanel
            detail={detail}
            isLoadingDetail={isLoadingDetail}
          />
        );
      case "especialidad":
        return (
          <EspecialidadPanel
            detail={detail}
            isLoadingDetail={isLoadingDetail}
          />
        );
      case "botin":
        return <LootPanel detail={detail} isLoadingDetail={isLoadingDetail} />;
      case "recursos":
        return detail ? (
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
                const row = extraResourceRows.find((r) => r.index === index);
                const max = row?.max ?? 0;
                return {
                  ...cur,
                  [index]: Math.max(
                    0,
                    Math.min(max, (cur[index] ?? row?.valor ?? 0) + delta),
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
        ) : null;
      case "hechizos":
        return detail ? (
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
        ) : null;
    }
  };

  return (
    <>
      {selectedPosition && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-4 pointer-events-none">
          <div
            ref={attackMenuWrapperRef}
            className="pointer-events-auto relative flex items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-5 py-3 backdrop-blur-sm shadow-2xl"
          >
            <CharacterPortrait
              selectedPosition={selectedPosition}
              portraitFailed={portraitFailed}
              onPortraitError={() => setPortraitFailed(true)}
            />

            <div className="h-10 w-px bg-white/15 mx-1" />

            {visibleActions.map((action) => (
              <div key={action.key}>
                {activeAction === action.key && renderPanel(action.key)}
                <ActionButton
                  action={action}
                  label={
                    action.key === "habilidad" && isMBPlayer
                      ? "Estadísticas"
                      : undefined
                  }
                  onClick={() => handleActionClick(action.key)}
                />
              </div>
            ))}

            <div className="h-10 w-px bg-white/15 mx-1" />

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
        </div>
      )}

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
    </>
  );
}
