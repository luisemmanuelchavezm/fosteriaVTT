import { useRef, useState } from "react";
import {
  crearNpc,
  addDndCharacterInventoryItem,
  addHabilidadNpc,
  type CreatedCharacterResponse,
} from "../../personaje/utils/dndApi";
import {
  crearNpcAdmin,
  addHabilidadNpcAdmin,
  addDndInventoryAdmin,
} from "../../../lib/adminApi";
import { ABILITY_STATS } from "../../personaje/creatednd/utils/statisticsUtils";
import {
  SKILL_ROWS,
  SAVING_THROW_ROWS,
} from "../../personaje/dndcharactersheet/data";
import {
  calcMod,
  type SkillOverride,
  type SaveOverride,
  type PassiveEntry,
  type ActionEntry,
  type WeaponEntry,
} from "../utils/enemyUtils";

const ABILITY_NAMES = ABILITY_STATS.map((s) => s.name);

const DEFAULT_SCORES: Record<string, number> = Object.fromEntries(
  ABILITY_NAMES.map((n) => [n, 10]),
);

export function useEnemyForm(
  sistemaDeJuego: string,
  onCreated: (character: CreatedCharacterResponse) => void,
  onClose: () => void,
  adminMode = false,
) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Basic info
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"enemigo" | "PNJ">("enemigo");
  const [vd, setVd] = useState("");
  const [portrait, setPortrait] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [biografia, setBiografia] = useState("");
  const [idiomas, setIdiomas] = useState("");

  // Ability scores
  const [abilityScores, setAbilityScores] =
    useState<Record<string, number>>(DEFAULT_SCORES);
  const [abilityScoreInputs, setAbilityScoreInputs] = useState<
    Record<string, string>
  >(Object.fromEntries(ABILITY_NAMES.map((n) => [n, "10"])));

  // Combat stats
  const [ca, setCa] = useState(10);
  const [pvMax, setPvMax] = useState(10);
  const [movimiento, setMovimiento] = useState(30);
  const [iniciativa, setIniciativa] = useState<number | "">("");

  // Proficiencies & overrides
  const [skillOverrides, setSkillOverrides] = useState<SkillOverride[]>([]);
  const [saveOverrides, setSaveOverrides] = useState<SaveOverride[]>([]);

  // Abilities
  const [pasivas, setPasivas] = useState<PassiveEntry[]>([]);
  const [acciones, setAcciones] = useState<ActionEntry[]>([]);
  const [weapons, setWeapons] = useState<WeaponEntry[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nombre?: string;
    portrait?: string;
    pasivas?: Partial<Record<number, string>>;
    acciones?: Partial<Record<number, string>>;
  }>({});

  // ─── Portrait ──────────────────────────────────────────────────────────────

  const handlePortraitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPortrait(file);
    setFieldErrors((prev) => ({ ...prev, portrait: undefined }));
    const reader = new FileReader();
    reader.onload = (e) => setPortraitPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearPortrait = () => {
    setPortrait(null);
    setPortraitPreview(null);
    setFieldErrors((prev) => ({
      ...prev,
      portrait: "La imagen es requerida",
    }));
  };

  // ─── Ability scores ────────────────────────────────────────────────────────

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

  // ─── Skills ────────────────────────────────────────────────────────────────

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

  // ─── Saving throws ─────────────────────────────────────────────────────────

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

  // ─── Passives ──────────────────────────────────────────────────────────────

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

  // ─── Actions ───────────────────────────────────────────────────────────────

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

  // ─── Reset / Close ─────────────────────────────────────────────────────────

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
    setIdiomas("");
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

  // ─── Submit ────────────────────────────────────────────────────────────────

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
    if (!portrait) newFieldErrors.portrait = "La imagen es requerida";

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

      const npcPayload = {
        nombre: nombre.trim(),
        tipo,
        sistemaDeJuego,
        vd: vd.trim() || undefined,
        biografia: biografia.trim() || undefined,
        estadisticas,
      };

      const result = adminMode
        ? await crearNpcAdmin(token, npcPayload, portrait)
        : await crearNpc(token, npcPayload, portrait);

      const npcId = result.id;
      const addInventory = adminMode
        ? addDndInventoryAdmin
        : addDndCharacterInventoryItem;
      const addHabilidad = adminMode ? addHabilidadNpcAdmin : addHabilidadNpc;

      for (const w of weapons) {
        await addInventory(token, npcId, w.payload);
      }
      for (const p of pasivas) {
        await addHabilidad(token, npcId, {
          nombre: p.nombre.trim(),
          descripcion: p.descripcion.trim() || null,
          tags: "NPC,PASIVA",
        });
      }
      for (const a of acciones) {
        await addHabilidad(token, npcId, {
          nombre: a.nombre.trim(),
          descripcion: a.descripcion.trim() || null,
          tags: "NPC,ACCION",
        });
      }
      if (idiomas.trim()) {
        for (const idioma of idiomas
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean)) {
          await addHabilidad(token, npcId, {
            nombre: `Idioma: ${idioma}`,
            descripcion: null,
            tags: "NPC,IDIOMA",
          });
        }
      }

      onCreated(result);
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // refs
    fileInputRef,
    // basic
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
    // ability scores
    abilityScores,
    abilityScoreInputs,
    handleScoreInputChange,
    handleScoreBlur,
    // combat
    ca,
    setCa,
    pvMax,
    setPvMax,
    movimiento,
    setMovimiento,
    iniciativa,
    setIniciativa,
    // skills
    skillOverrides,
    usedSkills,
    availableSkills,
    addSkill,
    updateSkill,
    removeSkill,
    // saves
    saveOverrides,
    usedSaves,
    availableSaves,
    addSave,
    updateSave,
    removeSave,
    // passives
    pasivas,
    addPasiva,
    updatePasiva,
    removePasiva,
    // actions
    acciones,
    addAccion,
    updateAccion,
    removeAccion,
    // weapons
    weapons,
    setWeapons,
    // ui
    isSubmitting,
    error,
    fieldErrors,
    setFieldErrors,
    // handlers
    handlePortraitChange,
    clearPortrait,
    handleClose,
    handleSubmit,
  };
}
