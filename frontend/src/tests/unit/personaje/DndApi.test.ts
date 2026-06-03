// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDndCharacterAbility,
  addDndCharacterInventoryItem,
  createDndCharacter,
  deleteDndCharacter,
  deleteDndCharacterAbility,
  deleteDndCharacterInventoryItem,
  fetchDndBackgroundDetail,
  fetchDndBackgroundSummaries,
  fetchDndCharacterDetail,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  fetchDndCompetencyCatalog,
  fetchClassSkills,
  fetchClassSubclassSkills,
  fetchObjectCatalog,
  fetchSpellCatalog,
  fetchSpellDetailByName,
  fetchAbilityCatalog,
  levelDownDndCharacter,
  levelUpDndCharacter,
  markCharacterAsUsed,
  updateDndCharacterInventoryItem,
  updateDndCharacterExperience,
  updateDndCharacterResources,
  updateDndCharacterSheet,
} from "../../../screens/personaje/utils/dndApi";

describe("personaje dndApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("carga recursos DnD y propaga errores de lectura", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        okJson([{ id: "mago", nombre: "Mago", insignia: "Ma" }]),
      )
      .mockResolvedValueOnce(okJson({ id: "sabio", nombre: "Sabio" }))
      .mockResolvedValueOnce(
        okJson({
          habilidades: ["Arcano"],
          armasArmaduras: [],
          herramientas: [],
        }),
      )
      .mockResolvedValueOnce(errorResponse(500));

    await expect(fetchDndClassSummaries("token")).resolves.toEqual([
      { id: "mago", nombre: "Mago", insignia: "Ma" },
    ]);
    await expect(fetchDndBackgroundDetail("token", "sabio")).resolves.toEqual({
      id: "sabio",
      nombre: "Sabio",
    });
    await expect(fetchDndCompetencyCatalog("token")).resolves.toEqual({
      habilidades: ["Arcano"],
      armasArmaduras: [],
      herramientas: [],
    });
    await expect(fetchDndClassSummaries("token")).rejects.toThrow(
      "No se pudo cargar la información de DnD",
    );
  });

  it("carga detalles, resúmenes y habilidades de clase", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(okJson({ id: "mago", nombre: "Mago" }))
      .mockResolvedValueOnce(okJson([{ id: "sabio", nombre: "Sabio" }]))
      .mockResolvedValueOnce(
        okJson([{ nivel: 1, habilidades: [{ id: 1, nombre: "Luz" }] }]),
      )
      .mockResolvedValueOnce(
        okJson([
          { nivel: 2, habilidades: [{ id: 2, nombre: "Esculpir conjuros" }] },
        ]),
      )
      .mockResolvedValueOnce(okJson({ id: 9, nombre: "Iria" }));

    await expect(fetchDndClassDetail("token", "mago")).resolves.toEqual({
      id: "mago",
      nombre: "Mago",
    });
    await expect(fetchDndBackgroundSummaries("token")).resolves.toEqual([
      { id: "sabio", nombre: "Sabio" },
    ]);
    await expect(fetchClassSkills("token", "mago")).resolves.toEqual([
      { nivel: 1, habilidades: [{ id: 1, nombre: "Luz" }] },
    ]);
    await expect(
      fetchClassSubclassSkills("token", "mago", "evocacion"),
    ).resolves.toEqual([
      { nivel: 2, habilidades: [{ id: 2, nombre: "Esculpir conjuros" }] },
    ]);
    await expect(fetchDndCharacterDetail("token", 9)).resolves.toEqual({
      id: 9,
      nombre: "Iria",
    });
  });

  it("construye queries de conjuros y trata el 404 del detalle como null", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(okJson([{ id: 1, nombre: "Luz" }]))
      .mockResolvedValueOnce(notFoundJson());

    await expect(
      fetchSpellCatalog("token", { nombre: "Luz", nivel: 0, clase: "mago" }),
    ).resolves.toEqual([{ id: 1, nombre: "Luz" }]);
    await expect(
      fetchSpellDetailByName("token", "Oscuridad"),
    ).resolves.toBeNull();

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/api/habilidades/conjuros?nombre=Luz&nivel=0&clase=mago",
    );
  });

  it("envia mutaciones de personaje con metodo y cuerpo correctos", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(okNoContent())
      .mockResolvedValueOnce(okJson({ id: 9 }))
      .mockResolvedValueOnce(okJson({ id: 9 }));

    await expect(
      updateDndCharacterResources("token", 9, {
        vidaActual: 20,
        vidaTemporal: 2,
        espaciosConjuroActuales: { 1: 1 },
        dinero: { po: 10 },
      }),
    ).resolves.toBeUndefined();
    await expect(
      updateDndCharacterExperience("token", 9, { experiencia: 900 }),
    ).resolves.toEqual({ id: 9 });
    await expect(
      levelUpDndCharacter("token", 9, { claseId: "mago" }),
    ).resolves.toEqual({ id: 9 });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "PATCH" });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "PATCH" });
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: "POST" });
  });

  it("cubre el resto de mutaciones CRUD del personaje", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(okNoContent())
      .mockResolvedValueOnce(okJson({ id: 9, edited: true }))
      .mockResolvedValueOnce(okJson({ id: 9, itemUpdated: true }))
      .mockResolvedValueOnce(okJson([{ id: 2, nombre: "Antorcha" }]))
      .mockResolvedValueOnce(okJson([{ id: 5, nombre: "Misil mágico" }]))
      .mockResolvedValueOnce(okJson({ id: 9, inventoryAdded: true }))
      .mockResolvedValueOnce(okJson({ id: 9, inventoryDeleted: true }))
      .mockResolvedValueOnce(okJson({ id: 9, abilityAdded: true }))
      .mockResolvedValueOnce(okJson({ id: 9, abilityDeleted: true }))
      .mockResolvedValueOnce(okNoContent())
      .mockResolvedValueOnce(okJson({ id: 9, leveledDown: true }));

    await expect(deleteDndCharacter("token", 9)).resolves.toBeUndefined();
    await expect(
      updateDndCharacterSheet("token", 9, {
        nombre: "Iria",
        estadisticasBase: { Fuerza: 8 },
      }),
    ).resolves.toEqual({ id: 9, edited: true });
    await expect(
      updateDndCharacterInventoryItem("token", 9, 4, { equipado: true }),
    ).resolves.toEqual({ id: 9, itemUpdated: true });
    await expect(
      fetchObjectCatalog("token", { nombre: "ant", tipo: "MISCELANEO" }),
    ).resolves.toEqual([{ id: 2, nombre: "Antorcha" }]);
    await expect(fetchSpellCatalog("token")).resolves.toEqual([
      { id: 5, nombre: "Misil mágico" },
    ]);
    await expect(
      addDndCharacterInventoryItem("token", 9, {
        nombre: "Cuerda",
        cantidad: 1,
      }),
    ).resolves.toEqual({ id: 9, inventoryAdded: true });
    await expect(
      deleteDndCharacterInventoryItem("token", 9, 4),
    ).resolves.toEqual({
      id: 9,
      inventoryDeleted: true,
    });
    await expect(
      addDndCharacterAbility("token", 9, { habilidadId: 7 }),
    ).resolves.toEqual({
      id: 9,
      abilityAdded: true,
    });
    await expect(deleteDndCharacterAbility("token", 9, 7)).resolves.toEqual({
      id: 9,
      abilityDeleted: true,
    });
    await expect(markCharacterAsUsed("token", 9)).resolves.toBeUndefined();
    await expect(
      levelDownDndCharacter("token", 9, { claseId: "mago" }),
    ).resolves.toEqual({
      id: 9,
      leveledDown: true,
    });

    expect(fetchMock.mock.calls[3]?.[0]).toContain(
      "/api/objetos?nombre=ant&tipo=MISCELANEO",
    );
    expect(fetchMock.mock.calls[4]?.[0]).toContain("/api/habilidades/conjuros");
  });

  it("propaga errores de las mutaciones de personaje", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500));

    await expect(deleteDndCharacter("token", 9)).rejects.toThrow(
      "No se pudo eliminar el personaje",
    );
    await expect(
      levelDownDndCharacter("token", 9, { claseId: "mago" }),
    ).rejects.toThrow("No se pudo bajar de nivel al personaje");
    await expect(
      updateDndCharacterSheet("token", 9, {
        nombre: "Iria",
        estadisticasBase: { Fuerza: 8 },
      }),
    ).rejects.toThrow("No se pudo guardar la edición del personaje");
    await expect(
      updateDndCharacterInventoryItem("token", 9, 4, { cantidad: 2 }),
    ).rejects.toThrow("No se pudo actualizar el inventario del personaje");
    await expect(fetchObjectCatalog("token")).rejects.toThrow(
      "No se pudo cargar el catálogo de objetos",
    );
    await expect(
      addDndCharacterInventoryItem("token", 9, { nombre: "Cuerda" }),
    ).rejects.toThrow("No se pudo añadir el objeto a la mochila");
    await expect(
      deleteDndCharacterInventoryItem("token", 9, 4),
    ).rejects.toThrow("No se pudo eliminar el objeto de la mochila");
    await expect(
      addDndCharacterAbility("token", 9, { habilidadId: 7 }),
    ).rejects.toThrow("No se pudo añadir el hechizo al personaje");
    await expect(deleteDndCharacterAbility("token", 9, 7)).rejects.toThrow(
      "No se pudo eliminar la habilidad del personaje",
    );
  });

  it("propaga errores de fetchClassSubclassSkills y fetchSpellDetailByName", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500));

    await expect(
      fetchClassSubclassSkills("token", "mago", "evocacion"),
    ).rejects.toThrow("No se pudieron cargar las habilidades de la subclase");
    await expect(
      fetchSpellDetailByName("token", "Bola de fuego"),
    ).rejects.toThrow("No se pudo cargar la información del conjuro o truco");
  });

  it("fetchAbilityCatalog carga catálogo con y sin filtros", async () => {
    const fetchMock = vi.mocked(fetch);
    const catalog = [{ id: 1, nombre: "Arcano", tags: "CatalogoHabilidadDnd" }];
    fetchMock
      .mockResolvedValueOnce(okJson(catalog))
      .mockResolvedValueOnce(okJson(catalog))
      .mockResolvedValueOnce(okJson(catalog))
      .mockResolvedValueOnce(errorResponse(500));

    await expect(fetchAbilityCatalog("token", {})).resolves.toEqual(catalog);
    await expect(
      fetchAbilityCatalog("token", { clase: "mago" }),
    ).resolves.toEqual(catalog);
    await expect(
      fetchAbilityCatalog("token", {
        clase: "mago",
        subclase: "ev",
        etiqueta: "truco",
      }),
    ).resolves.toEqual(catalog);
    await expect(fetchAbilityCatalog("token", {})).rejects.toThrow(
      "No se pudo cargar el catálogo de habilidades",
    );
  });

  it("maneja errores de creacion de personaje para sesion, backend y exito", async () => {
    const fetchMock = vi.mocked(fetch);
    const portrait = new File(["portrait"], "portrait.png", {
      type: "image/png",
    });
    const payload = {
      nombre: "Iria",
      claseId: "mago",
      subclaseId: null,
      trasfondoId: "sabio",
      razaId: "elf",
      subrazaId: "high-elf",
      alineamiento: "Neutral bueno",
      historiaPersonal: "",
      estadisticas: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 17,
        wisdom: 12,
        charisma: 10,
      },
      competenciasClase: ["Arcano"],
      eleccionesClase: { "class-skill-0": ["Arcano", "Historia"] },
      eleccionesTrasfondo: {},
      eleccionesRaza: {},
      gruposEquipamiento: {},
      catalogosEquipamiento: {},
    };

    fetchMock
      .mockResolvedValueOnce(errorResponse(401))
      .mockResolvedValueOnce(
        jsonErrorResponse(400, {
          detail: "No se pudo resolver un objeto inicial del personaje",
        }),
      )
      .mockResolvedValueOnce(
        okJson({
          id: 5,
          nombre: "Iria",
          retrato: "url",
          sistemaDeJuego: "DND",
          usado: "now",
        }),
      );

    await expect(
      createDndCharacter("token", payload, portrait),
    ).rejects.toThrow(
      "Tu sesión no es válida o ha caducado. Vuelve a iniciar sesión antes de crear el personaje.",
    );
    await expect(
      createDndCharacter("token", payload, portrait),
    ).rejects.toThrow("No se pudo resolver un objeto inicial del personaje");
    await expect(
      createDndCharacter("token", payload, portrait),
    ).resolves.toEqual({
      id: 5,
      nombre: "Iria",
      retrato: "url",
      sistemaDeJuego: "DND",
      usado: "now",
    });
  });
});

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function okNoContent(): Response {
  return new Response(null, { status: 200 });
}

function errorResponse(status: number): Response {
  return new Response("", { status });
}

function notFoundJson(): Response {
  return new Response("{}", {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonErrorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
