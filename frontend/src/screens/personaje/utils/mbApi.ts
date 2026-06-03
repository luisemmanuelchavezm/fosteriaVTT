import { buildApiUrl } from "../../../lib/api";
import type { DndCharacterDetailResponse } from "./dndApi";

export interface MBRasgoClaseItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  formula: string | null;
  tags: string | null;
  tipo: "HABILIDAD" | "OBJETO";
}

export interface MBAyudaDmCategoria {
  id: string;
  titulo: string;
  color?: string;
  seccionIds: string[];
}

export interface MBAyudaDmGrupo {
  titulo: string;
  entradas: string[];
  etiquetas?: string[];
}

export interface MBAyudaDmBloque {
  titulo: string;
  descripcion?: string;
  lista?: string[];
}

export interface MBAyudaDmColumna {
  titulo: string;
  descripcion?: string;
  lista?: string[];
  bloques?: MBAyudaDmBloque[];
}

export interface MBAyudaDmTabla {
  titulo: string;
  encabezados: string[];
  anchos?: string[];
  filas: string[][];
}

export interface MBAyudaDmSeccion {
  id: string;
  titulo: string;
  dado: string;
  entradas: string[];
  etiquetas?: string[];
  descripcion?: string;
  grupos?: MBAyudaDmGrupo[];
  columnas?: MBAyudaDmColumna[];
  nota?: string;
  tablas?: MBAyudaDmTabla[];
  layout?: string;
}

export interface MBAyudaDmCatalogo {
  categorias?: MBAyudaDmCategoria[];
  secciones: MBAyudaDmSeccion[];
}

export interface EscoriaEspecialidadRequest {
  habilidadesAEliminar: number[];
  nuevosIdxs: number[];
}

export interface MejorarPersonajeMBRequest {
  modFuerza?: number | null;
  modAgilidad?: number | null;
  modPresencia?: number | null;
  modResistencia?: number | null;
  vidaMaxima?: number | null;
  plataGanada?: number | null;
}

export interface UpdateMBSuppliesRequest {
  plata: number;
  comida: number;
  decocciones: Record<number, number>;
}

export async function saveCurrentHpMB(
  token: string,
  characterId: number | string,
  vidaActual: number,
): Promise<void> {
  await fetch(buildApiUrl(`/api/personajes/${characterId}/hp-mb`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vidaActual }),
  });
}

export async function getMBRasgosClase(
  token: string,
): Promise<MBRasgoClaseItem[]> {
  const response = await fetch(buildApiUrl("/api/mb/rasgos-clase"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("No se pudo cargar el catálogo de rasgos");
  return response.json() as Promise<MBRasgoClaseItem[]>;
}

export async function getMBAyudaDm(
  token: string,
  signal?: AbortSignal,
): Promise<MBAyudaDmCatalogo> {
  const response = await fetch(buildApiUrl("/api/mb/ayuda-dm"), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) {
    throw new Error("No se pudo cargar la ayuda al DM de Mork Borg");
  }
  return response.json() as Promise<MBAyudaDmCatalogo>;
}

export async function agregarRasgoClaseMB(
  token: string,
  characterId: number | string,
  habilidadId: number,
): Promise<DndCharacterDetailResponse> {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/rasgo-clase-mb`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ habilidadId }),
    },
  );
  if (!response.ok) throw new Error("No se pudo añadir el rasgo de clase");
  return response.json() as Promise<DndCharacterDetailResponse>;
}

export async function crearRasgoCustomMB(
  token: string,
  characterId: number | string,
  nombre: string,
  descripcion: string,
): Promise<DndCharacterDetailResponse> {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/rasgo-custom-mb`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre, descripcion }),
    },
  );
  if (!response.ok) throw new Error("No se pudo crear el rasgo personalizado");
  return response.json() as Promise<DndCharacterDetailResponse>;
}

export async function intercambiarEscoriaEspecialidad(
  token: string,
  characterId: number | string,
  payload: EscoriaEspecialidadRequest,
): Promise<DndCharacterDetailResponse> {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/escoria-especialidad`),
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) throw new Error("No se pudo guardar la especialidad");
  return response.json() as Promise<DndCharacterDetailResponse>;
}

export async function mejorarPersonajeMB(
  token: string,
  characterId: number | string,
  payload: MejorarPersonajeMBRequest,
): Promise<DndCharacterDetailResponse> {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/mejorar-mb`),
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) throw new Error("No se pudo guardar la mejora");
  return response.json() as Promise<DndCharacterDetailResponse>;
}

export async function updateMBSupplies(
  token: string,
  characterId: number | string,
  payload: UpdateMBSuppliesRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/suministros-mb`),
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error("No se pudieron guardar los suministros del personaje");
  }
}

export async function saveMBEnemyTraits(
  token: string,
  characterId: number | string,
  tagsToAdd: string,
): Promise<void> {
  await fetch(buildApiUrl(`/api/personajes/${characterId}/mb-enemy-traits`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tagsToAdd }),
  });
}

export async function saveMBEnemyMoral(
  token: string,
  characterId: number | string,
  moralActual: number,
): Promise<void> {
  await fetch(buildApiUrl(`/api/personajes/${characterId}/mb-enemy-moral`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ moralActual }),
  });
}

export async function saveMBEnemyVida(
  token: string,
  characterId: number | string,
  vidaActual: number,
): Promise<void> {
  await fetch(buildApiUrl(`/api/personajes/${characterId}/recursos`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vidaActual,
      vidaTemporal: 0,
      espaciosConjuroActuales: {},
      recursosExtraActuales: {},
      dinero: {},
    }),
  });
}
