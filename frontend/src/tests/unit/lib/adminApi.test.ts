import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  crearNpcAdmin,
  addHabilidadNpcAdmin,
  saveMBEnemyTraitsAdmin,
  addDndInventoryAdmin,
  subirMapaAdmin,
} from "../../../lib/adminApi";

vi.mock("../../../lib/api", () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:8080${path}`),
}));

const TOKEN = "test-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("crearNpcAdmin", () => {
  it("hace POST y devuelve respuesta JSON en éxito", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, nombre: "Goblin" }),
    });

    const payload = {
      nombre: "Goblin",
      tipo: "ENEMY",
      sistemaDeJuego: "MORK_BORG",
      estadisticas: {},
    };
    const result = await crearNpcAdmin(TOKEN, payload, null);
    expect(result).toEqual({ id: 1, nombre: "Goblin" });
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("lanza error cuando la respuesta no es ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "Error del servidor",
    });

    const payload = {
      nombre: "Goblin",
      tipo: "ENEMY",
      sistemaDeJuego: "MORK_BORG",
      estadisticas: {},
    };
    await expect(crearNpcAdmin(TOKEN, payload, null)).rejects.toThrow(
      "Error del servidor",
    );
  });

  it("usa mensaje por defecto cuando la respuesta de error está vacía", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "",
    });

    const payload = {
      nombre: "Goblin",
      tipo: "ENEMY",
      sistemaDeJuego: "MORK_BORG",
      estadisticas: {},
    };
    await expect(crearNpcAdmin(TOKEN, payload, null)).rejects.toThrow(
      "No se pudo crear el NPC",
    );
  });

  it("incluye portrait en FormData cuando se proporciona", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2 }),
    });

    const portrait = new File(["img"], "portrait.png", { type: "image/png" });
    const payload = {
      nombre: "Troll",
      tipo: "ENEMY",
      sistemaDeJuego: "MORK_BORG",
      estadisticas: {},
    };
    await crearNpcAdmin(TOKEN, payload, portrait);

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
  });
});

describe("addHabilidadNpcAdmin", () => {
  it("hace POST al endpoint correcto", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });
    await addHabilidadNpcAdmin(TOKEN, 1, {
      nombre: "Veneno",
      tags: "MORK_BORG",
    });
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("lanza error cuando no es ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    await expect(
      addHabilidadNpcAdmin(TOKEN, 1, { nombre: "Veneno", tags: "MORK_BORG" }),
    ).rejects.toThrow("No se pudo añadir la habilidad al NPC");
  });
});

describe("saveMBEnemyTraitsAdmin", () => {
  it("hace PATCH y resuelve en éxito", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });
    await saveMBEnemyTraitsAdmin(TOKEN, 5, "MBEnemyTag");
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("lanza error cuando no es ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    await expect(saveMBEnemyTraitsAdmin(TOKEN, 5, "tag")).rejects.toThrow(
      "No se pudieron guardar los rasgos MB del NPC",
    );
  });
});

describe("addDndInventoryAdmin", () => {
  it("hace POST al endpoint de mochila", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });
    const payload = {
      objetoId: 1,
      nombre: null,
      formula: null,
      descripcion: null,
      tipoObjeto: null,
      indice: null,
      cantidad: 1,
    };
    await addDndInventoryAdmin(TOKEN, 3, payload as never);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("lanza error cuando no es ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    await expect(addDndInventoryAdmin(TOKEN, 3, {} as never)).rejects.toThrow(
      "No se pudo añadir el objeto a la mochila del NPC",
    );
  });
});

describe("subirMapaAdmin", () => {
  it("hace POST y devuelve JSON en éxito", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 10, nombre: "Mapa1", mapa: "url" }),
    });

    const file = new File(["img"], "mapa.png", { type: "image/png" });
    const result = await subirMapaAdmin(TOKEN, "Mapa1", file);
    expect(result).toEqual({ id: 10, nombre: "Mapa1", mapa: "url" });
  });

  it("lanza error con mensaje del servidor cuando falla", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "Mapa inválido",
    });

    const file = new File(["img"], "mapa.png", { type: "image/png" });
    await expect(subirMapaAdmin(TOKEN, "Mapa1", file)).rejects.toThrow(
      "Mapa inválido",
    );
  });

  it("usa mensaje por defecto cuando el cuerpo de error está vacío", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "   ",
    });

    const file = new File(["img"], "mapa.png", { type: "image/png" });
    await expect(subirMapaAdmin(TOKEN, "Mapa1", file)).rejects.toThrow(
      "No se pudo subir el mapa",
    );
  });

  it("incluye tags en FormData cuando se proporciona", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 11, nombre: "Mapa2", mapa: "url2" }),
    });

    const file = new File(["img"], "mapa2.png", { type: "image/png" });
    await subirMapaAdmin(TOKEN, "Mapa2", file, "dungeon");
    expect(global.fetch).toHaveBeenCalledOnce();
  });
});
