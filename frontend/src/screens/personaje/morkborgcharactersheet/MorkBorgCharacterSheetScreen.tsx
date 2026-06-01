import { useEffect, useRef, useState, useCallback } from "react";
import MorkBorgEnemySheetContent from "./components/MorkBorgEnemySheetContent";
import type { DiceRollSummary } from "../../../components/dice/useDiceRoller";
import { ChevronLeft } from "lucide-react";
import HomeNavbar, { type NavTab } from "../../../components/HomeNavbar";
import LogoLayout from "../../../components/LogoLayout";
import UserMenu from "../../../components/UserMenu";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { buildApiUrl } from "../../../lib/api";
import type {
  DndCharacterDetailResponse,
  AddDndCharacterInventoryItemRequest,
} from "../utils/dndApi";
import {
  addDndCharacterInventoryItem,
  deleteDndCharacterInventoryItem,
  updateMBSupplies,
  mejorarPersonajeMB,
  intercambiarEscoriaEspecialidad,
  getMBRasgosClase,
  agregarRasgoClaseMB,
  crearRasgoCustomMB,
  deleteDndCharacter,
  saveCurrentHpMB,
  eliminarHabilidadPersonaje,
  updateCharacterPortrait,
} from "../utils/dndApi";
import MorkBorgImprovementModal from "./components/MorkBorgImprovementModal";
import MorkBorgClassTraitsCatalogModal from "./components/MorkBorgClassTraitsCatalogModal";
import MorkBorgScrollCatalogModal from "./components/MorkBorgScrollCatalogModal";
import { createPortal } from "react-dom";
import MorkBorgIdentitySection from "./components/MorkBorgIdentitySection";
import MorkBorgInventoryCatalogModal from "./components/MorkBorgInventoryCatalogModal";
import MorkBorgStatisticsSection from "./components/MorkBorgStatisticsSection";
import MorkBorgSuppliesSection from "./components/MorkBorgSuppliesSection";
import MorkBorgTraitsAndScrollsSection from "./components/MorkBorgTraitsAndScrollsSection";

function extractClassId(tags: string | null | undefined): string | null {
  if (!tags) return null;
  const match = tags.match(/clase;([^,]+)/);
  return match?.[1] ?? null;
}

interface MorkBorgCharacterSheetScreenProps {
  username: string;
  avatarUrl: string;
  characterId: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  modalMode?: boolean;
}

export default function MorkBorgCharacterSheetScreen({
  username,
  avatarUrl,
  characterId,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  modalMode = false,
}: MorkBorgCharacterSheetScreenProps) {
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

  const classId = extractClassId(character?.tags);
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

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome();
      return;
    }
    if (tab === "campaigns") {
      onGoCampaigns();
      return;
    }
    onGoCharacters();
  };

  const isRollingPresagios = isRolling && pendingPresagiosRef.current;
  const overlayDisplaySummary = presagiosDisplaySummary ?? summary;

  const content = (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={overlayDisplaySummary}
      />

      {!modalMode && (
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      )}

      {token ? (
        <MorkBorgInventoryCatalogModal
          token={token}
          isOpen={isInventoryCatalogOpen}
          onClose={() => setIsInventoryCatalogOpen(false)}
          onAddItem={handleAddInventoryItem}
        />
      ) : null}

      <div
        className={
          modalMode
            ? "relative z-10 w-full px-4 py-4"
            : "relative z-10 w-full px-4 pb-32 pt-28 md:px-8 md:pb-36 xl:w-[125%] xl:[zoom:0.8]"
        }
      >
        <div className="relative overflow-hidden rounded-[32px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.96)_0%,rgba(28,25,23,0.92)_48%,rgba(10,10,10,0.98)_100%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
          <div className="pointer-events-none absolute -top-20 right-[-50px] h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[-30px] h-64 w-64 rounded-full bg-stone-300/10 blur-3xl" />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-200/80">
                Mork Borg
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                Hoja de personaje
              </h1>
            </div>
            {!modalMode && (
              <button
                type="button"
                onClick={onGoCharacters}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-rose-300/25 hover:bg-stone-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver a personajes
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-[26px] border border-white/10 bg-black/20 px-6 py-10 text-center text-sm text-stone-300">
              Cargando hoja del personaje...
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="mt-8 rounded-[26px] border border-rose-400/35 bg-rose-950/25 px-6 py-5 text-sm font-medium text-rose-100">
              {loadError}
            </div>
          ) : null}

          {!isLoading &&
          !loadError &&
          character &&
          (character.tipo === "enemigo" || character.tipo === "PNJ") ? (
            <MorkBorgEnemySheetContent
              character={character}
              characterId={characterId}
              onCharacterUpdate={setCharacter}
            />
          ) : null}

          {!isLoading &&
          !loadError &&
          character &&
          character.tipo !== "enemigo" &&
          character.tipo !== "PNJ" ? (
            <div className="mt-8 space-y-8">
              {isImprovementModalOpen && character && (
                <MorkBorgImprovementModal
                  currentMods={{
                    fuerza: character.estadisticas["MB_ModFuerza"] ?? 0,
                    agilidad: character.estadisticas["MB_ModAgilidad"] ?? 0,
                    presencia: character.estadisticas["MB_ModPresencia"] ?? 0,
                    resistencia:
                      character.estadisticas["MB_ModResistencia"] ?? 0,
                  }}
                  currentMaxHp={totalHp}
                  classId={classId}
                  characterAbilities={character.habilidades}
                  onClose={() => setIsImprovementModalOpen(false)}
                  onSave={handleSaveMejora}
                  onSaveEscoriaEspecialidades={handleSaveEscoriaEspecialidades}
                />
              )}
              <MorkBorgIdentitySection
                character={character}
                editableName={editableName}
                isEditMode={isEditMode}
                isOwner={isOwner}
                onShortRest={handleShortRest}
                onLongRest={handleLongRest}
                onToggleEditMode={() => setIsEditMode((v) => !v)}
                onDeleteCharacter={() => {
                  setIsDeleteConfirmOpen(true);
                  setDeleteConfirmText("");
                }}
                onMejorar={() => {
                  setIsImprovementModalOpen(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onEditableNameChange={setEditableName}
                onSaveEdit={() => void handleSaveEdit()}
                onCancelEdit={handleCancelEdit}
                onPortraitChange={handlePortraitChange}
              />
              <MorkBorgStatisticsSection
                character={character}
                isEditMode={isEditMode}
                editableMaxHp={editableMaxHp}
                currentHp={currentHp}
                totalHp={totalHp}
                hpDelta={hpDelta}
                carga={carga}
                pendingStatMods={pendingStatMods}
                onHpDeltaChange={(v) => setHpDelta(sanitize(v))}
                onHeal={handleHeal}
                onDamage={handleDamage}
                onIncrementHpDelta={() =>
                  setHpDelta((v) => String((Number.parseInt(v, 10) || 0) + 1))
                }
                onDecrementHpDelta={() =>
                  setHpDelta((v) =>
                    String(Math.max(0, (Number.parseInt(v, 10) || 0) - 1)),
                  )
                }
                onMaxHpChange={(v) => setEditableMaxHp(v)}
                onRollStat={handleRollStat}
                onAdjustStat={handleAdjustStat}
                onDeleteItem={(itemId) =>
                  void handleDeleteInventoryItem(itemId)
                }
                onOpenCatalog={() => setIsInventoryCatalogOpen(true)}
                suppliesSlot={
                  <MorkBorgSuppliesSection
                    plata={plata}
                    comida={comida}
                    presagios={presagios}
                    decocciones={decocciones}
                    isRollingPresagios={isRollingPresagios}
                    onAdjust={handleAdjustSupply}
                    onSetPlata={handleSetPlata}
                    onSetComida={handleSetComida}
                    onAdjustDecoccion={handleAdjustDecoccion}
                    onSetDecoccion={handleSetDecoccion}
                    onRollPresagios={handleRollPresagios}
                  />
                }
              />
              {isScrollCatalogOpen && character && (
                <MorkBorgScrollCatalogModal
                  token={token ?? ""}
                  characterAbilityIds={character.habilidades.map((h) => h.id)}
                  fetchCatalog={getMBRasgosClase}
                  onAdd={handleAddClassTrait}
                  onClose={() => setIsScrollCatalogOpen(false)}
                />
              )}
              {isClassTraitsCatalogOpen && character && (
                <MorkBorgClassTraitsCatalogModal
                  token={token ?? ""}
                  characterAbilityIds={character.habilidades.map((h) => h.id)}
                  characterItemIds={character.mochila
                    .filter((item) =>
                      [
                        "DesertorItemIdx",
                        "RealezaItemIdx",
                        "SacerdoteItemIdx",
                        "ErmitanoEspecialidadIdx",
                        "ArmaEspecial",
                        "ItemEspecial",
                      ].some((kw) => item.tags?.includes(kw)),
                    )
                    .map((item) => item.objetoId ?? item.id)}
                  fetchCatalog={getMBRasgosClase}
                  onAddAbility={handleAddClassTrait}
                  onAddItem={handleAddClassItem}
                  onCreateCustom={handleCreateCustomTrait}
                  onClose={() => setIsClassTraitsCatalogOpen(false)}
                />
              )}
              <MorkBorgTraitsAndScrollsSection
                character={character}
                isOwner={isOwner}
                onOpenClassTraitsCatalog={() =>
                  setIsClassTraitsCatalogOpen(true)
                }
                onOpenScrollCatalog={() => setIsScrollCatalogOpen(true)}
                onDeleteClassTrait={(id) => void handleDeleteClassTrait(id)}
                onDeleteClassItem={(id) => void handleDeleteClassItem(id)}
                onDeleteScroll={(id) => void handleDeleteClassTrait(id)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {!modalMode && (
        <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
      )}

      {/* Modal de confirmación de borrado */}
      {isDeleteConfirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-[24px] border border-rose-500/30 bg-[#1a0a0a] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-rose-200">
                Eliminar personaje
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                Esta acción es irreversible. Escribe{" "}
                <span className="font-bold text-white">borrar</span> para
                confirmar.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="borrar"
                className="mt-4 h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-rose-400/60"
              />
              <div className="mt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300 hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText !== "borrar"}
                  onClick={() => void handleDeleteCharacter()}
                  className="rounded-full border border-rose-500/40 bg-rose-950/50 px-4 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-900/60 disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  if (modalMode) return <div className="w-full">{content}</div>;
  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      {content}
    </LogoLayout>
  );
}
