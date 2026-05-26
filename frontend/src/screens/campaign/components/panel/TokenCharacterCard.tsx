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

interface TokenCharacterCardProps {
  token: CampaignPositionResponse;
  detail: DndCharacterDetailResponse | undefined;
  articleCls: string;
  portraitCls: string;
  iniciativaActiva: boolean;
  personajesConIniciativa?: Set<number>;
  diceRoller: ReturnType<typeof useDiceRoller>;
  onOpenCharacterSheet?: (characterId: number) => void;
  onInteract?: () => void;
  onTokenRightClick?: (posicionId: number, x: number, y: number) => void;
  onTokenSelect?: (posicionId: number) => void;
  onSelectHealthCharacter: (id: number) => void;
  onTirarIniciativa?: (
    personajeId: number,
    nombre: string,
    retrato: string | undefined,
    bonificacion: number,
  ) => void;
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
  onTirarIniciativa,
}: TokenCharacterCardProps) {
  const stats = detail?.estadisticas ?? {};
  const maxHp = getMaxHp(stats);
  const currentHp = Math.max(0, stats["Vida actual"] ?? 0);
  const tempHp = Math.max(0, stats["Vida temporal"] ?? 0);
  const hpPercent = clampPercentage((currentHp / maxHp) * 100);
  const tempHpPercent = clampPercentage((tempHp / maxHp) * 100);
  const armorClass = getArmorClass(stats);
  const movement = Math.max(0, stats["Movimiento"] ?? 0);
  const initiative = getInitiative(stats);

  return (
    <article className={`w-full border-y p-3 ${articleCls}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            onTokenSelect?.(token.id);
            onOpenCharacterSheet?.(token.personajeId);
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
    </article>
  );
}
