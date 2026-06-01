import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import { getAbilityModifierByName } from "../../../personaje/dndcharactersheet/utils/characterAbilities";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import {
  clampPercentage,
  formatStatWithModifier,
  getArmorClass,
  getInitiative,
  getMaxHp,
} from "../../hooks/useTokenPanelCharacter";
import type { CampaignPositionResponse } from "../../types";

const MAIN_STATS = [
  { key: "Fuerza", short: "Fue", display: "Fuerza" },
  { key: "Destreza", short: "Des", display: "Destreza" },
  { key: "Constitucion", short: "Con", display: "Constitución" },
  { key: "Inteligencia", short: "Int", display: "Inteligencia" },
  { key: "Sabiduria", short: "Sab", display: "Sabiduría" },
  { key: "Carisma", short: "Car", display: "Carisma" },
] as const;

const MB_MAIN_STATS = [
  { key: "MB_ModFuerza", short: "Fue", display: "Fuerza" },
  { key: "MB_ModAgilidad", short: "Agi", display: "Agilidad" },
  { key: "MB_ModPresencia", short: "Pre", display: "Presencia" },
  { key: "MB_ModResistencia", short: "Res", display: "Resistencia" },
] as const;

interface TokenCharacterCardProps {
  token: CampaignPositionResponse;
  detail: DndCharacterDetailResponse | undefined;
  articleCls: string;
  portraitCls: string;
  iniciativaActiva: boolean;
  personajesConIniciativa?: Set<number>;
  diceRoller: ReturnType<typeof useDiceRoller>;
  onOpenCharacterSheet?: (characterId: number, sistemaDeJuego?: string) => void;
  onInteract?: () => void;
  onTokenRightClick?: (posicionId: number, x: number, y: number) => void;
  onTokenSelect?: (posicionId: number) => void;
  onSelectHealthCharacter: (id: number) => void;
  onSelectMoralCharacter?: (id: number) => void;
  onTirarIniciativa?: (
    personajeId: number,
    nombre: string,
    retrato: string | undefined,
    bonificacion: number,
  ) => void;
}

function hasExactTagCard(tags: string | null | undefined, key: string) {
  return !!tags && tags.split(",").some((t) => t.trim() === key);
}

function extractTagNumCard(
  tags: string | null | undefined,
  key: string,
): number | null {
  if (!tags) return null;
  const m = tags.match(new RegExp(`${key};(\\d+)`));
  return m ? Number.parseInt(m[1], 10) : null;
}

export default function TokenCharacterCard({
  token,
  detail,
  articleCls,
  portraitCls,
  iniciativaActiva,
  personajesConIniciativa,
  diceRoller,
  onOpenCharacterSheet,
  onInteract,
  onTokenRightClick,
  onTokenSelect,
  onSelectHealthCharacter,
  onSelectMoralCharacter,
  onTirarIniciativa,
}: TokenCharacterCardProps) {
  const stats = detail?.estadisticas ?? {};
  const isMB = detail?.sistemaDeJuego === "Mork Borg";
  const isMBEnemy =
    isMB && (detail?.tipo === "enemigo" || detail?.tipo === "PNJ");

  // ── HP ────────────────────────────────────────────────────────
  // MB enemies use "Vida actual"/"Vida maxima"; MB players use "MB_VidaActual"/"MB_VidaMaxima"
  const maxHp = isMBEnemy
    ? Math.max(1, stats["Vida maxima"] ?? getMaxHp(stats))
    : isMB
      ? (stats["MB_VidaMaxima"] ?? 0)
      : getMaxHp(stats);
  const currentHp = isMBEnemy
    ? Math.max(0, stats["Vida actual"] ?? 0)
    : isMB
      ? Math.max(0, stats["MB_VidaActual"] ?? 0)
      : Math.max(0, stats["Vida actual"] ?? 0);
  const tempHp = isMBEnemy
    ? 0
    : isMB
      ? 0
      : Math.max(0, stats["Vida temporal"] ?? 0);

  const hpPercent = clampPercentage(maxHp > 0 ? (currentHp / maxHp) * 100 : 0);
  const tempHpPercent = clampPercentage(maxHp > 0 ? (tempHp / maxHp) * 100 : 0);

  // ── Moral (MB enemies only) ───────────────────────────────────
  const charTags = detail?.tags ?? "";
  const moralNA =
    hasExactTagCard(charTags, "MBMoralNA") || charTags.includes("MBMoralNA");
  const moralEspecial =
    hasExactTagCard(charTags, "MBMoralEspecial") ||
    charTags.includes("MBMoralEspecial");
  const moralActual = stats["Moral actual"] ?? null;
  const moralMaxima = stats["Moral maxima"] ?? null;
  const showMoralBar = isMBEnemy && !moralNA;
  const moralPercent = clampPercentage(
    moralMaxima && moralMaxima > 0 && moralActual !== null
      ? (moralActual / moralMaxima) * 100
      : 0,
  );
  const moralDisplay = moralEspecial
    ? "Especial"
    : moralMaxima !== null && moralActual !== null
      ? `${moralActual}/${moralMaxima}`
      : "-/-";

  // ── MB enemy weapons & armor ──────────────────────────────────
  const mbEnemyWeapons = isMBEnemy
    ? (detail?.habilidades ?? []).filter(
        (h) =>
          hasExactTagCard(h.tags, "MBEnemyArma") ||
          hasExactTagCard(h.tags, "MBEnemyArmaEspecial"),
      )
    : [];
  const mbEnemyArmors = isMBEnemy
    ? (detail?.habilidades ?? []).filter((h) =>
        hasExactTagCard(h.tags, "MBEnemyArmadura"),
      )
    : [];

  // Berserker random weapon: resolve from biography if instance has mbArmaIdx tag
  const hasRandomWeapon = isMBEnemy && charTags.includes("MBArmaAleatoria");
  const resolvedArmaIdx = extractTagNumCard(charTags, "mbArmaIdx");
  let resolvedRandomWeapon: { nombre: string; formula: string } | null = null;
  if (hasRandomWeapon && resolvedArmaIdx !== null && detail?.biografia) {
    try {
      const bio = JSON.parse(detail.biografia) as {
        armaAleatoria?: { opciones: { nombre: string; formula: string }[] };
      };
      resolvedRandomWeapon =
        bio.armaAleatoria?.opciones[resolvedArmaIdx - 1] ?? null;
    } catch {
      /* ignore */
    }
  }

  // ── MB enemy weapon/armor dice roll ──────────────────────────
  const rollMBItem = (nombre: string, formula: string, isArmor: boolean) => {
    // Strip leading "-" for armor formulas (e.g. "-1d2" → "1d2")
    const rollFormula =
      isArmor && formula.startsWith("-") ? formula.slice(1) : formula;
    // Simulate d2 as d4 (same as the rest of the app)
    const finalFormula = rollFormula.includes("d2")
      ? rollFormula.replace("d2", "d4")
      : rollFormula;
    diceRoller.rollExpression(nombre, finalFormula);
  };

  // ── DnD secondary stats ──────────────────────────────────────
  const armorClass = getArmorClass(stats);
  const movement = Math.max(0, stats["Movimiento"] ?? 0);
  const initiative = getInitiative(stats);

  // ── MB player inventory ───────────────────────────────────────
  const mbCarga = isMB && !isMBEnemy ? (stats["MB_Carga"] ?? 0) : 0;
  const mbItems =
    isMB && !isMBEnemy
      ? (detail?.mochila ?? []).filter((item) => item.tipoObjeto !== "DINERO")
      : [];
  const mbMaxSlots = mbCarga * 2;
  const mbIsOverloaded = mbItems.length > mbCarga;

  return (
    <article className={`w-full border-y p-3 ${articleCls}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            onTokenSelect?.(token.id);
            onOpenCharacterSheet?.(token.personajeId, detail?.sistemaDeJuego);
            onInteract?.();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTokenRightClick?.(token.id, e.clientX, e.clientY);
          }}
          className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${portraitCls} bg-zinc-700 transition hover:scale-[1.02]`}
          title="Abrir hoja de personaje (click derecho → opciones)"
        >
          {(detail?.retrato ?? token.retrato) ? (
            <img
              src={detail?.retrato ?? token.retrato}
              alt={detail?.nombre ?? token.personajeNombre}
              className="h-full w-full object-cover"
            />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            {detail?.nombre ?? token.personajeNombre}
          </p>

          <div className="mt-2 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onSelectHealthCharacter(token.personajeId);
                onInteract?.();
              }}
              className="relative block h-5 w-full overflow-hidden rounded-full border border-red-300/35 bg-black/35 text-left transition hover:border-red-200/60"
              title="Gestionar puntos de vida"
            >
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${hpPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">
                {currentHp}/{maxHp}
              </div>
            </button>

            {tempHp > 0 ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-blue-100/90">
                  <span>Temporal</span>
                  <span>{tempHp}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-blue-300/35 bg-black/35">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${tempHpPercent}%` }}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── DnD stats ─────────────────────────────────────────── */}
      {!isMB && (
        <div className="mt-3 border-t border-white/10 pt-2.5">
          <div className="grid grid-cols-6 gap-0 text-center">
            {MAIN_STATS.map((stat) => (
              <div key={`${token.id}-${stat.key}`}>
                <p className="text-[10px] font-semibold text-white/70">
                  {stat.short}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!detail) return;
                    diceRoller.rollD20Check(
                      stat.key,
                      getAbilityModifierByName(detail, stat.key),
                    );
                  }}
                  className="text-sm font-bold text-amber-100"
                  title={`Tirar ${stat.display}`}
                >
                  {formatStatWithModifier(
                    stats[stat.key] ?? 0,
                    detail ? getAbilityModifierByName(detail, stat.key) : 0,
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-0 border-t border-white/10 pt-2">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                CA
              </p>
              <p className="text-sm font-bold text-white">{armorClass}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                MOV
              </p>
              <p className="text-sm font-bold text-white">{movement}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                INI
              </p>
              {iniciativaActiva && onTirarIniciativa ? (
                <button
                  type="button"
                  onClick={() => {
                    onTirarIniciativa(
                      token.personajeId,
                      detail?.nombre ?? token.personajeNombre,
                      detail?.retrato ?? token.retrato,
                      initiative,
                    );
                  }}
                  className={[
                    "text-sm font-bold transition-colors",
                    personajesConIniciativa?.has(token.personajeId)
                      ? "text-amber-300"
                      : "text-white hover:text-amber-200",
                  ].join(" ")}
                  title="Tirar iniciativa"
                >
                  {initiative >= 0 ? `+${initiative}` : String(initiative)}
                </button>
              ) : (
                <p className="text-sm font-bold text-white">{initiative}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mork Borg ENEMY stats ──────────────────────────────── */}
      {isMBEnemy && (
        <div className="mt-2 space-y-1.5">
          {/* Moral bar — clickable */}
          {showMoralBar && (
            <button
              type="button"
              onClick={() =>
                !moralEspecial && onSelectMoralCharacter?.(token.personajeId)
              }
              className={`relative block h-4 w-full overflow-hidden rounded-full border border-sky-300/30 bg-black/35 text-left transition ${!moralEspecial ? "hover:border-sky-200/60 cursor-pointer" : "cursor-default"}`}
              title={moralEspecial ? "Moral especial" : "Gestionar moral"}
            >
              {!moralEspecial && moralMaxima !== null && moralMaxima > 0 && (
                <div
                  className="h-full bg-sky-600 transition-all"
                  style={{ width: `${moralPercent}%` }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                {moralDisplay}
              </div>
            </button>
          )}

          {/* Weapons | Armor — clickable rolls */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 pt-1.5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/45 mb-0.5">
                Armas
              </p>
              {resolvedRandomWeapon && (
                <button
                  type="button"
                  onClick={() =>
                    resolvedRandomWeapon.formula &&
                    rollMBItem(
                      resolvedRandomWeapon.nombre,
                      resolvedRandomWeapon.formula,
                      false,
                    )
                  }
                  className="text-left text-[10px] leading-tight text-amber-200 truncate w-full hover:text-amber-100 transition"
                >
                  {resolvedRandomWeapon.nombre}
                  <span className="ml-1 text-red-300 font-mono">
                    {resolvedRandomWeapon.formula}
                  </span>
                </button>
              )}
              {mbEnemyWeapons.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() =>
                    w.formula && rollMBItem(w.nombre, w.formula, false)
                  }
                  className="text-left text-[10px] leading-tight text-amber-200 truncate w-full hover:text-amber-100 transition"
                >
                  {w.nombre}
                  {w.formula && (
                    <span className="ml-1 text-red-300 font-mono">
                      {w.formula}
                    </span>
                  )}
                </button>
              ))}
              {!resolvedRandomWeapon && mbEnemyWeapons.length === 0 && (
                <p className="text-[10px] text-stone-500">Nada</p>
              )}
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/45 mb-0.5">
                Armadura
              </p>
              {mbEnemyArmors.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    a.formula && rollMBItem(a.nombre, a.formula, true)
                  }
                  className="text-left text-[10px] leading-tight text-amber-200 truncate w-full hover:text-amber-100 transition"
                >
                  {a.nombre}
                  {a.formula && (
                    <span className="ml-1 text-amber-300 font-mono">
                      {a.formula}
                    </span>
                  )}
                </button>
              ))}
              {mbEnemyArmors.length === 0 && (
                <p className="text-[10px] text-stone-500">Nada</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mork Borg PLAYER stats ──────────────────────────────── */}
      {isMB && !isMBEnemy && (
        <div className="mt-3 border-t border-white/10 pt-2.5">
          <div className="grid grid-cols-4 gap-0 text-center">
            {MB_MAIN_STATS.map((stat) => {
              const mod = stats[stat.key] ?? 0;
              return (
                <div key={`${token.id}-${stat.key}`}>
                  <p className="text-[10px] font-semibold text-white/70">
                    {stat.short}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      diceRoller.rollD20Check(stat.display, mod);
                    }}
                    className="text-sm font-bold text-amber-100"
                    title={`d20${mod >= 0 ? `+${mod}` : mod}`}
                  >
                    {mod >= 0 ? `+${mod}` : String(mod)}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 border-t border-white/10 pt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                Inventario {mbItems.length}/{mbMaxSlots}
              </p>
              {mbIsOverloaded && (
                <p className="text-[10px] font-bold text-rose-400 animate-pulse">
                  CD+2 Fue y Agi
                </p>
              )}
            </div>
            <div className="max-h-[88px] overflow-y-auto grid grid-cols-2 gap-1 pr-0.5 [scrollbar-width:thin] [scrollbar-color:rgba(203,213,225,0.3)_transparent]">
              {Array.from(
                { length: Math.max(mbMaxSlots, mbItems.length) },
                (_, i) => {
                  const item = mbItems[i] ?? null;
                  const isOver = i >= mbCarga;
                  return (
                    <div
                      key={i}
                      className={`rounded-[8px] px-1.5 py-1 min-h-[24px] ${
                        isOver
                          ? "border border-rose-500/30 bg-rose-950/25"
                          : "border border-blue-500/20 bg-blue-950/25"
                      }`}
                    >
                      {item ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-white/50">
                            {item.cantidad}×
                          </span>
                          <span
                            className="truncate text-[10px] text-amber-200 leading-tight"
                            title={item.nombre}
                          >
                            {item.nombre}
                          </span>
                          {item.tipoObjeto === "ARMA" && (
                            <span className="shrink-0 text-[9px] font-bold text-red-400">
                              ⚔
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
