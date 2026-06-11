import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import {
  MB_WEAPONS,
  getMbArmorByRoll,
  getMbScrollByIdx,
} from "../utils/morkBorgUtils";
import type { MorkBorgClass } from "../utils/morkBorgUtils";
import type { MbEquipmentSnapshot } from "../hooks/useCreateMorkBorgCharacter";
import {
  SubRollButton,
  PresenciaNota,
  ResultChip,
  TableBox,
} from "./MorkBorgEquipmentHelpers";
import {
  presenciaQty,
  D6_CONTAINER_INFO,
  D12_TABLE1_INFO,
  D12_TABLE2_INFO,
} from "./MorkBorgEquipmentConstants";
import {
  useMorkBorgEquipmentRolls,
  Z_PLATA,
  Z_COMIDA,
  Z_ARMA,
  Z_ARMADURA,
  Z_CONTENEDOR,
  Z_ITEM1,
  Z_ITEM2,
  Z_IMPURO_IDX,
  Z_VENENO_CANT,
  Z_SAGRADO_IDX,
  Z_ELIXIR_CANT,
  Z_MONOS_CANT,
  Z_PER_TIPO,
  Z_PER_IDX,
  Z_ESOT_TIPO,
  Z_ESOT_IDX,
} from "./useMorkBorgEquipmentRolls";

interface MorkBorgEquipmentSectionProps {
  selectedClass: MorkBorgClass | null;
  presenciaModifier: number | null;
  allStatsRolled: boolean;
  hasError?: boolean;
  hasAttemptedCreation?: boolean;
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
  hasAttemptedCreation = false,
  onEquipmentComplete,
}: MorkBorgEquipmentSectionProps) {
  const classId = selectedClass?.id;

  const blockedByClass = !selectedClass;
  const blockedByStats = !!selectedClass && !allStatsRolled;
  const disabled = blockedByClass || blockedByStats;

  const rolls = useMorkBorgEquipmentRolls({
    selectedClass,
    disabled,
    onEquipmentComplete,
  });

  const {
    diceBoxHostId,
    diceBoxError,
    isRolling,
    isZ,
    roll,
    plataExpr,
    comidaExpr,
    armaExpr,
    effectiveArmaduraExpr,
    plataValue,
    comidaValue,
    armaResult,
    armaduraResult,
    armaduraRolled,
    armaduraIsReroll,
    contenedor,
    contenedorChoice,
    setContenedorChoice,
    item1,
    impuroIdx,
    venenoCant,
    item2,
    sagradoIdx,
    elixirCant,
    monosCant,
    wantsScroll,
    setWantsScroll,
    perScrollTipo,
    perScrollIdx,
    esotScrollTipo,
    esotScrollIdx,
    showArmaModal,
    setShowArmaModal,
    showArmModal,
    setShowArmModal,
    rollArmadura,
  } = rolls;

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
              <>
                <SubRollButton
                  label="Tirar 1d10 (pergamino)"
                  onClick={() =>
                    roll(Z_IMPURO_IDX, "1d10", "Pergamino impuro al azar")
                  }
                  disabled={isRolling}
                />
                {hasAttemptedCreation ? (
                  <p className="mt-2 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </>
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
              <>
                <SubRollButton
                  label="Tirar d4 (botellas)"
                  onClick={() =>
                    roll(Z_VENENO_CANT, "1d4", "Número de botellas de veneno")
                  }
                  disabled={isRolling || isZ(Z_VENENO_CANT)}
                />
                {hasAttemptedCreation ? (
                  <p className="mt-2 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </>
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
              <>
                <SubRollButton
                  label="Tirar d4 (elixires)"
                  onClick={() =>
                    roll(Z_ELIXIR_CANT, "1d4", "Número de elixires de vida")
                  }
                  disabled={isRolling || isZ(Z_ELIXIR_CANT)}
                />
                {hasAttemptedCreation ? (
                  <p className="mt-2 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </>
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
              <>
                <SubRollButton
                  label="Tirar 1d10 (pergamino)"
                  onClick={() =>
                    roll(Z_SAGRADO_IDX, "1d10", "Pergamino sagrado al azar")
                  }
                  disabled={isRolling || isZ(Z_SAGRADO_IDX)}
                />
                {hasAttemptedCreation ? (
                  <p className="mt-2 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </>
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
              <>
                <SubRollButton
                  label="Tirar d4 (monos)"
                  onClick={() => roll(Z_MONOS_CANT, "1d4", "Número de monos")}
                  disabled={isRolling || isZ(Z_MONOS_CANT)}
                />
                {hasAttemptedCreation ? (
                  <p className="mt-2 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </>
            )}
          </div>
        );
      default:
        return <p className="font-bold text-amber-200">{item2.nombre}</p>;
    }
  }

  // ── JSX ────────────────────────────────────────────────────────────────────
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
                className={`flex flex-1 flex-col gap-2 rounded-2xl border px-5 py-4 ${plataValue !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
              >
                <div className="flex items-center gap-3">
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
                      <span className="text-lg font-bold text-stone-600">
                        —
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        roll(Z_PLATA, plataExpr, "Tirada de Plata")
                      }
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
                {hasAttemptedCreation &&
                plataValue === null &&
                !isZ(Z_PLATA) ? (
                  <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </div>

              {/* Comida */}
              <div
                className={`flex flex-1 flex-col gap-2 rounded-2xl border px-5 py-4 ${comidaValue !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
              >
                <div className="flex items-center gap-3">
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
                      <span className="text-lg font-bold text-stone-600">
                        —
                      </span>
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
                {hasAttemptedCreation &&
                comidaValue === null &&
                !isZ(Z_COMIDA) ? (
                  <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente
                  </p>
                ) : null}
              </div>
            </div>

            {/* Der: Arma */}
            <div
              className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${armaResult ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
            >
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
              {hasAttemptedCreation && !armaResult && !isZ(Z_ARMA) ? (
                <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                  ⚠ Tirada pendiente
                </p>
              ) : null}
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
                  onChange={(e) => setWantsScroll(e.target.checked)}
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

                  <div className="flex flex-col gap-2">
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

                    {hasAttemptedCreation &&
                    perScrollTipo === null &&
                    !isZ(Z_PER_TIPO) ? (
                      <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                        ⚠ Tirada pendiente — elige el tipo de pergamino
                      </p>
                    ) : hasAttemptedCreation &&
                      perScrollTipo !== null &&
                      perScrollIdx === null &&
                      !isZ(Z_PER_IDX) ? (
                      <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                        ⚠ Tirada pendiente — tira para obtener el pergamino
                      </p>
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
                onClick={rollArmadura}
                disabled={isRolling}
                className="w-full rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {isZ(Z_ARMADURA)
                  ? "Tirando…"
                  : armaduraRolled
                    ? "🎲 Volver a tirar"
                    : "🎲 Tirar"}
              </button>
              {hasAttemptedCreation && !armaduraRolled && !isZ(Z_ARMADURA) ? (
                <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                  ⚠ Tirada pendiente
                </p>
              ) : null}
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
                  pendingWarning={
                    hasAttemptedCreation &&
                    contenedor === null &&
                    !isZ(Z_CONTENEDOR)
                  }
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
                  pendingWarning={
                    hasAttemptedCreation && item1 === null && !isZ(Z_ITEM1)
                  }
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
                  pendingWarning={
                    hasAttemptedCreation && item2 === null && !isZ(Z_ITEM2)
                  }
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
