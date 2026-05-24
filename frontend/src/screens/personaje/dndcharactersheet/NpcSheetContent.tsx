import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type {
  DndCharacterDetailResponse,
  CharacterAbilityResponse,
  ObjectCatalogResponse,
} from "../utils/dndApi";
import { fetchObjectCatalog } from "../utils/dndApi";
import { ABILITY_STATS } from "../creatednd/utils/statisticsUtils";
import { SKILL_ROWS, SAVING_THROW_ROWS } from "./data";
import { buildApiUrl } from "../../../lib/api";
import { normalizeText } from "./utils/characterText";

function renderNpcText(text: string): ReactNode {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let pendingItems: string[] = [];

  const flushList = () => {
    if (pendingItems.length === 0) return;
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="mt-1 ml-4 space-y-0.5 list-disc list-outside"
      >
        {pendingItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-white/70">
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
            className="mt-1 text-sm leading-relaxed text-white/70"
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
  // Edit props
  characterId?: string;
  isOwner?: boolean;
  onNpcSaved?: (character: DndCharacterDetailResponse) => void;
}

function abilitySuffix(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

function fmtBonus(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

const SECONDARY_STATS = ["CA", "Movimiento", "Iniciativa", "Puntos de vida"];

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit state
  const [editNombre, setEditNombre] = useState("");
  const [editBiografia, setEditBiografia] = useState("");
  const [editVd, setEditVd] = useState("");
  const [editStats, setEditStats] = useState<Record<string, number>>({});
  const [localHabilidades, setLocalHabilidades] = useState<
    CharacterAbilityResponse[]
  >(character.habilidades);

  // New habilidad form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabilidadNombre, setNewHabilidadNombre] = useState("");
  const [newHabilidadDesc, setNewHabilidadDesc] = useState("");
  const [newHabilidadTipo, setNewHabilidadTipo] = useState<"PASIVA" | "ACCION">(
    "PASIVA",
  );
  const [isAddingHabilidad, setIsAddingHabilidad] = useState(false);

  // Weapon modal state
  type WeaponModalState =
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
  const [weaponModal, setWeaponModal] = useState<WeaponModalState>(null);
  const [isWeaponSaving, setIsWeaponSaving] = useState(false);

  // Portrait upload
  const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);

  // Idioma form
  const [newIdioma, setNewIdioma] = useState("");
  const [isAddingIdioma, setIsAddingIdioma] = useState(false);

  const ca = character.estadisticas["CA"] ?? 10;
  const mov = character.estadisticas["Movimiento"] ?? 30;
  const ini = character.estadisticas["Iniciativa"] ?? 0;

  const skillBonuses = SKILL_ROWS.filter((skill) => {
    const val = character.estadisticas[skill.name];
    return val !== undefined && val !== 0;
  }).map((skill) => ({
    displayName: skill.displayName,
    bonus: character.estadisticas[skill.name] ?? 0,
  }));

  const saveBonuses = SAVING_THROW_ROWS.filter((save) => {
    const val =
      character.estadisticas[`Salvacion de ${save.statName}`] ??
      character.estadisticas[`Salvación de ${save.statName}`];
    return val !== undefined && val !== 0;
  }).map((save) => ({
    displayName: save.displayName,
    bonus:
      character.estadisticas[`Salvacion de ${save.statName}`] ??
      character.estadisticas[`Salvación de ${save.statName}`] ??
      0,
  }));

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

  const TABS: { key: NpcTab; label: string }[] = [
    { key: "estadisticas", label: "Estadísticas" },
    { key: "info", label: "Información" },
    { key: "rasgos", label: "Rasgos" },
  ];

  const handleToggleEdit = () => {
    if (!isEditMode) {
      // Initialize edit state from current character
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
      // ignore
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

      // Re-fetch the character to get the new habilidad with its ID
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
      // ignore
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
      /* ignore */
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
        // Re-fetch in a fresh request so the BONO tag is read from a clean DB transaction
        const detailRes = await fetch(
          buildApiUrl(`/api/personajes/${characterId}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
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
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!detailRes.ok) return;
        const updated = (await detailRes.json()) as DndCharacterDetailResponse;
        setLocalHabilidades(updated.habilidades);
        onNpcSaved(updated);
      }
      setWeaponModal(null);
    } catch {
      /* ignore */
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
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!detailRes.ok) return;
      const updated = (await detailRes.json()) as DndCharacterDetailResponse;
      setLocalHabilidades(updated.habilidades);
      onNpcSaved(updated);
      setNewIdioma("");
    } catch {
      // ignore
    } finally {
      setIsAddingIdioma(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      {/* Portrait + nombre */}
      <div className="flex flex-col items-center gap-3">
        {/* Portrait — clickable in edit mode to change image */}
        <label
          className={`relative h-28 w-28 overflow-hidden rounded-2xl border-2 shadow-lg transition ${
            isOwner && isEditMode
              ? "cursor-pointer border-amber-400/60 hover:border-amber-400"
              : "border-amber-400/40 cursor-default"
          }`}
          title={isOwner && isEditMode ? "Cambiar imagen" : undefined}
        >
          {isOwner && isEditMode && (
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePortraitChange(file);
                e.target.value = "";
              }}
            />
          )}
          {isUploadingPortrait ? (
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
          {/* Edit overlay hint */}
          {isOwner && isEditMode && !isUploadingPortrait && (
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent pb-1.5 opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                Cambiar
              </span>
            </div>
          )}
        </label>

        {isEditMode ? (
          <input
            type="text"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
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
              onClick={handleToggleEdit}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition ${
                isEditMode
                  ? "bg-white/10 text-white/60 hover:bg-white/15"
                  : "bg-amber-600/25 text-amber-200 hover:bg-amber-600/40"
              }`}
            >
              {isEditMode ? "Cancelar" : "✏ Editar"}
            </button>
          )}

          {isEditMode && (
            <button
              type="button"
              onClick={() => void handleSaveNpc()}
              disabled={isSaving}
              className="rounded-full bg-emerald-600/30 px-3 py-0.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-600/50 disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : "💾 Guardar"}
            </button>
          )}
        </div>

        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      </div>

      {/* Tabs */}
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

      {/* ── Tab 1: Estadísticas ── */}
      {activeTab === "estadisticas" && (
        <div className="space-y-5">
          {/* Ability scores */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ABILITY_STATS.map((stat) => {
              const score = isEditMode
                ? (editStats[stat.name] ?? 10)
                : (character.estadisticas[stat.name] ?? 10);
              return (
                <div
                  key={stat.id}
                  className="flex flex-col items-center rounded-[18px] border-2 border-white bg-white px-2 py-3 text-center shadow-md"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {stat.name}
                  </p>
                  <p className="my-0.5 text-xl font-bold text-stone-900">
                    {abilitySuffix(score)}
                  </p>
                  {isEditMode ? (
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={score}
                      onChange={(e) =>
                        setEditStats((prev) => ({
                          ...prev,
                          [stat.name]: Math.max(
                            1,
                            Math.min(30, Number(e.target.value) || 10),
                          ),
                        }))
                      }
                      className="w-full rounded border border-stone-300 bg-white px-1 py-0.5 text-center text-sm font-semibold text-stone-700 outline-none"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-stone-600">
                      {score}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Secondary stats: CA / MOV / INI / HP */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                key: "CA",
                label: "CA",
                display: String(isEditMode ? (editStats["CA"] ?? ca) : ca),
                min: 0,
                max: 100,
              },
              {
                key: "Movimiento",
                label: "Movimiento",
                display: `${isEditMode ? (editStats["Movimiento"] ?? mov) : mov} m`,
                min: 0,
                max: 999,
              },
              {
                key: "Iniciativa",
                label: "Iniciativa",
                display: fmtBonus(
                  isEditMode ? (editStats["Iniciativa"] ?? ini) : ini,
                ),
                min: -1,
                max: 100,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-xl border border-white/15 bg-white/5 py-3 text-center"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  {s.label}
                </p>
                {isEditMode ? (
                  <input
                    type="number"
                    min={s.min}
                    max={s.max}
                    value={editStats[s.key] ?? 0}
                    onChange={(e) =>
                      setEditStats((prev) => ({
                        ...prev,
                        [s.key]: Math.max(
                          s.min,
                          Math.min(s.max, Number(e.target.value) || 0),
                        ),
                      }))
                    }
                    className="mt-1 w-16 rounded border border-white/20 bg-white/10 px-1 py-0.5 text-center text-xl font-bold text-white outline-none focus:border-amber-400/60"
                  />
                ) : (
                  <p className="mt-1 text-2xl font-bold text-white">
                    {s.display}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Max HP edit */}
          {isEditMode && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm font-semibold text-white/70">
                Puntos de vida máx.
              </span>
              <input
                type="number"
                min={1}
                max={999}
                value={editStats["Puntos de vida"] ?? totalHp}
                onChange={(e) =>
                  setEditStats((prev) => ({
                    ...prev,
                    "Puntos de vida": Math.max(
                      1,
                      Math.min(999, Number(e.target.value) || 1),
                    ),
                  }))
                }
                className="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-lg font-bold text-white outline-none focus:border-amber-400/60"
              />
            </div>
          )}

          {/* HP widget */}
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div
              className={`grid gap-3 ${isOwner ? "sm:grid-cols-[120px_120px_minmax(0,1fr)]" : "justify-items-center"}`}
            >
              {/* Combat controls: only visible to owners */}
              {isOwner && (
                <>
                  {/* Curar / Delta / Daño column */}
                  <div className="grid grid-rows-[48px_48px_48px] gap-2">
                    <button
                      type="button"
                      onClick={onHeal}
                      className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
                    >
                      Curar
                    </button>
                    <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                      <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                        <button
                          type="button"
                          onClick={onDecrementHpDelta}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={hpDelta}
                          onChange={(e) =>
                            onHpDeltaChange(
                              sanitizeNonNegativeNumber(e.target.value),
                            )
                          }
                          className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={onIncrementHpDelta}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onDamage}
                      className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                    >
                      Daño
                    </button>
                  </div>

                  {/* Temp HP column */}
                  <div className="grid grid-rows-[48px_48px_48px] gap-2">
                    <button
                      type="button"
                      onClick={onGainTempHp}
                      className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
                    >
                      Temp +
                    </button>
                    <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                      <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                        <button
                          type="button"
                          onClick={onDecrementTempHpDelta}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tempHpDelta}
                          onChange={(e) =>
                            onTempHpDeltaChange(
                              sanitizeNonNegativeNumber(e.target.value),
                            )
                          }
                          className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={onIncrementTempHpDelta}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onLoseTempHp}
                      className="rounded-[16px] border border-cyan-300/35 bg-cyan-400/10 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                    >
                      Temp -
                    </button>
                  </div>
                </>
              )}

              {/* HP display — always visible */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2">
                  <p className="text-[2.6rem] font-bold leading-none text-white">
                    {currentHp}
                  </p>
                  <span className="text-[2rem] font-bold leading-none text-white/40">
                    /
                  </span>
                  <p className="text-[2rem] font-bold leading-none text-white/70">
                    {totalHp}
                  </p>
                </div>
                {tempHp > 0 && (
                  <p className="mt-2 text-sm font-semibold text-sky-300">
                    +{tempHp} temp
                  </p>
                )}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  Puntos de vida
                </p>
              </div>
            </div>
          </div>

          {/* Skill bonuses (only if overrides exist) */}
          {skillBonuses.length > 0 && (
            <p className="text-sm text-white/80">
              <span className="font-bold text-white">Habilidades: </span>
              {skillBonuses
                .map((s) => `${s.displayName} ${fmtBonus(s.bonus)}`)
                .join(", ")}
            </p>
          )}

          {/* Saving throw bonuses (only if overrides exist) */}
          {saveBonuses.length > 0 && (
            <p className="text-sm text-white/80">
              <span className="font-bold text-white">Salvaciones: </span>
              {saveBonuses
                .map((s) => `${s.displayName} ${fmtBonus(s.bonus)}`)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {/* ── Tab 2: Información ── */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {/* Valor de Desafío */}
          {(isEditMode || character.vd) && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-900/15 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300/70 shrink-0">
                Valor de Desafío
              </span>
              {isEditMode ? (
                <input
                  type="text"
                  value={editVd}
                  onChange={(e) => setEditVd(e.target.value)}
                  placeholder="Ej. 5 (1.800 PX)"
                  className="flex-1 rounded-lg border border-amber-400/30 bg-black/30 px-2 py-1 text-sm font-bold text-amber-200 outline-none placeholder:text-amber-400/30 focus:border-amber-400/60"
                />
              ) : (
                <span className="text-lg font-bold text-amber-200">
                  {character.vd}
                </span>
              )}
            </div>
          )}

          {/* Idiomas */}
          {(() => {
            const idiomaHabilidades = displayHabilidades.filter((h) =>
              normalizeText(h.nombre).startsWith(normalizeText("Idioma")),
            );
            const idiomaNames = idiomaHabilidades
              .map((h) =>
                h.nombre.replace(/^Idioma(?:\s+dote)?\s*:\s*/i, "").trim(),
              )
              .filter(Boolean);

            if (!isEditMode && idiomaHabilidades.length === 0) return null;

            return (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                  Idiomas
                </p>
                {isEditMode ? (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {idiomaHabilidades.length === 0 ? (
                        <span className="text-sm text-white/30">
                          Sin idiomas
                        </span>
                      ) : (
                        idiomaHabilidades.map((h) => {
                          const name = h.nombre
                            .replace(/^Idioma(?:\s+dote)?\s*:\s*/i, "")
                            .trim();
                          return (
                            <span
                              key={h.id}
                              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => void handleDeleteHabilidad(h.id)}
                                className="rounded p-0.5 text-red-400/50 transition hover:bg-red-900/25 hover:text-red-400"
                                title="Eliminar idioma"
                              >
                                <Trash2 size={12} />
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIdioma}
                        onChange={(e) => setNewIdioma(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleAddIdioma();
                        }}
                        placeholder="Ej. Común, Élfico…"
                        className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAddIdioma()}
                        disabled={!newIdioma.trim() || isAddingIdioma}
                        className="rounded-lg bg-amber-600/25 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-600/40 disabled:opacity-40"
                      >
                        {isAddingIdioma ? "…" : "+ Agregar"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/80">
                    {idiomaNames.join(", ")}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Descripción / Biografía */}
          {isEditMode ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                Descripción
              </p>
              <textarea
                value={editBiografia}
                onChange={(e) => setEditBiografia(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                placeholder="Descripción del NPC..."
              />
            </div>
          ) : character.biografia ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                Descripción
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {character.biografia}
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-white/30">Sin descripción</p>
          )}
        </div>
      )}

      {/* ── Tab 3: Rasgos ── */}
      {activeTab === "rasgos" && (
        <div className="space-y-6">
          {isEditMode && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-900/10 p-4">
              {!showAddForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
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
                    onChange={(e) => setNewHabilidadNombre(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                  <textarea
                    placeholder="Descripción (opcional)"
                    value={newHabilidadDesc}
                    onChange={(e) => setNewHabilidadDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewHabilidadTipo("PASIVA")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                        newHabilidadTipo === "PASIVA"
                          ? "bg-amber-600/30 text-amber-200 border border-amber-400/40"
                          : "bg-white/5 text-white/50 border border-white/15 hover:bg-white/10"
                      }`}
                    >
                      Pasiva
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHabilidadTipo("ACCION")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                        newHabilidadTipo === "ACCION"
                          ? "bg-amber-600/30 text-amber-200 border border-amber-400/40"
                          : "bg-white/5 text-white/50 border border-white/15 hover:bg-white/10"
                      }`}
                    >
                      Acción
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewHabilidadNombre("");
                        setNewHabilidadDesc("");
                      }}
                      className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs font-semibold text-white/50 hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAddHabilidad()}
                      disabled={isAddingHabilidad || !newHabilidadNombre.trim()}
                      className="flex-1 rounded-lg bg-amber-600/30 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-600/50 disabled:opacity-40"
                    >
                      {isAddingHabilidad ? "Agregando…" : "Agregar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {pasivas.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">
                Pasivas
              </h3>
              <div className="space-y-3">
                {pasivas.map((p) => (
                  <div
                    key={p.id}
                    className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-amber-200">{p.nombre}</p>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteHabilidad(p.id)}
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

          {acciones.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">
                Acciones
              </h3>
              <div className="space-y-3">
                {acciones.map((a) => (
                  <div
                    key={a.id}
                    className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-amber-200">{a.nombre}</p>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteHabilidad(a.id)}
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

          {/* ── Armas (always at the bottom) ── */}
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
                              setWeaponModal({
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
                            onClick={() => void handleDeleteHabilidad(w.id)}
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
                    onClick={() => setWeaponModal({ mode: "add" })}
                    className="w-full rounded-lg border border-amber-400/50 bg-amber-600/15 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-600/30 hover:border-amber-400/80 hover:text-amber-200"
                  >
                    + Agregar arma
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Weapon modal */}
          {weaponModal && (
            <WeaponFormModal
              mode={weaponModal.mode}
              initialNombre={
                weaponModal.mode === "edit" ? weaponModal.nombre : ""
              }
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
              onConfirm={(data) => void handleWeaponConfirm(data)}
              onCancel={() => setWeaponModal(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── WeaponFormModal ───────────────────────────────────────────────────────────

const WEAPON_ABILITY_OPTIONS = [
  { value: "@fuerza", label: "Fuerza" },
  { value: "@destreza", label: "Destreza" },
  { value: "@constitucion", label: "Constitución" },
  { value: "@inteligencia", label: "Inteligencia" },
  { value: "@sabiduria", label: "Sabiduría" },
  { value: "@carisma", label: "Carisma" },
];

function parseFormulaToState(formula: string | null): {
  diceParts: { count: string; sides: string }[];
  baseBonus: string;
  abilityModifiers: string[];
} {
  if (!formula) return { diceParts: [], baseBonus: "", abilityModifiers: [] };
  const parts = formula
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
  const diceParts: { count: string; sides: string }[] = [];
  let baseBonus = "";
  const abilityModifiers: string[] = [];
  for (const part of parts) {
    // Match NdS optionally followed by damage type text (e.g. "1d6 cortante")
    const diceMatch = part.match(/^(\d+)d(\d+)/i);
    if (diceMatch) {
      diceParts.push({ count: diceMatch[1], sides: diceMatch[2] });
    } else if (/^\d+$/.test(part)) {
      baseBonus = part;
    } else if (part.startsWith("@")) {
      abilityModifiers.push(part);
    }
  }
  return { diceParts, baseBonus, abilityModifiers };
}

interface WeaponFormModalProps {
  mode: "add" | "edit";
  initialNombre: string;
  initialFormula: string | null;
  initialBonificacion: number;
  initialDescripcion: string;
  isSaving: boolean;
  onConfirm: (data: {
    nombre: string;
    formula: string | null;
    bonificacion: number;
    descripcion: string;
  }) => void;
  onCancel: () => void;
}

function WeaponFormModal({
  mode,
  initialNombre,
  initialFormula,
  initialBonificacion,
  initialDescripcion,
  isSaving,
  onConfirm,
  onCancel,
}: WeaponFormModalProps) {
  const [tab, setTab] = useState<"catalog" | "custom">(
    mode === "edit" ? "custom" : "catalog",
  );

  // Catalog state (add mode only)
  const [search, setSearch] = useState("");
  const [catalogItems, setCatalogItems] = useState<ObjectCatalogResponse[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Custom form state
  const parsed = parseFormulaToState(initialFormula);
  const [nombre, setNombre] = useState(initialNombre);
  const [descripcion, setDescripcion] = useState(initialDescripcion);
  const [diceParts, setDiceParts] = useState<
    { count: string; sides: string }[]
  >(parsed.diceParts);
  const [baseBonus, setBaseBonus] = useState(parsed.baseBonus);
  const [showBaseBonus, setShowBaseBonus] = useState(!!parsed.baseBonus);
  const [selectedModifier, setSelectedModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>(
    parsed.abilityModifiers,
  );
  const [attackBonus, setAttackBonus] = useState(
    initialBonificacion !== 0 ? String(initialBonificacion) : "",
  );
  const [customError, setCustomError] = useState<string | null>(null);

  // Catalog search with debounce (add mode + catalog tab only)
  useEffect(() => {
    if (mode !== "add" || tab !== "catalog") return;
    const token = localStorage.getItem("jwtToken") ?? "";
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoadingCatalog(true);
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
          if (!abortController.signal.aborted) setIsLoadingCatalog(false);
        });
    }, 200);
    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [mode, tab, search]);

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

  const handleCustomConfirm = () => {
    if (!nombre.trim()) {
      setCustomError("El nombre es requerido");
      return;
    }
    if (!builtFormula) {
      setCustomError("La fórmula de daño es obligatoria");
      return;
    }
    const bonif = attackBonus !== "" ? parseInt(attackBonus, 10) || 0 : 0;
    onConfirm({
      nombre: nombre.trim(),
      formula: builtFormula,
      bonificacion: bonif,
      descripcion: descripcion.trim(),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-stone-950 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Armas / Ataques
            </p>
            <h3 className="text-base font-black text-white">
              {mode === "add" ? "Añadir arma" : "Editar arma"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs — add mode only */}
        {mode === "add" && (
          <div className="flex gap-2 border-b border-white/10 px-5 py-3">
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
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {/* Catalog tab — add mode only */}
          {mode === "add" && tab === "catalog" && (
            <div className="space-y-2">
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
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
                {isLoadingCatalog && (
                  <p className="py-2 text-center text-xs text-white/40">
                    Cargando catálogo...
                  </p>
                )}
                {!isLoadingCatalog && catalogItems.length === 0 && (
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
                        <p className="text-xs text-amber-200/80">
                          {item.formula}
                        </p>
                      )}
                      {item.descripcion && (
                        <p className="line-clamp-1 text-[11px] text-white/50">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.formula) return; // formula is required
                        onConfirm({
                          nombre: item.nombre,
                          formula: item.formula,
                          bonificacion: 0,
                          descripcion: item.descripcion ?? "",
                        });
                      }}
                      disabled={!item.formula}
                      className="flex-shrink-0 rounded-full border border-amber-300/30 bg-amber-700/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-700/40 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        !item.formula
                          ? "Este arma no tiene fórmula de daño"
                          : undefined
                      }
                    >
                      Añadir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom form — edit mode always, add mode on "custom" tab */}
          {(mode === "edit" || tab === "custom") && (
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Nombre del arma
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setCustomError(null);
                  }}
                  placeholder="Ej. Espada del Caos"
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${customError ? "border-red-400/70" : "border-white/20"}`}
                />
                {customError && (
                  <p className="mt-1 text-xs text-red-400">{customError}</p>
                )}
              </div>

              {/* Fórmula de daño */}
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
                        if (val && abilityModifiers.length < 3)
                          setAbilityModifiers((p) => [...p, val]);
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

                {diceParts.map((die, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={die.count}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        const c = isNaN(v)
                          ? ""
                          : String(Math.max(1, Math.min(10, v)));
                        setDiceParts((p) =>
                          p.map((d, j) => (j === i ? { ...d, count: c } : d)),
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
                        const c = isNaN(v)
                          ? ""
                          : String(Math.max(2, Math.min(100, v)));
                        setDiceParts((p) =>
                          p.map((d, j) => (j === i ? { ...d, sides: c } : d)),
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

                {abilityModifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {abilityModifiers.map((mod, i) => (
                      <button
                        key={`${mod}-${i}`}
                        type="button"
                        onClick={() =>
                          setAbilityModifiers((p) =>
                            p.filter((_, j) => j !== i),
                          )
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

                <p className="text-xs text-amber-200/70">
                  {builtFormula ?? "Sin fórmula de daño"}
                </p>
              </div>

              {/* Bonificador de ataque */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Bonificador de ataque{" "}
                  <span className="text-white/35">(-10 a +100, vacío = 0)</span>
                </label>
                <input
                  type="number"
                  min={-10}
                  max={100}
                  value={attackBonus}
                  onChange={(e) => setAttackBonus(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      setAttackBonus("");
                      return;
                    }
                    const v = parseInt(e.target.value, 10);
                    setAttackBonus(
                      isNaN(v) ? "" : String(Math.max(-10, Math.min(100, v))),
                    );
                  }}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-400/60"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Descripción <span className="text-white/35">(opcional)</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Descripción del arma..."
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-400/60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer — shown only on custom/edit form */}
        {(mode === "edit" || tab === "custom") && (
          <div className="flex gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCustomConfirm}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-60"
            >
              {isSaving
                ? "Guardando…"
                : mode === "add"
                  ? "Añadir arma"
                  : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
