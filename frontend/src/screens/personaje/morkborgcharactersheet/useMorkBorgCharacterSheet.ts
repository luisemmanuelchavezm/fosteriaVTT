import { useEffect, useRef, useState, useCallback } from "react";
import type { DiceRollSummary } from "../../../components/dice/useDiceRoller";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { buildApiUrl } from "../../../lib/api";
import type {
  DndCharacterDetailResponse,
  AddDndCharacterInventoryItemRequest,
} from "../utils/dndApi";
import {
  addDndCharacterInventoryItem,
  deleteDndCharacterInventoryItem,
  deleteDndCharacter,
  eliminarHabilidadPersonaje,
  updateCharacterPortrait,
} from "../utils/dndApi";
import {
  updateMBSupplies,
  mejorarPersonajeMB,
  intercambiarEscoriaEspecialidad,
  agregarRasgoClaseMB,
  crearRasgoCustomMB,
  saveCurrentHpMB,
} from "../utils/mbApi";
import type { NavTab } from "../../../components/HomeNavbar";

export interface UseMorkBorgCharacterSheetProps {
  characterId: string;
  username: string;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
}

export function useMorkBorgCharacterSheet({
  characterId,
  username,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
}: UseMorkBorgCharacterSheetProps) {
  const [character, setCharacter] = useState<DndCharacterDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editableName, setEditableName] = useState<string>("");
  const [pendingStatMods, setPendingStatMods] = useState<
    Record<string, number>
  >({});

  const [currentHp, setCurrentHp] = useState(0);
  const [totalHp, setTotalHp] = useState(0);
  const [editableMaxHp, setEditableMaxHp] = useState<number | undefined>(
    undefined,
  );
  const [hpDelta, setHpDelta] = useState("1");

  const [plata, setPlata] = useState(0);
  const [comida, setComida] = useState(0);
  const [presagios, setPresagios] = useState(0);
  const [carga, setCarga] = useState(0);
  const [decocciones, setDecocciones] = useState<number[]>(Array(8).fill(0));
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);
  const [isClassTraitsCatalogOpen, setIsClassTraitsCatalogOpen] =
    useState(false);
  const [isScrollCatalogOpen, setIsScrollCatalogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const saveSuppliesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isInventoryCatalogOpen, setIsInventoryCatalogOpen] = useState(false);

  const token = localStorage.getItem("jwtToken");

  // ── Dice roller ────────────────────────────────────────────────────────────
  const {
    diceBoxHostId,
    diceBoxError,
    isRolling,
    summary,
    rollD20Check,
    rollExpression,
  } = useDiceRoller();

  const pendingPresagiosRef = useRef(false);
  const pendingRestRef = useRef<"short" | "long" | null>(null);
  const presagiosFacesRef = useRef(2);
  const [presagiosDisplaySummary, setPresagiosDisplaySummary] =
    useState<DiceRollSummary | null>(null);

  // Capturar resultado de descanso
  useEffect(() => {
    if (!pendingRestRef.current || !summary || isRolling) return;
    pendingRestRef.current = null;
    const healed = Math.max(0, summary.diceValues[0] ?? summary.total);
    setCurrentHp((prev) => Math.min(totalHp, prev + healed));
  }, [summary, isRolling, totalHp]);

  // Limpiar el summary mapeado cuando el original desaparece
  useEffect(() => {
    if (!summary) setPresagiosDisplaySummary(null);
  }, [summary]);

  // Capturar resultado y mapear d2 → 1-2
  useEffect(() => {
    if (!pendingPresagiosRef.current || !summary || isRolling) return;
    pendingPresagiosRef.current = false;
    const raw = summary.diceValues[0] ?? summary.total;
    const faces = presagiosFacesRef.current;
    const mapped = faces === 2 && raw > 2 ? raw - 2 : raw;
    const value = Math.max(1, mapped);
    setPresagios(value);
    if (faces === 2) {
      setPresagiosDisplaySummary({
        ...summary,
        diceValues: [value],
        total: value,
        title: "Presagios (d2)",
      });
    }
  }, [summary, isRolling]);

  // ── Carga del personaje ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(buildApiUrl(`/api/personajes/${characterId}`), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("No se pudo cargar la hoja del personaje");
        const data = (await res.json()) as DndCharacterDetailResponse;
        setCharacter(data);
        setEditableName(data.nombre);

        const s = data.estadisticas;
        const maxHp = s["MB_VidaMaxima"] ?? 0;
        setTotalHp(maxHp);
        setCurrentHp(s["MB_VidaActual"] ?? maxHp);
        setPlata(s["MB_Plata"] ?? 0);
        setComida(s["MB_Comida"] ?? 0);
        setPresagios(s["MB_PresagiosActuales"] ?? s["MB_Presagios"] ?? 0);
        setCarga(s["MB_Carga"] ?? 0);
        setDecocciones(
          Array.from({ length: 8 }, (_, i) => s[`MB_Decoccion_${i + 1}`] ?? 0),
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setLoadError("No se pudo cargar la hoja del personaje.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [characterId, token]);

  // Guardar HP inmediatamente cuando cambia (excepto la carga inicial)
  const isInitialHpLoad = useRef(true);
  useEffect(() => {
    if (isInitialHpLoad.current) {
      isInitialHpLoad.current = false;
      return;
    }
    if (!token) return;
    void saveCurrentHpMB(token, characterId, currentHp);
  }, [characterId, currentHp, token]);

  const classId = character ? extractClassId(character.tags) : null;
  const isOwner = !character || character.propietario === username;

  const sanitize = (value: string) => {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) || n < 0 ? "0" : String(n);
  };

  const handleHeal = useCallback(() => {
    const delta = Number.parseInt(hpDelta, 10) || 0;
    setCurrentHp((prev) => Math.min(totalHp, prev + delta));
  }, [hpDelta, totalHp]);

  const handleDamage = useCallback(() => {
    const delta = Number.parseInt(hpDelta, 10) || 0;
    setCurrentHp((prev) => Math.max(0, prev - delta));
  }, [hpDelta]);

  const handleRollStat = useCallback(
    (statLabel: string, modifier: number) => {
      rollD20Check(statLabel, modifier);
    },
    [rollD20Check],
  );

  const handleRollPresagios = useCallback(() => {
    if (isRolling) return;
    const isD4Class =
      classId === "ermitano-esoterico" || classId === "sacerdote-hereje";
    presagiosFacesRef.current = isD4Class ? 4 : 2;
    pendingPresagiosRef.current = true;
    rollExpression("Tirada de Presagios", "1d4");
  }, [classId, isRolling, rollExpression]);

  const saveSupplies = useCallback(
    (nextPlata: number, nextComida: number, nextDecocciones: number[]) => {
      if (!token) return;
      if (saveSuppliesTimer.current) clearTimeout(saveSuppliesTimer.current);
      saveSuppliesTimer.current = setTimeout(() => {
        const decoccionesMap: Record<number, number> = {};
        nextDecocciones.forEach((v, i) => {
          decoccionesMap[i + 1] = v;
        });
        void updateMBSupplies(token, characterId, {
          plata: nextPlata,
          comida: nextComida,
          decocciones: decoccionesMap,
        });
      }, 800);
    },
    [token, characterId],
  );

  const handleAdjustSupply = useCallback(
    (supply: "plata" | "comida" | "presagios", delta: number) => {
      if (supply === "plata") {
        setPlata((p) => {
          const next = Math.min(999, Math.max(-999, p + delta));
          setComida((c) => {
            saveSupplies(next, c, decocciones);
            return c;
          });
          return next;
        });
      } else if (supply === "comida") {
        setComida((c) => {
          const next = Math.min(99, Math.max(0, c + delta));
          setPlata((p) => {
            saveSupplies(p, next, decocciones);
            return p;
          });
          return next;
        });
      } else {
        setPresagios((p) => Math.max(0, p + delta));
      }
    },
    [decocciones, saveSupplies],
  );

  const handleSetPlata = useCallback(
    (value: number) => {
      const next = Math.min(999, Math.max(-999, value));
      setPlata(next);
      setComida((c) => {
        saveSupplies(next, c, decocciones);
        return c;
      });
    },
    [decocciones, saveSupplies],
  );

  const handleSetComida = useCallback(
    (value: number) => {
      const next = Math.min(99, Math.max(0, value));
      setComida(next);
      setPlata((p) => {
        saveSupplies(p, next, decocciones);
        return p;
      });
    },
    [decocciones, saveSupplies],
  );

  const handleAdjustDecoccion = useCallback(
    (index: number, delta: number) => {
      setDecocciones((prev) => {
        const next = prev.map((v, i) =>
          i === index ? Math.min(10, Math.max(0, v + delta)) : v,
        );
        setPlata((p) => {
          setComida((c) => {
            saveSupplies(p, c, next);
            return c;
          });
          return p;
        });
        return next;
      });
    },
    [saveSupplies],
  );

  const handleSetDecoccion = useCallback(
    (index: number, value: number) => {
      setDecocciones((prev) => {
        const next = prev.map((v, i) =>
          i === index ? Math.min(10, Math.max(0, value)) : v,
        );
        setPlata((p) => {
          setComida((c) => {
            saveSupplies(p, c, next);
            return c;
          });
          return p;
        });
        return next;
      });
    },
    [saveSupplies],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!token) {
      setIsEditMode(false);
      return;
    }
    const statKeyMap: Record<string, string> = {
      MB_ModFuerza: "modFuerza",
      MB_ModAgilidad: "modAgilidad",
      MB_ModPresencia: "modPresencia",
      MB_ModResistencia: "modResistencia",
    };
    const changes: Record<string, number> = {};
    for (const [modKey, value] of Object.entries(pendingStatMods)) {
      const k = statKeyMap[modKey];
      if (k) changes[k] = value;
    }
    if (editableMaxHp !== undefined) changes.vidaMaxima = editableMaxHp;
    if (Object.keys(changes).length > 0) {
      const updated = await mejorarPersonajeMB(token, characterId, changes);
      setCharacter(updated);
      const newMaxHp = updated.estadisticas["MB_VidaMaxima"];
      if (newMaxHp !== undefined) setTotalHp(newMaxHp);
      const newCarga = updated.estadisticas["MB_Carga"];
      if (newCarga !== undefined) setCarga(newCarga);
    }
    setPendingStatMods({});
    setEditableMaxHp(undefined);
    setIsEditMode(false);
  }, [characterId, editableMaxHp, pendingStatMods, token]);

  const handleCancelEdit = useCallback(() => {
    if (!character) return;
    setEditableName(character.nombre);
    setEditableMaxHp(undefined);
    setPendingStatMods({});
    setIsEditMode(false);
  }, [character]);

  const handleAddInventoryItem = useCallback(
    async (payload: AddDndCharacterInventoryItemRequest) => {
      if (!token) return;
      const updated = await addDndCharacterInventoryItem(
        token,
        characterId,
        payload,
      );
      setCharacter(updated);
    },
    [characterId, token],
  );

  const handleDeleteInventoryItem = useCallback(
    async (itemId: number) => {
      if (!token) return;
      const updated = await deleteDndCharacterInventoryItem(
        token,
        characterId,
        itemId,
      );
      setCharacter(updated);
    },
    [characterId, token],
  );

  const handleSaveMejora = useCallback(
    async (changes: {
      modFuerza?: number;
      modAgilidad?: number;
      modPresencia?: number;
      modResistencia?: number;
      vidaMaxima?: number;
      plataGanada?: number;
    }) => {
      if (!token) return;
      const updated = await mejorarPersonajeMB(token, characterId, changes);
      setCharacter(updated);
      if (changes.vidaMaxima !== undefined) setTotalHp(changes.vidaMaxima);
      if (changes.plataGanada !== undefined)
        setPlata((p) => Math.min(999, p + changes.plataGanada!));
      setCurrentHp(updated.estadisticas["MB_VidaActual"] ?? currentHp);
      const newCarga = updated.estadisticas["MB_Carga"];
      if (newCarga !== undefined) setCarga(newCarga);
      setIsImprovementModalOpen(false);
    },
    [token, characterId, currentHp],
  );

  const handleSaveEscoriaEspecialidades = useCallback(
    async (habilidadesAEliminar: number[], nuevosIdxs: number[]) => {
      if (!token) return;
      const updated = await intercambiarEscoriaEspecialidad(
        token,
        characterId,
        { habilidadesAEliminar, nuevosIdxs },
      );
      setCharacter(updated);
      setIsImprovementModalOpen(false);
    },
    [token, characterId],
  );

  const handleShortRest = useCallback(() => {
    if (isRolling) return;
    pendingRestRef.current = "short";
    rollExpression("Descanso corto", "1d4");
  }, [isRolling, rollExpression]);

  const handleLongRest = useCallback(() => {
    if (isRolling) return;
    pendingRestRef.current = "long";
    rollExpression("Descanso largo", "1d6");
  }, [isRolling, rollExpression]);

  const handleAdjustStat = useCallback(
    (modKey: string, delta: number) => {
      if (!character) return;
      const current =
        pendingStatMods[modKey] ?? character.estadisticas[modKey] ?? 0;
      const next = Math.min(6, Math.max(-3, current + delta));
      if (next === current) return;
      setPendingStatMods((prev) => ({ ...prev, [modKey]: next }));
    },
    [character, pendingStatMods],
  );

  const handleDeleteClassTrait = useCallback(
    async (habilidadId: number) => {
      if (!token) return;
      const updated = await eliminarHabilidadPersonaje(
        token,
        characterId,
        habilidadId,
      );
      setCharacter(updated);
    },
    [token, characterId],
  );

  const handleDeleteClassItem = useCallback(
    async (itemId: number) => {
      if (!token) return;
      const updated = await deleteDndCharacterInventoryItem(
        token,
        characterId,
        itemId,
      );
      setCharacter(updated);
    },
    [token, characterId],
  );

  const handleAddClassTrait = useCallback(
    async (habilidadId: number) => {
      if (!token) return;
      const updated = await agregarRasgoClaseMB(
        token,
        characterId,
        habilidadId,
      );
      setCharacter(updated);
    },
    [token, characterId],
  );

  const handleAddClassItem = useCallback(
    async (objetoId: number) => {
      if (!token) return;
      const updated = await addDndCharacterInventoryItem(token, characterId, {
        objetoId,
      });
      setCharacter(updated);
    },
    [token, characterId],
  );

  const handleCreateCustomTrait = useCallback(
    async (nombre: string, descripcion: string) => {
      if (!token) return;
      const updated = await crearRasgoCustomMB(
        token,
        characterId,
        nombre,
        descripcion,
      );
      setCharacter(updated);
    },
    [token, characterId],
  );

  const handlePortraitChange = useCallback(
    async (file: File) => {
      if (!token) return;
      const updated = await updateCharacterPortrait(token, characterId, file);
      setCharacter(updated);
    },
    [token, characterId],
  );

  const handleDeleteCharacter = useCallback(async () => {
    if (!token || deleteConfirmText !== "borrar") return;
    await deleteDndCharacter(token, characterId);
    setIsDeleteConfirmOpen(false);
    onGoCharacters();
  }, [token, characterId, deleteConfirmText, onGoCharacters]);

  const handleNavChange = useCallback(
    (tab: NavTab) => {
      if (tab === "home") {
        onGoHome();
        return;
      }
      if (tab === "campaigns") {
        onGoCampaigns();
        return;
      }
      onGoCharacters();
    },
    [onGoHome, onGoCampaigns, onGoCharacters],
  );

  const isRollingPresagios = isRolling && pendingPresagiosRef.current;
  const overlayDisplaySummary = presagiosDisplaySummary ?? summary;

  return {
    // data
    character,
    setCharacter,
    isLoading,
    loadError,
    token,
    classId,
    isOwner,
    // edit mode
    isEditMode,
    setIsEditMode,
    editableName,
    setEditableName,
    pendingStatMods,
    editableMaxHp,
    setEditableMaxHp,
    // hp
    currentHp,
    totalHp,
    hpDelta,
    setHpDelta,
    sanitize,
    // supplies
    plata,
    comida,
    presagios,
    carga,
    decocciones,
    // modals
    isImprovementModalOpen,
    setIsImprovementModalOpen,
    isClassTraitsCatalogOpen,
    setIsClassTraitsCatalogOpen,
    isScrollCatalogOpen,
    setIsScrollCatalogOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleteConfirmText,
    setDeleteConfirmText,
    isInventoryCatalogOpen,
    setIsInventoryCatalogOpen,
    // dice roller
    diceBoxHostId,
    diceBoxError,
    isRolling,
    isRollingPresagios,
    overlayDisplaySummary,
    // handlers
    handleHeal,
    handleDamage,
    handleRollStat,
    handleRollPresagios,
    handleAdjustSupply,
    handleSetPlata,
    handleSetComida,
    handleAdjustDecoccion,
    handleSetDecoccion,
    handleSaveEdit,
    handleCancelEdit,
    handleAddInventoryItem,
    handleDeleteInventoryItem,
    handleSaveMejora,
    handleSaveEscoriaEspecialidades,
    handleShortRest,
    handleLongRest,
    handleAdjustStat,
    handleDeleteClassTrait,
    handleDeleteClassItem,
    handleAddClassTrait,
    handleAddClassItem,
    handleCreateCustomTrait,
    handlePortraitChange,
    handleDeleteCharacter,
    handleNavChange,
  };
}

function extractClassId(tags: string | null | undefined): string | null {
  if (!tags) return null;
  const match = tags.match(/clase;([^,]+)/);
  return match?.[1] ?? null;
}
