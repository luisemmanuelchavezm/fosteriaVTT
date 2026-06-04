import { buildApiUrl } from "./api";
import type {
  CreatedCharacterResponse,
  AddDndCharacterInventoryItemRequest,
} from "../screens/personaje/utils/dndApi";

export interface CrearNpcAdminPayload {
  nombre: string;
  tipo: string;
  sistemaDeJuego: string;
  vd?: string;
  biografia?: string;
  estadisticas: Record<string, number>;
}

/** Crea un NPC bajo el usuario "sistema" vía el endpoint de admin. */
export async function crearNpcAdmin(
  token: string,
  payload: CrearNpcAdminPayload,
  portrait: File | null,
): Promise<CreatedCharacterResponse> {
  const formData = new FormData();
  formData.append(
    "payload",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  if (portrait) {
    formData.append("portrait", portrait);
  }
  const res = await fetch(buildApiUrl("/api/admin/personajes/npc"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.trim() || "No se pudo crear el NPC");
  }
  return (await res.json()) as CreatedCharacterResponse;
}

/** Añade habilidad a un NPC del sistema sin verificación de propietario. */
export async function addHabilidadNpcAdmin(
  token: string,
  characterId: number,
  payload: {
    nombre: string;
    descripcion?: string | null;
    tags: string;
    formula?: string | null;
    bonificacion?: number | null;
  },
): Promise<void> {
  const res = await fetch(
    buildApiUrl(`/api/admin/personajes/${characterId}/habilidades/npc`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("No se pudo añadir la habilidad al NPC");
}

/** Añade tags MB a un NPC del sistema sin verificación de propietario. */
export async function saveMBEnemyTraitsAdmin(
  token: string,
  characterId: number | string,
  tagsToAdd: string,
): Promise<void> {
  const res = await fetch(
    buildApiUrl(`/api/admin/personajes/${characterId}/mb-enemy-traits`),
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags: tagsToAdd }),
    },
  );
  if (!res.ok) throw new Error("No se pudieron guardar los rasgos MB del NPC");
}

/** Añade un objeto a la mochila de un NPC del sistema sin verificación de propietario. */
export async function addDndInventoryAdmin(
  token: string,
  characterId: number | string,
  payload: AddDndCharacterInventoryItemRequest,
): Promise<void> {
  const res = await fetch(
    buildApiUrl(`/api/admin/personajes/${characterId}/mochila`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok)
    throw new Error("No se pudo añadir el objeto a la mochila del NPC");
}

/** Sube un mapa bajo el usuario "sistema". */
export async function subirMapaAdmin(
  token: string,
  nombre: string,
  mapImage: File,
  tags?: string,
): Promise<{ id: number; nombre: string; mapa: string }> {
  const formData = new FormData();
  formData.append("mapImage", mapImage);
  formData.append("nombre", nombre);
  if (tags) formData.append("tags", tags);
  const res = await fetch(buildApiUrl("/api/admin/mapas"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.trim() || "No se pudo subir el mapa");
  }
  return res.json();
}
