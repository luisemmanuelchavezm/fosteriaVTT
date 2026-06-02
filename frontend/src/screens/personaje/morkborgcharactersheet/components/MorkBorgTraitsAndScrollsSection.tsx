import { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import {
  MB_RASGOS_TERRIBLES,
  MB_CUERPOS_ROTOS,
  MB_HABITOS,
  MB_HISTORIAS_PERTURBADORAS,
} from "../../createmorkborg/utils/morkBorgUtils";
import { MB_CATASTROFES } from "../../createmorkborg/utils/morkBorgCatastrofes";
import MorkBorgDecoccionesModal from "./MorkBorgDecoccionesModal";

const SCROLL_KEYWORDS = ["PergaminoImpuro", "PergaminoSagrado"];
const CLASS_ABILITY_KEYWORDS = [
  "EscEspecialidadIdx",
  "DesertorItemIdx",
  "ErmitanoEspecialidadIdx",
  "RealezaItemIdx",
  "HerboristaHabilidadIdx",
  "ContenedorSinClase;6",
  "ItemSinClase2;3",
  "ItemSinClase2;4",
  "MorkBorgCustom",
];
const CLASS_OBJECT_KEYWORDS = [
  "DesertorItemIdx",
  "RealezaItemIdx",
  "SacerdoteItemIdx",
  "ErmitanoEspecialidadIdx",
  "ArmaEspecial",
  "ItemEspecial",
];

function extractTagNumber(tags: string, key: string): number | null {
  const match = tags.match(new RegExp(`${key};(\\d+)`));
  return match ? Number.parseInt(match[1], 10) : null;
}

function hasKeyword(
  tags: string | null | undefined,
  keywords: string[],
): boolean {
  if (!tags) return false;
  return keywords.some((kw) => tags.includes(kw));
}

function hasMbTag(tags: string | null | undefined): boolean {
  if (!tags) return false;
  return tags.split(",").some((tag) => tag.trim() === "MORK_BORG");
}

interface Props {
  character: DndCharacterDetailResponse;
  isOwner?: boolean;
  onOpenClassTraitsCatalog?: () => void;
  onOpenScrollCatalog?: () => void;
  onDeleteClassTrait?: (habilidadId: number) => void;
  onDeleteClassItem?: (itemId: number) => void;
  onDeleteScroll?: (habilidadId: number) => void;
}

export default function MorkBorgTraitsAndScrollsSection({
  character,
  isOwner = true,
  onOpenClassTraitsCatalog,
  onOpenScrollCatalog,
  onDeleteClassTrait,
  onDeleteClassItem,
  onDeleteScroll,
}: Props) {
  const characterTags = character.tags ?? "";
  const storageKey = `mb_catastrofas_${character.id}`;

  // ── Catástrofes ──────────────────────────────────────────────────────────
  const [catastrofasIdx, setCatastrofasIdx] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  });
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [decoccionModalOpen, setDecoccionModalOpen] = useState(false);

  const handleRollCatastrofe = useCallback(() => {
    if (catastrofasIdx.length >= 20 || rolling) return;

    setRolling(true);
    setLastRoll(null);

    setTimeout(() => {
      const allIdxs = MB_CATASTROFES.map((c) => c.idx);
      const picked = allIdxs[Math.floor(Math.random() * allIdxs.length)];
      const next = [...catastrofasIdx, picked];
      setCatastrofasIdx(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setLastRoll(picked);
      setRolling(false);
    }, 350);
  }, [catastrofasIdx, rolling, storageKey]);

  const handleReveal = (arrayIndex: number) =>
    setRevealed((prev) => new Set([...prev, arrayIndex]));

  const handleRemoveCatastrofe = useCallback(
    (arrayIndex: number) => {
      const next = catastrofasIdx.filter((_, i) => i !== arrayIndex);
      setCatastrofasIdx(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRevealed((prev) => {
        const adjusted = new Set<number>();
        prev.forEach((revIdx) => {
          if (revIdx < arrayIndex) adjusted.add(revIdx);
          else if (revIdx > arrayIndex) adjusted.add(revIdx - 1);
        });
        return adjusted;
      });
    },
    [catastrofasIdx, storageKey],
  );

  const allUsed = catastrofasIdx.length >= 20;

  // ── Rasgos ───────────────────────────────────────────────────────────────
  const rasgoIdx1 = extractTagNumber(characterTags, "rasgoTerrible1");
  const rasgoIdx2 = extractTagNumber(characterTags, "rasgoTerrible2");
  const cuerpoIdx = extractTagNumber(characterTags, "cuerpoRoto");
  const habitoIdx = extractTagNumber(characterTags, "habito");
  const historiaIdx = extractTagNumber(characterTags, "historia");

  const rasgo1 = MB_RASGOS_TERRIBLES.find((t) => t.idx === rasgoIdx1) ?? null;
  const rasgo2 = MB_RASGOS_TERRIBLES.find((t) => t.idx === rasgoIdx2) ?? null;
  const cuerpo = MB_CUERPOS_ROTOS.find((t) => t.idx === cuerpoIdx) ?? null;
  const habito = MB_HABITOS.find((t) => t.idx === habitoIdx) ?? null;
  const historia =
    MB_HISTORIAS_PERTURBADORAS.find((t) => t.idx === historiaIdx) ?? null;

  // ── Habilidades ──────────────────────────────────────────────────────────
  const scrolls = character.habilidades.filter((h) =>
    hasKeyword(h.tags, SCROLL_KEYWORDS),
  );
  const classAbilities = character.habilidades.filter((h) =>
    hasKeyword(h.tags, CLASS_ABILITY_KEYWORDS),
  );
  const classItems = character.mochila.filter(
    (item) =>
      hasMbTag(item.tags) && hasKeyword(item.tags, CLASS_OBJECT_KEYWORDS),
  );

  return (
    <section className="mt-8 space-y-6">
      {decoccionModalOpen && (
        <MorkBorgDecoccionesModal
          onClose={() => setDecoccionModalOpen(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── Columna izquierda ────────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Pergaminos */}
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-bold text-white">Pergaminos</h4>
              {isOwner && onOpenScrollCatalog && (
                <button
                  type="button"
                  onClick={onOpenScrollCatalog}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-purple-300/30 bg-purple-300/10 text-lg font-bold leading-none text-purple-100 transition hover:bg-purple-300/20"
                  aria-label="Añadir pergamino"
                >
                  +
                </button>
              )}
            </div>
            {scrolls.length === 0 ? (
              <p className="mt-3 text-base text-stone-500">Sin pergaminos.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {scrolls.map((scroll) => {
                  const isSagrado = scroll.tags?.includes("PergaminoSagrado");
                  return (
                    <div
                      key={scroll.id}
                      className={`rounded-[14px] border px-4 py-3 ${
                        isSagrado
                          ? "border-yellow-500/30 bg-yellow-950/25"
                          : "border-purple-500/25 bg-purple-950/25"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-lg font-semibold ${isSagrado ? "text-yellow-200" : "text-amber-200"}`}
                        >
                          {scroll.nombre}
                        </p>
                        {isOwner && onDeleteScroll && (
                          <button
                            type="button"
                            onClick={() => onDeleteScroll(scroll.id)}
                            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-rose-500/60 transition hover:bg-rose-950/50 hover:text-rose-400"
                            title="Eliminar pergamino"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {scroll.descripcion ? (
                        <p className="mt-1.5 text-base leading-6 text-white">
                          {scroll.descripcion}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catástrofes Arcanas */}
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-bold text-white">
                Catástrofes Arcanas
              </h4>
              <button
                type="button"
                disabled={allUsed || rolling}
                onClick={handleRollCatastrofe}
                className="flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-base leading-none">
                  {rolling ? "…" : "🎲"}
                </span>
                d20
                {lastRoll !== null && !rolling ? (
                  <span className="ml-1 text-rose-400">({lastRoll})</span>
                ) : null}
              </button>
            </div>

            {catastrofasIdx.length === 0 ? (
              <p className="mt-3 text-base text-stone-500">
                Sin catástrofes aún.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {catastrofasIdx.map((idx, arrayIndex) => {
                  const cat = MB_CATASTROFES.find((c) => c.idx === idx);
                  if (!cat) return null;
                  const isRevealed = revealed.has(arrayIndex);
                  return (
                    <div
                      key={arrayIndex}
                      className="rounded-[14px] border border-rose-800/30 bg-rose-950/20 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 text-sm font-bold tabular-nums text-rose-500/60 mt-0.5">
                          {idx}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base text-white whitespace-pre-line leading-6">
                            {cat.visible}
                          </p>
                          {cat.oculto && isRevealed ? (
                            <p className="mt-2 text-base text-rose-200 whitespace-pre-line leading-6">
                              {cat.oculto}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-start gap-2 self-start">
                          {cat.oculto && !isRevealed ? (
                            <button
                              type="button"
                              onClick={() => handleReveal(arrayIndex)}
                              className="rounded-full border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300 transition hover:bg-rose-900/50"
                            >
                              Efecto oculto
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleRemoveCatastrofe(arrayIndex)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-600/40 bg-rose-950/50 text-rose-400 transition hover:bg-rose-800/60 hover:text-rose-200"
                            aria-label="Eliminar catástrofe"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rasgos */}
          <div>
            <h4 className="text-2xl font-bold text-white">Rasgos</h4>

            <div className="mt-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                Rasgos terribles
              </p>
              <div className="mt-2 space-y-2">
                {rasgo1 ? (
                  <div className="rounded-[12px] border border-rose-500/25 bg-rose-950/25 px-3 py-2.5">
                    <p className="text-base text-white">{rasgo1.nombre}</p>
                  </div>
                ) : null}
                {rasgo2 ? (
                  <div className="rounded-[12px] border border-rose-500/25 bg-rose-950/25 px-3 py-2.5">
                    <p className="text-base text-white">{rasgo2.nombre}</p>
                  </div>
                ) : null}
                {!rasgo1 && !rasgo2 ? (
                  <p className="text-base text-stone-500">No registrados.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {cuerpo ? (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                    Cuerpo roto
                  </p>
                  <div className="mt-2 rounded-[12px] border border-stone-600/30 bg-stone-900/40 px-3 py-2.5">
                    <p className="text-base text-white">{cuerpo.nombre}</p>
                  </div>
                </div>
              ) : null}
              {habito ? (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                    Hábito
                  </p>
                  <div className="mt-2 rounded-[12px] border border-stone-600/30 bg-stone-900/40 px-3 py-2.5">
                    <p className="text-base text-white">{habito.nombre}</p>
                  </div>
                </div>
              ) : null}
              {historia ? (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                    Historia perturbadora
                  </p>
                  <div className="mt-2 rounded-[12px] border border-stone-600/30 bg-stone-900/40 px-3 py-2.5">
                    <p className="text-base text-white">{historia.nombre}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: Rasgos de clase ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-bold text-white">
              Rasgos de clase y otros
            </h4>
            {isOwner && onOpenClassTraitsCatalog && (
              <button
                type="button"
                onClick={onOpenClassTraitsCatalog}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-lg font-bold leading-none text-amber-100 transition hover:bg-amber-300/20"
                aria-label="Añadir rasgo de clase"
              >
                +
              </button>
            )}
          </div>
          {classAbilities.length === 0 && classItems.length === 0 ? (
            <p className="mt-3 text-base text-stone-500">
              Sin rasgos de clase.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {classAbilities.map((ability) => {
                const isHerborista = ability.tags?.includes(
                  "HerboristaHabilidadIdx",
                );
                return (
                  <div
                    key={ability.id}
                    className="rounded-[14px] border border-amber-500/20 bg-amber-950/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-semibold text-amber-200">
                          {ability.nombre}
                        </p>
                        {isHerborista && (
                          <button
                            type="button"
                            onClick={() => setDecoccionModalOpen(true)}
                            className="rounded-full border border-amber-400/40 bg-amber-950/50 px-2.5 py-0.5 text-sm font-bold text-amber-300 transition hover:bg-amber-900/60"
                            title="Ver catálogo de decocciones"
                          >
                            ?
                          </button>
                        )}
                      </div>
                      {isOwner && onDeleteClassTrait && (
                        <button
                          type="button"
                          onClick={() => onDeleteClassTrait(ability.id)}
                          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-rose-500/60 transition hover:bg-rose-950/50 hover:text-rose-400"
                          title="Quitar rasgo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {ability.descripcion ? (
                      <p className="mt-1.5 text-base leading-6 text-white">
                        {ability.descripcion}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {classItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[14px] border border-amber-500/20 bg-amber-950/20 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-amber-200">
                        {item.nombre}
                      </p>
                      {item.tipoObjeto === "ARMA" && item.formula ? (
                        <span className="text-sm font-mono text-red-300/80">
                          {item.formula}
                        </span>
                      ) : null}
                      {item.tipoObjeto === "ARMA" ? (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-900/50 text-red-300 border border-red-500/30">
                          arma
                        </span>
                      ) : null}
                    </div>
                    {isOwner && onDeleteClassItem && (
                      <button
                        type="button"
                        onClick={() => onDeleteClassItem(item.id)}
                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-rose-500/60 transition hover:bg-rose-950/50 hover:text-rose-400"
                        title="Quitar rasgo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {item.descripcion ? (
                    <p className="mt-1.5 text-base leading-6 text-white">
                      {item.descripcion}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
