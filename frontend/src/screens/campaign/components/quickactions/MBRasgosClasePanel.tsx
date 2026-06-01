import type {
  DndCharacterDetailResponse,
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
} from "../../../personaje/utils/dndApi";

interface MBRasgosClasePanelProps {
  detail: DndCharacterDetailResponse | null;
  isLoadingDetail: boolean;
}

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

function hasKeyword(
  tags: string | null | undefined,
  keywords: string[],
): boolean {
  if (!tags) return false;
  return keywords.some((kw) => tags.includes(kw));
}

function AbilityCard({ ability }: { ability: CharacterAbilityResponse }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2.5">
      <p className="text-sm font-bold text-red-200">{ability.nombre}</p>
      {ability.descripcion ? (
        <p className="mt-1 text-sm leading-snug text-stone-200">
          {ability.descripcion}
        </p>
      ) : null}
    </div>
  );
}

function ItemCard({ item }: { item: CharacterInventoryItemResponse }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-sm font-bold text-red-200">{item.nombre}</p>
        {item.tipoObjeto === "ARMA" && item.formula ? (
          <span className="font-mono text-xs text-red-300/80">
            {item.formula}
          </span>
        ) : null}
      </div>
      {item.descripcion ? (
        <p className="mt-1 text-sm leading-snug text-stone-200">
          {item.descripcion}
        </p>
      ) : null}
    </div>
  );
}

export default function MBRasgosClasePanel({
  detail,
  isLoadingDetail,
}: MBRasgosClasePanelProps) {
  const classAbilities =
    detail?.habilidades.filter((h) =>
      hasKeyword(h.tags, CLASS_ABILITY_KEYWORDS),
    ) ?? [];
  const classItems =
    detail?.mochila.filter((item) =>
      hasKeyword(item.tags, CLASS_OBJECT_KEYWORDS),
    ) ?? [];
  const isEmpty = classAbilities.length === 0 && classItems.length === 0;

  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[520px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
      <p className="mb-3 text-base font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Rasgos de clase y otros
      </p>
      {isLoadingDetail ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          Cargando...
        </div>
      ) : isEmpty ? (
        <p className="text-xs italic text-white/40">Sin rasgos de clase.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {classAbilities.map((ability) => (
            <AbilityCard key={ability.id} ability={ability} />
          ))}
          {classItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
