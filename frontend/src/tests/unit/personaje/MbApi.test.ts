// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  saveCurrentHpMB,
  getMBRasgosClase,
  getMBAyudaDm,
  agregarRasgoClaseMB,
  crearRasgoCustomMB,
  intercambiarEscoriaEspecialidad,
  mejorarPersonajeMB,
  updateMBSupplies,
  saveMBEnemyTraits,
  saveMBEnemyMoral,
  saveMBEnemyVida,
} from "../../../screens/personaje/utils/mbApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function okJson(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

function errorResponse(status = 500) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
  } as unknown as Response;
}

function okEmpty() {
  return { ok: true, status: 204 } as unknown as Response;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("mbApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── saveCurrentHpMB ──────────────────────────────────────────────────────

  describe("saveCurrentHpMB", () => {
    it("hace PATCH a /api/personajes/:id/hp-mb con el body correcto", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(okEmpty());

      await saveCurrentHpMB("tok", 42, 15);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/42/hp-mb"),
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({ Authorization: "Bearer tok" }),
          body: JSON.stringify({ vidaActual: 15 }),
        }),
      );
    });

    it("no lanza si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(saveCurrentHpMB("tok", 1, 5)).resolves.toBeUndefined();
    });
  });

  // ── getMBRasgosClase ─────────────────────────────────────────────────────

  describe("getMBRasgosClase", () => {
    it("retorna lista de rasgos con respuesta ok", async () => {
      const data = [
        {
          id: 1,
          nombre: "Rasgo",
          descripcion: null,
          formula: null,
          tags: null,
          tipo: "HABILIDAD",
        },
      ];
      vi.mocked(fetch).mockResolvedValueOnce(okJson(data));

      const result = await getMBRasgosClase("tok");
      expect(result).toEqual(data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/mb/rasgos-clase"),
        expect.objectContaining({ headers: { Authorization: "Bearer tok" } }),
      );
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404));
      await expect(getMBRasgosClase("tok")).rejects.toThrow(
        "No se pudo cargar el catálogo de rasgos",
      );
    });
  });

  // ── getMBAyudaDm ─────────────────────────────────────────────────────────

  describe("getMBAyudaDm", () => {
    it("retorna el catálogo de ayuda DM", async () => {
      const data = { secciones: [] };
      vi.mocked(fetch).mockResolvedValueOnce(okJson(data));

      const result = await getMBAyudaDm("tok");
      expect(result).toEqual(data);
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500));
      await expect(getMBAyudaDm("tok")).rejects.toThrow(
        "No se pudo cargar la ayuda al DM de Mork Borg",
      );
    });

    it("pasa signal de abort correctamente", async () => {
      const data = { secciones: [] };
      vi.mocked(fetch).mockResolvedValueOnce(okJson(data));
      const controller = new AbortController();

      await getMBAyudaDm("tok", controller.signal);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  // ── agregarRasgoClaseMB ─────────────────────────────────────────────────

  describe("agregarRasgoClaseMB", () => {
    it("hace POST con habilidadId y retorna el personaje actualizado", async () => {
      const char = { id: 7, nombre: "Kragor" };
      vi.mocked(fetch).mockResolvedValueOnce(okJson(char));

      const result = await agregarRasgoClaseMB("tok", 7, 55);

      expect(result).toEqual(char);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/7/rasgo-clase-mb"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ habilidadId: 55 }),
        }),
      );
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(agregarRasgoClaseMB("tok", 1, 1)).rejects.toThrow(
        "No se pudo añadir el rasgo de clase",
      );
    });
  });

  // ── crearRasgoCustomMB ──────────────────────────────────────────────────

  describe("crearRasgoCustomMB", () => {
    it("hace POST con nombre y descripcion", async () => {
      const char = { id: 3, nombre: "Kragor" };
      vi.mocked(fetch).mockResolvedValueOnce(okJson(char));

      const result = await crearRasgoCustomMB(
        "tok",
        3,
        "Mi rasgo",
        "Descripción",
      );

      expect(result).toEqual(char);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/3/rasgo-custom-mb"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            nombre: "Mi rasgo",
            descripcion: "Descripción",
          }),
        }),
      );
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(crearRasgoCustomMB("tok", 1, "x", "y")).rejects.toThrow(
        "No se pudo crear el rasgo personalizado",
      );
    });
  });

  // ── intercambiarEscoriaEspecialidad ─────────────────────────────────────

  describe("intercambiarEscoriaEspecialidad", () => {
    it("hace PATCH con el payload correcto", async () => {
      const char = { id: 5, nombre: "Scum" };
      vi.mocked(fetch).mockResolvedValueOnce(okJson(char));

      const payload = { habilidadesAEliminar: [1, 2], nuevosIdxs: [3] };
      const result = await intercambiarEscoriaEspecialidad("tok", 5, payload);

      expect(result).toEqual(char);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/5/escoria-especialidad"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      );
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(
        intercambiarEscoriaEspecialidad("tok", 1, {
          habilidadesAEliminar: [],
          nuevosIdxs: [],
        }),
      ).rejects.toThrow("No se pudo guardar la especialidad");
    });
  });

  // ── mejorarPersonajeMB ──────────────────────────────────────────────────

  describe("mejorarPersonajeMB", () => {
    it("hace PATCH a /mejorar-mb y retorna el personaje", async () => {
      const char = { id: 2, nombre: "Kragor" };
      vi.mocked(fetch).mockResolvedValueOnce(okJson(char));

      const payload = { vidaMaxima: 2, plataGanada: 10 };
      const result = await mejorarPersonajeMB("tok", 2, payload);

      expect(result).toEqual(char);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/2/mejorar-mb"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      );
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(mejorarPersonajeMB("tok", 1, {})).rejects.toThrow(
        "No se pudo guardar la mejora",
      );
    });
  });

  // ── updateMBSupplies ────────────────────────────────────────────────────

  describe("updateMBSupplies", () => {
    it("hace PATCH a /suministros-mb con el payload", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(okEmpty());

      await updateMBSupplies("tok", 9, {
        plata: 5,
        comida: 3,
        decocciones: { 0: 1 },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/9/suministros-mb"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ plata: 5, comida: 3, decocciones: { 0: 1 } }),
        }),
      );
    });

    it("lanza error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(
        updateMBSupplies("tok", 1, { plata: 0, comida: 0, decocciones: {} }),
      ).rejects.toThrow("No se pudieron guardar los suministros del personaje");
    });
  });

  // ── saveMBEnemyTraits ────────────────────────────────────────────────────

  describe("saveMBEnemyTraits", () => {
    it("hace PATCH a /mb-enemy-traits", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(okEmpty());

      await saveMBEnemyTraits("tok", 11, "tag1;tag2");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/11/mb-enemy-traits"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ tagsToAdd: "tag1;tag2" }),
        }),
      );
    });

    it("no lanza si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(saveMBEnemyTraits("tok", 1, "")).resolves.toBeUndefined();
    });
  });

  // ── saveMBEnemyMoral ─────────────────────────────────────────────────────

  describe("saveMBEnemyMoral", () => {
    it("hace PATCH a /mb-enemy-moral con moralActual", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(okEmpty());

      await saveMBEnemyMoral("tok", 12, 7);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/12/mb-enemy-moral"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ moralActual: 7 }),
        }),
      );
    });

    it("no lanza si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(saveMBEnemyMoral("tok", 1, 0)).resolves.toBeUndefined();
    });
  });

  // ── saveMBEnemyVida ──────────────────────────────────────────────────────

  describe("saveMBEnemyVida", () => {
    it("hace PATCH a /recursos con vidaActual y campos vacíos", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(okEmpty());

      await saveMBEnemyVida("tok", 13, 4);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/personajes/13/recursos"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            vidaActual: 4,
            vidaTemporal: 0,
            espaciosConjuroActuales: {},
            recursosExtraActuales: {},
            dinero: {},
          }),
        }),
      );
    });

    it("no lanza si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(errorResponse());
      await expect(saveMBEnemyVida("tok", 1, 0)).resolves.toBeUndefined();
    });
  });
});
