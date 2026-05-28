import type { ReactNode } from "react";

import ChoiceChecklist from "../../../creatednd/components/ChoiceChecklist";
import ExpertisePicklistSection from "../../../creatednd/components/ExpertisePicklistSection";
import type { DndCharacterDetailResponse } from "../../../utils/dndApi";
import type { LevelUpModalController } from "../../hooks/useLevelUpModalState";

interface LevelUpSelectionColumnProps {
  controller: LevelUpModalController;
  character: DndCharacterDetailResponse;
  token: string;
  asiSection: ReactNode;
}

export default function LevelUpSelectionColumn({
  controller,
  character,
  token,
  asiSection,
}: LevelUpSelectionColumnProps) {
  const {
    classSectionRef,
    totalCharacterLevel,
    visibleClassSummaries,
    selectedClassId,
    selectedClassDetail,
    selectedClassLevel,
    targetLevel,
    isDownMode,
    classWarnings,
    setSelectedClassId,
    classIsNew,
    visibleInitialClassChoices,
    classChoicesSectionRef,
    classChoices,
    setClassChoices,
    expertiseChoiceConfig,
    expertiseChoices,
    availableExpertiseOptions,
    missingChoiceErrors,
    openSpellDetailByName,
    needsSubclass,
    subclassSectionRef,
    selectedSubclassId,
    setSelectedSubclassId,
    requiresAsi,
    eaChosenCantrips,
    eaChosenSpells,
    eaCantripOptions,
    eaSpellOptions,
    eaCantripCount,
    eaSpellCount,
    ekChosenCantrips,
    ekChosenSpells,
    ekCantripOptions,
    ekSpellOptions,
    ekCantripCount,
    ekSpellCount,
    isGainingEa,
    isActiveEa,
    isGainingEk,
    isActiveEk,
    battleMasterManeuvers,
    battleMasterManeuverOptions,
    battleMasterManeuverCount,
    isGainingBattleMaster,
    isActiveBattleMaster,
    cantripUpgradeChosen,
    cantripUpgradeOptions,
    cantripUpgradeCount,
    setCantripUpgradeChosen,
    setExpertiseChoices,
    setEaChosenCantrips,
    setEaChosenSpells,
    setEkChosenCantrips,
    setEkChosenSpells,
    setBattleMasterManeuvers,
  } = controller;

  return (
    <div className="space-y-6">
      <section
        ref={classSectionRef}
        className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
              Clase objetivo
            </p>
            <h4 className="mt-2 text-xl font-semibold text-white">
              Selecciona la clase
            </h4>
          </div>
          <p className="text-sm text-stone-400">
            Nivel total actual: {totalCharacterLevel}
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visibleClassSummaries.map((classSummary) => {
            const currentLevel = character.clases
              .filter(
                (entry) =>
                  entry.nombre.toLowerCase() ===
                  classSummary.nombre.toLowerCase(),
              )
              .reduce((total, entry) => total + entry.nivel, 0);
            const validMulticlass = classWarnings(classSummary, character);
            const selected = classSummary.id === selectedClassId;
            return (
              <button
                key={classSummary.id}
                type="button"
                onClick={() => setSelectedClassId(classSummary.id)}
                className={`rounded-[22px] border px-4 py-4 text-left transition ${selected ? "border-amber-300/50 bg-amber-300/10" : "border-stone-300/10 bg-black/20 hover:border-amber-300/25"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {classSummary.nombre}
                    </p>
                    <p className="mt-1 text-sm text-stone-300">
                      {isDownMode
                        ? `Baja de nivel ${currentLevel} a ${Math.max(0, currentLevel - 1)}`
                        : currentLevel > 0
                          ? `Sube a nivel ${currentLevel + 1}`
                          : "Añadir como nueva clase"}
                    </p>
                  </div>
                  {!isDownMode && !validMulticlass && currentLevel === 0 ? (
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                      Homebrew
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedClassDetail ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            Resumen
          </p>
          <h4 className="mt-2 text-xl font-semibold text-white">
            {selectedClassDetail.nombre} nivel{" "}
            {isDownMode ? selectedClassLevel : targetLevel}
          </h4>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            {selectedClassDetail.descripcion}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Dados de golpe
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {selectedClassDetail.puntosGolpe.dadoGolpe}
              </p>
              <p className="mt-2 text-sm text-stone-300">
                {isDownMode
                  ? "Se retirará el promedio de PV correspondiente a ese nivel y se reajustarán los dados de golpe."
                  : "Aumento de PV por promedio + modificador de Constitución."}
              </p>
            </div>
            <div className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Lanzamiento de conjuros
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {selectedClassDetail.lanzamientoConjuros?.modo ??
                  "Sin progresión mágica"}
              </p>
              <p className="mt-2 text-sm text-stone-300">
                Se recalcula los espacios con reglas de multiclase y suma aparte
                las ranuras de pacto del brujo.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!isDownMode &&
      selectedClassDetail &&
      classIsNew &&
      visibleInitialClassChoices.length > 0 ? (
        <section
          ref={classChoicesSectionRef}
          className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5"
        >
          <h4 className="text-xl font-semibold text-white">
            Elecciones iniciales de la clase
          </h4>
          <div className="mt-5 space-y-5">
            {visibleInitialClassChoices.map((choice) => (
              <ChoiceChecklist
                key={choice.id}
                anchorId={`levelup-choice-${choice.id}`}
                title={choice.etiqueta}
                description={choice.resumen}
                options={choice.opciones}
                selectedValues={classChoices[choice.id] ?? []}
                maxSelections={choice.cantidad}
                error={missingChoiceErrors[choice.id]}
                showInfoAction={/trucos|conjuros|wizardcantrips/i.test(
                  choice.catalogo,
                )}
                onInfoClick={(option) => {
                  void openSpellDetailByName(token, option);
                }}
                onChange={(values) =>
                  setClassChoices((current: Record<string, string[]>) => ({
                    ...current,
                    [choice.id]: values,
                  }))
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isDownMode && expertiseChoiceConfig ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            {expertiseChoiceConfig.title}
          </h4>
          <div className="mt-5">
            <ExpertisePicklistSection
              anchorId="levelup-choice-class-expertise"
              title="Elige tus nuevas pericias"
              description={expertiseChoiceConfig.description}
              options={availableExpertiseOptions}
              selectedValues={expertiseChoices}
              selectionCount={expertiseChoiceConfig.count}
              error={missingChoiceErrors["class-expertise"]}
              onChange={setExpertiseChoices}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode && selectedClassDetail && needsSubclass ? (
        <section
          ref={subclassSectionRef}
          className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5"
        >
          <h4 className="text-xl font-semibold text-white">
            Selecciona una subclase
          </h4>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {selectedClassDetail.subclases
              .filter((subclass) => subclass.nivelDesbloqueo <= targetLevel)
              .map((subclass) => {
                const selected = subclass.id === selectedSubclassId;
                return (
                  <button
                    key={subclass.id}
                    type="button"
                    onClick={() => setSelectedSubclassId(subclass.id)}
                    className={`rounded-[20px] border px-4 py-4 text-left ${selected ? "border-sky-300/40 bg-sky-400/10" : "border-stone-300/10 bg-black/20"}`}
                  >
                    <p className="text-base font-semibold text-white">
                      {subclass.nombre}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-300">
                      {subclass.descripcion}
                    </p>
                  </button>
                );
              })}
          </div>
        </section>
      ) : null}

      {!isDownMode && cantripUpgradeCount > 0 && selectedClassDetail ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Nuevo truco conocido
          </h4>
          <div className="mt-5">
            <ChoiceChecklist
              title="Selecciona tus nuevos trucos"
              options={cantripUpgradeOptions.map((s) => s.nombre)}
              selectedValues={cantripUpgradeChosen}
              maxSelections={cantripUpgradeCount}
              showInfoAction
              onInfoClick={(name) => {
                void openSpellDetailByName(token, name);
              }}
              onChange={setCantripUpgradeChosen}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode && (isGainingEa || isActiveEa) && eaCantripCount > 0 ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Trucos del Embaucador Arcano
          </h4>
          <div className="mt-5">
            <ChoiceChecklist
              title="Selecciona los trucos del Embaucador Arcano"
              options={eaCantripOptions.map((s) => s.nombre)}
              selectedValues={eaChosenCantrips}
              maxSelections={eaCantripCount}
              showInfoAction
              onInfoClick={(name) => {
                void openSpellDetailByName(token, name);
              }}
              onChange={setEaChosenCantrips}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode && (isGainingEa || isActiveEa) && eaSpellCount > 0 ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Conjuros del Embaucador Arcano
          </h4>
          <div className="mt-5">
            <ChoiceChecklist
              title="Selecciona los conjuros del Embaucador Arcano"
              options={eaSpellOptions.map((s) => s.nombre)}
              selectedValues={eaChosenSpells}
              maxSelections={eaSpellCount}
              showInfoAction
              onInfoClick={(name) => {
                void openSpellDetailByName(token, name);
              }}
              onChange={setEaChosenSpells}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode && (isGainingEk || isActiveEk) && ekCantripCount > 0 ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Trucos del Caballero Arcano
          </h4>
          <div className="mt-5">
            <ChoiceChecklist
              title="Selecciona los trucos del Caballero Arcano"
              options={ekCantripOptions.map((s) => s.nombre)}
              selectedValues={ekChosenCantrips}
              maxSelections={ekCantripCount}
              showInfoAction
              onInfoClick={(name) => {
                void openSpellDetailByName(token, name);
              }}
              onChange={setEkChosenCantrips}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode && (isGainingEk || isActiveEk) && ekSpellCount > 0 ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Conjuros del Caballero Arcano
          </h4>
          <div className="mt-5">
            <ChoiceChecklist
              title="Selecciona los conjuros del Caballero Arcano"
              options={ekSpellOptions.map((s) => s.nombre)}
              selectedValues={ekChosenSpells}
              maxSelections={ekSpellCount}
              showInfoAction
              onInfoClick={(name) => {
                void openSpellDetailByName(token, name);
              }}
              onChange={setEkChosenSpells}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode &&
      (isGainingBattleMaster || isActiveBattleMaster) &&
      battleMasterManeuverCount > 0 ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Maniobras del Maestro de Batalla
          </h4>
          <div className="mt-5">
            <ChoiceChecklist
              title="Selecciona las maniobras"
              description="Estas maniobras se añaden como habilidades del personaje y consumen tus dados de supremacía cuando corresponda."
              options={battleMasterManeuverOptions}
              selectedValues={battleMasterManeuvers}
              maxSelections={battleMasterManeuverCount}
              showInfoAction
              onInfoClick={(name) => {
                void openSpellDetailByName(token, name);
              }}
              onChange={setBattleMasterManeuvers}
            />
          </div>
        </section>
      ) : null}

      {!isDownMode && requiresAsi ? asiSection : null}
    </div>
  );
}
