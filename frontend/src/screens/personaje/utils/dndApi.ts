import { buildApiUrl } from "../../../lib/api";
import type {
  CreateDndCharacterRequest,
  DndBackgroundDetail,
  DndBackgroundSummary,
  DndClassDetail,
  DndClassSummary,
} from "../types";

export interface ClassSkill {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface ClassSkillGroup {
  nivel: number;
  habilidades: ClassSkill[];
}

async function fetchDndResource<T>(
  token: string,
  path: string,
  signal?: AbortSignal,
) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la informacion de DnD");
  }

  return (await response.json()) as T;
}

export function fetchDndClassSummaries(token: string, signal?: AbortSignal) {
  return fetchDndResource<DndClassSummary[]>(
    token,
    "/api/informacion/dnd/clases",
    signal,
  );
}

export function fetchDndClassDetail(
  token: string,
  id: string,
  signal?: AbortSignal,
) {
  return fetchDndResource<DndClassDetail>(
    token,
    `/api/informacion/dnd/clases/${id}`,
    signal,
  );
}

export function fetchDndBackgroundSummaries(
  token: string,
  signal?: AbortSignal,
) {
  return fetchDndResource<DndBackgroundSummary[]>(
    token,
    "/api/informacion/dnd/trasfondos",
    signal,
  );
}

export function fetchDndBackgroundDetail(
  token: string,
  id: string,
  signal?: AbortSignal,
) {
  return fetchDndResource<DndBackgroundDetail>(
    token,
    `/api/informacion/dnd/trasfondos/${id}`,
    signal,
  );
}

export async function fetchClassSkills(
  token: string,
  classId: string,
  signal?: AbortSignal,
) {
  const response = await fetch(buildApiUrl(`/api/habilidades/${classId}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar las habilidades de la clase");
  }

  return (await response.json()) as ClassSkillGroup[];
}

export interface CreatedCharacterResponse {
  id: number;
  nombre: string;
  retrato: string;
  sistemaDeJuego: string;
  usado: string;
}

export interface CharacterClassLevelResponse {
  nombre: string;
  nivel: number;
}

export interface CharacterAbilityResponse {
  id: number;
  nombre: string;
  formula: string | null;
  descripcion: string | null;
  tags: string | null;
}

export interface CharacterInventoryItemResponse {
  id: number;
  nombre: string;
  cantidad: number;
  equipado: boolean;
  tags: string;
  tipoObjeto: string;
}

export interface DndCharacterDetailResponse {
  id: number;
  nombre: string;
  retrato: string;
  sistemaDeJuego: string;
  raza: string | null;
  subraza: string | null;
  clases: CharacterClassLevelResponse[];
  caracteristicaLanzamientoConjuros: string | null;
  estadisticas: Record<string, number>;
  habilidades: CharacterAbilityResponse[];
  mochila: CharacterInventoryItemResponse[];
  usado: string;
}

export function fetchDndCharacterDetail(
  token: string,
  characterId: number | string,
  signal?: AbortSignal,
) {
  return fetchDndResource<DndCharacterDetailResponse>(
    token,
    `/api/personajes/${characterId}`,
    signal,
  );
}

export async function markCharacterAsUsed(
  token: string,
  characterId: number | string,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/usar`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo actualizar el uso del personaje");
  }
}

export async function createDndCharacter(
  token: string,
  payload: CreateDndCharacterRequest,
  portrait: File,
) {
  const formData = new FormData();
  formData.append(
    "payload",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  formData.append("portrait", portrait);

  const response = await fetch(buildApiUrl("/api/personajes/dnd"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el personaje");
  }

  return (await response.json()) as CreatedCharacterResponse;
}
