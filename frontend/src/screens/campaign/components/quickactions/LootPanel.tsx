import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";

interface LootPanelProps {
  detail: DndCharacterDetailResponse | null;
  isLoadingDetail: boolean;
}

function hasTag(tags: string | null | undefined, key: string): boolean {
  return !!tags && tags.includes(key);
}

export default function LootPanel({ detail, isLoadingDetail }: LootPanelProps) {
  const loot =
    detail?.habilidades.find((h) => hasTag(h.tags, "MBEnemyLoot"))
      ?.descripcion ?? null;

  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[520px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
      <p className="mb-3 text-base font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Botín
      </p>
      {isLoadingDetail ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          Cargando...
        </div>
      ) : loot ? (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-100 px-3 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-900">
            {loot}
          </p>
        </div>
      ) : (
        <p className="text-xs italic text-white/40">Sin botín registrado.</p>
      )}
    </div>
  );
}
