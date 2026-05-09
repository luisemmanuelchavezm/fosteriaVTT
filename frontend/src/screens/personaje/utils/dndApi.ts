import { buildApiUrl } from "../../../lib/api";
import type {
  CreateDndCharacterRequest,
  DndBackgroundDetail,
  DndBackgroundSummary,
  DndClassDetail,
  DndCompetencyCatalog,
  DndClassSummary,
} from "../types";

export interface ClassSkill {
  id: number;
  nombre: string;
  formula: string | null;
  descripcion: string | null;
  tags: string | null;
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
    throw new Error("No se pudo cargar la información de DnD");
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

export function fetchDndCompetencyCatalog(token: string, signal?: AbortSignal) {
  return fetchDndResource<DndCompetencyCatalog>(
    token,
    "/api/informacion/dnd/catalogos/competencias",
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

export async function fetchClassSubclassSkills(
  token: string,
  classId: string,
  subclassId: string,
  signal?: AbortSignal,
) {
  const response = await fetch(
    buildApiUrl(`/api/habilidades/${classId}/subclases/${subclassId}`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudieron cargar las habilidades de la subclase");
  }

  return (await response.json()) as ClassSkillGroup[];
}

export async function fetchSpellDetailByName(
  token: string,
  spellName: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ nombre: spellName });
  const response = await fetch(
    buildApiUrl(`/api/habilidades/conjuros/detalle?${query.toString()}`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("No se pudo cargar la información del conjuro o truco");
  }

  return (await response.json()) as CharacterAbilityResponse;
}

export async function fetchAbilityCatalog(
  token: string,
  filters: {
    clase?: string;
    subclase?: string;
    etiqueta?: string;
  },
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (filters.clase) {
    query.set("clase", filters.clase);
  }
  if (filters.subclase) {
    query.set("subclase", filters.subclase);
  }
  if (filters.etiqueta) {
    query.set("etiqueta", filters.etiqueta);
  }

  const suffix = query.toString();
  const response = await fetch(
    buildApiUrl(`/api/habilidades/catalogo${suffix ? `?${suffix}` : ""}`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar el catálogo de habilidades");
  }

  return (await response.json()) as CharacterAbilityResponse[];
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
  bonificacion: number | null;
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
  formula: string | null;
  descripcion: string | null;
}

export interface ObjectCatalogResponse {
  id: number;
  nombre: string;
  formula: string | null;
  descripcion: string | null;
  tipoObjeto: string;
}

export interface DndCharacterDetailResponse {
  id: number;
  nombre: string;
  retrato: string;
  biografia: string | null;
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

export interface UpdateDndCharacterResourcesRequest {
  vidaActual: number;
  vidaTemporal: number;
  espaciosConjuroActuales: Record<number, number>;
  recursosExtraActuales?: Record<number, number>;
  dinero: Record<string, number>;
}

export interface UpdateDndCharacterInventoryItemRequest {
  equipado?: boolean;
  cantidad?: number;
}

export interface AddDndCharacterInventoryItemRequest {
  objetoId?: number;
  nombre?: string;
  formula?: string | null;
  descripcion?: string | null;
  tipoObjeto?: string;
  indice?: string | null;
  cantidad?: number;
}

export interface AddDndCharacterAbilityRequest {
  habilidadId: number;
}

export interface UpdateDndCharacterExperienceRequest {
  experiencia: number;
}

export interface LevelUpFeatSelectionRequest {
  nombre: string;
  descripcion: string;
  formula?: string | null;
  bonificacionesCaracteristica?: Record<string, number>;
  competencias?: string[];
  habilidades?: string[];
  idiomas?: string[];
  conjuros?: string[];
  claseConjuros?: string | null;
}

export interface LevelUpDndCharacterRequest {
  claseId: string;
  subclaseId?: string | null;
  eleccionesClase?: Record<string, string[]>;
  modoMejoraCaracteristica?: string | null;
  caracteristicaPrimaria?: string | null;
  caracteristicaSecundaria?: string | null;
  dote?: LevelUpFeatSelectionRequest | null;
}

export interface LevelDownDndCharacterRequest {
  claseId: string;
}

export interface UpdateDndCharacterSheetRequest {
  nombre: string;
  alineamiento?: string | null;
  historiaPersonal?: string | null;
  idiomasTexto?: string | null;
  competenciasArmasArmaduras?: string[];
  competenciasHerramientas?: string[];
  estadisticasBase: Record<string, number>;
  movimiento?: number | null;
  vidaMaxima?: number | null;
  espaciosConjuroMaximos?: Record<number, number>;
  espaciosConjuroActuales?: Record<number, number>;
  recursosExtraMaximos?: Record<number, number>;
  recursosExtraActuales?: Record<number, number>;
  salvacionesCompetentes?: string[];
  habilidadesCompetentes?: string[];
  habilidadesConPericia?: string[];
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

export async function updateDndCharacterResources(
  token: string,
  characterId: number | string,
  payload: UpdateDndCharacterResourcesRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/recursos`),
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
    throw new Error("No se pudieron guardar los recursos del personaje");
  }
}

export async function updateDndCharacterExperience(
  token: string,
  characterId: number | string,
  payload: UpdateDndCharacterExperienceRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/experiencia`),
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
    throw new Error("No se pudo actualizar la experiencia del personaje");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function levelUpDndCharacter(
  token: string,
  characterId: number | string,
  payload: LevelUpDndCharacterRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/subir-nivel`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo aplicar la subida de nivel");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function deleteDndCharacter(
  token: string,
  characterId: number | string,
) {
  const response = await fetch(buildApiUrl(`/api/personajes/${characterId}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el personaje");
  }
}

export async function levelDownDndCharacter(
  token: string,
  characterId: number | string,
  payload: LevelDownDndCharacterRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/bajar-nivel`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo bajar de nivel al personaje");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function updateDndCharacterSheet(
  token: string,
  characterId: number | string,
  payload: UpdateDndCharacterSheetRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/edicion`),
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
    throw new Error("No se pudo guardar la edición del personaje");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function updateDndCharacterInventoryItem(
  token: string,
  characterId: number | string,
  itemId: number,
  payload: UpdateDndCharacterInventoryItemRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/mochila/${itemId}`),
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
    throw new Error("No se pudo actualizar el inventario del personaje");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function fetchSpellCatalog(
  token: string,
  options?: {
    nombre?: string;
    nivel?: number;
    clase?: string;
  },
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (options?.nombre) {
    query.set("nombre", options.nombre);
  }
  if (typeof options?.nivel === "number") {
    query.set("nivel", String(options.nivel));
  }
  if (options?.clase) {
    query.set("clase", options.clase);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetch(
    buildApiUrl(`/api/habilidades/conjuros${suffix}`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar el catálogo de conjuros");
  }

  return (await response.json()) as CharacterAbilityResponse[];
}

export async function fetchObjectCatalog(
  token: string,
  options?: {
    nombre?: string;
    tipo?: string;
  },
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (options?.nombre) {
    query.set("nombre", options.nombre);
  }
  if (options?.tipo) {
    query.set("tipo", options.tipo);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetch(buildApiUrl(`/api/objetos${suffix}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar el catálogo de objetos");
  }

  return (await response.json()) as ObjectCatalogResponse[];
}

export async function addDndCharacterInventoryItem(
  token: string,
  characterId: number | string,
  payload: AddDndCharacterInventoryItemRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/mochila`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo añadir el objeto a la mochila");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function deleteDndCharacterInventoryItem(
  token: string,
  characterId: number | string,
  itemId: number,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/mochila/${itemId}`),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo eliminar el objeto de la mochila");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function addDndCharacterAbility(
  token: string,
  characterId: number | string,
  payload: AddDndCharacterAbilityRequest,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/habilidades`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo añadir el hechizo al personaje");
  }

  return (await response.json()) as DndCharacterDetailResponse;
}

export async function deleteDndCharacterAbility(
  token: string,
  characterId: number | string,
  abilityId: number,
) {
  const response = await fetch(
    buildApiUrl(`/api/personajes/${characterId}/habilidades/${abilityId}`),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo eliminar la habilidad del personaje");
  }

  return (await response.json()) as DndCharacterDetailResponse;
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
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Tu sesión no es válida o ha caducado. Vuelve a iniciar sesión antes de crear el personaje.",
      );
    }

    let backendMessage = "";
    const contentType = response.headers.get("content-type") ?? "";

    try {
      if (contentType.includes("application/json")) {
        const errorBody = (await response.json()) as {
          message?: string;
          detail?: string;
          error?: string;
        };
        backendMessage =
          errorBody.detail ?? errorBody.message ?? errorBody.error ?? "";
      } else {
        backendMessage = await response.text();
      }
    } catch {
      backendMessage = "";
    }

    if (backendMessage.trim()) {
      throw new Error(backendMessage.trim());
    }

    throw new Error("No se pudo crear el personaje");
  }

  return (await response.json()) as CreatedCharacterResponse;
}
