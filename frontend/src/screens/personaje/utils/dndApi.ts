import { buildApiUrl } from "../../../lib/api";
import type {
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
