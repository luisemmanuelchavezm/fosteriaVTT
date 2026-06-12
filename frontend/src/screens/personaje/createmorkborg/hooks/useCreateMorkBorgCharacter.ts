import { useRef, useState } from "react";
import type { MorkBorgClass } from "../utils/morkBorgUtils";

// ── Tipos de snapshot ─────────────────────────────────────────────────────────

export interface MbStatsSnapshot {
  fuerza: number;
  modFuerza: number;
  agilidad: number;
  modAgilidad: number;
  presencia: number;
  modPresencia: number;
  resistencia: number;
  modResistencia: number;
  vida: number;
  presagios: number;
  carga: number;
}

export interface MbEquipmentSnapshot {
  plata: number;
  comida: number;
  armaIdx: number;
  armaduraNivel: number;
  contenedorResult: number | null;
  item1Result: number | null;
  item2Result: number | null;
  wantsScroll: boolean;
  perScrollTipo: number | null;
  perScrollIdx: number | null;
  esotScrollTipo: number | null;
  esotScrollIdx: number | null;
}

export interface MbTraitsData {
  rasgoTerrible1: number | null;
  rasgoTerrible2: number | null;
  cuerpoRoto: number | null;
  habito: number | null;
  historiaperturbadora: number | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCreateMorkBorgCharacter() {
  // ── Identidad ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Clase ──────────────────────────────────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState<MorkBorgClass | null>(
    null,
  );
  /** Índices 0-based de la opción de clase tirada (vacío si no aplica). */
  const [claseOpciones, setClaseOpciones] = useState<number[]>([]);

  // ── Estadísticas derivadas ─────────────────────────────────────────────────
  const [presenciaModifier, setPresenciaModifier] = useState<number | null>(
    null,
  );
  const [allMainStatsRolled, setAllMainStatsRolled] = useState(false);
  const [allStatsComplete, setAllStatsComplete] = useState(false);
  const [statsSnapshot, setStatsSnapshot] = useState<MbStatsSnapshot | null>(
    null,
  );

  // ── Equipo ─────────────────────────────────────────────────────────────────
  const [equipmentComplete, setEquipmentComplete] = useState(false);
  const [equipmentSnapshot, setEquipmentSnapshot] =
    useState<MbEquipmentSnapshot | null>(null);

  // ── Rasgos ─────────────────────────────────────────────────────────────────
  const [rasgosComplete, setRasgosComplete] = useState(false);
  const [traitsData, setTraitsData] = useState<MbTraitsData | null>(null);

  // ── Fases ──────────────────────────────────────────────────────────────────
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePortraitSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const selectClass = (item: MorkBorgClass) => {
    setSelectedClass(item);
    setClaseOpciones([]);
    setPresenciaModifier(null);
    setAllMainStatsRolled(false);
    setAllStatsComplete(false);
    setStatsSnapshot(null);
    setEquipmentComplete(false);
    setEquipmentSnapshot(null);
  };

  const clearClass = () => {
    setSelectedClass(null);
    setClaseOpciones([]);
    setPresenciaModifier(null);
    setAllMainStatsRolled(false);
    setAllStatsComplete(false);
    setStatsSnapshot(null);
    setEquipmentComplete(false);
    setEquipmentSnapshot(null);
  };

  const claseRequiereOpcion =
    !!selectedClass &&
    selectedClass.id !== "herborista-ocultista" &&
    !!(selectedClass.opciones && selectedClass.opciones.length > 0);

  const claseOpcionesComplete =
    !claseRequiereOpcion || claseOpciones.length > 0;

  return {
    // identidad
    name,
    setName,
    portraitFile,
    portraitPreview,
    fileInputRef,
    handlePortraitSelection,
    handleOpenFilePicker,
    // clase
    selectedClass,
    selectClass,
    clearClass,
    claseOpciones,
    claseOpcionesComplete,
    notifyClaseOpcionRolled: setClaseOpciones,
    // estadísticas
    presenciaModifier,
    notifyPresenciaRolled: setPresenciaModifier,
    allMainStatsRolled,
    notifyAllMainStatsRolled: () => setAllMainStatsRolled(true),
    allStatsComplete,
    notifyAllStatsComplete: () => setAllStatsComplete(true),
    statsSnapshot,
    notifyStatsSnapshot: setStatsSnapshot,
    // equipo
    equipmentComplete,
    notifyEquipmentComplete: (
      complete: boolean,
      snapshot?: MbEquipmentSnapshot,
    ) => {
      setEquipmentComplete(complete);
      if (snapshot) setEquipmentSnapshot(snapshot);
    },
    equipmentSnapshot,
    // rasgos
    rasgosComplete,
    traitsData,
    notifyRasgosComplete: (complete: boolean, data?: MbTraitsData) => {
      setRasgosComplete(complete);
      if (data) setTraitsData(data);
    },
    // fases
    activePhaseIndex,
    setActivePhaseIndex,
  };
}
