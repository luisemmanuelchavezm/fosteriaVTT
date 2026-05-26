export interface CampaignSummaryResponse {
  id: number;
  sistemaDeJuego: string;
}

export interface CampaignPageResponse {
  items: CampaignSummaryResponse[];
  hasMore: boolean;
}

export interface CharacterSummaryResponse {
  id: number;
  nombre: string;
  retrato?: string;
  sistemaDeJuego: string;
  tipo?: string;
  esPublico?: boolean;
  estaPublicado?: boolean;
  esGuardado?: boolean;
}

export interface CharacterPageResponse {
  items: CharacterSummaryResponse[];
}

export interface MapSummaryResponse {
  id: number;
  nombre: string;
  mapa?: string;
  esPublico?: boolean;
  estaPublicado?: boolean;
  creadorUsername?: string;
  yaTienesCopia?: boolean;
  esGuardado?: boolean;
}

export interface MapPageResponse {
  items: MapSummaryResponse[];
}

export interface CreateMapResponse {
  id: number;
  nombre: string;
  mapa?: string;
}

export interface MarketplaceCharacterResponse {
  id: number;
  nombre: string;
  retrato?: string;
  sistemaDeJuego: string;
  tipo: string;
  creadorUsername: string;
  yaTienesCopia: boolean;
}

export interface MarketplacePageResponse {
  items: MarketplaceCharacterResponse[];
  hasMore: boolean;
}

export type ChestSourceTab = "mine" | "marketplace";
export type ChestContentTab = "characters" | "map";
export type ChestTipoTab = "todos" | "personajes" | "enemigos" | "pnj";

export const TIPO_BADGE: Record<string, string> = {
  enemigo: "bg-red-900/70 text-red-300 border border-red-500/40",
  pnj: "bg-sky-900/70 text-sky-300 border border-sky-500/40",
  personaje: "bg-violet-900/70 text-violet-300 border border-violet-500/40",
};
