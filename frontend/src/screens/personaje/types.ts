import type { DiceRound, StatsMethod } from "./creatednd/utils/statisticsUtils";

export interface InitialEquipmentItem {
  id: number;
  nombre: string;
  descripcion: string;
  formula: string | null;
  tipoObjeto: string;
  indice: string;
  cantidad: number;
}

export interface DndEquipmentOption {
  id: string;
  etiqueta: string;
  cantidad: number;
  objeto: InitialEquipmentItem | null;
  catalogo: string | null;
  opcionesCatalogo: InitialEquipmentItem[];
}

export interface DndEquipmentGroup {
  id: string;
  etiqueta: string;
  opciones: DndEquipmentOption[];
}

export interface DndEquipment {
  fijos: DndEquipmentOption[];
  gruposEleccion: DndEquipmentGroup[];
}

export interface DndClassSummary {
  id: string;
  nombre: string;
  insignia: string;
}

export interface DndProgressionTable {
  titulo: string;
  columnas: string[];
  filas: string[][];
}

export interface DndSubclassDetail {
  id: string;
  nombre: string;
  descripcion: string;
  nivelDesbloqueo: number;
  tablas?: DndProgressionTable[];
}

export interface DndClassHitPoints {
  dadoGolpe: string;
  primerNivel: string;
  nivelesSuperiores: string;
}

export interface DndClassCompetencies {
  armaduras: string[];
  armas: string[];
  herramientas: string[];
  salvaciones: string[];
  habilidades: string[];
}

export interface DndClassSpellcastingLevel {
  nivel: number;
  trucosConocidos: number | null;
  conjurosConocidos: number | null;
  conjurosEnLibro: number | null;
  espaciosConjuro: number[] | null;
  ranurasPacto: number | null;
  nivelRanuraPacto: number | null;
  arcanosMisticos: number[] | null;
  invocacionesConocidas: number | null;
}

export interface DndClassSpellcasting {
  modo: string;
  caracteristica: string;
  formulaConjurosPreparados: string | null;
  niveles: DndClassSpellcastingLevel[];
}

export interface ClassSkillChoiceGroup {
  id: string;
  etiqueta: string;
  resumen: string;
  catalogo: string;
  cantidad: number;
  opciones: string[];
}

export interface DndClassDetail extends DndClassSummary {
  descripcion: string;
  puntosGolpe: DndClassHitPoints;
  competencias: DndClassCompetencies;
  lanzamientoConjuros?: DndClassSpellcasting | null;
  subclases: DndSubclassDetail[];
  elecciones: ClassSkillChoiceGroup[];
  equipamiento: DndEquipment;
}

export interface DndBackgroundChoice {
  id: string;
  etiqueta: string;
  resumen: string;
  catalogo: string;
  cantidad: number;
  opciones: string[];
}

export interface DndBackgroundSummary {
  id: string;
  nombre: string;
}

export interface DndBackgroundDetail extends DndBackgroundSummary {
  descripcion: string;
  competenciasHabilidades: string[];
  competenciasHerramientas: string[];
  resumenIdiomas: string[];
  nombreRasgo: string;
  descripcionRasgo: string;
  elecciones: DndBackgroundChoice[];
  equipamiento: DndEquipment;
}

export interface BackgroundSelectionSnapshot {
  selectedBackgroundId: string;
  selectedBackground: DndBackgroundDetail | null;
  selectedChoices: Record<string, string[]>;
  alignment: string;
  personalHistory: string;
}

export interface DndRaceTrait {
  titulo: string;
  descripcion: string;
}

export interface DndRaceChoice {
  id: string;
  etiqueta: string;
  resumen: string;
  catalogo: string;
  cantidad: number;
  adjuntarATitulo: string | null;
  opciones: string[];
  excluirOpciones: string[];
}

export interface DndSubraceDetail {
  id: string;
  nombre: string;
  descripcion: string;
  aumentoCaracteristicas: string[];
  competencias: string[];
  rasgos: DndRaceTrait[];
  elecciones: DndRaceChoice[];
}

export interface DndRaceSummary {
  id: string;
  nombre: string;
}

export interface DndRaceDetail extends DndRaceSummary {
  descripcion: string;
  aumentoCaracteristicas: string[];
  edad: string;
  tamano: string;
  velocidad: number;
  idiomas: string[];
  competencias: string[];
  rasgos: DndRaceTrait[];
  elecciones: DndRaceChoice[];
  subrazas: DndSubraceDetail[];
}

export interface DndCompetencyCatalog {
  habilidades: string[];
  armasArmaduras: string[];
  herramientas: string[];
}

export interface RaceSelectionSnapshot {
  selectedRaceId: string;
  selectedRace: DndRaceDetail | null;
  selectedSubraceId: string;
  selectedSubrace: DndSubraceDetail | null;
  selectedChoices: Record<string, string[]>;
}

export interface CharacterStatisticsSnapshot {
  selectedMethod: StatsMethod;
  diceRounds: DiceRound[];
  standardAssignments: Record<string, string>;
  pointBuyScores: Record<string, number>;
  customScores: Record<string, string>;
  resolvedScores: Record<string, number | null>;
}

export interface EquipmentSelectionSnapshot {
  selectedGroups: Record<string, number | null>;
  selectedCatalogByGroup: Record<string, number | null>;
}

export interface CreateDndCharacterRequest {
  nombre: string;
  claseId: string;
  subclaseId: string | null;
  trasfondoId: string;
  razaId: string;
  subrazaId: string | null;
  alineamiento: string | null;
  historiaPersonal: string | null;
  estadisticas: Record<string, number>;
  competenciasClase: string[];
  eleccionesClase: Record<string, string[]>;
  eleccionesTrasfondo: Record<string, string[]>;
  eleccionesRaza: Record<string, string[]>;
  gruposEquipamiento: Record<string, number>;
  catalogosEquipamiento: Record<string, number>;
}
