import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import {
  imgSalvacionFuerza,
  imgHabilidadAcrobacias,
  imgHabilidadPercepcion,
  imgSalvacionConstitucion,
} from "../../utils/quickActionImages";

interface MBEstadisticasPanelProps {
  detail: DndCharacterDetailResponse | null;
  isLoadingDetail: boolean;
  onRollStat: (nombre: string, modifier: number) => void;
}

const MB_STATS = [
  { label: "Fuerza", modKey: "MB_ModFuerza", img: imgSalvacionFuerza },
  { label: "Agilidad", modKey: "MB_ModAgilidad", img: imgHabilidadAcrobacias },
  {
    label: "Presencia",
    modKey: "MB_ModPresencia",
    img: imgHabilidadPercepcion,
  },
  {
    label: "Resistencia",
    modKey: "MB_ModResistencia",
    img: imgSalvacionConstitucion,
  },
] as const;

export default function MBEstadisticasPanel({
  detail,
  isLoadingDetail,
  onRollStat,
}: MBEstadisticasPanelProps) {
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[340px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-3 shadow-2xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Estadísticas
      </p>
      {isLoadingDetail ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          Cargando...
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {MB_STATS.map((stat) => {
            const modifier = detail?.estadisticas[stat.modKey] ?? 0;
            const modLabel = modifier >= 0 ? `+${modifier}` : `${modifier}`;
            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => onRollStat(stat.label, modifier)}
                className="group flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/10"
                title={`${stat.label} (${modLabel})`}
              >
                <img
                  src={stat.img}
                  alt={stat.label}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
                <span className="block max-w-[64px] break-words whitespace-normal text-center text-[10px] leading-tight text-white/80 group-hover:text-amber-100">
                  {stat.label}
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
  );
}
