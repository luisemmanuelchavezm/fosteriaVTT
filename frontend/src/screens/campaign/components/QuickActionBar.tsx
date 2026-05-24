/* eslint-disable react-hooks/refs */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SKILL_ROWS,
  SPELL_LEVELS,
  SAVING_THROW_ROWS,
} from "../../personaje/dndcharactersheet/data";
import { SAVING_THROWS_WITH_IMAGES } from "../utils/quickActionUtils";
import imgAtaque from "../../../assets/habilidades DND/ataque neutral.jpeg";
import imgAtaqueVentaja from "../../../assets/habilidades DND/ataque ventaja.jpeg";
import imgAtaqueDesventaja from "../../../assets/habilidades DND/ataque desventaja.jpeg";
import imgDanoNeutral from "../../../assets/habilidades DND/daño neutral.jpeg";
import imgDanoVentaja from "../../../assets/habilidades DND/daño ventaja.jpeg";
import imgHabilidad from "../../../assets/habilidades DND/tirada de habilidad.jpeg";
import imgHabilidadAcrobacias from "../../../assets/habilidades DND/habilidad acrobacias.jpeg";
import imgHabilidadArcanos from "../../../assets/habilidades DND/habilidad arcanos.jpeg";
import imgHabilidadAtletismo from "../../../assets/habilidades DND/habilidad atletismo.jpeg";
import imgHabilidadEnganar from "../../../assets/habilidades DND/habilidad engañar.jpeg";
import imgHabilidadHistoria from "../../../assets/habilidades DND/habilidad historia.jpeg";
import imgHabilidadInterpretacion from "../../../assets/habilidades DND/habilidad interpretacion.jpeg";
import imgHabilidadIntimidacion from "../../../assets/habilidades DND/habilidad intimidacion.jpeg";
import imgHabilidadInvestigacion from "../../../assets/habilidades DND/habilidad investigacion.jpeg";
import imgHabilidadMedicina from "../../../assets/habilidades DND/habilidad medicina.jpeg";
import imgHabilidadNaturaleza from "../../../assets/habilidades DND/habilidad naturaleza.jpeg";
import imgHabilidadPercepcion from "../../../assets/habilidades DND/habilidad percepcion.jpeg";
import imgHabilidadPerspicacia from "../../../assets/habilidades DND/habilidad perspicacia.jpeg";
import imgHabilidadPersuasion from "../../../assets/habilidades DND/habilidad persuasion.jpeg";
import imgHabilidadReligion from "../../../assets/habilidades DND/habilidad religion.jpeg";
import imgHabilidadSigilo from "../../../assets/habilidades DND/habilidad sigilo.jpeg";
import imgHabilidadSupervivencia from "../../../assets/habilidades DND/habilidad supervivencia.jpeg";
import imgHabilidadTratoConAnimales from "../../../assets/habilidades DND/habilidad trato con animales.jpeg";
import imgJuegoDeManos from "../../../assets/habilidades DND/juego de manos.jpeg";
import imgRecursos from "../../../assets/habilidades DND/Recursos.jpeg";
import imgSalvacion from "../../../assets/habilidades DND/tirada de salvacion.jpeg";
import imgHechizos from "../../../assets/habilidades DND/hechizos.jpeg";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import SpellDetailModal from "../../../components/spells/SpellDetailModal";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { serializeRollMessage } from "./ChatRollBubble";
import {
  fetchDndCharacterDetail,
  type CharacterAbilityResponse,
  type DndCharacterDetailResponse,
} from "../../personaje/utils/dndApi";
import {
  getActionDamageParts,
  isActionAbility,
  getAbilityModifierByName,
} from "../../personaje/dndcharactersheet/utils/characterAbilities";
import {
  getProficiencyBonus,
  formatSignedValue,
} from "../../personaje/dndcharactersheet/utils/characterCore";
import { getCharacterMoney } from "../../personaje/dndcharactersheet/utils/characterInventory";
import { extractExtraResources } from "../../personaje/dndcharactersheet/utils/characterResources";

const SKILL_IMAGE_MAP: Record<string, string> = {
  Acrobacias: imgHabilidadAcrobacias,
  Atletismo: imgHabilidadAtletismo,
  Arcano: imgHabilidadArcanos,
  Engano: imgHabilidadEnganar,
  Historia: imgHabilidadHistoria,
  Interpretacion: imgHabilidadInterpretacion,
  Intimidacion: imgHabilidadIntimidacion,
  Investigacion: imgHabilidadInvestigacion,
  "Juego de manos": imgJuegoDeManos,
  Medicina: imgHabilidadMedicina,
  Naturaleza: imgHabilidadNaturaleza,
  Percepcion: imgHabilidadPercepcion,
  Perspicacia: imgHabilidadPerspicacia,
  Persuasión: imgHabilidadPersuasion,
  Religión: imgHabilidadReligion,
  Sigilo: imgHabilidadSigilo,
  Supervivencia: imgHabilidadSupervivencia,
  "Trato con Animales": imgHabilidadTratoConAnimales,
};

const SKILLS = SKILL_ROWS.map((row) => ({
  name: row.name,
  displayName: row.displayName,
  statName: row.statName,
  image: SKILL_IMAGE_MAP[row.name] || imgHabilidad,
}));
// Utilidad para obtener el total de habilidad igual que en la ficha
function getSkillTotal(
  detail: DndCharacterDetailResponse | null,
  skill: { name: string; statName: string },
  proficiencyBonus: number,
) {
  // El modificador base de la característica
  const mod = getAbilityModifierByName(detail, skill.statName);
  // El nivel de competencia (0: nada, 1: competencia, 2: maestría)
  let proficiencyLevel = 0;
  const statValue = detail?.estadisticas[skill.name] ?? 0;
  if (proficiencyBonus > 0 && statValue >= proficiencyBonus * 2) {
    proficiencyLevel = 2;
  } else if (statValue > 0) {
    proficiencyLevel = 1;
  }
  return mod + proficiencyLevel * proficiencyBonus;
}

function getEnemySkillBonus(
  detail: DndCharacterDetailResponse | null,
  skill: { name: string; statName: string },
): number {
  const flat = detail?.estadisticas[skill.name];
  if (flat !== undefined && flat !== 0) return flat;
  return getAbilityModifierByName(detail, skill.statName);
}

function getEnemySaveBonus(
  detail: DndCharacterDetailResponse | null,
  statName: string,
): number {
  const flat =
    detail?.estadisticas[`Salvacion de ${statName}`] ??
    detail?.estadisticas[`Salvación de ${statName}`];
  if (flat !== undefined && flat !== 0) return flat;
  return getAbilityModifierByName(detail, statName);
}

// Utilidad para obtener el total de salvación igual que en la ficha
function getSavingThrowTotal(
  detail: DndCharacterDetailResponse | null,
  statName: string,
  proficiencyBonus: number,
) {
  const mod = getAbilityModifierByName(detail, statName);
  // Proficiente si la estadística de salvación es > 0
  const isProficient =
    (detail?.estadisticas[`Salvación de ${statName}`] ??
      detail?.estadisticas[`Salvacion de ${statName}`] ??
      0) > 0;
  return mod + (isProficient ? proficiencyBonus : 0);
}

function getSpellLevel(ability: CharacterAbilityResponse): number {
  const tags = ability.tags ?? "";
  for (const rawTag of tags.split(",")) {
    const trimmed = rawTag.trim().toLowerCase();
    if (trimmed === "truco") {
      return 0;
    }
    const parts = trimmed.split(";");
    if (parts[0] === "hechizo" && parts[1]) {
      const level = Number.parseInt(parts[1], 10);
      return Number.isNaN(level) ? -1 : level;
    }
  }
  return -1;
}

function groupSpellsByLevel(
  spells: CharacterAbilityResponse[],
): Map<number, CharacterAbilityResponse[]> {
  const grouped = new Map<number, CharacterAbilityResponse[]>();
  for (const spell of spells) {
    const level = getSpellLevel(spell);
    if (level >= 0) {
      if (!grouped.has(level)) {
        grouped.set(level, []);
      }
      grouped.get(level)!.push(spell);
    }
  }
  return grouped;
}

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

interface AdvantageResult {
  die1: number;
  die2: number;
  modifier: number;
  weaponName: string;
  type: "ventaja" | "desventaja";
}

interface WeaponOption {
  id: number;
  name: string;
  attackBonus: number | null;
  damageExpression: string | null;
}

interface AttackRollAction {
  id: string;
  label: string;
  image: string;
  onClick: () => void;
}

function buildCriticalExpression(expression: string | null) {
  if (!expression) {
    return null;
  }

  const upgraded = expression.replace(
    /(\d+)d(\d+)/gi,
    (_, rawCount, rawFaces) => {
      const count = Number.parseInt(rawCount, 10);
      const faces = Number.parseInt(rawFaces, 10);
      if (Number.isNaN(count) || Number.isNaN(faces)) {
        return `${rawCount}d${rawFaces}`;
      }
      return `${count * 2}d${faces}`;
    },
  );

  return upgraded;
}

function getWeaponOptions(detail: DndCharacterDetailResponse | null) {
  if (!detail) {
    return [] as WeaponOption[];
  }

  return detail.habilidades.filter(isActionAbility).map((ability) => ({
    id: ability.id,
    name: ability.nombre,
    attackBonus: ability.bonificacion ?? null,
    damageExpression:
      getActionDamageParts(detail, ability).expression ?? ability.formula,
  }));
}

// Fallback SVG icons for each action when the image isn't loaded yet
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
  {
    key: "ataque",
    label: "Ataque",
    img: imgAtaque,
  },
  {
    key: "habilidad",
    label: "Habilidad",
    img: imgHabilidad,
  },
  {
    key: "salvacion",
    label: "Salvación",
    img: imgSalvacion,
  },
  {
    key: "hechizos",
    label: "Hechizos",
    img: imgHechizos,
  },
  {
    key: "recursos",
    label: "Recursos",
    img: imgRecursos,
  },
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

    if (!selectedPosition) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      return;
    }

    const abortController = new AbortController();
    setIsLoadingDetail(true);

    void fetchDndCharacterDetail(
      token,
      selectedPosition.personajeId,
      abortController.signal,
    )
      .then((response) => {
        if (!abortController.signal.aborted) {
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
        }
      })
      .catch(() => {
        if (!abortController.signal.aborted) {
          setDetail(null);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoadingDetail(false);
        }
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

  // Keep track of the selected weapon's name so we can re-anchor after a
  // clone-on-edit gives the weapon a new database ID.
  const selectedWeaponNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedWeaponId === null) {
      selectedWeaponNameRef.current = null;
      return;
    }
    const found = weaponOptions.find((w) => w.id === selectedWeaponId);
    if (found) {
      // ID still valid — keep name in sync
      selectedWeaponNameRef.current = found.name;
    } else if (selectedWeaponNameRef.current !== null) {
      // ID disappeared (clone created a new ID) — try to match by name
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
    () =>
      weaponOptions.find((weapon) => weapon.id === selectedWeaponId) ?? null,
    [weaponOptions, selectedWeaponId],
  );

  const attackRollActions = useMemo<AttackRollAction[]>(() => {
    if (!selectedWeapon) {
      return [];
    }

    const attackModifier = selectedWeapon.attackBonus ?? 0;
    const damageExpr = selectedWeapon.damageExpression;
    const critExpr = buildCriticalExpression(damageExpr);

    return [
      {
        id: "atk-adv",
        label: "Ataque con ventaja",
        image: imgAtaqueVentaja,
        onClick: () => {
          void diceRoller.rollTwoD20ForAdvantage().then(([die1, die2]) => {
            if (advantageTimeoutRef.current !== null) {
              window.clearTimeout(advantageTimeoutRef.current);
            }
            setAdvantageResult({
              die1,
              die2,
              modifier: attackModifier,
              weaponName: selectedWeapon.name,
              type: "ventaja",
            });
            advantageTimeoutRef.current = window.setTimeout(() => {
              setAdvantageResult(null);
              advantageTimeoutRef.current = null;
            }, 5000);
            const used = Math.max(die1, die2);
            const advExpr =
              attackModifier === 0
                ? "1d20"
                : attackModifier > 0
                  ? `1d20 + ${attackModifier}`
                  : `1d20 - ${Math.abs(attackModifier)}`;
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con ventaja`,
                [die1],
                attackModifier,
                die1 + attackModifier,
                die1 < used,
                advExpr,
              ),
            );
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con ventaja`,
                [die2],
                attackModifier,
                die2 + attackModifier,
                die2 < used,
                advExpr,
              ),
            );
          });
        },
      },
      {
        id: "atk-neutral",
        label: "Ataque",
        image: imgAtaque,
        onClick: () => {
          diceRoller.rollD20Check(
            `Ataque con ${selectedWeapon.name}`,
            attackModifier,
          );
        },
      },
      {
        id: "atk-dis",
        label: "Ataque con desventaja",
        image: imgAtaqueDesventaja,
        onClick: () => {
          void diceRoller.rollTwoD20ForAdvantage().then(([die1, die2]) => {
            if (advantageTimeoutRef.current !== null) {
              window.clearTimeout(advantageTimeoutRef.current);
            }
            setAdvantageResult({
              die1,
              die2,
              modifier: attackModifier,
              weaponName: selectedWeapon.name,
              type: "desventaja",
            });
            advantageTimeoutRef.current = window.setTimeout(() => {
              setAdvantageResult(null);
              advantageTimeoutRef.current = null;
            }, 5000);
            const used = Math.min(die1, die2);
            const disExpr =
              attackModifier === 0
                ? "1d20"
                : attackModifier > 0
                  ? `1d20 + ${attackModifier}`
                  : `1d20 - ${Math.abs(attackModifier)}`;
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con desventaja`,
                [die1],
                attackModifier,
                die1 + attackModifier,
                die1 > used,
                disExpr,
              ),
            );
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con desventaja`,
                [die2],
                attackModifier,
                die2 + attackModifier,
                die2 > used,
                disExpr,
              ),
            );
          });
        },
      },
      {
        id: "dmg-neutral",
        label: "Daño",
        image: imgDanoNeutral,
        onClick: () => {
          if (damageExpr) {
            diceRoller.rollExpression(
              `Daño · ${selectedWeapon.name}`,
              damageExpr,
            );
          }
        },
      },
      {
        id: "dmg-crit",
        label: "Daño critico",
        image: imgDanoVentaja,
        onClick: () => {
          if (critExpr) {
            diceRoller.rollExpression(
              `Daño critico · ${selectedWeapon.name}`,
              critExpr,
            );
          }
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

  const spellAttackBonus = useMemo(() => {
    if (spellcastingModifier === null) return null;
    return spellcastingModifier + getProficiencyBonus(detail);
  }, [spellcastingModifier, detail]);

  const spellSaveDc = useMemo(() => {
    if (spellAttackBonus === null) return null;
    return 8 + spellAttackBonus;
  }, [spellAttackBonus]);

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
        .filter((resource) => resource.max > 0)
        .map((resource) => ({
          ...resource,
          valor: resourceExtraResources[resource.index] ?? resource.current,
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
        {/* Retrato + nombre del personaje seleccionado */}
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

        {/* Botones de acción */}
        {visibleActions.map((action) => {
          if (action.key === "ataque") {
            const isOpen = activeAction === "ataque";

            return (
              <div key={action.key}>
                {isOpen ? (
                  <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-max max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-3 shadow-2xl">
                    {!selectedWeapon && (
                      <>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                          Armas
                        </p>

                        {isLoadingDetail ? (
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                            Cargando armas...
                          </div>
                        ) : weaponOptions.length === 0 ? (
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                            Este personaje no tiene armas en su mochila.
                          </div>
                        ) : (
                          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                            {weaponOptions.map((weapon) => (
                              <button
                                key={weapon.id}
                                type="button"
                                onClick={() => setSelectedWeaponId(weapon.id)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 transition-colors hover:bg-white/10"
                              >
                                {weapon.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {selectedWeapon ? (
                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100/85">
                          {selectedWeapon.name}
                        </p>
                        <div className="flex gap-4 overflow-x-auto pb-1">
                          {attackRollActions.map((rollAction) => (
                            <button
                              key={rollAction.id}
                              type="button"
                              onClick={rollAction.onClick}
                              className="group flex shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1 transition-colors"
                              title={rollAction.label}
                            >
                              <img
                                src={rollAction.image}
                                alt={rollAction.label}
                                className="h-16 w-16 object-cover rounded-2xl"
                              />
                              <span className="block text-[10px] leading-tight text-white/80 group-hover:text-amber-100">
                                {rollAction.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <ActionButton
                  action={action}
                  onClick={() => {
                    setSelectedWeaponId(null);
                    setActiveAction((current) =>
                      current === "ataque" ? null : "ataque",
                    );
                  }}
                />
              </div>
            );
          }

          if (action.key === "habilidad") {
            const isOpen = activeAction === "habilidad";
            return (
              <div key={action.key}>
                {isOpen ? (
                  <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[700px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-3 shadow-2xl">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                      Habilidades
                    </p>
                    {isLoadingDetail ? (
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                        Cargando...
                      </div>
                    ) : (
                      <div className="grid grid-cols-9 gap-2">
                        {SKILLS.map((skill) => {
                          const proficiencyBonus = getProficiencyBonus(detail);
                          const total = isEnemy
                            ? getEnemySkillBonus(detail, skill)
                            : getSkillTotal(detail, skill, proficiencyBonus);
                          const modLabel =
                            total >= 0 ? `+${total}` : `${total}`;
                          return (
                            <button
                              key={skill.name}
                              type="button"
                              onClick={() =>
                                diceRoller.rollD20Check(
                                  skill.displayName,
                                  total,
                                )
                              }
                              className="group flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/10"
                              title={`${skill.displayName} (${modLabel})`}
                            >
                              <img
                                src={skill.image}
                                alt={skill.displayName}
                                className="h-16 w-16 shrink-0 object-cover rounded-2xl"
                              />
                              <span className="block text-[10px] leading-tight text-white/80 group-hover:text-amber-100 text-center max-w-[64px] whitespace-normal break-words">
                                {skill.displayName}
                              </span>
                              <span className="block text-[10px] leading-none text-amber-300/70">
                                {modLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((current) =>
                      current === "habilidad" ? null : "habilidad",
                    )
                  }
                />
              </div>
            );
          }

          if (action.key === "salvacion") {
            const isOpen = activeAction === "salvacion";
            return (
              <div key={action.key}>
                {isOpen && detail ? (
                  <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[760px] max-w-[96vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                      Salvaciones
                    </p>
                    <div className="grid grid-cols-6 gap-3">
                      {SAVING_THROW_ROWS.map((save, idx) => {
                        const proficiencyBonus = getProficiencyBonus(detail);
                        const total = isEnemy
                          ? getEnemySaveBonus(detail, save.statName)
                          : getSavingThrowTotal(
                              detail,
                              save.statName,
                              proficiencyBonus,
                            );
                        const modLabel = total >= 0 ? `+${total}` : `${total}`;
                        const image = SAVING_THROWS_WITH_IMAGES[idx]?.image;
                        return (
                          <button
                            key={save.statName}
                            type="button"
                            onClick={() =>
                              diceRoller.rollD20Check(save.displayName, total)
                            }
                            className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/10"
                            title={`${save.displayName} (${modLabel})`}
                          >
                            {image && (
                              <img
                                src={image}
                                alt={save.displayName}
                                className="h-16 w-16 shrink-0 object-cover object-center rounded-2xl"
                              />
                            )}
                            <span className="block text-[13px] font-medium leading-tight text-white/80 group-hover:text-amber-100 text-center">
                              {save.displayName}
                            </span>
                            <span className="block text-[12px] font-bold leading-none text-amber-300/70">
                              {modLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((current) =>
                      current === "salvacion" ? null : "salvacion",
                    )
                  }
                />
              </div>
            );
          }

          if (action.key === "recursos") {
            const isOpen = activeAction === "recursos";
            return (
              <div key={action.key}>
                {isOpen && detail ? (
                  <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[760px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                      Recursos
                    </p>

                    <div className="mb-3 flex gap-2 border-b border-white/10 pb-2">
                      <button
                        type="button"
                        onClick={() => setResourceTab("spells")}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${resourceTab === "spells" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
                      >
                        Hechizos
                      </button>
                      <button
                        type="button"
                        onClick={() => setResourceTab("extra")}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${resourceTab === "extra" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
                      >
                        Extra
                      </button>
                      <button
                        type="button"
                        onClick={() => setResourceTab("money")}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${resourceTab === "money" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
                      >
                        Dinero
                      </button>
                    </div>

                    {resourceTab === "spells" ? (
                      <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] gap-2">
                        {SPELL_LEVELS.map((level) => {
                          const maxValue = spellSlotMaximums[level] ?? 0;
                          const currentValue =
                            resourceSpellSlots[level] ?? maxValue;
                          const isDisabled = maxValue <= 0;

                          return (
                            <article
                              key={`quick-resource-spell-${level}`}
                              className="rounded-[14px] border border-white/10 bg-black/20 px-2 py-2 text-center"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                                {level}
                              </p>
                              <p className="mt-1 text-lg font-bold leading-none text-white">
                                {maxValue > 0 ? currentValue : "--"}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                                / {maxValue > 0 ? maxValue : "--"}
                              </p>
                              <div className="mt-2 flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() =>
                                    setResourceSpellSlots((current) => {
                                      const nextValue = Math.max(
                                        0,
                                        Math.min(
                                          maxValue,
                                          (current[level] ?? maxValue) - 1,
                                        ),
                                      );
                                      return { ...current, [level]: nextValue };
                                    })
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200 disabled:opacity-40"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() =>
                                    setResourceSpellSlots((current) => {
                                      const nextValue = Math.max(
                                        0,
                                        Math.min(
                                          maxValue,
                                          (current[level] ?? maxValue) + 1,
                                        ),
                                      );
                                      return { ...current, [level]: nextValue };
                                    })
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200 disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}

                    {resourceTab === "extra" ? (
                      extraResourceRows.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2">
                          {extraResourceRows.map((resource) => (
                            <article
                              key={`quick-resource-extra-${resource.index}`}
                              className="rounded-[14px] border border-white/10 bg-black/20 px-2 py-2 text-center"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                                Extra {resource.index}
                              </p>
                              <p className="mt-1 text-lg font-bold leading-none text-white">
                                {resource.valor}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                                / {resource.max}
                              </p>
                              <div className="mt-2 flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setResourceExtraResources((current) => {
                                      const maxValue = resource.max;
                                      const nextValue = Math.max(
                                        0,
                                        Math.min(
                                          maxValue,
                                          (current[resource.index] ??
                                            resource.valor) - 1,
                                        ),
                                      );
                                      return {
                                        ...current,
                                        [resource.index]: nextValue,
                                      };
                                    })
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setResourceExtraResources((current) => {
                                      const maxValue = resource.max;
                                      const nextValue = Math.max(
                                        0,
                                        Math.min(
                                          maxValue,
                                          (current[resource.index] ??
                                            resource.valor) + 1,
                                        ),
                                      );
                                      return {
                                        ...current,
                                        [resource.index]: nextValue,
                                      };
                                    })
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200"
                                >
                                  +
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                          Este personaje no tiene recursos extra.
                        </div>
                      )
                    ) : null}

                    {resourceTab === "money" ? (
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          { key: "ppt", label: "PPT" },
                          { key: "po", label: "PO" },
                          { key: "pp", label: "PP" },
                          { key: "pc", label: "PC" },
                        ].map((currency) => (
                          <article
                            key={currency.key}
                            className="rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-2.5 text-center"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                              {currency.label}
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setResourceMoney((current) => ({
                                    ...current,
                                    [currency.key]: Math.max(
                                      0,
                                      (current[currency.key] ?? 0) - 1,
                                    ),
                                  }))
                                }
                                className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-200"
                              >
                                -
                              </button>
                              <p className="min-w-[32px] text-center text-xl font-bold leading-none text-white">
                                {resourceMoney[currency.key] ?? 0}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setResourceMoney((current) => ({
                                    ...current,
                                    [currency.key]:
                                      (current[currency.key] ?? 0) + 1,
                                  }))
                                }
                                className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-200"
                              >
                                +
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((current) =>
                      current === "recursos" ? null : "recursos",
                    )
                  }
                />
              </div>
            );
          }

          if (action.key === "hechizos") {
            const isOpen = activeAction === "hechizos";
            const levelOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
            const sortedLevels = levelOrder.filter((level) =>
              spellsByLevel.has(level),
            );

            return (
              <div key={action.key}>
                {isOpen && detail && spellsByLevel.size > 0 ? (
                  <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[380px] max-w-[90vw] -translate-x-1/2 max-h-[450px] rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl overflow-y-auto">
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                      Hechizos
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Modificador
                        </p>
                        <p className="mt-1 text-lg font-bold text-white leading-none">
                          {spellcastingModifier !== null &&
                          spellcastingModifier !== undefined
                            ? formatSignedValue(spellcastingModifier)
                            : "--"}
                        </p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-stone-500 truncate">
                          {detail.caracteristicaLanzamientoConjuros ?? "--"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={spellAttackBonus === null}
                        onClick={() =>
                          spellAttackBonus !== null &&
                          diceRoller.rollD20Check(
                            "Ataque de hechizo",
                            spellAttackBonus,
                          )
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center disabled:cursor-default hover:bg-white/10 transition-colors"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Ataque de hechizos
                        </p>
                        <p className="mt-1 text-lg font-bold text-white leading-none">
                          {spellAttackBonus !== null &&
                          spellAttackBonus !== undefined
                            ? formatSignedValue(spellAttackBonus)
                            : "--"}
                        </p>
                      </button>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Salvación
                        </p>
                        <p className="mt-1 text-lg font-bold text-white leading-none">
                          {spellSaveDc === null ? "--" : spellSaveDc}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {sortedLevels.map((level) => {
                        const spells = spellsByLevel.get(level) ?? [];
                        const levelLabel =
                          level === 0 ? "Trucos" : `Nivel ${level}`;
                        return (
                          <div key={level}>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 mb-2">
                              {levelLabel}
                            </p>
                            <div className="space-y-1.5">
                              {spells.map((spell) => (
                                <button
                                  key={spell.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSpell(spell);
                                  }}
                                  className="w-full block text-left rounded-lg px-3 py-2 text-[11px] text-white/80 hover:text-amber-100 hover:bg-white/10 transition-colors truncate font-medium"
                                  title={spell.nombre}
                                >
                                  {spell.nombre}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isOpen && detail && spellsByLevel.size === 0 ? (
                  <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[380px] max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
                      Hechizos
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Modificador
                        </p>
                        <p className="mt-1 text-lg font-bold text-white leading-none">
                          {spellcastingModifier === null
                            ? "--"
                            : formatSignedValue(spellcastingModifier)}
                        </p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-stone-500 truncate">
                          {detail.caracteristicaLanzamientoConjuros ?? "--"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={spellAttackBonus === null}
                        onClick={() =>
                          spellAttackBonus !== null &&
                          diceRoller.rollD20Check(
                            "Ataque de hechizo",
                            spellAttackBonus,
                          )
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center disabled:cursor-default hover:bg-white/10 transition-colors"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Ataque de hechizos
                        </p>
                        <p className="mt-1 text-lg font-bold text-white leading-none">
                          {spellAttackBonus === null
                            ? "--"
                            : formatSignedValue(spellAttackBonus)}
                        </p>
                      </button>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Salvación
                        </p>
                        <p className="mt-1 text-lg font-bold text-white leading-none">
                          {spellSaveDc === null ? "--" : spellSaveDc}
                        </p>
                      </div>
                    </div>
                    <p className="text-center text-[12px] text-white/60">
                      No se conoce ningún hechizo
                    </p>
                  </div>
                ) : null}

                <ActionButton
                  action={action}
                  onClick={() =>
                    setActiveAction((current) =>
                      current === "hechizos" ? null : "hechizos",
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

        {/* Botón cerrar */}
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
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center gap-4 px-4">
          {([advantageResult.die1, advantageResult.die2] as const).map(
            (die, i) => {
              const modFmt =
                advantageResult.modifier === 0
                  ? null
                  : `${advantageResult.modifier >= 0 ? "+" : "-"}${Math.abs(advantageResult.modifier)}`;
              const expression = modFmt ? `1d20 ${modFmt}` : "1d20";
              const total = die + advantageResult.modifier;
              const typeLabel =
                advantageResult.type === "ventaja"
                  ? "Con ventaja"
                  : "Con desventaja";
              return (
                <div
                  key={i}
                  className="min-w-[260px] animate-in fade-in zoom-in-95 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.92),rgba(28,25,23,0.9))] px-6 py-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md duration-300"
                >
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                    Resultado
                  </p>
                  <h3 className="mt-2 text-center text-xl font-bold text-white">
                    {advantageResult.weaponName} · {typeLabel}
                  </h3>
                  <p className="mt-1 text-center text-sm text-stone-300">
                    {expression}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-emerald-300/35 bg-emerald-300/15 text-lg font-bold text-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
                      {die}
                    </div>
                    {advantageResult.modifier !== 0 && (
                      <div className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-stone-100">
                        {modFmt}
                      </div>
                    )}
                  </div>

                  <p className="mt-5 text-center text-lg font-semibold text-stone-200">
                    Total:{" "}
                    <span className="text-2xl font-bold text-amber-200">
                      {total}
                    </span>
                  </p>
                </div>
              );
            },
          )}
        </div>
      )}

      <SpellDetailModal
        spell={selectedSpell}
        isOpen={selectedSpell !== null}
        onClose={() => setSelectedSpell(null)}
        onRollExpression={(spellName, expression) => {
          diceRoller.rollExpression(spellName, expression);
        }}
      />
    </div>
  );
}
