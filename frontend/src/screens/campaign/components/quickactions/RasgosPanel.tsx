import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";

interface RasgosPanelProps {
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
  const match = tags.match(new RegExp(`${key};(\\d+)`));
  return match ? Number.parseInt(match[1], 10) : null;
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

export default function RasgosPanel({
  detail,
  isLoadingDetail,
}: RasgosPanelProps) {
  const charTags = detail?.tags ?? "";
  const isInstance = charTags.includes("instancia");
  const hasRandomTraits = hasTag(charTags, "MBRasgosAleatorios");

  const bioJson = detail ? parseBiografia(detail.biografia) : null;
  const rasgoTables = bioJson?.rasgosAleatorios?.filter(
    (table) => !isEspecialTable(table),
  );
  const resolvedTraits = rasgoTables
    ? resolveRandomTraits(rasgoTables, charTags)
    : null;
  const resolvedRasgos = resolvedTraits?.filter(Boolean) ?? [];

  const templateRasgoText = rasgoTables?.length
    ? rasgoTables
        .map((t) => `${t.nombre}: ${t.opciones.join(" / ")}`)
        .join("\n")
    : null;

  const staticRasgo =
    detail?.habilidades.find((h) => hasTag(h.tags, "MBEnemyRasgo"))
      ?.descripcion ?? null;

  const isEmpty =
    !hasRandomTraits && !staticRasgo && resolvedRasgos.length === 0;

  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[520px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
      <p className="mb-3 text-base font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Rasgos
      </p>
      {isLoadingDetail ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          Cargando...
        </div>
      ) : isEmpty ? (
        <p className="text-xs italic text-white/40">Sin rasgos registrados.</p>
      ) : hasRandomTraits && isInstance && resolvedRasgos.length > 0 ? (
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          {resolvedRasgos.map((r, i) =>
            r ? (
              <div key={i}>
                <p className="text-sm font-bold text-stone-900">{r.nombre}</p>
                <p className="text-sm leading-snug text-stone-800">
                  {r.resultado}
                </p>
              </div>
            ) : null,
          )}
        </div>
      ) : hasRandomTraits && !isInstance && templateRasgoText ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-900">
            {templateRasgoText}
          </p>
        </div>
      ) : staticRasgo ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-900">
            {staticRasgo}
          </p>
        </div>
      ) : null}
    </div>
  );
}
