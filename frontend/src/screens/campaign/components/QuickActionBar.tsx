import { useEffect, useMemo, useRef, useState } from "react";
import { SPELL_LEVELS } from "../../personaje/dndcharactersheet/data";
import {
  imgAtaque,
  imgAtaqueVentaja,
  imgAtaqueDesventaja,
  imgDanoNeutral,
  imgDanoVentaja,
  imgHabilidad,
  imgRecursos,
  imgSalvacion,
  imgHechizos,
} from "../utils/quickActionImages";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import SpellDetailModal from "../../../components/spells/SpellDetailModal";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { serializeRollMessage } from "./chatRollUtils";
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
  buildCriticalExpression,
  getWeaponOptions,
  type AdvantageResult,
  type AttackRollAction,
} from "./quickactions/attackTypes";
import AttackPanel from "./quickactions/AttackPanel";
import SkillPanel from "./quickactions/SkillPanel";
import SavePanel from "./quickactions/SavePanel";
import SpellsPanel from "./quickactions/SpellsPanel";
import ResourcesPanel from "./quickactions/ResourcesPanel";
import AdvantageResultOverlay from "./quickactions/AdvantageResultOverlay";

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

type ActionKind =
  | "ataque"
  | "habilidad"
  | "salvacion"
  | "hechizos"
  | "recursos";

const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  ataque: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  ),
  habilidad: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect x="2" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="18" y="2" width="4" height="18" rx="1" />
    </svg>
  ),
  salvacion: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  hechizos: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
  recursos: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
      <path d="M8 3v4" />
      <path d="M16 10v4" />
      <path d="M12 17v4" />
    </svg>
  ),
};

const ACTIONS = [
  { key: "ataque", label: "Ataque", img: imgAtaque },
  { key: "habilidad", label: "Habilidad", img: imgHabilidad },
  { key: "salvacion", label: "Salvación", img: imgSalvacion },
  { key: "hechizos", label: "Hechizos", img: imgHechizos },
  { key: "recursos", label: "Recursos", img: imgRecursos },
] as const;

function ActionButton({
  action,
  onClick,
}: {
  action: (typeof ACTIONS)[number];
  onClick?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button
      title={action.label}
      onClick={onClick}
      className="group flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-150 hover:bg-white/10 active:scale-95"
    >
      <div className="h-16 w-16 rounded-lg overflow-hidden border border-white/20 group-hover:border-amber-400/60 transition-colors flex items-center justify-center bg-white/5">
        {imgFailed ? (
          <span className="text-amber-200/70 group-hover:text-amber-200 transition-colors">
            {FALLBACK_ICONS[action.key]}
          </span>
        ) : (
          <img
            src={action.img}
            alt={action.label}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <span className="text-[10px] text-white/70 group-hover:text-amber-200 transition-colors">
        {action.label}
      </span>
    </button>
  );
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
  const [advantageResult, setAdvantageResult] =
    useState<AdvantageResult | null>(null);
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
  const advantageTimeoutRef = useRef<number | null>(null);
  const diceRoller = useDiceRoller();
  const onRollResultRef = useRef(onRollResult);

  useEffect(() => {
    onRollResultRef.current = onRollResult;
  }, [onRollResult]);

  const lastSeenSummaryIdRef = useRef(-1);
  useEffect(() => {
    if (!diceRoller.summary) return;
    if (diceRoller.summary.id === lastSeenSummaryIdRef.current) return;
    lastSeenSummaryIdRef.current = diceRoller.summary.id;
    const { title, expression, diceValues, modifier, total } =
      diceRoller.summary;
    onRollResultRef.current?.(
      serializeRollMessage(
        title,
        diceValues,
        modifier,
        total,
        undefined,
        expression,
      ),
    );
  }, [diceRoller.summary]);

  useEffect(() => {
    setActiveAction(null);
    setSelectedWeaponId(null);
    setDetail(null);
    setPortraitFailed(false);
    setAdvantageResult(null);
    setResourceTab("spells");
    setResourceSpellSlots({});
    setResourceExtraResources({});
    setResourceMoney({ ppt: 0, po: 0, pp: 0, pc: 0 });
    if (advantageTimeoutRef.current !== null) {
      window.clearTimeout(advantageTimeoutRef.current);
      advantageTimeoutRef.current = null;
    }
    if (!selectedPosition) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    const abortController = new AbortController();
    setIsLoadingDetail(true);
    void fetchDndCharacterDetail(
      token,
      selectedPosition.personajeId,
      abortController.signal,
    )
      .then((response) => {
        if (abortController.signal.aborted) return;
        const loadedSpellSlots = Object.fromEntries(
          SPELL_LEVELS.map((level) => [
            level,
            response.estadisticas[`Hechizos nivel ${level} gastados`] ??
              response.estadisticas[`Hechizos nivel ${level}`] ??
              0,
          ]),
        ) as Record<number, number>;
        const loadedExtraResources = Object.fromEntries(
          extractExtraResources(response.estadisticas).map((e) => [
            e.index,
            e.current,
          ]),
        ) as Record<number, number>;
        setDetail(response);
        setResourceSpellSlots(loadedSpellSlots);
        setResourceExtraResources(loadedExtraResources);
        setResourceMoney(getCharacterMoney(response));
      })
      .catch(() => {
        if (!abortController.signal.aborted) setDetail(null);
      })
      .finally(() => {
        if (!abortController.signal.aborted) setIsLoadingDetail(false);
      });
    return () => {
      abortController.abort();
    };
  }, [selectedPosition]);

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

  const isEnemy = detail?.tipo === "enemigo" || detail?.tipo === "PNJ";
  const visibleActions = useMemo(
    () =>
      isEnemy
        ? ACTIONS.filter((a) => a.key !== "hechizos" && a.key !== "recursos")
        : ACTIONS,
    [isEnemy],
  );
  const weaponOptions = useMemo(() => getWeaponOptions(detail), [detail]);

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

  const attackRollActions = useMemo<AttackRollAction[]>(() => {
    if (!selectedWeapon) return [];
    const attackModifier = selectedWeapon.attackBonus ?? 0;
    const damageExpr = selectedWeapon.damageExpression;
    const critExpr = buildCriticalExpression(damageExpr);

    function scheduleAdvantageRoll(
      die1: number,
      die2: number,
      type: "ventaja" | "desventaja",
    ) {
      if (advantageTimeoutRef.current !== null)
        window.clearTimeout(advantageTimeoutRef.current);
      setAdvantageResult({
        die1,
        die2,
        modifier: attackModifier,
        weaponName: selectedWeapon!.name,
        type,
      });
      advantageTimeoutRef.current = window.setTimeout(() => {
        setAdvantageResult(null);
        advantageTimeoutRef.current = null;
      }, 5000);
    }
    const modExpr =
      attackModifier === 0
        ? "1d20"
        : attackModifier > 0
          ? `1d20 + ${attackModifier}`
          : `1d20 - ${Math.abs(attackModifier)}`;

    return [
      {
        id: "atk-adv",
        label: "Ataque con ventaja",
        image: imgAtaqueVentaja,
        onClick: () =>
          void diceRoller.rollTwoD20ForAdvantage().then(([die1, die2]) => {
            scheduleAdvantageRoll(die1, die2, "ventaja");
            const used = Math.max(die1, die2);
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con ventaja`,
                [die1],
                attackModifier,
                die1 + attackModifier,
                die1 < used,
                modExpr,
              ),
            );
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con ventaja`,
                [die2],
                attackModifier,
                die2 + attackModifier,
                die2 < used,
                modExpr,
              ),
            );
          }),
      },
      {
        id: "atk-neutral",
        label: "Ataque",
        image: imgAtaque,
        onClick: () =>
          diceRoller.rollD20Check(
            `Ataque con ${selectedWeapon.name}`,
            attackModifier,
          ),
      },
      {
        id: "atk-dis",
        label: "Ataque con desventaja",
        image: imgAtaqueDesventaja,
        onClick: () =>
          void diceRoller.rollTwoD20ForAdvantage().then(([die1, die2]) => {
            scheduleAdvantageRoll(die1, die2, "desventaja");
            const used = Math.min(die1, die2);
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con desventaja`,
                [die1],
                attackModifier,
                die1 + attackModifier,
                die1 > used,
                modExpr,
              ),
            );
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con desventaja`,
                [die2],
                attackModifier,
                die2 + attackModifier,
                die2 > used,
                modExpr,
              ),
            );
          }),
      },
      {
        id: "dmg-neutral",
        label: "Daño",
        image: imgDanoNeutral,
        onClick: () => {
          if (damageExpr)
            diceRoller.rollExpression(
              `Daño · ${selectedWeapon.name}`,
              damageExpr,
            );
        },
      },
      {
        id: "dmg-crit",
        label: "Daño critico",
        image: imgDanoVentaja,
        onClick: () => {
          if (critExpr)
            diceRoller.rollExpression(
              `Daño critico · ${selectedWeapon.name}`,
              critExpr,
            );
        },
      },
    ];
  }, [diceRoller, selectedWeapon, setAdvantageResult]);

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
            return (
              <div key={action.key}>
                {activeAction === "habilidad" && (
                  <SkillPanel
                    detail={detail}
                    isLoadingDetail={isLoadingDetail}
                    isEnemy={isEnemy}
                    onRollSkill={(name, total) =>
                      diceRoller.rollD20Check(name, total)
                    }
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "habilidad" ? null : "habilidad",
                    )
                  }
                />
              </div>
            );
          }
          if (action.key === "salvacion") {
            return (
              <div key={action.key}>
                {activeAction === "salvacion" && detail && (
                  <SavePanel
                    detail={detail}
                    isEnemy={isEnemy}
                    onRollSave={(name, total) =>
                      diceRoller.rollD20Check(name, total)
                    }
                  />
                )}
                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((c) =>
                      c === "salvacion" ? null : "salvacion",
                    )
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
        summary={diceRoller.summary}
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
