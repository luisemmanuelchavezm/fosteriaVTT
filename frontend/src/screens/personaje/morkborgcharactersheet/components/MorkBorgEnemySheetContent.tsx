import { useEffect, useRef, useState } from "react";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import type { DiceRollSummary } from "../../../../components/dice/useDiceRoller";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { saveMBEnemyVida, saveMBEnemyMoral } from "../../utils/mbApi";
import {
  hasTag,
  hasExactTag,
  getWeapons,
  getArmaduras,
  getRasgo,
  getEspecial,
  getLoot,
  isEspecialTable,
  parseBiografia,
  resolveRandomTraits,
  resolveRandomWeapon,
} from "./MorkBorgEnemySheetUtils";
import { StatPanel, SpecialWeaponOverlay } from "./MorkBorgEnemySheetHelpers";

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
    0,
    stats["Vida maxima"] ?? stats["Puntos de vida"] ?? 0,
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
    // Strip ability modifiers (@mb_fuerza or +fuerza style) — enemies have no character stats
    const cleanFormula =
      formula
        .replace(/\s*[+]\s*@?mb_\w+/gi, "")
        .replace(/@?mb_\w+\s*[+]\s*/gi, "")
        .replace(/\s*[+]\s*(?:fuerza|agilidad|presencia|resistencia)\b/gi, "")
        .trim() || "1d4";
    setArmorDisplaySummary(null);
    pendingRollRef.current = {
      expr: `${nombre} (${formula})`,
      hasSpecial,
      isArmor: false,
      armorSides: 0,
    };
    rollExpression(nombre, cleanFormula);
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
  const rasgoTables = bioJson?.rasgosAleatorios?.filter(
    (table) => !isEspecialTable(table),
  );
  const especialTables = bioJson?.rasgosAleatorios?.filter((table) =>
    isEspecialTable(table),
  );

  // Random weapon (Berserker)
  const randomWeapon = bioJson?.armaAleatoria
    ? resolveRandomWeapon(bioJson.armaAleatoria, tags)
    : null;

  // Random traits (Pálido, Merodeador)
  const resolvedTraits = rasgoTables
    ? resolveRandomTraits(rasgoTables, tags)
    : null;
  const resolvedEspecialidades = especialTables
    ? resolveRandomTraits(especialTables, tags)
    : null;

  // Instance: show resolved; Template: show tables as text
  const resolvedRasgos = resolvedTraits?.filter(Boolean) ?? [];
  const resolvedEspecialidad =
    resolvedEspecialidades?.find((entry) => entry !== null) ?? null;

  // Template text for random trait tables (shown in baúl/marketplace)
  const templateRasgoText = rasgoTables?.length
    ? rasgoTables
        .map(
          (t) =>
            `${t.nombre} (${t.dados}):\n${t.opciones.map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
        )
        .join("\n\n")
    : null;

  const templateEspecialidadText = especialTables?.length
    ? (() => {
        const first = especialTables[0];
        return first
          ? `${first.nombre} (${first.dados}):\n${first.opciones.map((o, i) => `${i + 1}. ${o}`).join("\n")}`
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
            disabledLabel={moralEspecial ? "Especial" : "-"}
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
                    className="flex w-full items-start gap-2 rounded-[12px] border border-red-500/30 bg-red-900/30 px-3 py-2 text-left transition hover:bg-red-900/50"
                  >
                    <span className="min-w-0 flex-1 break-words font-semibold text-amber-200">
                      {w.nombre}
                    </span>
                    <span
                      className="ml-1 shrink-0 max-w-[45%] truncate font-mono text-sm text-red-300"
                      title={w.formula ?? ""}
                    >
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
                  className="flex w-full items-start gap-2 rounded-[12px] border border-amber-600/30 bg-amber-900/20 px-3 py-2 text-left transition hover:bg-amber-900/40"
                >
                  <span className="min-w-0 flex-1 break-words font-semibold text-amber-200">
                    {a.nombre}
                  </span>
                  <span
                    className="ml-1 shrink-0 max-w-[45%] truncate font-mono text-sm text-amber-300"
                    title={a.formula ?? ""}
                  >
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
