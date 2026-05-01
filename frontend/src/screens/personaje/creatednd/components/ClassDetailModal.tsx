import { Shield } from "lucide-react";
import {
  buildEquipmentMeta,
  formatEquipmentOption,
} from "../utils/equipmentUtils";
import {
  readableContentStyle,
  renderSkillDescription,
} from "../utils/textUtils";
import type { ClassSkillGroup } from "../utils/dndApi";
import type { DndClassDetail, DndClassSummary } from "../types";
import ProgressionTablesBlock from "./ProgressionTablesBlock";

interface ClassDetailModalProps {
  previewClass: DndClassSummary | null;
  previewClassDetail: DndClassDetail | null;
  classSkills: ClassSkillGroup[];
  isOpen: boolean;
  isLoadingPreviewClassDetail: boolean;
  previewClassDetailError: string | null;
  isLoadingClassSkills: boolean;
  classSkillsError: string | null;
  onClose: () => void;
  onSelect: () => void;
}

export default function ClassDetailModal({
  previewClass,
  previewClassDetail,
  classSkills,
  isOpen,
  isLoadingPreviewClassDetail,
  previewClassDetailError,
  isLoadingClassSkills,
  classSkillsError,
  onClose,
  onSelect,
}: ClassDetailModalProps) {
  if (!isOpen || !previewClass) {
    return null;
  }

  const canSelectClass =
    !isLoadingPreviewClassDetail &&
    !previewClassDetailError &&
    previewClassDetail !== null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-amber-200/80">
              <Shield className="h-4 w-4" />
              Clase seleccionada
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {previewClass.nombre}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de clase"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="rounded-[22px] border border-stone-200/10 bg-black/35 p-4 text-sm text-stone-200">
            <div>
              <h4 className="text-lg font-semibold text-amber-100">
                Información básica de {previewClass.nombre}
              </h4>
              <div className="mt-4 space-y-3">
                {isLoadingPreviewClassDetail ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                    Cargando información de clase...
                  </div>
                ) : null}

                {!isLoadingPreviewClassDetail && previewClassDetailError ? (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 text-sm text-amber-100">
                    {previewClassDetailError}
                  </div>
                ) : null}

                {!isLoadingPreviewClassDetail &&
                !previewClassDetailError &&
                previewClassDetail ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4">
                      <p className="text-sm leading-6 text-stone-200/90">
                        {previewClassDetail.descripcion}
                      </p>
                      <div className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
                        <p>
                          <span className="font-semibold text-white">
                            Dado de golpe:
                          </span>{" "}
                          {previewClassDetail.puntosGolpe.dadoGolpe}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Nivel 1:
                          </span>{" "}
                          {previewClassDetail.puntosGolpe.primerNivel}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Niveles superiores:
                          </span>{" "}
                          {previewClassDetail.puntosGolpe.nivelesSuperiores}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm leading-6 text-stone-200/90">
                      <p>
                        <span className="font-semibold text-white">
                          Armaduras:
                        </span>{" "}
                        {previewClassDetail.competencias.armaduras.join(", ") ||
                          "Ninguna"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">Armas:</span>{" "}
                        {previewClassDetail.competencias.armas.join(", ") ||
                          "Ninguna"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Herramientas:
                        </span>{" "}
                        {previewClassDetail.competencias.herramientas.join(
                          ", ",
                        ) || "Ninguna"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Salvaciones:
                        </span>{" "}
                        {previewClassDetail.competencias.salvaciones.join(
                          ", ",
                        ) || "Ninguna"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Habilidades:
                        </span>{" "}
                        {previewClassDetail.competencias.habilidades.join(
                          ". ",
                        ) || "Ninguna"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 border-t border-stone-200/10 pt-6">
              <h4 className="text-lg font-semibold text-amber-100">
                Subclases de {previewClass.nombre}
              </h4>

              {previewClassDetail?.subclases.length ? (
                <div className="mt-4 space-y-4">
                  {previewClassDetail.subclases.map((subclass) => (
                    <section
                      key={subclass.id}
                      className="rounded-2xl border border-stone-200/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h5 className="text-base font-semibold text-white">
                            {subclass.nombre}
                          </h5>
                          <p className="mt-2 text-sm leading-6 text-stone-200/90">
                            {subclass.descripcion}
                          </p>
                        </div>
                        <span className="rounded-full border border-amber-300/20 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/90">
                          Nivel {subclass.nivelDesbloqueo}
                        </span>
                      </div>

                      <ProgressionTablesBlock
                        tables={subclass.tablas ?? []}
                        title="Progresion"
                      />
                    </section>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                  No hay subclases configuradas para esta clase.
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-stone-200/10 pt-6">
              <h4 className="text-lg font-semibold text-amber-100">
                Habilidades de {previewClass.nombre}
              </h4>
              <div className="mt-4 space-y-3">
                {isLoadingClassSkills ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                    Cargando habilidades...
                  </div>
                ) : null}

                {!isLoadingClassSkills && classSkillsError ? (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 text-sm text-amber-100">
                    {classSkillsError}
                  </div>
                ) : null}

                {!isLoadingClassSkills &&
                !classSkillsError &&
                classSkills.length === 0 ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                    No hay habilidades disponibles.
                  </div>
                ) : null}

                {!isLoadingClassSkills && !classSkillsError
                  ? classSkills.map((group) => (
                      <section
                        key={group.nivel}
                        className="rounded-2xl border border-stone-200/10 bg-black/30 p-4"
                      >
                        <div className="border-b border-stone-200/10 pb-3">
                          <h5 className="text-base font-semibold text-amber-300">
                            Nivel {group.nivel}
                          </h5>
                        </div>

                        <div className="mt-4 space-y-3">
                          {group.habilidades.map((skill) => (
                            <details
                              key={skill.id}
                              className="rounded-2xl border border-stone-200/10 bg-stone-950/70 p-4 open:border-amber-300/30 open:bg-stone-950"
                            >
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                                <div>
                                  <p className="text-lg font-semibold text-white">
                                    {skill.nombre}
                                  </p>
                                </div>
                                <span className="rounded-full border border-amber-300/20 bg-black/40 px-2 py-0.5 text-lg text-amber-100">
                                  +
                                </span>
                              </summary>
                              {skill.descripcion ? (
                                <div
                                  className="mt-4 rounded-xl border border-stone-200/10 bg-black/45 px-4 py-3 text-sm leading-6 text-stone-100/90"
                                  style={readableContentStyle}
                                >
                                  <div className="space-y-3">
                                    {renderSkillDescription(
                                      skill.descripcion,
                                      skill.id,
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </details>
                          ))}
                        </div>
                      </section>
                    ))
                  : null}
              </div>
            </div>

            <div className="mt-6 border-t border-stone-200/10 pt-6">
              <h4 className="text-lg font-semibold text-amber-100">
                Equipamiento inicial de {previewClass.nombre}
              </h4>

              <div className="mt-4 space-y-3">
                {isLoadingPreviewClassDetail ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                    Cargando equipamiento inicial...
                  </div>
                ) : null}

                {!isLoadingPreviewClassDetail && previewClassDetailError ? (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 text-sm text-amber-100">
                    {previewClassDetailError}
                  </div>
                ) : null}

                {!isLoadingPreviewClassDetail &&
                !previewClassDetailError &&
                previewClassDetail ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4">
                    <ul className="space-y-2 text-sm leading-6 text-stone-200/90">
                      {previewClassDetail.equipamiento.fijos.map((item) => (
                        <li key={item.id} className="flex gap-2">
                          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                          <span>
                            {formatEquipmentOption(item)}
                            {buildEquipmentMeta(item.objeto).map((meta) => (
                              <span
                                key={`${item.id}-${meta}`}
                                className="block text-xs text-stone-400"
                              >
                                {meta}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                      {previewClassDetail.equipamiento.gruposEleccion.map(
                        (group) => (
                          <li key={group.id} className="flex gap-2">
                            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                            <span>
                              {group.etiqueta}:{" "}
                              {group.opciones
                                .map((option) => option.etiqueta)
                                .join(" o ")}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-300/12 px-6 py-4">
          <button
            type="button"
            onClick={onSelect}
            disabled={!canSelectClass}
            className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
              canSelectClass
                ? "border-amber-300/35 bg-[linear-gradient(90deg,rgba(28,25,23,0.92),rgba(245,158,11,0.14))] text-amber-100 hover:border-amber-300/60 hover:bg-[linear-gradient(90deg,rgba(41,37,36,0.96),rgba(245,158,11,0.22))]"
                : "cursor-not-allowed border-stone-300/10 bg-stone-900/70 text-stone-400"
            }`}
          >
            Seleccionar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300/20 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-amber-300/30 hover:bg-stone-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
