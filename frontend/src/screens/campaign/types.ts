import type {
  VisionConfig,
  ExploredArea,
  IniciativaEstado,
  NieblaEstado,
} from "./hooks/useCampaignRealtime";

// Re-export so consumers can import from one place
export type { VisionConfig, ExploredArea, IniciativaEstado, NieblaEstado };

export interface CampaignChatMessage {
  id: number;
  username: string;
  mensaje: string;
  enviadoEn: string;
}

export interface CampaignPestañaScreenProps {
  campaignId: string;
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onBack?: () => void;
}

export interface CampaignPestañaResponse {
  id: number;
  nombre: string;
  nCuadriculasX: number;
  nCuadriculasY: number;
  distanciaCasilla: number;
  sistemaMetrico: string;
  nieblaDeGuerra: string;
  imagenBaseUrl: string;
  mapaCapaUrl?: string;
  dmUsername?: string;
}

export type LayerSelection = "fichas" | "mapa" | "dm";

export interface CampaignPositionResponse {
  id: number;
  pestanaId: number;
  capa: LayerSelection;
  personajeId: number;
  personajeNombre: string;
  retrato?: string;
  posicionX: number;
  posicionY: number;
  largo: number;
  ancho: number;
  tipo?: string;
}

export interface CharacterDropPayload {
  id: number;
  nombre: string;
  retrato?: string;
  tipo?: string;
  source?: string;
  sistemaDeJuego?: string;
}

export const CHARACTER_DRAG_MIME = "application/x-fosteria-character";

export const CELL_SIZE = 70; // px fijos por celda

export type VisionShape = {
  radius: number;
  apertura: number;
  rotation: number;
  angle: number;
  length: number;
  width: number;
  height: number;
};

export type ToolSelection =
  | "move"
  | "select"
  | "pencil"
  | "ruler"
  | "fog"
  | "timer"
  | "chest";

export const CHARACTER_REMOTE_UPDATED_EVENT =
  "fosteria:character-remote-updated";
