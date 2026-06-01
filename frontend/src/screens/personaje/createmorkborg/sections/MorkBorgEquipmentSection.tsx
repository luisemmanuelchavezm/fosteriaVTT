import { useEffect, useRef, useState } from "react";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import {
  MB_WEAPONS,
  MB_SIN_CLASE_CONTAINER_TABLE,
  MB_SIN_CLASE_ITEM_TABLE_1,
  MB_SIN_CLASE_ITEM_TABLE_2,
  getMbArmaExpression,
  getMbArmaduraExpression,
  getMbComidaExpression,
  getMbPlataExpression,
  getMbTableEntry,
  getMbWeaponByIdx,
  getMbArmorByRoll,
  getMbScrollByIdx,
  type MbTableEntry,
  type MbWeapon,
  type MbArmor,
  type MorkBorgClass,
} from "../utils/morkBorgUtils";

// ── IDs de zona ───────────────────────────────────────────────────────────────
const Z_PLATA = "plata";
const Z_COMIDA = "comida";
const Z_ARMA = "arma";
const Z_ARMADURA = "armadura";
const Z_CONTENEDOR = "contenedor";
const Z_ITEM1 = "item1";
const Z_ITEM2 = "item2";
const Z_IMPURO_IDX = "impuro-idx";
const Z_VENENO_CANT = "veneno-cant";
const Z_SAGRADO_IDX = "sagrado-idx";
const Z_ELIXIR_CANT = "elixir-cant";
const Z_MONOS_CANT = "monos-cant";
const Z_PER_TIPO = "per-tipo";
const Z_PER_IDX = "per-idx";
const Z_ESOT_TIPO = "esot-tipo";
const Z_ESOT_IDX = "esot-idx";

// ── Tablas de referencia para los modales ? ───────────────────────────────────
const D6_CONTAINER_INFO = [
  { label: "1–2", description: "Nada" },
  { label: "3", description: "Mochila para 7 artículos de tamaño normal" },
  { label: "4", description: "Saco para 10 prendas de tamaño normal" },
  {
    label: "5",
    description: "Cofre pequeño o un artículo de arriba a tu elección",
  },
  {
    label: "6",
    description: "Burro, no está mal. O uno de los anteriores a tu elección",
  },
];

const D12_TABLE1_INFO = [
  { label: "1", description: "Cuerda de 30 pies" },
  { label: "2", description: "Presencia + 4 antorchas" },
  { label: "3", description: "Farol con aceite para Presencia + 6 horas" },
  { label: "4", description: "Tira de magnesio" },
  { label: "5", description: "Pergamino impuro al azar" },
  { label: "6", description: "Aguja afilada" },
  {
    label: "7",
    description:
      "Botiquín — Presencia + 4 usos (detiene hemorragia/infección, cura d6 PV)",
  },
  { label: "8", description: "Lima de metal y ganzúas" },
  {
    label: "9",
    description: "Trampa para osos (Presencia DR14 para detectar, daño d8)",
  },
  { label: "10", description: "Bomba — botella sellada, daño d10" },
  {
    label: "11",
    description:
      "Botella de veneno rojo — d4 dosis (Resistencia CD12 o daño d10)",
  },
  { label: "12", description: "Crucifijo de plata" },
];

const D12_TABLE2_INFO = [
  {
    label: "1",
    description:
      "Elixir de vida con d4 dosis (cura d6 PV y elimina la infección)",
  },
  { label: "2", description: "Pergamino sagrado al azar" },
  {
    label: "3",
    description:
      "Perro pequeño pero feroz (d6+2 PV, mordisco d4, solo obedece a su dueño)",
  },
  {
    label: "4",
    description:
      "d4 monos que te ignoran pero te quieren (d4+2 PV, puñetazo/mordisco d4)",
  },
  { label: "5", description: "Perfume exquisito por valor de 25s" },
  {
    label: "6",
    description:
      "Caja de herramientas — 10 clavos, tenazas, martillo, sierra pequeña y taladro",
  },
  { label: "7", description: "Cadena pesada de 15 pies" },
  { label: "8", description: "Gancho de escalada" },
  {
    label: "9",
    description: "Escudo (-1 PV de daño o se rompe para ignorar un ataque)",
  },
  { label: "10", description: "Palanca (d4 daño)" },
  {
    label: "11",
    description:
      "Manteca de cerdo (puede funcionar como 5 comidas en caso de necesidad)",
  },
  { label: "12", description: "Tienda de campaña" },
];

// ── Helpers visuales ──────────────────────────────────────────────────────────
function SubRollButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
    >
      🎲 {label}
    </button>
  );
}

function presenciaQty(modifier: number | null, base: number): string {
  if (modifier === null) return `? + ${base}`;
  return String(Math.max(1, modifier + base));
}

function PresenciaNota({ modifier }: { modifier: number | null }) {
  if (modifier !== null) return null;
  return (
    <p className="mt-1 text-xs italic text-amber-400/80">
      ↑ Tira Presencia en la fase de Estadísticas
    </p>
  );
}

function ResultChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-amber-300/60 bg-stone-800 px-2.5 py-0.5 text-xs font-bold text-amber-200">
      {children}
    </span>
  );
}

// ── Caja de tabla con modal ? ─────────────────────────────────────────────────
interface TableInfo {
  label: string;
  description: string;
}

interface TableBoxProps {
  label: string;
  dice: string;
  hasResult: boolean;
  isRollingThis: boolean;
  isRollingAny: boolean;
  onRoll: () => void;
  children: React.ReactNode;
  tableInfo?: TableInfo[];
}

function TableBox({
  label,
  dice,
  hasResult,
  isRollingThis,
  isRollingAny,
  onRoll,
  children,
  tableInfo,
}: TableBoxProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${hasResult ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      {/* Cabecera con ? opcional */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
            {label}
          </p>
          <p className="text-xs font-semibold text-stone-200">{dice}</p>
        </div>
        {tableInfo ? (
          <button
            type="button"
            onClick={() => setShowModal((v) => !v)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
          >
            ?
          </button>
        ) : null}
      </div>

      {/* Modal */}
      {showModal && tableInfo ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute right-0 top-14 z-20 w-72 rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300/80">
              {label} · {dice}
            </p>
            <div className="flex flex-col gap-1.5">
              {tableInfo.map((e) => (
                <div key={e.label} className="flex gap-2 text-xs">
                  <span className="w-8 shrink-0 font-bold text-white">
                    {e.label}
                  </span>
                  <span className="text-white">{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Contenido */}
      <div className="min-h-[3rem]">
        {isRollingThis ? (
          <p className="text-2xl font-bold text-stone-500 animate-pulse">…</p>
        ) : hasResult ? (
          <div className="text-white">{children}</div>
        ) : (
          <span className="text-3xl font-bold text-stone-600">—</span>
        )}
      </div>

      <button
        type="button"
        onClick={onRoll}
        disabled={isRollingAny}
        className="w-full rounded-full border border-stone-600 bg-stone-900 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
      >
        {isRollingThis
          ? "Tirando…"
          : hasResult
            ? "🎲 Volver a tirar"
            : "🎲 Tirar"}
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
import type { MbEquipmentSnapshot } from "../hooks/useCreateMorkBorgCharacter";

interface MorkBorgEquipmentSectionProps {
  selectedClass: MorkBorgClass | null;
  presenciaModifier: number | null;
  allStatsRolled: boolean;
  hasError?: boolean;
  /** Llamado cuando cambia si el equipo obligatorio está completo. Incluye snapshot cuando complete=true. */
  onEquipmentComplete?: (
    complete: boolean,
    snapshot?: MbEquipmentSnapshot,
  ) => void;
}

export default function MorkBorgEquipmentSection({
  selectedClass,
  presenciaModifier,
  allStatsRolled,
  hasError = false,
  onEquipmentComplete,
}: MorkBorgEquipmentSectionProps) {
  const classId = selectedClass?.id;

  // Condiciones de bloqueo
  const blockedByClass = !selectedClass;
  const blockedByStats = !!selectedClass && !allStatsRolled;
  const disabled = blockedByClass || blockedByStats;

  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();
  const activeZoneRef = useRef<string | null>(null);
  const rollingD2ArmaduraRef = useRef(false);

  // ── Estados ────────────────────────────────────────────────────────────────
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [plataValue, setPlataValue] = useState<number | null>(null);
  const [comidaValue, setComidaValue] = useState<number | null>(null);
  const [armaResult, setArmaResult] = useState<MbWeapon | null>(null);
  const [armaduraResult, setArmaduraResult] = useState<MbArmor | null>(null);
  const [armaduraRolled, setArmaduraRolled] = useState(false);
  const [contenedor, setContenedor] = useState<MbTableEntry | null>(null);
  const [contenedorChoice, setContenedorChoice] = useState<string>("");
  const [item1, setItem1] = useState<MbTableEntry | null>(null);
  const [impuroIdx, setImpuroIdx] = useState<number | null>(null);
  const [venenoCant, setVenenoCant] = useState<number | null>(null);
  const [item2, setItem2] = useState<MbTableEntry | null>(null);
  const [sagradoIdx, setSagradoIdx] = useState<number | null>(null);
  const [elixirCant, setElixirCant] = useState<number | null>(null);
  const [monosCant, setMonosCant] = useState<number | null>(null);
  const [wantsScroll, setWantsScroll] = useState(false);
  const [perScrollTipo, setPerScrollTipo] = useState<number | null>(null);
  const [perScrollIdx, setPerScrollIdx] = useState<number | null>(null);
  const [showArmaModal, setShowArmaModal] = useState(false);
  const [showArmModal, setShowArmModal] = useState(false);
  const [armaduraIsReroll, setArmaduraIsReroll] = useState(false);
  const [esotScrollTipo, setEsotScrollTipo] = useState<number | null>(null);
  const [esotScrollIdx, setEsotScrollIdx] = useState<number | null>(null);

  // ── Reset al cambiar de clase ──────────────────────────────────────────────
  useEffect(() => {
    setActiveZone(null);
    setPlataValue(null);
    setComidaValue(null);
    setArmaResult(null);
    setArmaduraResult(null);
    setArmaduraRolled(false);
    setContenedor(null);
    setContenedorChoice("");
    setItem1(null);
    setImpuroIdx(null);
    setVenenoCant(null);
    setItem2(null);
    setSagradoIdx(null);
    setElixirCant(null);
    setMonosCant(null);
    setWantsScroll(false);
    setPerScrollTipo(null);
    setPerScrollIdx(null);
    setArmaduraIsReroll(false);
    setEsotScrollTipo(null);
    setEsotScrollIdx(null);
    activeZoneRef.current = null;
  }, [selectedClass?.id]);

  // ── Notificar completitud del equipo ───────────────────────────────────────
  useEffect(() => {
    if (!classId) {
      onEquipmentComplete?.(false);
      return;
    }

    const base =
      armaResult !== null &&
      armaduraRolled &&
      plataValue !== null &&
      comidaValue !== null;

    const basicEquip = contenedor !== null && item1 !== null && item2 !== null;

    // Pergamino opcional: si está activado debe estar completamente tirado
    const scrollOk =
      !wantsScroll || (perScrollTipo !== null && perScrollIdx !== null);

    // Esotérico: necesita el pergamino inicial obligatorio
    const esotOk = classId !== "ermitano-esoterico" || esotScrollIdx !== null;

    const complete = base && basicEquip && scrollOk && esotOk;
    if (complete) {
      onEquipmentComplete?.(true, {
        plata: plataValue!,
        comida: comidaValue!,
        armaIdx: armaResult!.idx,
        armaduraNivel: armaduraResult?.nivel ?? 0,
        contenedorResult: contenedor?.result ?? null,
        item1Result: item1?.result ?? null,
        item2Result: item2?.result ?? null,
        wantsScroll,
        perScrollTipo,
        perScrollIdx,
        esotScrollTipo,
        esotScrollIdx,
      });
    } else {
      onEquipmentComplete?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    armaResult,
    armaduraRolled,
    plataValue,
    comidaValue,
    contenedor,
    item1,
    item2,
    wantsScroll,
    perScrollTipo,
    perScrollIdx,
    esotScrollIdx,
    classId,
  ]);

  // ── Capturar resultado ─────────────────────────────────────────────────────
  useEffect(() => {
    const zone = activeZoneRef.current;
    if (!summary || isRolling || !zone) return;

    switch (zone) {
      case Z_PLATA:
        setPlataValue(summary.total * 10);
        break;
      case Z_COMIDA:
        setComidaValue(summary.total);
        break;
      case Z_ARMA:
        setArmaResult(getMbWeaponByIdx(summary.total));
        break;

      case Z_ARMADURA: {
        let roll = summary.total;
        if (rollingD2ArmaduraRef.current) roll = roll > 2 ? roll - 2 : roll;
        setArmaduraResult(getMbArmorByRoll(roll));
        setArmaduraRolled(true);
        break;
      }

      case Z_CONTENEDOR:
        setContenedor(
          getMbTableEntry(MB_SIN_CLASE_CONTAINER_TABLE, summary.total),
        );
        setContenedorChoice("");
        break;
      case Z_ITEM1:
        setItem1(getMbTableEntry(MB_SIN_CLASE_ITEM_TABLE_1, summary.total));
        setImpuroIdx(null);
        setVenenoCant(null);
        break;
      case Z_ITEM2:
        setItem2(getMbTableEntry(MB_SIN_CLASE_ITEM_TABLE_2, summary.total));
        setSagradoIdx(null);
        setElixirCant(null);
        setMonosCant(null);
        break;

      case Z_IMPURO_IDX:
        setImpuroIdx(summary.total);
        break;
      case Z_VENENO_CANT:
        setVenenoCant(summary.total);
        break;
      case Z_SAGRADO_IDX:
        setSagradoIdx(summary.total);
        break;
      case Z_ELIXIR_CANT:
        setElixirCant(summary.total);
        break;
      case Z_MONOS_CANT:
        setMonosCant(summary.total);
        break;

      case Z_PER_TIPO: {
        const raw = summary.total;
        setPerScrollTipo(raw > 2 ? raw - 2 : raw); // d4 → d2
        setPerScrollIdx(null);
        break;
      }
      case Z_PER_IDX:
        setPerScrollIdx(summary.total);
        break;

      case Z_ESOT_TIPO: {
        const raw = summary.total;
        setEsotScrollTipo(raw > 2 ? raw - 2 : raw); // d4 → d2
        setEsotScrollIdx(null);
        break;
      }
      case Z_ESOT_IDX:
        setEsotScrollIdx(summary.total);
        break;
    }

    activeZoneRef.current = null;
    setActiveZone(null);
  }, [summary, isRolling]);

  // ── Helper de tirada ───────────────────────────────────────────────────────
  function roll(zone: string, expression: string, title: string) {
    if (isRolling || disabled) return;
    activeZoneRef.current = zone;
    setActiveZone(zone);
    rollExpression(title, expression);
  }

  const isZ = (z: string) => activeZone === z && isRolling;

  const plataExpr = getMbPlataExpression(classId);
  const comidaExpr = getMbComidaExpression(classId);
  const armaExpr = getMbArmaExpression(classId);
  const armaduraExpr = getMbArmaduraExpression(classId);
  const effectiveArmaduraExpr = wantsScroll ? "1d2" : armaduraExpr;

  // ── Render: d6 contenedor ─────────────────────────────────────────────────
  function renderContenedor() {
    if (!contenedor) return null;
    if (contenedor.nombre === null)
      return <p className="italic text-stone-500">Nada</p>;
    const choices =
      contenedor.result === 5
        ? ["Mochila", "Saco"]
        : contenedor.result === 6
          ? ["Mochila", "Saco", "Cofre pequeño"]
          : null;
    return (
      <div>
        <p className="font-bold text-amber-200">{contenedor.nombre}</p>
        {contenedor.descripcion ? (
          <p className="text-xs text-stone-200">{contenedor.descripcion}</p>
        ) : null}
        {choices ? (
          <div className="mt-2">
            <p className="text-xs font-semibold text-amber-400">o elige:</p>
            <select
              value={contenedorChoice}
              onChange={(e) => setContenedorChoice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">— elegir —</option>
              {choices.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {contenedorChoice ? (
              <p className="mt-1 text-xs font-bold text-white">
                Elegido: {contenedorChoice}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  // ── Render: d12 tabla 1 ───────────────────────────────────────────────────
  function renderItem1() {
    if (!item1 || item1.nombre === null) return null;
    switch (item1.result) {
      case 1:
        return (
          <p className="font-bold text-amber-200">
            Cuerda{" "}
            <span className="font-normal text-xs text-stone-200">
              (30 pies)
            </span>
          </p>
        );
      case 4:
        return <p className="font-bold text-amber-200">Tira de magnesio</p>;
      case 6:
        return <p className="font-bold text-amber-200">Aguja afilada</p>;
      case 8:
        return (
          <p className="font-bold text-amber-200">Lima de metal y ganzúas</p>
        );
      case 9:
        return (
          <div>
            <p className="font-bold text-amber-200">Trampa para osos</p>
            <p className="text-xs text-stone-200">
              Presencia DR14 para detectar, daño d8
            </p>
          </div>
        );
      case 10:
        return (
          <div>
            <p className="font-bold text-amber-200">Bomba</p>
            <p className="text-xs text-stone-200">botella sellada, daño d10</p>
          </div>
        );
      case 12:
        return <p className="font-bold text-amber-200">Crucifijo de plata</p>;
      case 2:
        return (
          <div>
            <p className="font-bold text-amber-200">
              <ResultChip>{presenciaQty(presenciaModifier, 4)}</ResultChip>{" "}
              Antorchas
            </p>
            <PresenciaNota modifier={presenciaModifier} />
          </div>
        );
      case 3:
        return (
          <div>
            <p className="font-bold text-amber-200">
              <ResultChip>{presenciaQty(presenciaModifier, 6)}</ResultChip>{" "}
              Faroles
            </p>
            <PresenciaNota modifier={presenciaModifier} />
          </div>
        );
      case 7:
        return (
          <div>
            <p className="font-bold text-amber-200">
              <ResultChip>{presenciaQty(presenciaModifier, 4)}</ResultChip>{" "}
              Botiquines
            </p>
            <p className="text-xs text-stone-200">
              Detiene hemorragia / infección, cura d6 PV
            </p>
            <PresenciaNota modifier={presenciaModifier} />
          </div>
        );
      case 5: {
        const scroll =
          impuroIdx !== null ? getMbScrollByIdx("impuro", impuroIdx) : null;
        return (
          <div>
            <p className="font-bold text-amber-200">Pergamino impuro al azar</p>
            {scroll ? (
              <div className="mt-1 rounded-xl border border-red-400/40 bg-stone-900/80 px-3 py-2">
                <p className="text-sm font-bold text-red-400">
                  {scroll.nombre}
                </p>
                <p className="text-xs text-stone-200 mt-0.5">
                  {scroll.descripcion}
                </p>
              </div>
            ) : (
              <SubRollButton
                label="Tirar 1d10 (pergamino)"
                onClick={() =>
                  roll(Z_IMPURO_IDX, "1d10", "Pergamino impuro al azar")
                }
                disabled={isRolling}
              />
            )}
          </div>
        );
      }
      case 11:
        return (
          <div>
            <p className="font-bold text-amber-200">Botella de veneno rojo</p>
            <p className="text-xs text-stone-200">
              Resistencia CD12 o daño d10
            </p>
            {venenoCant !== null ? (
              <p className="mt-1">
                <ResultChip>{venenoCant}</ResultChip>
                <span className="ml-1 text-xs text-stone-200">botellas</span>
              </p>
            ) : (
              <SubRollButton
                label="Tirar d4 (botellas)"
                onClick={() =>
                  roll(Z_VENENO_CANT, "1d4", "Número de botellas de veneno")
                }
                disabled={isRolling || isZ(Z_VENENO_CANT)}
              />
            )}
          </div>
        );
      default:
        return <p className="font-bold text-amber-200">{item1.nombre}</p>;
    }
  }

  // ── Render: d12 tabla 2 ───────────────────────────────────────────────────
  function renderItem2() {
    if (!item2 || item2.nombre === null) return null;
    switch (item2.result) {
      case 3:
        return (
          <div>
            <p className="font-bold text-amber-200">Perro pequeño pero feroz</p>
            <p className="text-xs text-stone-200">
              d6+2 PV, mordisco d4. Solo obedece a su dueño
            </p>
          </div>
        );
      case 5:
        return (
          <div>
            <p className="font-bold text-amber-200">Perfume exquisito</p>
            <p className="text-xs text-stone-200">por valor de 25s</p>
          </div>
        );
      case 6:
        return (
          <div>
            <p className="font-bold text-amber-200">Caja de herramientas</p>
            <p className="text-xs text-stone-200">
              10 clavos, tenazas, martillo, sierra pequeña y taladro
            </p>
          </div>
        );
      case 7:
        return (
          <div>
            <p className="font-bold text-amber-200">Cadena pesada</p>
            <p className="text-xs text-stone-200">15 pies</p>
          </div>
        );
      case 8:
        return <p className="font-bold text-amber-200">Gancho de escalada</p>;
      case 9:
        return (
          <div>
            <p className="font-bold text-amber-200">Escudo</p>
            <p className="text-xs text-stone-200">
              -1 PV de daño, o romper el escudo para ignorar un ataque
            </p>
          </div>
        );
      case 10:
        return (
          <div>
            <p className="font-bold text-amber-200">Palanca</p>
            <p className="text-xs text-stone-200">d4 daño</p>
          </div>
        );
      case 11:
        return (
          <div>
            <p className="font-bold text-amber-200">Manteca de cerdo</p>
            <p className="text-xs text-stone-200">
              puede funcionar como 5 comidas
            </p>
          </div>
        );
      case 12:
        return <p className="font-bold text-amber-200">Tienda de campaña</p>;
      case 1:
        return (
          <div>
            <p className="font-bold text-amber-200">Elixir de vida</p>
            <p className="text-xs text-stone-200">
              d4 dosis. Cura d6 PV y elimina la infección
            </p>
            {elixirCant !== null ? (
              <p className="mt-1">
                <ResultChip>{elixirCant}</ResultChip>
                <span className="ml-1 text-xs text-stone-200">elixires</span>
              </p>
            ) : (
              <SubRollButton
                label="Tirar d4 (elixires)"
                onClick={() =>
                  roll(Z_ELIXIR_CANT, "1d4", "Número de elixires de vida")
                }
                disabled={isRolling || isZ(Z_ELIXIR_CANT)}
              />
            )}
          </div>
        );
      case 2: {
        const scroll =
          sagradoIdx !== null ? getMbScrollByIdx("sagrado", sagradoIdx) : null;
        return (
          <div>
            <p className="font-bold text-amber-200">
              Pergamino sagrado al azar
            </p>
            {scroll ? (
              <div className="mt-1 rounded-xl border border-amber-300/60 bg-stone-900/80 px-3 py-2">
                <p className="text-sm font-bold text-amber-300">
                  {scroll.nombre}
                </p>
                <p className="text-xs text-stone-200 mt-0.5">
                  {scroll.descripcion}
                </p>
              </div>
            ) : (
              <SubRollButton
                label="Tirar 1d10 (pergamino)"
                onClick={() =>
                  roll(Z_SAGRADO_IDX, "1d10", "Pergamino sagrado al azar")
                }
                disabled={isRolling || isZ(Z_SAGRADO_IDX)}
              />
            )}
          </div>
        );
      }
      case 4:
        return (
          <div>
            <p className="font-bold text-amber-200">Monos</p>
            <p className="text-xs text-stone-200">
              d4+2 PV, puñetazo/mordisco d4. Te ignoran pero te quieren
            </p>
            {monosCant !== null ? (
              <p className="mt-1">
                <ResultChip>{monosCant}</ResultChip>
                <span className="ml-1 text-xs text-stone-200">monos</span>
              </p>
            ) : (
              <SubRollButton
                label="Tirar d4 (monos)"
                onClick={() => roll(Z_MONOS_CANT, "1d4", "Número de monos")}
                disabled={isRolling || isZ(Z_MONOS_CANT)}
              />
            )}
          </div>
        );
      default:
        return <p className="font-bold text-amber-200">{item2.nombre}</p>;
    }
  }

  // ── JSX ────────────────────────────────────────────────────────────────────
  // Suppress unused state warning — showArmaModal is kept for future use
  void showArmaModal;

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={null}
      />

      <section
        data-validation-error={hasError && !disabled ? "true" : undefined}
        className={`relative mt-6 rounded-[28px] border p-6 transition-all duration-300 ${
          disabled
            ? "border-stone-600/30 bg-stone-800/40"
            : hasError
              ? "border-rose-400/50 bg-rose-950/15"
              : "border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]"
        }`}
      >
        {/* Overlay de bloqueo */}
        {blockedByClass ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px]">
            <p className="animate-pulse rounded-full border border-red-500/60 bg-red-950/80 px-6 py-3 text-sm font-bold text-red-300 shadow-[0_0_24px_rgba(220,38,38,0.35)]">
              Debes escoger una clase antes de asignar equipo
            </p>
          </div>
        ) : blockedByStats ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px]">
            <p className="animate-pulse rounded-full border border-amber-500/60 bg-amber-950/80 px-6 py-3 text-sm font-bold text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
              Debes tirar todas las estadísticas antes de asignar equipo
            </p>
          </div>
        ) : null}

        <div
          className={
            disabled ? "pointer-events-none select-none opacity-30" : ""
          }
        >
          <h2 className="text-2xl font-bold text-amber-200">Equipo</h2>
          {selectedClass ? (
            <p className="mt-1 text-sm text-stone-200">
              El equipo inicial depende de tu clase:{" "}
              <span className="font-semibold text-white">
                {selectedClass.nombre}
              </span>
            </p>
          ) : null}

          {/* ── Row 1: Plata + Comida (izq) | Arma (der) ── */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* Izq: Plata + Comida apiladas */}
            <div className="flex flex-col gap-2">
              {/* Plata */}
              <div
                className={`flex flex-1 items-center gap-3 rounded-2xl border px-5 py-4 ${plataValue !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
              >
                <p className="shrink-0 text-sm font-bold uppercase tracking-wider text-amber-300/80">
                  Plata
                </p>
                <p className="text-xs font-semibold text-stone-200">
                  {plataExpr} × 10
                </p>
                <div className="ml-auto flex items-center gap-3">
                  {isZ(Z_PLATA) ? (
                    <span className="text-lg font-bold text-stone-500 animate-pulse">
                      …
                    </span>
                  ) : plataValue !== null ? (
                    <span className="text-lg font-bold text-white">
                      {plataValue}
                      <span className="ml-1 text-xs font-semibold text-stone-200">
                        s
                      </span>
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-stone-600">—</span>
                  )}
                  <button
                    type="button"
                    onClick={() => roll(Z_PLATA, plataExpr, "Tirada de Plata")}
                    disabled={isRolling}
                    className="shrink-0 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                  >
                    {isZ(Z_PLATA)
                      ? "…"
                      : plataValue !== null
                        ? "🎲"
                        : "🎲 Tirar"}
                  </button>
                </div>
              </div>

              {/* Comida */}
              <div
                className={`flex flex-1 items-center gap-3 rounded-2xl border px-5 py-4 ${comidaValue !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
              >
                <p className="shrink-0 text-sm font-bold uppercase tracking-wider text-amber-300/80">
                  Comida
                </p>
                <p className="text-xs font-semibold text-stone-200">
                  {comidaExpr}
                </p>
                <div className="ml-auto flex items-center gap-3">
                  {isZ(Z_COMIDA) ? (
                    <span className="text-lg font-bold text-stone-500 animate-pulse">
                      …
                    </span>
                  ) : comidaValue !== null ? (
                    <span className="text-lg font-bold text-white">
                      {comidaValue}
                      <span className="ml-1 text-xs font-semibold text-stone-200">
                        {comidaValue === 1 ? "ración" : "raciones"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-stone-600">—</span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      roll(Z_COMIDA, comidaExpr, "Tirada de Comida")
                    }
                    disabled={isRolling}
                    className="shrink-0 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                  >
                    {isZ(Z_COMIDA)
                      ? "…"
                      : comidaValue !== null
                        ? "🎲"
                        : "🎲 Tirar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Der: Arma (ocupa la misma altura que ambas filas) */}
            <div
              className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${armaResult ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
            >
              {/* Cabecera: "Arma" + dado inline + ? */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
                    Arma
                  </p>
                  <span className="rounded-full border border-stone-500/40 bg-stone-800/60 px-2 py-0.5 text-xs font-bold text-white">
                    {armaExpr}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArmModal((v) => !v)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
                  title="Ver armas posibles"
                >
                  ?
                </button>
              </div>

              {/* Modal armas */}
              {showArmModal ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowArmModal(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-64 rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/80">
                      Armas posibles · {armaExpr}
                    </p>
                    <div className="flex flex-col gap-1">
                      {MB_WEAPONS.filter(
                        (w) =>
                          w.idx <= (parseInt(armaExpr.replace("1d", "")) || 10),
                      ).map((w) => (
                        <div key={w.idx} className="flex gap-2 text-xs">
                          <span className="w-5 shrink-0 font-bold text-white">
                            {w.idx}
                          </span>
                          <span className="text-white">{w.nombre}</span>
                          <span className="ml-auto text-stone-500">
                            {w.formula}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {/* Resultado */}
              <div className="flex flex-1 min-h-[2.5rem] items-center">
                {isZ(Z_ARMA) ? (
                  <span className="text-2xl font-bold text-stone-500 animate-pulse">
                    …
                  </span>
                ) : armaResult ? (
                  <div>
                    <p className="text-base font-bold text-amber-200">
                      {armaResult.nombre}
                    </p>
                    <p className="text-xs text-stone-200">
                      {armaResult.formula}
                    </p>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-stone-600">—</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => roll(Z_ARMA, armaExpr, "Tirada de Arma")}
                disabled={isRolling}
                className="w-full rounded-full border border-stone-600 bg-stone-900 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {isZ(Z_ARMA)
                  ? "Tirando…"
                  : armaResult
                    ? "🎲 Volver a tirar"
                    : "🎲 Tirar"}
              </button>
            </div>
          </div>

          {/* ── Row 2: Pergamino | Armadura ── */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* Caja: Pergamino */}
            <div
              className={`flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${wantsScroll ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
                Pergamino
              </p>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={wantsScroll}
                  onChange={(e) => {
                    setWantsScroll(e.target.checked);
                    setArmaduraResult(null);
                    setArmaduraRolled(false);
                    setArmaduraIsReroll(false);
                    if (!e.target.checked) {
                      setPerScrollTipo(null);
                      setPerScrollIdx(null);
                    }
                  }}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span className="text-xs font-semibold text-white">
                  Empezar con pergamino
                </span>
              </label>

              {wantsScroll ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs italic text-amber-400/80">
                    tu dado de armadura se reducirá a 1d2
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        roll(Z_PER_TIPO, "1d4", "Tipo de pergamino")
                      }
                      disabled={isRolling}
                      className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                    >
                      {isZ(Z_PER_TIPO)
                        ? "Tirando…"
                        : perScrollTipo !== null
                          ? "🎲 Volver a tirar"
                          : "🎲 1d2 (tipo)"}
                    </button>

                    {perScrollTipo !== null && !isZ(Z_PER_TIPO) ? (
                      <>
                        <ResultChip>
                          {perScrollTipo === 1
                            ? "🕊 Pergamino sagrado"
                            : "💀 Pergamino impuro"}
                        </ResultChip>
                        <button
                          type="button"
                          onClick={() =>
                            roll(Z_PER_IDX, "1d10", "Pergamino al azar")
                          }
                          disabled={isRolling}
                          className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                        >
                          {isZ(Z_PER_IDX)
                            ? "Tirando…"
                            : perScrollIdx !== null
                              ? "🎲 Tirar de nuevo"
                              : "🎲 Tirar"}
                        </button>
                      </>
                    ) : null}
                  </div>

                  {perScrollIdx !== null && !isZ(Z_PER_IDX)
                    ? (() => {
                        const scroll = getMbScrollByIdx(
                          perScrollTipo === 1 ? "sagrado" : "impuro",
                          perScrollIdx,
                        );
                        return scroll ? (
                          <div
                            className={`rounded-xl border px-3 py-2 ${perScrollTipo === 1 ? "border-amber-300/60 bg-stone-900/80" : "border-red-400/40 bg-stone-900/80"}`}
                          >
                            <p
                              className={`text-sm font-bold ${perScrollTipo === 1 ? "text-amber-300" : "text-red-400"}`}
                            >
                              {scroll.nombre}
                            </p>
                            <p className="mt-0.5 text-xs text-stone-200">
                              {scroll.descripcion}
                            </p>
                          </div>
                        ) : null;
                      })()
                    : null}
                </div>
              ) : null}
            </div>

            {/* Caja: Armadura */}
            <div
              className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${armaduraRolled ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
                    Armadura
                  </p>
                  <span className="rounded-full border border-stone-500/40 bg-stone-800/60 px-2 py-0.5 text-xs font-bold text-white">
                    {effectiveArmaduraExpr}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArmaModal((v) => !v)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
                  title="Ver armaduras posibles"
                >
                  ?
                </button>
              </div>

              {/* Modal armaduras */}
              {showArmaModal ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowArmaModal(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/80">
                      Armaduras posibles · {effectiveArmaduraExpr}
                    </p>
                    <div className="flex flex-col gap-1">
                      {Array.from(
                        {
                          length:
                            parseInt(effectiveArmaduraExpr.replace("1d", "")) ||
                            4,
                        },
                        (_, i) => i + 1,
                      ).map((n) => {
                        const a = getMbArmorByRoll(n);
                        return (
                          <div key={n} className="flex gap-2 text-xs">
                            <span className="w-5 shrink-0 font-bold text-white">
                              {n}
                            </span>
                            <span className="text-white">
                              {a ? a.nombre : "Nada"}
                            </span>
                            {a ? (
                              <span className="ml-auto text-stone-500">
                                {a.formula}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}

              {/* Resultado */}
              <div className="flex flex-1 min-h-[2.5rem] items-center">
                {isZ(Z_ARMADURA) ? (
                  <span className="text-xl font-bold text-stone-500 animate-pulse">
                    …
                  </span>
                ) : armaduraRolled ? (
                  armaduraResult ? (
                    <div>
                      <p className="text-sm font-bold text-amber-200">
                        {armaduraResult.nombre}
                      </p>
                      <p className="text-xs text-stone-200">
                        {armaduraResult.formula}
                      </p>
                      {armaduraResult.descripcion ? (
                        <p className="text-xs text-stone-200 mt-0.5">
                          {armaduraResult.descripcion}
                        </p>
                      ) : null}
                      {classId === "realeza-desgracia" &&
                      armaduraResult.nivel === 3 &&
                      !armaduraIsReroll ? (
                        <p className="mt-1.5 rounded-lg border border-amber-400/50 bg-amber-950/40 px-2 py-1 text-xs font-bold text-amber-300">
                          ⚠ Deberías tirar 1 vez más
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-base font-bold text-white">Nada</p>
                  )
                ) : (
                  <span className="text-2xl font-bold text-stone-600">—</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (armaduraRolled) setArmaduraIsReroll(true);
                  const isD2 = effectiveArmaduraExpr === "1d2";
                  rollingD2ArmaduraRef.current = isD2;
                  roll(
                    Z_ARMADURA,
                    isD2 ? "1d4" : effectiveArmaduraExpr,
                    "Tirada de Armadura",
                  );
                }}
                disabled={isRolling}
                className="w-full rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {isZ(Z_ARMADURA)
                  ? "Tirando…"
                  : armaduraRolled
                    ? "🎲 Volver a tirar"
                    : "🎲 Tirar"}
              </button>
            </div>
          </div>

          {/* ── Pergamino inicial (solo Ermitaño Esotérico) ── */}
          {classId === "ermitano-esoterico" ? (
            <div className="mt-3">
              <div className="mb-3 mt-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-stone-700" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">
                  Pergamino inicial
                </p>
                <div className="h-px flex-1 bg-stone-700" />
              </div>

              <div
                className={`flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${esotScrollIdx !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
              >
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
                    Pergamino de inicio
                  </p>
                  <p className="mt-1 text-xs text-stone-200">
                    El ermitaño esotérico siempre comienza con un pergamino al
                    azar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      roll(Z_ESOT_TIPO, "1d4", "Tipo de pergamino inicial")
                    }
                    disabled={isRolling}
                    className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                  >
                    {isZ(Z_ESOT_TIPO)
                      ? "Tirando…"
                      : esotScrollTipo !== null
                        ? "🎲 Volver a tirar"
                        : "🎲 1d2 (tipo)"}
                  </button>

                  {esotScrollTipo !== null && !isZ(Z_ESOT_TIPO) ? (
                    <>
                      <ResultChip>
                        {esotScrollTipo === 1
                          ? "🕊 Pergamino sagrado"
                          : "💀 Pergamino impuro"}
                      </ResultChip>
                      <button
                        type="button"
                        onClick={() =>
                          roll(Z_ESOT_IDX, "1d10", "Pergamino al azar")
                        }
                        disabled={isRolling}
                        className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                      >
                        {isZ(Z_ESOT_IDX)
                          ? "Tirando…"
                          : esotScrollIdx !== null
                            ? "🎲 Tirar de nuevo"
                            : "🎲 Tirar"}
                      </button>
                    </>
                  ) : null}
                </div>

                {esotScrollIdx !== null && !isZ(Z_ESOT_IDX)
                  ? (() => {
                      const scroll = getMbScrollByIdx(
                        esotScrollTipo === 1 ? "sagrado" : "impuro",
                        esotScrollIdx,
                      );
                      return scroll ? (
                        <div
                          className={`rounded-xl border px-3 py-2 ${esotScrollTipo === 1 ? "border-amber-300/60 bg-stone-900/80" : "border-red-400/40 bg-stone-900/80"}`}
                        >
                          <p
                            className={`text-sm font-bold ${esotScrollTipo === 1 ? "text-amber-300" : "text-red-400"}`}
                          >
                            {scroll.nombre}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-200">
                            {scroll.descripcion}
                          </p>
                        </div>
                      ) : null;
                    })()
                  : null}
              </div>
            </div>
          ) : null}

          {/* ── Equipo básico ── */}
          {selectedClass ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-stone-700" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">
                  Equipo básico
                </p>
                <div className="h-px flex-1 bg-stone-700" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TableBox
                  label="Elección 1"
                  dice="1d6 — contenedor"
                  hasResult={contenedor !== null}
                  isRollingThis={isZ(Z_CONTENEDOR)}
                  isRollingAny={isRolling}
                  onRoll={() =>
                    roll(Z_CONTENEDOR, "1d6", "Elección de contenedor")
                  }
                  tableInfo={D6_CONTAINER_INFO}
                >
                  {renderContenedor()}
                </TableBox>

                <TableBox
                  label="Elección 2"
                  dice="1d12 — objeto"
                  hasResult={item1 !== null}
                  isRollingThis={isZ(Z_ITEM1)}
                  isRollingAny={isRolling}
                  onRoll={() =>
                    roll(Z_ITEM1, "1d12", "Elección de objeto (tabla 1)")
                  }
                  tableInfo={D12_TABLE1_INFO}
                >
                  {renderItem1()}
                </TableBox>

                <TableBox
                  label="Elección 3"
                  dice="1d12 — objeto"
                  hasResult={item2 !== null}
                  isRollingThis={isZ(Z_ITEM2)}
                  isRollingAny={isRolling}
                  onRoll={() =>
                    roll(Z_ITEM2, "1d12", "Elección de objeto (tabla 2)")
                  }
                  tableInfo={D12_TABLE2_INFO}
                >
                  {renderItem2()}
                </TableBox>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
