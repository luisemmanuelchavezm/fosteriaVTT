import { useState } from "react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import { buildApiUrl } from "../../../../lib/api";
import { ABILITY_STATS } from "../../creatednd/utils/statisticsUtils";

const SECONDARY_STATS = ["CA", "Movimiento", "Iniciativa", "Puntos de vida"];

export type WeaponModalState =
  | null
  | { mode: "add" }
  | {
      mode: "edit";
      id: number;
      nombre: string;
      formula: string | null;
      bonificacion: number;
      descripcion: string;
    };

interface UseNpcEditOptions {
  character: DndCharacterDetailResponse;
  characterId?: string;
  isOwner?: boolean;
  onNpcSaved?: (character: DndCharacterDetailResponse) => void;
}

/**
 * Centraliza todo el estado de edición y las operaciones CRUD del NPC.
 * El componente principal solo necesita consumir los valores y callbacks devueltos.
 */
export function useNpcEdit({
  character,
  characterId,
  onNpcSaved,
}: UseNpcEditOptions) {
  // Modo edición
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Valores editables
  const [editNombre, setEditNombre] = useState("");
  const [editBiografia, setEditBiografia] = useState("");
  const [editVd, setEditVd] = useState("");
  const [editStats, setEditStats] = useState<Record<string, number>>({});
  const [localHabilidades, setLocalHabilidades] = useState<
    CharacterAbilityResponse[]
  >(character.habilidades);

  // Formulario para agregar rasgo/acción
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabilidadNombre, setNewHabilidadNombre] = useState("");
  const [newHabilidadDesc, setNewHabilidadDesc] = useState("");
  const [newHabilidadTipo, setNewHabilidadTipo] = useState<"PASIVA" | "ACCION">(
    "PASIVA",
  );
  const [isAddingHabilidad, setIsAddingHabilidad] = useState(false);

  // Modal de arma
  const [weaponModal, setWeaponModal] = useState<WeaponModalState>(null);
  const [isWeaponSaving, setIsWeaponSaving] = useState(false);

  // Subida de retrato
  const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);

  // Formulario de idioma
  const [newIdioma, setNewIdioma] = useState("");
  const [isAddingIdioma, setIsAddingIdioma] = useState(false);

  // ── Valores derivados ─────────────────────────────────────────────────────
  const displayHabilidades = isEditMode
    ? localHabilidades
    : character.habilidades;

  const pasivas = displayHabilidades.filter((h) => {
    const tags = h.tags?.toUpperCase().split(",") ?? [];
    return tags.includes("NPC") && tags.includes("PASIVA");
  });
  const acciones = displayHabilidades.filter((h) => {
    const tags = h.tags?.toUpperCase().split(",") ?? [];
    return tags.includes("NPC") && tags.includes("ACCION");
  });
  const armas = displayHabilidades.filter((h) => {
    const tags = h.tags?.toUpperCase().split(",") ?? [];
    return tags.includes("NPC") && tags.includes("ARMA");
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleEdit = () => {
    if (!isEditMode) {
      setEditNombre(character.nombre);
      setEditBiografia(character.biografia ?? "");
      setEditVd(character.vd ?? "");
      const allStats: Record<string, number> = {};
      for (const stat of ABILITY_STATS) {
        allStats[stat.name] = character.estadisticas[stat.name] ?? 10;
      }
      for (const key of SECONDARY_STATS) {
        allStats[key] = character.estadisticas[key] ?? 0;
      }
      setEditStats(allStats);
      setLocalHabilidades([...character.habilidades]);
      setSaveError(null);
    }
    setIsEditMode((v) => !v);
    setShowAddForm(false);
    setWeaponModal(null);
    setNewIdioma("");
  };

  const handleSaveNpc = async () => {
    if (!characterId || !onNpcSaved) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(
        buildApiUrl(`/api/personajes/${characterId}/npc`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: editNombre,
            biografia: editBiografia,
            vd: editVd,
            estadisticas: editStats,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo guardar el NPC");
      }
      const updated = (await res.json()) as DndCharacterDetailResponse;
      onNpcSaved(updated);
      setIsEditMode(false);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabilidad = async (habilidadId: number) => {
    if (!characterId || !onNpcSaved) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    try {
      const res = await fetch(
        buildApiUrl(
          `/api/personajes/${characterId}/habilidades/${habilidadId}`,
        ),
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const updated = (await res.json()) as DndCharacterDetailResponse;
      setLocalHabilidades(updated.habilidades);
      onNpcSaved(updated);
    } catch {
      /* ignorar */
    }
  };

  const handleAddHabilidad = async () => {
    if (!characterId || !newHabilidadNombre.trim() || !onNpcSaved) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsAddingHabilidad(true);
    try {
      const tags = `NPC,${newHabilidadTipo}`;
      const res = await fetch(
        buildApiUrl(`/api/personajes/${characterId}/habilidades/npc`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: newHabilidadNombre.trim(),
            descripcion: newHabilidadDesc.trim() || null,
            tags,
          }),
        },
      );
      if (!res.ok) return;
      const detailRes = await fetch(
        buildApiUrl(`/api/personajes/${characterId}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!detailRes.ok) return;
      const updated = (await detailRes.json()) as DndCharacterDetailResponse;
      setLocalHabilidades(updated.habilidades);
      onNpcSaved(updated);
      setNewHabilidadNombre("");
      setNewHabilidadDesc("");
      setShowAddForm(false);
    } catch {
      /* ignorar */
    } finally {
      setIsAddingHabilidad(false);
    }
  };

  const handlePortraitChange = async (file: File) => {
    if (!characterId || !onNpcSaved) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsUploadingPortrait(true);
    try {
      const formData = new FormData();
      formData.append("portrait", file);
      const res = await fetch(
        buildApiUrl(`/api/personajes/${characterId}/retrato`),
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (!res.ok) return;
      const updated = (await res.json()) as DndCharacterDetailResponse;
      onNpcSaved(updated);
    } catch {
      /* ignorar */
    } finally {
      setIsUploadingPortrait(false);
    }
  };

  const handleWeaponConfirm = async (data: {
    nombre: string;
    formula: string | null;
    bonificacion: number;
    descripcion: string;
  }) => {
    if (!characterId || !onNpcSaved) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsWeaponSaving(true);
    try {
      if (weaponModal?.mode === "edit") {
        const res = await fetch(
          buildApiUrl(
            `/api/personajes/${characterId}/habilidades/npc/${weaponModal.id}`,
          ),
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: data.nombre,
              formula: data.formula,
              bonificacion: data.bonificacion,
            }),
          },
        );
        if (!res.ok) return;
        const detailRes = await fetch(
          buildApiUrl(`/api/personajes/${characterId}`),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!detailRes.ok) return;
        const updated = (await detailRes.json()) as DndCharacterDetailResponse;
        setLocalHabilidades(updated.habilidades);
        onNpcSaved(updated);
      } else {
        const res = await fetch(
          buildApiUrl(`/api/personajes/${characterId}/habilidades/npc`),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: data.nombre,
              descripcion: data.descripcion || null,
              tags: "NPC,ARMA",
              formula: data.formula,
              bonificacion: data.bonificacion,
            }),
          },
        );
        if (!res.ok) return;
        const detailRes = await fetch(
          buildApiUrl(`/api/personajes/${characterId}`),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!detailRes.ok) return;
        const updated = (await detailRes.json()) as DndCharacterDetailResponse;
        setLocalHabilidades(updated.habilidades);
        onNpcSaved(updated);
      }
      setWeaponModal(null);
    } catch {
      /* ignorar */
    } finally {
      setIsWeaponSaving(false);
    }
  };

  const handleAddIdioma = async () => {
    if (!characterId || !newIdioma.trim() || !onNpcSaved) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsAddingIdioma(true);
    try {
      const res = await fetch(
        buildApiUrl(`/api/personajes/${characterId}/habilidades/npc`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: `Idioma: ${newIdioma.trim()}`,
            tags: "NPC,IDIOMA",
          }),
        },
      );
      if (!res.ok) return;
      const detailRes = await fetch(
        buildApiUrl(`/api/personajes/${characterId}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!detailRes.ok) return;
      const updated = (await detailRes.json()) as DndCharacterDetailResponse;
      setLocalHabilidades(updated.habilidades);
      onNpcSaved(updated);
      setNewIdioma("");
    } catch {
      /* ignorar */
    } finally {
      setIsAddingIdioma(false);
    }
  };

  return {
    // Modo edición
    isEditMode,
    isSaving,
    saveError,
    // Valores editables
    editNombre,
    setEditNombre,
    editBiografia,
    setEditBiografia,
    editVd,
    setEditVd,
    editStats,
    setEditStats,
    // Habilidades
    localHabilidades,
    displayHabilidades,
    pasivas,
    acciones,
    armas,
    // Formulario de rasgo
    showAddForm,
    setShowAddForm,
    newHabilidadNombre,
    setNewHabilidadNombre,
    newHabilidadDesc,
    setNewHabilidadDesc,
    newHabilidadTipo,
    setNewHabilidadTipo,
    isAddingHabilidad,
    // Modal de arma
    weaponModal,
    setWeaponModal,
    isWeaponSaving,
    // Retrato
    isUploadingPortrait,
    // Idioma
    newIdioma,
    setNewIdioma,
    isAddingIdioma,
    // Handlers
    handleToggleEdit,
    handleSaveNpc,
    handleDeleteHabilidad,
    handleAddHabilidad,
    handlePortraitChange,
    handleWeaponConfirm,
    handleAddIdioma,
  };
}
