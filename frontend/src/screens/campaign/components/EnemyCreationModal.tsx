import { ImagePlus, X } from "lucide-react";
import { type CreatedCharacterResponse } from "../../personaje/utils/dndApi";
import { useEnemyForm } from "../hooks/useEnemyForm";
import { formatMod, calcMod } from "../utils/enemyUtils";
import EnemyStatsSection from "./enemy/EnemyStatsSection";
import WeaponSection from "./enemy/WeaponSection";
import SkillsAndSavesSection from "./enemy/SkillsAndSavesSection";
import ActionsSection from "./enemy/ActionsSection";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EnemyCreationModalProps {
  isOpen: boolean;
  sistemaDeJuego: string;
  onClose: () => void;
  onCreated: (character: CreatedCharacterResponse) => void;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function EnemyCreationModal({
  isOpen,
  sistemaDeJuego,
  onClose,
  onCreated,
}: EnemyCreationModalProps) {
  const form = useEnemyForm(sistemaDeJuego, onCreated, onClose);

  if (!isOpen) return null;

  const {
    fileInputRef,
    nombre,
    setNombre,
    tipo,
    setTipo,
    vd,
    setVd,
    portrait,
    portraitPreview,
    biografia,
    setBiografia,
    idiomas,
    setIdiomas,
    abilityScores,
    abilityScoreInputs,
    handleScoreInputChange,
    handleScoreBlur,
    ca,
    setCa,
    pvMax,
    setPvMax,
    movimiento,
    setMovimiento,
    iniciativa,
    setIniciativa,
    skillOverrides,
    usedSkills,
    availableSkills,
    addSkill,
    updateSkill,
    removeSkill,
    saveOverrides,
    usedSaves,
    availableSaves,
    addSave,
    updateSave,
    removeSave,
    pasivas,
    addPasiva,
    updatePasiva,
    removePasiva,
    acciones,
    addAccion,
    updateAccion,
    removeAccion,
    weapons,
    setWeapons,
    isSubmitting,
    error,
    fieldErrors,
    setFieldErrors,
    handlePortraitChange,
    clearPortrait,
    handleClose,
    handleSubmit,
  } = form;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-stone-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">Crear NPC</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Portrait upload */}
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePortraitChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-32 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/25 bg-white/5 transition hover:border-amber-300/50 hover:bg-white/10"
            >
              {portraitPreview ? (
                <img
                  src={portraitPreview}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <ImagePlus size={26} className="text-amber-200/70" />
                  <span className="mt-2 px-2 text-center text-[10px] text-white/50">
                    Subir imagen
                  </span>
                </>
              )}
            </button>
            {portrait && (
              <button
                type="button"
                onClick={clearPortrait}
                className="mt-1.5 text-xs text-white/40 hover:text-white/70"
              >
                Eliminar
              </button>
            )}
          </div>

          {/* Nombre / Tipo / VD */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (fieldErrors.nombre)
                    setFieldErrors((prev) => ({ ...prev, nombre: undefined }));
                }}
                placeholder="Nombre del NPC"
                maxLength={100}
                className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${fieldErrors.nombre ? "border-red-400/70" : "border-white/20"}`}
              />
              {fieldErrors.nombre && (
                <p data-field-error className="mt-1 text-xs text-red-400">
                  {fieldErrors.nombre}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                Tipo
              </label>
              <div className="flex gap-2">
                {(["enemigo", "PNJ"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      tipo === t
                        ? "border-amber-400/70 bg-amber-700/20 text-amber-200"
                        : "border-white/20 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {t === "enemigo" ? "Enemigo" : "PNJ"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                Valor de Desafío (VD)
              </label>
              <input
                type="text"
                value={vd}
                onChange={(e) => setVd(e.target.value)}
                placeholder="ej. 1/4, 5, 20"
                maxLength={20}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
              />
            </div>
          </div>

          {/* Ability scores */}
          <EnemyStatsSection
            abilityScores={abilityScores}
            abilityScoreInputs={abilityScoreInputs}
            onInputChange={handleScoreInputChange}
            onBlur={handleScoreBlur}
          />

          {/* Combat stats */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/60">
              Combate
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  CA
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ca}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setCa(Number.isNaN(v) ? 0 : Math.max(0, Math.min(100, v)));
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  PV Máximos
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={pvMax}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPvMax(
                      Number.isNaN(v) ? 1 : Math.max(1, Math.min(999, v)),
                    );
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Movimiento (m)
                </label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={movimiento}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setMovimiento(
                      Number.isNaN(v) ? 0 : Math.max(0, Math.min(999, v)),
                    );
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Iniciativa{" "}
                  <span className="text-white/40">(auto si vacío)</span>
                </label>
                <input
                  type="number"
                  min={-1}
                  max={100}
                  value={iniciativa}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setIniciativa("");
                      return;
                    }
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v))
                      setIniciativa(Math.max(-1, Math.min(100, v)));
                  }}
                  placeholder={`${formatMod(calcMod(abilityScores["Destreza"] ?? 10))}`}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                />
              </div>
            </div>
          </div>

          {/* Biografía */}
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                Biografía / Descripción
              </label>
              <span
                className={`text-[10px] ${biografia.length >= 500 ? "text-red-400" : biografia.length >= 400 ? "text-amber-400" : "text-white/30"}`}
              >
                {biografia.length}/500
              </span>
            </div>
            <textarea
              value={biografia}
              onChange={(e) => setBiografia(e.target.value.slice(0, 500))}
              placeholder="Historia, apariencia, motivaciones..."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>

          {/* Idiomas */}
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                Idiomas <span className="text-white/35">(opcional)</span>
              </label>
              <span
                className={`text-[10px] ${idiomas.length >= 250 ? "text-red-400" : idiomas.length >= 200 ? "text-amber-400" : "text-white/30"}`}
              >
                {idiomas.length}/250
              </span>
            </div>
            <input
              type="text"
              value={idiomas}
              onChange={(e) => setIdiomas(e.target.value.slice(0, 250))}
              placeholder="Ej. Común, élfico, telepatía 60 pies"
              maxLength={250}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>

          {/* Skills & Saves */}
          <SkillsAndSavesSection
            skillOverrides={skillOverrides}
            usedSkills={usedSkills}
            availableSkills={availableSkills}
            addSkill={addSkill}
            updateSkill={updateSkill}
            removeSkill={removeSkill}
            saveOverrides={saveOverrides}
            usedSaves={usedSaves}
            availableSaves={availableSaves}
            addSave={addSave}
            updateSave={updateSave}
            removeSave={removeSave}
          />

          {/* Pasivas & Acciones */}
          <ActionsSection
            pasivas={pasivas}
            addPasiva={addPasiva}
            updatePasiva={updatePasiva}
            removePasiva={removePasiva}
            fieldErrorsPasivas={fieldErrors.pasivas}
            acciones={acciones}
            addAccion={addAccion}
            updateAccion={updateAccion}
            removeAccion={removeAccion}
            fieldErrorsAcciones={fieldErrors.acciones}
          />

          {/* Weapons */}
          <WeaponSection weapons={weapons} onWeaponsChange={setWeapons} />

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-900/25 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-60"
          >
            {isSubmitting ? "Creando..." : "Crear NPC"}
          </button>
        </div>
      </div>
    </div>
  );
}
