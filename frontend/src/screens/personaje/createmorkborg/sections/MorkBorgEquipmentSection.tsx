import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import type { MorkBorgClass } from "../utils/morkBorgUtils";
import type { MbEquipmentSnapshot } from "../hooks/useCreateMorkBorgCharacter";
import { TableBox } from "./MorkBorgEquipmentHelpers";
import {
  D6_CONTAINER_INFO,
  D12_TABLE1_INFO,
  D12_TABLE2_INFO,
} from "./MorkBorgEquipmentConstants";
import {
  useMorkBorgEquipmentRolls,
  Z_CONTENEDOR,
  Z_ITEM1,
  Z_ITEM2,
} from "./useMorkBorgEquipmentRolls";
import {
  ContenedorResult,
  Item1Result,
  Item2Result,
} from "./MorkBorgEquipmentItems";
import {
  SilverCard,
  FoodCard,
  WeaponCard,
  ArmorCard,
  ScrollSection,
  InitialScrollSection,
} from "./MorkBorgEquipmentCards";

interface MorkBorgEquipmentSectionProps {
  selectedClass: MorkBorgClass | null;
  presenciaModifier: number | null;
  allStatsRolled: boolean;
  hasError?: boolean;
  hasAttemptedCreation?: boolean;
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
    rollArmadura,
  } = useMorkBorgEquipmentRolls({
    selectedClass,
    disabled,
    onEquipmentComplete,
  });

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

          {/* Row 1: Plata + Comida | Arma */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <SilverCard
                plataExpr={plataExpr}
                plataValue={plataValue}
                isRolling={isRolling}
                isZ={isZ}
                roll={roll}
                hasAttemptedCreation={hasAttemptedCreation}
              />
              <FoodCard
                comidaExpr={comidaExpr}
                comidaValue={comidaValue}
                isRolling={isRolling}
                isZ={isZ}
                roll={roll}
                hasAttemptedCreation={hasAttemptedCreation}
              />
            </div>
            <WeaponCard
              armaExpr={armaExpr}
              armaResult={armaResult}
              isRolling={isRolling}
              isZ={isZ}
              roll={roll}
              hasAttemptedCreation={hasAttemptedCreation}
            />
          </div>

          {/* Row 2: Pergamino | Armadura */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ScrollSection
              wantsScroll={wantsScroll}
              setWantsScroll={setWantsScroll}
              perScrollTipo={perScrollTipo}
              perScrollIdx={perScrollIdx}
              isRolling={isRolling}
              isZ={isZ}
              roll={roll}
              hasAttemptedCreation={hasAttemptedCreation}
            />
            <ArmorCard
              effectiveArmaduraExpr={effectiveArmaduraExpr}
              armaduraResult={armaduraResult}
              armaduraRolled={armaduraRolled}
              armaduraIsReroll={armaduraIsReroll}
              classId={classId}
              isRolling={isRolling}
              isZ={isZ}
              rollArmadura={rollArmadura}
              hasAttemptedCreation={hasAttemptedCreation}
            />
          </div>

          {/* Pergamino inicial (solo Ermitaño Esotérico) */}
          {classId === "ermitano-esoterico" ? (
            <InitialScrollSection
              esotScrollTipo={esotScrollTipo}
              esotScrollIdx={esotScrollIdx}
              isRolling={isRolling}
              isZ={isZ}
              roll={roll}
            />
          ) : null}

          {/* Equipo básico */}
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
                  {contenedor ? (
                    <ContenedorResult
                      contenedor={contenedor}
                      contenedorChoice={contenedorChoice}
                      setContenedorChoice={setContenedorChoice}
                    />
                  ) : null}
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
                  {item1 ? (
                    <Item1Result
                      item1={item1}
                      presenciaModifier={presenciaModifier}
                      impuroIdx={impuroIdx}
                      venenoCant={venenoCant}
                      hasAttemptedCreation={hasAttemptedCreation}
                      isRolling={isRolling}
                      roll={roll}
                      isZ={isZ}
                    />
                  ) : null}
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
                  {item2 ? (
                    <Item2Result
                      item2={item2}
                      sagradoIdx={sagradoIdx}
                      elixirCant={elixirCant}
                      monosCant={monosCant}
                      hasAttemptedCreation={hasAttemptedCreation}
                      isRolling={isRolling}
                      roll={roll}
                      isZ={isZ}
                    />
                  ) : null}
                </TableBox>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
