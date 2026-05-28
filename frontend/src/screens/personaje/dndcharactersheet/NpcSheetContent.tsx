import { useState } from "react";
import type { DndCharacterDetailResponse } from "../utils/dndApi";
import { useNpcEdit } from "./hooks/useNpcEdit";
import NpcStatsTab from "./components/npc/NpcStatsTab";
import NpcInfoTab from "./components/npc/NpcInfoTab";
import NpcRasgosTab from "./components/npc/NpcRasgosTab";

type NpcTab = "estadisticas" | "info" | "rasgos";

interface NpcSheetContentProps {
  character: DndCharacterDetailResponse;
  currentHp: number;
  totalHp: number;
  tempHp: number;
  hpDelta: string;
  tempHpDelta: string;
  onHpDeltaChange: (value: string) => void;
  onTempHpDeltaChange: (value: string) => void;
  onHeal: () => void;
  onDamage: () => void;
  onGainTempHp: () => void;
  onLoseTempHp: () => void;
  onIncrementHpDelta: () => void;
  onDecrementHpDelta: () => void;
  onIncrementTempHpDelta: () => void;
  onDecrementTempHpDelta: () => void;
  sanitizeNonNegativeNumber: (value: string) => string;
  characterId?: string;
  isOwner?: boolean;
  onNpcSaved?: (character: DndCharacterDetailResponse) => void;
}

const TABS: { key: NpcTab; label: string }[] = [
  { key: "estadisticas", label: "Estadísticas" },
  { key: "info", label: "Información" },
  { key: "rasgos", label: "Rasgos" },
];

export default function NpcSheetContent({
  character,
  currentHp,
  totalHp,
  tempHp,
  hpDelta,
  tempHpDelta,
  onHpDeltaChange,
  onTempHpDeltaChange,
  onHeal,
  onDamage,
  onGainTempHp,
  onLoseTempHp,
  onIncrementHpDelta,
  onDecrementHpDelta,
  onIncrementTempHpDelta,
  onDecrementTempHpDelta,
  sanitizeNonNegativeNumber,
  characterId,
  isOwner,
  onNpcSaved,
}: NpcSheetContentProps) {
  const [activeTab, setActiveTab] = useState<NpcTab>("estadisticas");

  const edit = useNpcEdit({ character, characterId, isOwner, onNpcSaved });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      {/* Retrato + nombre */}
      <div className="flex flex-col items-center gap-3">
        <label
          className={`relative h-28 w-28 overflow-hidden rounded-2xl border-2 shadow-lg transition ${
            isOwner && edit.isEditMode
              ? "cursor-pointer border-amber-400/60 hover:border-amber-400"
              : "cursor-default border-amber-400/40"
          }`}
          title={isOwner && edit.isEditMode ? "Cambiar imagen" : undefined}
        >
          {isOwner && edit.isEditMode && (
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void edit.handlePortraitChange(file);
                e.target.value = "";
              }}
            />
          )}
          {edit.isUploadingPortrait ? (
            <div className="flex h-full w-full items-center justify-center bg-black/60">
              <span className="text-xs font-semibold text-white/60">
                Subiendo…
              </span>
            </div>
          ) : character.retrato ? (
            <img
              src={character.retrato}
              alt={character.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-12 w-12 text-white/30"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          )}
          {isOwner && edit.isEditMode && !edit.isUploadingPortrait && (
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent pb-1.5 opacity-0 transition-opacity hover:opacity-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                Cambiar
              </span>
            </div>
          )}
        </label>

        {edit.isEditMode ? (
          <input
            type="text"
            value={edit.editNombre}
            onChange={(e) => edit.setEditNombre(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-center text-xl font-bold text-white outline-none focus:border-amber-400/60"
          />
        ) : (
          <h2 className="text-2xl font-bold text-white">{character.nombre}</h2>
        )}

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              character.tipo === "PNJ"
                ? "bg-sky-700/40 text-sky-200"
                : "bg-rose-800/40 text-rose-200"
            }`}
          >
            {character.tipo === "PNJ" ? "PNJ" : "Enemigo"}
          </span>

          {isOwner && characterId && onNpcSaved && (
            <button
              type="button"
              onClick={edit.handleToggleEdit}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition ${
                edit.isEditMode
                  ? "bg-white/10 text-white/60 hover:bg-white/15"
                  : "bg-amber-600/25 text-amber-200 hover:bg-amber-600/40"
              }`}
            >
              {edit.isEditMode ? "Cancelar" : "✏ Editar"}
            </button>
          )}

          {edit.isEditMode && (
            <button
              type="button"
              onClick={() => void edit.handleSaveNpc()}
              disabled={edit.isSaving}
              className="rounded-full bg-emerald-600/30 px-3 py-0.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-600/50 disabled:opacity-50"
            >
              {edit.isSaving ? "Guardando…" : "💾 Guardar"}
            </button>
          )}
        </div>

        {edit.saveError && (
          <p className="text-xs text-red-400">{edit.saveError}</p>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "border-b-2 border-amber-400 text-amber-200"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      {activeTab === "estadisticas" && (
        <NpcStatsTab
          character={character}
          isEditMode={edit.isEditMode}
          editStats={edit.editStats}
          onEditStatsChange={edit.setEditStats}
          isOwner={isOwner}
          currentHp={currentHp}
          totalHp={totalHp}
          tempHp={tempHp}
          hpDelta={hpDelta}
          tempHpDelta={tempHpDelta}
          onHpDeltaChange={onHpDeltaChange}
          onTempHpDeltaChange={onTempHpDeltaChange}
          onHeal={onHeal}
          onDamage={onDamage}
          onGainTempHp={onGainTempHp}
          onLoseTempHp={onLoseTempHp}
          onIncrementHpDelta={onIncrementHpDelta}
          onDecrementHpDelta={onDecrementHpDelta}
          onIncrementTempHpDelta={onIncrementTempHpDelta}
          onDecrementTempHpDelta={onDecrementTempHpDelta}
          sanitizeNonNegativeNumber={sanitizeNonNegativeNumber}
        />
      )}

      {activeTab === "info" && (
        <NpcInfoTab
          character={character}
          isEditMode={edit.isEditMode}
          editVd={edit.editVd}
          onEditVdChange={edit.setEditVd}
          editBiografia={edit.editBiografia}
          onEditBiografiaChange={edit.setEditBiografia}
          displayHabilidades={edit.displayHabilidades}
          onDeleteHabilidad={(id) => void edit.handleDeleteHabilidad(id)}
          newIdioma={edit.newIdioma}
          onNewIdiomaChange={edit.setNewIdioma}
          isAddingIdioma={edit.isAddingIdioma}
          onAddIdioma={() => void edit.handleAddIdioma()}
        />
      )}

      {activeTab === "rasgos" && (
        <NpcRasgosTab
          isEditMode={edit.isEditMode}
          pasivas={edit.pasivas}
          acciones={edit.acciones}
          armas={edit.armas}
          onDeleteHabilidad={(id) => void edit.handleDeleteHabilidad(id)}
          showAddForm={edit.showAddForm}
          onShowAddFormChange={edit.setShowAddForm}
          newHabilidadNombre={edit.newHabilidadNombre}
          onNewHabilidadNombreChange={edit.setNewHabilidadNombre}
          newHabilidadDesc={edit.newHabilidadDesc}
          onNewHabilidadDescChange={edit.setNewHabilidadDesc}
          newHabilidadTipo={edit.newHabilidadTipo}
          onNewHabilidadTipoChange={edit.setNewHabilidadTipo}
          isAddingHabilidad={edit.isAddingHabilidad}
          onAddHabilidad={() => void edit.handleAddHabilidad()}
          weaponModal={edit.weaponModal}
          onWeaponModalChange={edit.setWeaponModal}
          isWeaponSaving={edit.isWeaponSaving}
          onWeaponConfirm={(data) => void edit.handleWeaponConfirm(data)}
        />
      )}
    </div>
  );
}
