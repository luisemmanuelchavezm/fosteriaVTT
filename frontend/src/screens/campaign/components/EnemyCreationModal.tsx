import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import {
  crearNpc,
  addDndCharacterInventoryItem,
  addHabilidadNpc,
  fetchObjectCatalog,
  type CreatedCharacterResponse,
  type AddDndCharacterInventoryItemRequest,
  type ObjectCatalogResponse,
} from "../../personaje/utils/dndApi";
import { ABILITY_STATS } from "../../personaje/creatednd/utils/statisticsUtils";
import {
  SKILL_ROWS,
  SAVING_THROW_ROWS,
} from "../../personaje/dndcharactersheet/data";

interface EnemyCreationModalProps {
  isOpen: boolean;
  sistemaDeJuego: string;
  onClose: () => void;
  onCreated: (character: CreatedCharacterResponse) => void;
}

interface SkillOverride {
  skill: string;
  bonus: number;
}

interface SaveOverride {
  ability: string;
  bonus: number;
}

interface PassiveEntry {
  nombre: string;
  descripcion: string;
}

interface ActionEntry {
  nombre: string;
  descripcion: string;
}

interface WeaponEntry {
  key: number;
  displayName: string;
  payload: AddDndCharacterInventoryItemRequest;
}

function calcMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatMod(mod: number) {
  return mod >= 0 ? `+${mod}` : String(mod);
}

const ABILITY_NAMES = ABILITY_STATS.map((s) => s.name);

const DEFAULT_SCORES: Record<string, number> = Object.fromEntries(
  ABILITY_NAMES.map((n) => [n, 10]),
);

export default function EnemyCreationModal({
  isOpen,
  sistemaDeJuego,
  onClose,
  onCreated,
}: EnemyCreationModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"enemigo" | "PNJ">("enemigo");
  const [vd, setVd] = useState("");
  const [portrait, setPortrait] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [abilityScores, setAbilityScores] =
    useState<Record<string, number>>(DEFAULT_SCORES);
  const [abilityScoreInputs, setAbilityScoreInputs] = useState<
    Record<string, string>
  >(Object.fromEntries(ABILITY_NAMES.map((n) => [n, "10"])));
  const [ca, setCa] = useState(10);
  const [pvMax, setPvMax] = useState(10);
  const [movimiento, setMovimiento] = useState(30);
  const [iniciativa, setIniciativa] = useState<number | "">("");
  const [biografia, setBiografia] = useState("");
  const [skillOverrides, setSkillOverrides] = useState<SkillOverride[]>([]);
  const [saveOverrides, setSaveOverrides] = useState<SaveOverride[]>([]);
  const [pasivas, setPasivas] = useState<PassiveEntry[]>([]);
  const [acciones, setAcciones] = useState<ActionEntry[]>([]);
  const [weapons, setWeapons] = useState<WeaponEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nombre?: string;
    pasivas?: Partial<Record<number, string>>;
    acciones?: Partial<Record<number, string>>;
  }>({});

  if (!isOpen) return null;

  const handlePortraitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPortrait(file);
    const reader = new FileReader();
    reader.onload = (e) => setPortraitPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleScoreInputChange = (name: string, raw: string) => {
    setAbilityScoreInputs((prev) => ({ ...prev, [name]: raw }));
  };

  const handleScoreBlur = (name: string) => {
    const raw = abilityScoreInputs[name] ?? "";
    let v = parseInt(raw, 10);
    if (Number.isNaN(v)) v = 8;
    v = Math.max(8, Math.min(30, v));
    setAbilityScores((prev) => ({ ...prev, [name]: v }));
    setAbilityScoreInputs((prev) => ({ ...prev, [name]: String(v) }));
  };

  // Skills
  const usedSkills = skillOverrides.map((s) => s.skill);
  const availableSkills = SKILL_ROWS.filter(
    (r) => !usedSkills.includes(r.name),
  );
  const addSkill = () => {
    if (availableSkills.length === 0) return;
    setSkillOverrides((prev) => [
      ...prev,
      { skill: availableSkills[0].name, bonus: 0 },
    ]);
  };
  const updateSkill = (
    index: number,
    field: "skill" | "bonus",
    value: string | number,
  ) => {
    setSkillOverrides((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };
  const removeSkill = (index: number) =>
    setSkillOverrides((prev) => prev.filter((_, i) => i !== index));

  // Saving throws
  const usedSaves = saveOverrides.map((s) => s.ability);
  const availableSaves = SAVING_THROW_ROWS.filter(
    (r) => !usedSaves.includes(r.statName),
  );
  const addSave = () => {
    if (availableSaves.length === 0) return;
    setSaveOverrides((prev) => [
      ...prev,
      { ability: availableSaves[0].statName, bonus: 0 },
    ]);
  };
  const updateSave = (
    index: number,
    field: "ability" | "bonus",
    value: string | number,
  ) => {
    setSaveOverrides((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };
  const removeSave = (index: number) =>
    setSaveOverrides((prev) => prev.filter((_, i) => i !== index));

  // Passives
  const addPasiva = () => {
    if (pasivas.length >= 20) return;
    setPasivas((prev) => [...prev, { nombre: "", descripcion: "" }]);
  };
  const updatePasiva = (
    index: number,
    field: "nombre" | "descripcion",
    value: string,
  ) => {
    setPasivas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
    if (field === "nombre" && fieldErrors.pasivas?.[index]) {
      setFieldErrors((prev) => ({
        ...prev,
        pasivas: { ...prev.pasivas, [index]: undefined },
      }));
    }
  };
  const removePasiva = (index: number) =>
    setPasivas((prev) => prev.filter((_, i) => i !== index));

  // Actions
  const addAccion = () => {
    if (acciones.length >= 20) return;
    setAcciones((prev) => [...prev, { nombre: "", descripcion: "" }]);
  };
  const updateAccion = (
    index: number,
    field: "nombre" | "descripcion",
    value: string,
  ) => {
    setAcciones((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    );
    if (field === "nombre" && fieldErrors.acciones?.[index]) {
      setFieldErrors((prev) => ({
        ...prev,
        acciones: { ...prev.acciones, [index]: undefined },
      }));
    }
  };
  const removeAccion = (index: number) =>
    setAcciones((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setError("No hay sesión activa");
      return;
    }

    for (const sk of skillOverrides) {
      if (!sk.skill) {
        setError("Selecciona una habilidad o elimínala");
        return;
      }
    }
    for (const sv of saveOverrides) {
      if (!sv.ability) {
        setError("Selecciona una salvación o elimínala");
        return;
      }
    }

    const newFieldErrors: typeof fieldErrors = {};
    if (!nombre.trim()) newFieldErrors.nombre = "El nombre es requerido";

    const pasivaErrors: Partial<Record<number, string>> = {};
    pasivas.forEach((p, i) => {
      if (!p.nombre.trim()) pasivaErrors[i] = "El nombre es requerido";
    });
    if (Object.keys(pasivaErrors).length > 0)
      newFieldErrors.pasivas = pasivaErrors;

    const accionErrors: Partial<Record<number, string>> = {};
    acciones.forEach((a, i) => {
      if (!a.nombre.trim()) accionErrors[i] = "El nombre es requerido";
    });
    if (Object.keys(accionErrors).length > 0)
      newFieldErrors.acciones = accionErrors;

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      window.setTimeout(() => {
        document
          .querySelector("[data-field-error]")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 30);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const estadisticas: Record<string, number> = { ...abilityScores };
      estadisticas["CA"] = ca;
      estadisticas["Puntos de vida"] = pvMax;
      estadisticas["Vida actual"] = pvMax;
      estadisticas["Vida temporal"] = 0;
      estadisticas["Movimiento"] = movimiento;

      const dexMod = calcMod(abilityScores["Destreza"] ?? 10);
      estadisticas["Iniciativa"] =
        iniciativa !== "" ? Number(iniciativa) : dexMod;

      for (const sk of skillOverrides) {
        estadisticas[sk.skill] = sk.bonus;
      }
      for (const sv of saveOverrides) {
        estadisticas[`Salvacion de ${sv.ability}`] = sv.bonus;
      }

      const result = await crearNpc(
        token,
        {
          nombre: nombre.trim(),
          tipo,
          sistemaDeJuego,
          vd: vd.trim() || undefined,
          biografia: biografia.trim() || undefined,
          estadisticas,
        },
        portrait,
      );

      const npcId = result.id;

      // Sequential to avoid JPA lost-update: each call loads + saves the same Personaje;
      // concurrent saves would overwrite each other's habilidades changes.
      for (const w of weapons) {
        await addDndCharacterInventoryItem(token, npcId, w.payload);
      }
      for (const p of pasivas) {
        await addHabilidadNpc(token, npcId, {
          nombre: p.nombre.trim(),
          descripcion: p.descripcion.trim() || null,
          tags: "NPC,PASIVA",
        });
      }
      for (const a of acciones) {
        await addHabilidadNpc(token, npcId, {
          nombre: a.nombre.trim(),
          descripcion: a.descripcion.trim() || null,
          tags: "NPC,ACCION",
        });
      }

      onCreated(result);
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNombre("");
    setTipo("enemigo");
    setVd("");
    setPortrait(null);
    setPortraitPreview(null);
    setAbilityScores(DEFAULT_SCORES);
    setAbilityScoreInputs(
      Object.fromEntries(ABILITY_NAMES.map((n) => [n, "10"])),
    );
    setCa(10);
    setPvMax(10);
    setMovimiento(30);
    setIniciativa("");
    setBiografia("");
    setSkillOverrides([]);
    setSaveOverrides([]);
    setPasivas([]);
    setAcciones([]);
    setWeapons([]);
    setError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

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
                onClick={() => {
                  setPortrait(null);
                  setPortraitPreview(null);
                }}
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
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/60">
              Estadísticas
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITY_STATS.map((stat) => {
                const score = abilityScores[stat.name] ?? 10;
                const mod = calcMod(score);
                return (
                  <div
                    key={stat.id}
                    className="flex flex-col items-center rounded-[18px] border-2 border-white bg-white px-2 py-3 text-center shadow-md"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                      {stat.name}
                    </p>
                    <p className="my-0.5 text-xl font-bold text-stone-900">
                      {formatMod(mod)}
                    </p>
                    <input
                      type="number"
                      min={8}
                      max={30}
                      value={abilityScoreInputs[stat.name] ?? String(score)}
                      onChange={(e) =>
                        handleScoreInputChange(stat.name, e.target.value)
                      }
                      onBlur={() => handleScoreBlur(stat.name)}
                      className="mt-0.5 w-full rounded-lg border border-stone-200 bg-stone-50 py-0.5 text-center text-sm font-semibold text-stone-800 outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

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

          {/* Skills */}
          <DynamicSection
            title="Habilidades"
            onAdd={addSkill}
            addDisabled={availableSkills.length === 0}
            addLabel="+ Habilidad"
          >
            {skillOverrides.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={entry.skill}
                  onChange={(e) => updateSkill(index, "skill", e.target.value)}
                  className="flex-1 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
                >
                  {SKILL_ROWS.filter(
                    (r) =>
                      r.name === entry.skill || !usedSkills.includes(r.name),
                  ).map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={-1}
                  max={30}
                  value={entry.bonus}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    updateSkill(
                      index,
                      "bonus",
                      Number.isNaN(v) ? 0 : Math.max(-1, Math.min(30, v)),
                    );
                  }}
                  className="w-16 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </DynamicSection>

          {/* Saving throws */}
          <DynamicSection
            title="Salvaciones"
            onAdd={addSave}
            addDisabled={availableSaves.length === 0}
            addLabel="+ Salvación"
          >
            {saveOverrides.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={entry.ability}
                  onChange={(e) => updateSave(index, "ability", e.target.value)}
                  className="flex-1 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
                >
                  {SAVING_THROW_ROWS.filter(
                    (r) =>
                      r.statName === entry.ability ||
                      !usedSaves.includes(r.statName),
                  ).map((r) => (
                    <option key={r.statName} value={r.statName}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={-1}
                  max={30}
                  value={entry.bonus}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    updateSave(
                      index,
                      "bonus",
                      Number.isNaN(v) ? 0 : Math.max(-1, Math.min(30, v)),
                    );
                  }}
                  className="w-16 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSave(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </DynamicSection>

          {/* Pasivas */}
          <DynamicSection
            title="Pasivas"
            onAdd={addPasiva}
            addDisabled={pasivas.length >= 20}
            addLabel="+ Pasiva"
          >
            {pasivas.map((entry, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={entry.nombre}
                      onChange={(e) =>
                        updatePasiva(index, "nombre", e.target.value)
                      }
                      placeholder="Nombre de la pasiva"
                      maxLength={100}
                      className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${fieldErrors.pasivas?.[index] ? "border-red-400/70" : "border-white/20"}`}
                    />
                    {fieldErrors.pasivas?.[index] && (
                      <p data-field-error className="text-xs text-red-400">
                        {fieldErrors.pasivas[index]}
                      </p>
                    )}
                    <div>
                      <textarea
                        value={entry.descripcion}
                        onChange={(e) =>
                          updatePasiva(
                            index,
                            "descripcion",
                            e.target.value.slice(0, 500),
                          )
                        }
                        placeholder="Descripción..."
                        rows={2}
                        maxLength={500}
                        className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                      />
                      {entry.descripcion.length > 400 && (
                        <p
                          className={`mt-0.5 text-right text-[9px] ${entry.descripcion.length >= 500 ? "text-red-400" : "text-amber-400"}`}
                        >
                          {entry.descripcion.length}/500
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePasiva(index)}
                    className="mt-0.5 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </DynamicSection>

          {/* Acciones */}
          <DynamicSection
            title="Acciones"
            onAdd={addAccion}
            addDisabled={acciones.length >= 20}
            addLabel="+ Acción"
          >
            {acciones.map((entry, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={entry.nombre}
                      onChange={(e) =>
                        updateAccion(index, "nombre", e.target.value)
                      }
                      placeholder="Nombre de la acción"
                      maxLength={100}
                      className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${fieldErrors.acciones?.[index] ? "border-red-400/70" : "border-white/20"}`}
                    />
                    {fieldErrors.acciones?.[index] && (
                      <p data-field-error className="text-xs text-red-400">
                        {fieldErrors.acciones[index]}
                      </p>
                    )}
                    <div>
                      <textarea
                        value={entry.descripcion}
                        onChange={(e) =>
                          updateAccion(
                            index,
                            "descripcion",
                            e.target.value.slice(0, 500),
                          )
                        }
                        placeholder="Descripción..."
                        rows={2}
                        maxLength={500}
                        className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                      />
                      {entry.descripcion.length > 400 && (
                        <p
                          className={`mt-0.5 text-right text-[9px] ${entry.descripcion.length >= 500 ? "text-red-400" : "text-amber-400"}`}
                        >
                          {entry.descripcion.length}/500
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAccion(index)}
                    className="mt-0.5 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </DynamicSection>

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

// ─── DynamicSection ────────────────────────────────────────────────────────────

interface DynamicSectionProps {
  title: string;
  onAdd: () => void;
  addDisabled: boolean;
  addLabel: string;
  children: React.ReactNode;
}

function DynamicSection({
  title,
  onAdd,
  addDisabled,
  addLabel,
  children,
}: DynamicSectionProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-white/60">
          {title}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className="flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-700/15 px-2 py-1 text-[11px] font-bold text-amber-300 transition hover:bg-amber-700/30 disabled:opacity-40"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── WeaponSection ─────────────────────────────────────────────────────────────

const WEAPON_ABILITY_OPTIONS = [
  { value: "@fuerza", label: "Fuerza" },
  { value: "@destreza", label: "Destreza" },
  { value: "@constitucion", label: "Constitución" },
  { value: "@inteligencia", label: "Inteligencia" },
  { value: "@sabiduria", label: "Sabiduría" },
  { value: "@carisma", label: "Carisma" },
];

interface WeaponSectionProps {
  weapons: WeaponEntry[];
  onWeaponsChange: React.Dispatch<React.SetStateAction<WeaponEntry[]>>;
}

function WeaponSection({ weapons, onWeaponsChange }: WeaponSectionProps) {
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");

  // Catalog state
  const [search, setSearch] = useState("");
  const [catalogItems, setCatalogItems] = useState<ObjectCatalogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Custom weapon state
  const [customNombre, setCustomNombre] = useState("");
  const [customDescripcion, setCustomDescripcion] = useState("");
  const [diceParts, setDiceParts] = useState<
    { count: string; sides: string }[]
  >([]);
  const [baseBonus, setBaseBonus] = useState("");
  const [showBaseBonus, setShowBaseBonus] = useState(false);
  const [selectedModifier, setSelectedModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>([]);
  const [attackBonus, setAttackBonus] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const keyCounter = useRef(0);

  // Catalog search with debounce
  useEffect(() => {
    if (tab !== "catalog") return;
    const token = localStorage.getItem("jwtToken") ?? "";
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setCatalogError(null);
      void fetchObjectCatalog(
        token,
        { nombre: search.trim() || undefined, tipo: "ARMA" },
        abortController.signal,
      )
        .then(setCatalogItems)
        .catch((err) => {
          if ((err as Error).name !== "AbortError") {
            setCatalogError("No se pudo cargar el catálogo.");
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsLoading(false);
        });
    }, 200);
    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [tab, search]);

  const builtFormula = useMemo(() => {
    const parts: string[] = [];
    for (const die of diceParts) {
      const count = parseInt(die.count, 10);
      const sides = parseInt(die.sides, 10);
      if (!isNaN(count) && !isNaN(sides) && count > 0 && sides > 0) {
        parts.push(`${count}d${sides}`);
      }
    }
    const bonusParsed = parseInt(baseBonus, 10);
    if (!isNaN(bonusParsed) && bonusParsed > 0) parts.push(String(bonusParsed));
    parts.push(...abilityModifiers);
    return parts.join(" + ").trim() || null;
  }, [diceParts, baseBonus, abilityModifiers]);

  const addFromCatalog = (item: ObjectCatalogResponse) => {
    const key = keyCounter.current++;
    onWeaponsChange((prev) => [
      ...prev,
      {
        key,
        displayName: item.nombre,
        payload: { objetoId: item.id, cantidad: 1 },
      },
    ]);
  };

  const addCustomWeapon = () => {
    if (!customNombre.trim()) {
      setCustomError("El nombre es requerido");
      return;
    }
    const key = keyCounter.current++;
    const attackBonusNum =
      attackBonus !== "" ? parseInt(attackBonus, 10) : null;
    const indice =
      attackBonusNum !== null && !isNaN(attackBonusNum)
        ? `BONO_ATAQUE=${attackBonusNum}`
        : "ASCuerpo,COMPETENTE_POR_DEFECTO";
    onWeaponsChange((prev) => [
      ...prev,
      {
        key,
        displayName: `${customNombre.trim()}${builtFormula ? ` (${builtFormula})` : ""}`,
        payload: {
          nombre: customNombre.trim(),
          formula: builtFormula,
          descripcion: customDescripcion.trim() || null,
          tipoObjeto: "ARMA",
          indice,
          cantidad: 1,
        },
      },
    ]);
    setCustomNombre("");
    setCustomDescripcion("");
    setDiceParts([]);
    setBaseBonus("");
    setShowBaseBonus(false);
    setSelectedModifier("");
    setAbilityModifiers([]);
    setAttackBonus("");
    setCustomError(null);
  };

  const removeWeapon = (key: number) =>
    onWeaponsChange((prev) => prev.filter((w) => w.key !== key));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-white/60">
          Armas / Ataques
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-2">
        {(["catalog", "custom"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              tab === t
                ? "bg-amber-200 text-stone-950"
                : "border border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {t === "catalog" ? "Catálogo" : "Personalizada"}
          </button>
        ))}
      </div>

      {/* Catalog tab */}
      {tab === "catalog" && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar arma..."
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50"
          />
          {catalogError && (
            <p className="text-xs text-red-400">{catalogError}</p>
          )}
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {isLoading && (
              <p className="py-2 text-center text-xs text-white/40">
                Cargando catálogo...
              </p>
            )}
            {!isLoading && catalogItems.length === 0 && (
              <p className="py-2 text-center text-xs text-white/40">
                No hay armas que coincidan.
              </p>
            )}
            {catalogItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {item.nombre}
                  </p>
                  {item.formula && (
                    <p className="text-xs text-amber-200/80">{item.formula}</p>
                  )}
                  {item.descripcion && (
                    <p className="line-clamp-1 text-[11px] text-white/50">
                      {item.descripcion}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addFromCatalog(item)}
                  className="flex-shrink-0 rounded-full border border-amber-300/30 bg-amber-700/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-700/40"
                >
                  Añadir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom tab */}
      {tab === "custom" && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Nombre del arma
            </label>
            <input
              type="text"
              value={customNombre}
              onChange={(e) => setCustomNombre(e.target.value)}
              placeholder="Ej. Espada del Caos"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>

          {/* Formula builder */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                Fórmula de daño
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setDiceParts((p) =>
                      p.length < 3 ? [...p, { count: "", sides: "" }] : p,
                    )
                  }
                  disabled={diceParts.length >= 3}
                  className="rounded px-2 py-0.5 text-[10px] font-semibold border border-white/15 text-white/70 hover:bg-white/10 disabled:opacity-40"
                >
                  + Dado
                </button>
                {!showBaseBonus && !baseBonus && (
                  <button
                    type="button"
                    onClick={() => setShowBaseBonus(true)}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold border border-white/15 text-white/70 hover:bg-white/10"
                  >
                    + Bonif.
                  </button>
                )}
                <select
                  value={selectedModifier}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && abilityModifiers.length < 3) {
                      setAbilityModifiers((p) => [...p, val]);
                    }
                    setSelectedModifier("");
                  }}
                  className="rounded px-2 py-0.5 text-[10px] border border-white/15 bg-black/40 text-white/70 outline-none"
                >
                  <option value="">+ Mod.</option>
                  {WEAPON_ABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dice parts */}
            {diceParts.map((die, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={die.count}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const clamped = isNaN(v)
                      ? ""
                      : String(Math.max(1, Math.min(10, v)));
                    setDiceParts((p) =>
                      p.map((d, j) => (j === i ? { ...d, count: clamped } : d)),
                    );
                  }}
                  placeholder="N"
                  className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm font-bold text-white/50">d</span>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={die.sides}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const clamped = isNaN(v)
                      ? ""
                      : String(Math.max(2, Math.min(100, v)));
                    setDiceParts((p) =>
                      p.map((d, j) => (j === i ? { ...d, sides: clamped } : d)),
                    );
                  }}
                  placeholder="S"
                  className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDiceParts((p) => p.filter((_, j) => j !== i))
                  }
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Base bonus */}
            {(showBaseBonus || baseBonus) && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Bonif.:</span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={baseBonus}
                  onChange={(e) => setBaseBonus(e.target.value)}
                  placeholder="0"
                  className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-xs text-white outline-none"
                />
              </div>
            )}

            {/* Ability modifier chips */}
            {abilityModifiers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {abilityModifiers.map((mod, i) => (
                  <button
                    key={`${mod}-${i}`}
                    type="button"
                    onClick={() =>
                      setAbilityModifiers((p) => p.filter((_, j) => j !== i))
                    }
                    className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-200"
                  >
                    {WEAPON_ABILITY_OPTIONS.find((o) => o.value === mod)
                      ?.label ?? mod}{" "}
                    ×
                  </button>
                ))}
              </div>
            )}

            {/* Formula preview */}
            <p className="text-xs text-amber-200/70">
              {builtFormula ?? "Sin fórmula de daño"}
            </p>
          </div>

          {/* Attack bonus */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Bonificador de ataque{" "}
              <span className="text-white/35">(vacío = auto)</span>
            </label>
            <input
              type="number"
              min={-1}
              max={100}
              value={attackBonus}
              onChange={(e) => {
                if (e.target.value === "") {
                  setAttackBonus("");
                  return;
                }
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v))
                  setAttackBonus(String(Math.max(-1, Math.min(100, v))));
              }}
              placeholder="auto (competencia + FUE/DES)"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-400/60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              Descripción
            </label>
            <textarea
              value={customDescripcion}
              onChange={(e) => setCustomDescripcion(e.target.value)}
              placeholder="Descripción del arma (opcional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>

          {customError && <p className="text-xs text-red-400">{customError}</p>}

          <button
            type="button"
            onClick={addCustomWeapon}
            className="w-full rounded-lg border border-amber-400/40 bg-amber-700/20 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-700/30"
          >
            Añadir arma
          </button>
        </div>
      )}

      {/* Added weapons list */}
      {weapons.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {weapons.map((w) => (
            <div
              key={w.key}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5"
            >
              <p className="flex-1 truncate text-xs text-white">
                {w.displayName}
              </p>
              <button
                type="button"
                onClick={() => removeWeapon(w.key)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
