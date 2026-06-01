import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import type { DiceRollSummary } from "../../../../components/dice/useDiceRoller";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { saveMBEnemyVida, saveMBEnemyMoral } from "../../utils/dndApi";

// ── Tag helpers ──────────────────────────────────────────────────────────────

function hasTag(tags: string | null | undefined, key: string): boolean {
  return !!tags && tags.includes(key);
}

function extractTagNumber(
  tags: string | null | undefined,
  key: string,
): number | null {
  if (!tags) return null;
  const match = tags.match(new RegExp(`${key};(\\d+)`));
  return match ? Number.parseInt(match[1], 10) : null;
}

// ── Weapon / armor filtering ─────────────────────────────────────────────────

function hasExactTag(tags: string | null | undefined, key: string): boolean {
  if (!tags) return false;
  return tags.split(",").some((t) => t.trim() === key);
}

function getWeapons(character: DndCharacterDetailResponse) {
  return character.habilidades.filter(
    (h) =>
      hasExactTag(h.tags, "MBEnemyArma") ||
      hasExactTag(h.tags, "MBEnemyArmaEspecial"),
  );
}

function getArmaduras(character: DndCharacterDetailResponse) {
  return character.habilidades.filter((h) =>
    hasExactTag(h.tags, "MBEnemyArmadura"),
  );
}

function getRasgo(character: DndCharacterDetailResponse): string | null {
  const h = character.habilidades.find((h) => hasTag(h.tags, "MBEnemyRasgo"));
  return h?.descripcion ?? null;
}

function getEspecial(character: DndCharacterDetailResponse): string | null {
  const h = character.habilidades.find((h) =>
    hasTag(h.tags, "MBEnemyEspecial"),
  );
  return h?.descripcion ?? null;
}

function getLoot(character: DndCharacterDetailResponse): string | null {
  const h = character.habilidades.find((h) => hasTag(h.tags, "MBEnemyLoot"));
  return h?.descripcion ?? null;
}

// ── Random trait resolution ───────────────────────────────────────────────────

interface RandomTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: string[];
}

interface WeaponOption {
  nombre: string;
  formula: string;
}
interface RandomWeaponTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: WeaponOption[];
}

interface BiografiaJson {
  rasgosAleatorios?: RandomTable[];
  armaAleatoria?: RandomWeaponTable;
}

function parseBiografia(bio: string | null | undefined): BiografiaJson | null {
  if (!bio) return null;
  try {
    return JSON.parse(bio) as BiografiaJson;
  } catch {
    return null;
  }
}

function resolveRandomTraits(
  tables: RandomTable[],
  tags: string | null | undefined,
): Array<{ nombre: string; resultado: string } | null> {
  return tables.map((t) => {
    const idx = extractTagNumber(tags, t.tagKey);
    if (idx === null) return null;
    const value = t.opciones[idx - 1];
    return value ? { nombre: t.nombre, resultado: value } : null;
  });
}

function resolveRandomWeapon(
  table: RandomWeaponTable,
  tags: string | null | undefined,
): { nombre: string; formula: string } | null {
  const idx = extractTagNumber(tags, table.tagKey);
  if (idx === null) return null;
  return table.opciones[idx - 1] ?? null;
}

// ── HP/Moral mini-panel ──────────────────────────────────────────────────────

interface StatPanelProps {
  label: string;
  current: number;
  max: number;
  disabled?: boolean;
  disabledLabel?: string;
  readOnly?: boolean;
  healLabel?: string;
  damageLabel?: string;
  onHeal: () => void;
  onDamage: () => void;
  delta: string;
  setDelta: (v: string) => void;
  isSaving?: boolean;
  healColor?: string;
  damageColor?: string;
}

function StatPanel({
  label,
  current,
  max,
  disabled,
  disabledLabel,
  readOnly = false,
  healLabel = "Curar",
  damageLabel = "Daño",
  onHeal,
  onDamage,
  delta,
  setDelta,
  isSaving,
  healColor = "border-emerald-300/35 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
  damageColor = "border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15",
}: StatPanelProps) {
  if (disabled || readOnly) {
    const displayVal = disabled
      ? (disabledLabel ?? "-/-")
      : `${current}/${max}`;
    return (
      <div
        className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-3 flex flex-col items-center justify-center gap-1.5"
        style={{ minHeight: "110px" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          {label}
        </p>
        <p
          className={`text-2xl font-bold ${disabled ? "text-white/40" : "text-white"}`}
        >
          {displayVal}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
        {label}
      </p>
      <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
        {/* Controls column — compact rows */}
        <div className="grid grid-rows-[32px_32px_32px] gap-1">
          <button
            type="button"
            onClick={onHeal}
            className={`rounded-[10px] border px-1 text-[11px] font-semibold transition ${healColor}`}
          >
            {healLabel}
          </button>
          <div className="rounded-[10px] border border-white/10 bg-black/25 px-1.5">
            <div className="grid grid-cols-[18px_1fr_18px] items-center gap-1 h-full">
              <button
                type="button"
                onClick={() =>
                  setDelta(
                    String(Math.max(0, (Number.parseInt(delta, 10) || 0) - 1)),
                  )
                }
                className="h-5 w-5 flex items-center justify-center rounded-full border border-white/10 text-xs text-white"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={delta}
                onChange={(e) =>
                  setDelta(e.target.value.replace(/\D+/g, "") || "0")
                }
                className="w-full bg-transparent text-center text-xs font-semibold text-white outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setDelta(String((Number.parseInt(delta, 10) || 0) + 1))
                }
                className="h-5 w-5 flex items-center justify-center rounded-full border border-white/10 text-xs text-white"
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDamage}
            className={`rounded-[10px] border px-1 text-[11px] font-semibold transition ${damageColor}`}
          >
            {damageLabel}
          </button>
        </div>
        {/* Numbers column */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-1.5">
            <p className="text-[1.8rem] font-bold leading-none text-white">
              {current}
            </p>
            <span className="text-[1.5rem] font-bold leading-none text-white/40">
              /
            </span>
            <p className="text-[1.8rem] font-bold leading-none text-white">
              {max}
            </p>
          </div>
          {isSaving && <p className="mt-0.5 text-[10px] text-white/40">…</p>}
        </div>
      </div>
    </div>
  );
}

// ── Special-weapon overlay (only for weapons with "leer efecto del especial") ──

interface SpecialWeaponOverlayProps {
  expression: string;
  onClose: () => void;
}

function SpecialWeaponOverlay({
  expression,
  onClose,
}: SpecialWeaponOverlayProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-[20px] border border-amber-400/30 bg-zinc-900 p-5 text-center shadow-2xl min-w-[220px] max-w-[300px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
          {expression}
        </p>
        <p className="text-base font-semibold text-amber-200 italic">
          leer efecto del especial
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 rounded-full border border-white/15 px-4 py-1 text-xs font-semibold text-white/70 hover:bg-white/10"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MorkBorgEnemySheetContentProps {
  character: DndCharacterDetailResponse;
  characterId: string;
  onCharacterUpdate?: (updated: DndCharacterDetailResponse) => void;
}

export default function MorkBorgEnemySheetContent({
  character,
  characterId,
  onCharacterUpdate,
}: MorkBorgEnemySheetContentProps) {
  const token = localStorage.getItem("jwtToken") ?? "";
  const tags = character.tags ?? "";

  const stats = character.estadisticas;
  const vidaActual = Math.max(0, stats["Vida actual"] ?? 0);
  const vidaMaxima = Math.max(
    1,
    stats["Vida maxima"] ?? stats["Puntos de vida"] ?? 1,
  );
  const moralActual = stats["Moral actual"] ?? null;
  const moralMaxima = stats["Moral maxima"] ?? null;

  const noMoral = hasTag(tags, "MBMoralNA");
  const moralEspecial = hasTag(tags, "MBMoralEspecial");
  const hasRandomTraits = hasTag(tags, "MBRasgosAleatorios");
  const hasRandomWeapon = hasTag(tags, "MBArmaAleatoria");

  const [currentHp, setCurrentHp] = useState(vidaActual);
  const [hpDelta, setHpDelta] = useState("1");
  const [isSavingHp, setIsSavingHp] = useState(false);

  const [currentMoral, setCurrentMoral] = useState(moralActual ?? 0);
  const [moralDelta, setMoralDelta] = useState("1");
  const [isSavingMoral, setIsSavingMoral] = useState(false);

  useEffect(() => {
    setCurrentHp(Math.max(0, stats["Vida actual"] ?? 0));
  }, [stats]);
  useEffect(() => {
    setCurrentMoral(stats["Moral actual"] ?? 0);
  }, [stats]);

  const handleHpHeal = async () => {
    const delta = Number.parseInt(hpDelta, 10);
    if (!delta || delta <= 0) return;
    const next = Math.min(vidaMaxima, currentHp + delta);
    setCurrentHp(next);
    setIsSavingHp(true);
    try {
      await saveMBEnemyVida(token, characterId, next);
    } finally {
      setIsSavingHp(false);
    }
    onCharacterUpdate?.({
      ...character,
      estadisticas: { ...stats, "Vida actual": next },
    });
  };

  const handleHpDamage = async () => {
    const delta = Number.parseInt(hpDelta, 10);
    if (!delta || delta <= 0) return;
    const next = Math.max(0, currentHp - delta);
    setCurrentHp(next);
    setIsSavingHp(true);
    try {
      await saveMBEnemyVida(token, characterId, next);
    } finally {
      setIsSavingHp(false);
    }
    onCharacterUpdate?.({
      ...character,
      estadisticas: { ...stats, "Vida actual": next },
    });
  };

  const handleMoralHeal = async () => {
    if (noMoral || moralEspecial || moralMaxima === null) return;
    const delta = Number.parseInt(moralDelta, 10);
    if (!delta || delta <= 0) return;
    const next = Math.min(moralMaxima, currentMoral + delta);
    setCurrentMoral(next);
    setIsSavingMoral(true);
    try {
      await saveMBEnemyMoral(token, characterId, next);
    } finally {
      setIsSavingMoral(false);
    }
  };

  const handleMoralDamage = async () => {
    if (noMoral || moralEspecial || moralMaxima === null) return;
    const delta = Number.parseInt(moralDelta, 10);
    if (!delta || delta <= 0) return;
    const next = Math.max(0, currentMoral - delta);
    setCurrentMoral(next);
    setIsSavingMoral(true);
    try {
      await saveMBEnemyMoral(token, characterId, next);
    } finally {
      setIsSavingMoral(false);
    }
  };

  // Dice roller (shared for weapons and armor)
  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  // For special weapons: show "leer efecto del especial" overlay
  const [specialOverlayExpr, setSpecialOverlayExpr] = useState<string | null>(
    null,
  );
  // For armor: override summary display with negative total
  const [armorDisplaySummary, setArmorDisplaySummary] =
    useState<DiceRollSummary | null>(null);

  const pendingRollRef = useRef<{
    expr: string;
    hasSpecial: boolean;
    isArmor: boolean;
    armorSides: number; // original sides before d2→d4 mapping
  } | null>(null);

  useEffect(() => {
    if (!pendingRollRef.current || !summary || isRolling) return;
    const pending = pendingRollRef.current;
    pendingRollRef.current = null;

    if (pending.isArmor) {
      // Map d2 result (rolled as d4): 3→1, 4→2
      const raw = summary.diceValues[0] ?? summary.total;
      const mapped = pending.armorSides === 2 && raw > 2 ? raw - 2 : raw;
      setArmorDisplaySummary({
        ...summary,
        diceValues: [mapped],
        total: -mapped,
      });
    } else {
      setArmorDisplaySummary(null);
      if (pending.hasSpecial) setSpecialOverlayExpr(pending.expr);
    }
  }, [summary, isRolling]);

  const handleRollWeapon = (
    formula: string,
    nombre: string,
    hasSpecial: boolean,
  ) => {
    setArmorDisplaySummary(null);
    pendingRollRef.current = {
      expr: `${nombre} (${formula})`,
      hasSpecial,
      isArmor: false,
      armorSides: 0,
    };
    rollExpression(nombre, formula);
  };

  const handleRollArmor = (formula: string, nombre: string) => {
    const stripped = formula.startsWith("-") ? formula.slice(1) : formula; // "-1d2" → "1d2"
    const match = stripped.match(/^(\d+)d(\d+)/);
    if (!match) return;
    const sides = Number.parseInt(match[2], 10);
    // d2 is simulated as d4 in the 3D engine (same as presagios)
    const rollFormula = sides === 2 ? "1d4" : stripped;
    pendingRollRef.current = {
      expr: `${nombre} (${formula})`,
      hasSpecial: false,
      isArmor: true,
      armorSides: sides,
    };
    setArmorDisplaySummary(null);
    rollExpression(nombre, rollFormula);
  };

  // Is this an instance (placed in campaign) or a template (browsing in baúl)?
  const isInstance = tags.includes("instancia");

  // Data extraction
  const weapons = getWeapons(character);
  const armaduras = getArmaduras(character);
  const rasgo = getRasgo(character);
  const especial = getEspecial(character);
  const loot = getLoot(character);
  const bioJson = parseBiografia(character.biografia);

  // Random weapon (Berserker)
  const randomWeapon = bioJson?.armaAleatoria
    ? resolveRandomWeapon(bioJson.armaAleatoria, tags)
    : null;

  // Random traits (Pálido, Merodeador)
  const resolvedTraits = bioJson?.rasgosAleatorios
    ? resolveRandomTraits(bioJson.rasgosAleatorios, tags)
    : null;

  // Instance: show resolved; Template: show tables as text
  const resolvedRasgos = resolvedTraits?.slice(0, -1).filter(Boolean) ?? [];
  const resolvedEspecialidad = resolvedTraits
    ? resolvedTraits[resolvedTraits.length - 1]
    : null;

  // Template text for random trait tables (shown in baúl/marketplace)
  const templateRasgoText = bioJson?.rasgosAleatorios
    ? bioJson.rasgosAleatorios
        .slice(0, -1)
        .map(
          (t) =>
            `${t.nombre} (${t.dados}):\n${t.opciones.map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
        )
        .join("\n\n")
    : null;

  const templateEspecialidadText = bioJson?.rasgosAleatorios
    ? (() => {
        const last =
          bioJson.rasgosAleatorios[bioJson.rasgosAleatorios.length - 1];
        return last
          ? `${last.nombre} (${last.dados}):\n${last.opciones.map((o, i) => `${i + 1}. ${o}`).join("\n")}`
          : null;
      })()
    : null;

  // Template text for random weapon (Berserker)
  const templateArmaText = bioJson?.armaAleatoria
    ? `${bioJson.armaAleatoria.nombre} (${bioJson.armaAleatoria.dados}):\n${bioJson.armaAleatoria.opciones.map((o, i) => `${i + 1}. ${o.nombre} ${o.formula}`).join("\n")}`
    : null;

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={armorDisplaySummary ?? summary}
      />
      {specialOverlayExpr && (
        <SpecialWeaponOverlay
          expression={specialOverlayExpr}
          onClose={() => setSpecialOverlayExpr(null)}
        />
      )}

      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-8 pt-6">
        {/* Portrait + name */}
        <div className="flex flex-col items-center gap-3">
          {character.retrato && (
            <img
              src={character.retrato}
              alt={character.nombre}
              className="h-32 w-32 rounded-2xl border-2 border-amber-400/40 object-cover shadow-lg"
            />
          )}
          <h2 className="text-3xl font-black text-white tracking-tight">
            {character.nombre}
          </h2>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              character.tipo === "PNJ"
                ? "bg-sky-800/50 text-sky-200"
                : "bg-rose-900/50 text-rose-200"
            }`}
          >
            {character.tipo === "PNJ" ? "PNJ" : "Enemigo"}
          </span>
        </div>

        {/* Row 1: HP | Moral — side by side */}
        <div className="grid grid-cols-2 gap-3">
          <StatPanel
            label="Puntos de vida"
            current={currentHp}
            max={vidaMaxima}
            readOnly={!isInstance}
            healLabel="Curar"
            healColor="border-emerald-300/35 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
            onHeal={() => void handleHpHeal()}
            onDamage={() => void handleHpDamage()}
            delta={hpDelta}
            setDelta={setHpDelta}
            isSaving={isSavingHp}
          />
          <StatPanel
            label="Moral"
            current={currentMoral}
            max={moralMaxima ?? 0}
            disabled={noMoral || moralEspecial}
            disabledLabel={moralEspecial ? "Especial" : "-/-"}
            readOnly={!isInstance}
            healLabel="Aumentar"
            damageLabel="Disminuir"
            healColor="border-sky-300/35 bg-sky-400/10 text-sky-100 hover:bg-sky-400/15"
            damageColor="border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
            onHeal={() => void handleMoralHeal()}
            onDamage={() => void handleMoralDamage()}
            delta={moralDelta}
            setDelta={setMoralDelta}
            isSaving={isSavingMoral}
          />
        </div>

        {/* Row 2: Weapons | Armor — side by side */}
        <div className="grid grid-cols-2 gap-3">
          {/* Weapons */}
          <div className="rounded-[18px] border border-red-900/40 bg-red-950/20 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Armas
            </p>
            <div className="space-y-1.5">
              {/* Template: show weapon table as text */}
              {hasRandomWeapon && !isInstance && templateArmaText && (
                <p className="text-sm leading-6 text-white/90 whitespace-pre-line">
                  {templateArmaText}
                </p>
              )}
              {/* Instance: show resolved weapon (clickable to roll) */}
              {hasRandomWeapon && isInstance && randomWeapon && (
                <button
                  type="button"
                  onClick={() =>
                    handleRollWeapon(
                      randomWeapon.formula,
                      randomWeapon.nombre,
                      false,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-[12px] border border-red-500/30 bg-red-900/30 px-3 py-2 text-left transition hover:bg-red-900/50"
                >
                  <span className="font-semibold text-amber-200">
                    {randomWeapon.nombre}
                  </span>
                  <span className="font-mono text-sm text-red-300">
                    {randomWeapon.formula}
                  </span>
                </button>
              )}
              {/* Static weapons (always shown clickable) */}
              {weapons.map((w) => {
                const isEspecial = hasExactTag(w.tags, "MBEnemyArmaEspecial");
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      handleRollWeapon(w.formula ?? "d4", w.nombre, isEspecial)
                    }
                    className="flex w-full items-center justify-between rounded-[12px] border border-red-500/30 bg-red-900/30 px-3 py-2 text-left transition hover:bg-red-900/50"
                  >
                    <span className="font-semibold text-amber-200">
                      {w.nombre}
                    </span>
                    <span className="font-mono text-sm text-red-300">
                      {w.formula}
                    </span>
                  </button>
                );
              })}
              {!hasRandomWeapon && weapons.length === 0 && (
                <p className="text-sm text-stone-400">Nada</p>
              )}
            </div>
          </div>

          {/* Armor */}
          <div className="rounded-[18px] border border-amber-900/40 bg-amber-950/20 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Armadura
            </p>
            <div className="space-y-1.5">
              {armaduras.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleRollArmor(a.formula ?? "1d2", a.nombre)}
                  className="flex w-full items-center justify-between rounded-[12px] border border-amber-600/30 bg-amber-900/20 px-3 py-2 text-left transition hover:bg-amber-900/40"
                >
                  <span className="font-semibold text-amber-200">
                    {a.nombre}
                  </span>
                  <span className="font-mono text-sm text-amber-300">
                    {a.formula}
                  </span>
                </button>
              ))}
              {armaduras.length === 0 && (
                <p className="text-sm text-stone-400">Nada</p>
              )}
            </div>
          </div>
        </div>

        {/* 2-col grid: [Rasgos | Especial] */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left: Rasgos */}
          <div className="rounded-[18px] border border-stone-700/40 bg-stone-900/30 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Rasgos
            </p>
            {/* Instance with resolved traits */}
            {hasRandomTraits && isInstance && resolvedRasgos.length > 0 ? (
              <div className="space-y-2">
                {resolvedRasgos.map((r, i) =>
                  r ? (
                    <div
                      key={i}
                      className="rounded-[10px] border border-stone-600/30 bg-stone-800/30 px-3 py-2"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                        {r.nombre}
                      </p>
                      <p className="mt-0.5 text-sm text-white">{r.resultado}</p>
                    </div>
                  ) : null,
                )}
              </div>
            ) : hasRandomTraits && !isInstance && templateRasgoText ? (
              /* Template: show full tables as text */
              <p className="text-sm leading-6 text-white/90 whitespace-pre-line">
                {templateRasgoText}
              </p>
            ) : rasgo ? (
              <p className="text-sm leading-6 text-white/90 whitespace-pre-line">
                {rasgo}
              </p>
            ) : (
              <p className="text-sm text-stone-500">-</p>
            )}
          </div>

          {/* Right: Especial */}
          <div className="rounded-[18px] border border-violet-900/40 bg-violet-950/20 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Especial
            </p>
            {/* Instance with resolved especialidad */}
            {hasRandomTraits && isInstance && resolvedEspecialidad ? (
              <div className="rounded-[10px] border border-violet-600/30 bg-violet-900/20 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400">
                  {resolvedEspecialidad.nombre}
                </p>
                <p className="mt-0.5 text-sm text-white">
                  {resolvedEspecialidad.resultado}
                </p>
              </div>
            ) : hasRandomTraits && !isInstance && templateEspecialidadText ? (
              /* Template: show full table as text */
              <p className="text-sm leading-6 text-white/90 whitespace-pre-line">
                {templateEspecialidadText}
              </p>
            ) : especial ? (
              <p className="text-sm leading-6 text-white/90 whitespace-pre-line">
                {especial}
              </p>
            ) : (
              <p className="text-sm text-stone-500">-</p>
            )}
          </div>
        </div>

        {/* Loot — full width */}
        {loot && (
          <div className="rounded-[18px] border border-yellow-800/40 bg-yellow-950/20 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Botín
            </p>
            <p className="text-sm leading-6 text-amber-100/90 whitespace-pre-line">
              {loot}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
