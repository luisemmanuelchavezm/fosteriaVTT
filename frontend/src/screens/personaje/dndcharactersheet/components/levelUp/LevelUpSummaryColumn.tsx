import type { LevelUpModalController } from "../../hooks/useLevelUpModalState";

interface LevelUpSummaryColumnProps {
  controller: LevelUpModalController;
  onClose: () => void;
}

export default function LevelUpSummaryColumn({
  controller,
  onClose,
}: LevelUpSummaryColumnProps) {
  const {
    isDownMode,
    levelFeatures,
    subclassFeatures,
    totalCharacterLevel,
    selectedClassLevel,
    targetLevelAfterDown,
    selectedClassDetail,
    classIsNew,
    targetLevel,
    effectiveSubclass,
    requiresAsi,
    asiMode,
    asiPrimary,
    asiSecondary,
    selectedFeat,
    submitError,
    isSubmitting,
    handleSubmit,
  } = controller;

  return (
    <div className="space-y-6">
      {!isDownMode ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">Rasgos que ganas</h4>
          {levelFeatures.length === 0 && subclassFeatures.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-stone-300">
              No hay rasgos listados para este nivel o la clase todavía no ha
              sido seleccionada.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {levelFeatures.map((feature) => (
                <div
                  key={`feature-${feature.id}`}
                  className="rounded-[18px] border border-stone-300/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {feature.nombre}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {feature.descripcion ?? "Sin descripción adicional."}
                  </p>
                </div>
              ))}
              {subclassFeatures.map((feature) => (
                <div
                  key={`subclass-feature-${feature.id}`}
                  className="rounded-[18px] border border-sky-300/20 bg-sky-400/5 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {feature.nombre}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {feature.descripcion ?? "Sin descripción adicional."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Resumen de bajada
          </h4>
          <div className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
            <p>
              Nivel total actual:{" "}
              <span className="font-semibold text-white">
                {totalCharacterLevel}
              </span>
            </p>
            <p>
              La clase seleccionada bajará de{" "}
              <span className="font-semibold text-white">
                {selectedClassLevel}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-white">
                {targetLevelAfterDown}
              </span>
              .
            </p>
            <p>
              Se recalcularán puntos de vida, dados de golpe, espacios de
              conjuro y rasgos automáticos ligados a ese nivel.
            </p>
          </div>
        </section>
      )}

      {selectedClassDetail ? (
        <section className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5">
          <h4 className="text-xl font-semibold text-white">
            Resumen de aplicación
          </h4>
          <div className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
            <p>
              Clase seleccionada:{" "}
              <span className="font-semibold text-white">
                {selectedClassDetail.nombre}
              </span>
            </p>
            {!isDownMode ? (
              <p>
                Tipo de subida:{" "}
                <span className="font-semibold text-white">
                  {classIsNew ? "Multiclase" : "Clase existente"}
                </span>
              </p>
            ) : null}
            <p>
              Nivel objetivo:{" "}
              <span className="font-semibold text-white">
                {isDownMode ? targetLevelAfterDown : targetLevel}
              </span>
            </p>
            {effectiveSubclass ? (
              <p>
                Subclase activa:{" "}
                <span className="font-semibold text-white">
                  {effectiveSubclass.nombre}
                </span>
              </p>
            ) : null}
            {!isDownMode && requiresAsi ? (
              <p>
                Mejora:{" "}
                <span className="font-semibold text-white">
                  {asiMode === "feat"
                    ? (selectedFeat?.nombre ?? "Dote pendiente")
                    : asiMode === "single"
                      ? `${asiPrimary} +2`
                      : `${asiPrimary} +1, ${asiSecondary} +1`}
                </span>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {submitError ? (
        <div className="rounded-[20px] border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {submitError}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-stone-100"
        >
          Cancelar
        </button>
        {selectedClassDetail ? (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${isDownMode ? "border border-rose-300/30 bg-rose-400/10 text-rose-100" : "border border-amber-300/30 bg-amber-300/10 text-amber-100"}`}
          >
            {isDownMode ? "Aplicar bajada de nivel" : "Aplicar subida de nivel"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
