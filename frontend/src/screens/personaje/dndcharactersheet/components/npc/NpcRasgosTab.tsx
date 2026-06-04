import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { CharacterAbilityResponse } from "../../../utils/dndApi";
import WeaponFormModal from "./WeaponFormModal";
import type { WeaponModalState } from "../../hooks/useNpcEdit";

function renderNpcText(text: string): ReactNode {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let pendingItems: string[] = [];

  const flushList = () => {
    if (pendingItems.length === 0) return;
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="ml-4 mt-1 list-outside list-disc space-y-0.5"
      >
        {pendingItems.map((item, i) => (
          <li
            key={i}
            className="break-words text-sm leading-relaxed text-white/70"
          >
            {item}
          </li>
        ))}
      </ul>,
    );
    pendingItems = [];
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^[*-]\s+(.+)$/);
    if (bulletMatch) {
      pendingItems.push(bulletMatch[1]);
    } else {
      flushList();
      if (line.trim()) {
        elements.push(
          <p
            key={`p-${elements.length}`}
            className="mt-1 break-words text-sm leading-relaxed text-white/70"
          >
            {line}
          </p>,
        );
      }
    }
  }
  flushList();

  return <>{elements}</>;
}

interface NpcRasgosTabProps {
  isEditMode: boolean;
  pasivas: CharacterAbilityResponse[];
  acciones: CharacterAbilityResponse[];
  armas: CharacterAbilityResponse[];
  onDeleteHabilidad: (id: number) => void;
  // Formulario de nuevo rasgo
  showAddForm: boolean;
  onShowAddFormChange: (v: boolean) => void;
  newHabilidadNombre: string;
  onNewHabilidadNombreChange: (v: string) => void;
  newHabilidadDesc: string;
  onNewHabilidadDescChange: (v: string) => void;
  newHabilidadTipo: "PASIVA" | "ACCION";
  onNewHabilidadTipoChange: (v: "PASIVA" | "ACCION") => void;
  isAddingHabilidad: boolean;
  onAddHabilidad: () => void;
  // Modal de arma
  weaponModal: WeaponModalState;
  onWeaponModalChange: (v: WeaponModalState) => void;
  isWeaponSaving: boolean;
  onWeaponConfirm: (data: {
    nombre: string;
    formula: string | null;
    bonificacion: number;
    descripcion: string;
  }) => void;
}

/** Pestaña de rasgos del NPC: pasivas, acciones y armas. */
export default function NpcRasgosTab({
  isEditMode,
  pasivas,
  acciones,
  armas,
  onDeleteHabilidad,
  showAddForm,
  onShowAddFormChange,
  newHabilidadNombre,
  onNewHabilidadNombreChange,
  newHabilidadDesc,
  onNewHabilidadDescChange,
  newHabilidadTipo,
  onNewHabilidadTipoChange,
  isAddingHabilidad,
  onAddHabilidad,
  weaponModal,
  onWeaponModalChange,
  isWeaponSaving,
  onWeaponConfirm,
}: NpcRasgosTabProps) {
  return (
    <div className="space-y-6">
      {/* Formulario para agregar rasgo (solo en modo edición) */}
      {isEditMode && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-900/10 p-4">
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => onShowAddFormChange(true)}
              className="w-full rounded-lg border border-amber-400/30 bg-amber-600/15 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-600/25"
            >
              + Agregar rasgo / acción
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300/70">
                Nuevo rasgo
              </p>
              <input
                type="text"
                placeholder="Nombre"
                value={newHabilidadNombre}
                onChange={(e) => onNewHabilidadNombreChange(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={newHabilidadDesc}
                onChange={(e) => onNewHabilidadDescChange(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onNewHabilidadTipoChange("PASIVA")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    newHabilidadTipo === "PASIVA"
                      ? "border border-amber-400/40 bg-amber-600/30 text-amber-200"
                      : "border border-white/15 bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  Pasiva
                </button>
                <button
                  type="button"
                  onClick={() => onNewHabilidadTipoChange("ACCION")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    newHabilidadTipo === "ACCION"
                      ? "border border-amber-400/40 bg-amber-600/30 text-amber-200"
                      : "border border-white/15 bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  Acción
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onShowAddFormChange(false);
                    onNewHabilidadNombreChange("");
                    onNewHabilidadDescChange("");
                  }}
                  className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs font-semibold text-white/50 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onAddHabilidad}
                  disabled={
                    isAddingHabilidad ||
                    !newHabilidadNombre.trim() ||
                    (newHabilidadTipo === "PASIVA" && pasivas.length >= 20) ||
                    (newHabilidadTipo === "ACCION" && acciones.length >= 20)
                  }
                  className="flex-1 rounded-lg bg-amber-600/30 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-600/50 disabled:opacity-40"
                >
                  {isAddingHabilidad
                    ? "Agregando…"
                    : (newHabilidadTipo === "PASIVA" && pasivas.length >= 20) ||
                        (newHabilidadTipo === "ACCION" && acciones.length >= 20)
                      ? "Límite alcanzado"
                      : "Agregar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rasgos pasivos */}
      {pasivas.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">
            Pasivas
          </h3>
          <div className="space-y-3">
            {pasivas.map((p) => (
              <div
                key={p.id}
                className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-semibold text-amber-200">
                    {p.nombre}
                  </p>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => onDeleteHabilidad(p.id)}
                      className="shrink-0 rounded-lg p-1.5 text-red-400/60 transition hover:bg-red-900/25 hover:text-red-400"
                      title="Eliminar rasgo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {p.descripcion && renderNpcText(p.descripcion)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      {acciones.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">
            Acciones
          </h3>
          <div className="space-y-3">
            {acciones.map((a) => (
              <div
                key={a.id}
                className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-semibold text-amber-200">
                    {a.nombre}
                  </p>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => onDeleteHabilidad(a.id)}
                      className="shrink-0 rounded-lg p-1.5 text-red-400/60 transition hover:bg-red-900/25 hover:text-red-400"
                      title="Eliminar acción"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {a.descripcion && renderNpcText(a.descripcion)}
              </div>
            ))}
          </div>
        </div>
      )}

      {pasivas.length === 0 &&
        acciones.length === 0 &&
        !isEditMode &&
        armas.length === 0 && (
          <p className="text-center text-sm text-white/30">Sin rasgos</p>
        )}

      {/* Armas (siempre al final) */}
      {(armas.length > 0 || isEditMode) && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">
            Armas
          </h3>
          <div className="space-y-2">
            {armas.map((w) => (
              <div
                key={w.id}
                className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-amber-200">{w.nombre}</p>
                  {isEditMode && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onWeaponModalChange({
                            mode: "edit",
                            id: w.id,
                            nombre: w.nombre,
                            formula: w.formula ?? null,
                            bonificacion: w.bonificacion ?? 0,
                            descripcion: w.descripcion ?? "",
                          })
                        }
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-300/70 transition hover:bg-amber-900/30 hover:text-amber-200"
                        title="Editar arma"
                      >
                        ✏
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHabilidad(w.id)}
                        className="rounded-lg p-1.5 text-red-400/60 transition hover:bg-red-900/25 hover:text-red-400"
                        title="Eliminar arma"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isEditMode && (
              <button
                type="button"
                onClick={() => onWeaponModalChange({ mode: "add" })}
                disabled={armas.length >= 15}
                className="w-full rounded-lg border border-amber-400/50 bg-amber-600/15 py-2 text-xs font-bold text-amber-300 transition hover:border-amber-400/80 hover:bg-amber-600/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {armas.length >= 15
                  ? "Límite de armas alcanzado (15/15)"
                  : "+ Agregar arma"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de arma */}
      {weaponModal && (
        <WeaponFormModal
          mode={weaponModal.mode}
          initialNombre={weaponModal.mode === "edit" ? weaponModal.nombre : ""}
          initialFormula={
            weaponModal.mode === "edit" ? weaponModal.formula : null
          }
          initialBonificacion={
            weaponModal.mode === "edit" ? weaponModal.bonificacion : 0
          }
          initialDescripcion={
            weaponModal.mode === "edit" ? weaponModal.descripcion : ""
          }
          isSaving={isWeaponSaving}
          onConfirm={onWeaponConfirm}
          onCancel={() => onWeaponModalChange(null)}
        />
      )}
    </div>
  );
}
