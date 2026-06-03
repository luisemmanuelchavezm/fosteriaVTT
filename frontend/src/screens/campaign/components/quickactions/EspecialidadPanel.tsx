import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";

interface EspecialidadPanelProps {
  detail: DndCharacterDetailResponse | null;
  isLoadingDetail: boolean;
}

interface RandomTable {
  tagKey: string;
  nombre: string;
  opciones: string[];
}

interface BiografiaJson {
  rasgosAleatorios?: RandomTable[];
}

function isEspecialTable(table: RandomTable): boolean {
  return table.tagKey.toLowerCase().includes("especial");
}

function hasTag(tags: string | null | undefined, key: string): boolean {
  return !!tags && tags.includes(key);
}

function extractTagNumber(
  tags: string | null | undefined,
  key: string,
): number | null {
  if (!tags) return null;
  const prefix = `${key};`;
  const start = tags.indexOf(prefix);
  if (start === -1) return null;
  const numStart = start + prefix.length;
  const end = tags.indexOf(",", numStart);
  const numStr = end === -1 ? tags.slice(numStart) : tags.slice(numStart, end);
  const num = Number.parseInt(numStr, 10);
  return Number.isNaN(num) ? null : num;
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

export default function EspecialidadPanel({
  detail,
  isLoadingDetail,
}: EspecialidadPanelProps) {
  const charTags = detail?.tags ?? "";
  const isInstance = charTags.includes("instancia");
  const hasRandomTraits = hasTag(charTags, "MBRasgosAleatorios");

  const bioJson = detail ? parseBiografia(detail.biografia) : null;
  const especialTables = bioJson?.rasgosAleatorios?.filter((table) =>
    isEspecialTable(table),
  );
  const resolvedTraits = especialTables
    ? resolveRandomTraits(especialTables, charTags)
    : null;
  const resolvedEspecialidad =
    resolvedTraits?.find((entry) => entry !== null) ?? null;

  const templateEspecialidadText = especialTables?.length
    ? (() => {
        const first = especialTables[0];
        return first ? `${first.nombre}: ${first.opciones.join(" / ")}` : null;
      })()
    : null;

  const staticEspecial =
    detail?.habilidades.find((h) => hasTag(h.tags, "MBEnemyEspecial"))
      ?.descripcion ?? null;

  const isEmpty = !hasRandomTraits && !staticEspecial && !resolvedEspecialidad;

  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[520px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
      <p className="mb-3 text-base font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Especialidad
      </p>
      {isLoadingDetail ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          Cargando...
        </div>
      ) : isEmpty ? (
        <p className="text-xs italic text-white/40">
          Sin especialidad registrada.
        </p>
      ) : hasRandomTraits && isInstance && resolvedEspecialidad ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          <p className="text-sm font-bold text-stone-900">
            {resolvedEspecialidad.nombre}
          </p>
          <p className="mt-1 text-sm leading-snug text-stone-800">
            {resolvedEspecialidad.resultado}
          </p>
        </div>
      ) : hasRandomTraits && !isInstance && templateEspecialidadText ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-900">
            {templateEspecialidadText}
          </p>
        </div>
      ) : staticEspecial ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-900">
            {staticEspecial}
          </p>
        </div>
      ) : null}
    </div>
  );
}
