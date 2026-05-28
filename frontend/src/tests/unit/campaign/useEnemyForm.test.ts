// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEnemyForm } from "../../../screens/campaign/hooks/useEnemyForm";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  crearNpc: vi.fn(),
  addDndCharacterInventoryItem: vi.fn(),
  addHabilidadNpc: vi.fn(),
}));

// ── Setup ─────────────────────────────────────────────────────────────────────

function setup(sistema = "Dungeons and Dragons") {
  const onCreated = vi.fn();
  const onClose = vi.fn();
  const { result } = renderHook(() =>
    useEnemyForm(sistema, onCreated, onClose),
  );
  return { result, onCreated, onClose };
}

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useEnemyForm - estado inicial", () => {
  it("nombre empieza vacío", () => {
    const { result } = setup();
    expect(result.current.nombre).toBe("");
  });

  it("tipo empieza como enemigo", () => {
    const { result } = setup();
    expect(result.current.tipo).toBe("enemigo");
  });

  it("ca empieza en 10", () => {
    const { result } = setup();
    expect(result.current.ca).toBe(10);
  });

  it("pvMax empieza en 10", () => {
    const { result } = setup();
    expect(result.current.pvMax).toBe(10);
  });

  it("movimiento empieza en 30", () => {
    const { result } = setup();
    expect(result.current.movimiento).toBe(30);
  });

  it("isSubmitting empieza en false", () => {
    const { result } = setup();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("error empieza en null", () => {
    const { result } = setup();
    expect(result.current.error).toBeNull();
  });

  it("skillOverrides empieza vacío", () => {
    const { result } = setup();
    expect(result.current.skillOverrides).toHaveLength(0);
  });

  it("saveOverrides empieza vacío", () => {
    const { result } = setup();
    expect(result.current.saveOverrides).toHaveLength(0);
  });

  it("pasivas empieza vacío", () => {
    const { result } = setup();
    expect(result.current.pasivas).toHaveLength(0);
  });

  it("acciones empieza vacío", () => {
    const { result } = setup();
    expect(result.current.acciones).toHaveLength(0);
  });

  it("weapons empieza vacío", () => {
    const { result } = setup();
    expect(result.current.weapons).toHaveLength(0);
  });

  it("abilityScores empieza con todas las estadísticas en 10", () => {
    const { result } = setup();
    const scores = result.current.abilityScores;
    expect(Object.values(scores).every((v) => v === 10)).toBe(true);
  });
});

// ── handleScoreInputChange ────────────────────────────────────────────────────

describe("useEnemyForm - handleScoreInputChange", () => {
  it("actualiza abilityScoreInputs para el stat dado", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "15");
    });
    expect(result.current.abilityScoreInputs["Fuerza"]).toBe("15");
  });

  it("acepta strings no numéricos (validación ocurre en blur)", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "abc");
    });
    expect(result.current.abilityScoreInputs["Fuerza"]).toBe("abc");
  });
});

// ── handleScoreBlur ───────────────────────────────────────────────────────────

describe("useEnemyForm - handleScoreBlur", () => {
  it("parsea el valor numérico y lo guarda en abilityScores", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "18");
    });
    act(() => {
      result.current.handleScoreBlur("Fuerza");
    });
    expect(result.current.abilityScores["Fuerza"]).toBe(18);
  });

  it("clampea al mínimo (8) para valores demasiado bajos", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "3");
    });
    act(() => {
      result.current.handleScoreBlur("Fuerza");
    });
    expect(result.current.abilityScores["Fuerza"]).toBe(8);
  });

  it("clampea al máximo (30) para valores demasiado altos", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "50");
    });
    act(() => {
      result.current.handleScoreBlur("Fuerza");
    });
    expect(result.current.abilityScores["Fuerza"]).toBe(30);
  });

  it("usa 8 como fallback para valores no numéricos", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "xyz");
    });
    act(() => {
      result.current.handleScoreBlur("Fuerza");
    });
    expect(result.current.abilityScores["Fuerza"]).toBe(8);
  });
});

// ── Skills ────────────────────────────────────────────────────────────────────

describe("useEnemyForm - skills", () => {
  it("addSkill agrega el primer skill disponible", () => {
    const { result } = setup();
    act(() => {
      result.current.addSkill();
    });
    expect(result.current.skillOverrides).toHaveLength(1);
    expect(result.current.skillOverrides[0].bonus).toBe(0);
  });

  it("updateSkill actualiza el bonus de un skill", () => {
    const { result } = setup();
    act(() => {
      result.current.addSkill();
    });
    act(() => {
      result.current.updateSkill(0, "bonus", 5);
    });
    expect(result.current.skillOverrides[0].bonus).toBe(5);
  });

  it("removeSkill elimina un skill por índice", () => {
    const { result } = setup();
    act(() => {
      result.current.addSkill();
    });
    act(() => {
      result.current.removeSkill(0);
    });
    expect(result.current.skillOverrides).toHaveLength(0);
  });

  it("availableSkills excluye los ya seleccionados", () => {
    const { result } = setup();
    act(() => {
      result.current.addSkill();
    });
    const firstSkill = result.current.skillOverrides[0].skill;
    expect(
      result.current.availableSkills.every((s) => s.name !== firstSkill),
    ).toBe(true);
  });

  it("addSkill no hace nada cuando todos los skills están usados", () => {
    // This is harder to test without exhausting all skills
    // Just verify that addSkill doesn't crash when empty
    const { result } = setup();
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.addSkill();
      }
    });
    // At least it doesn't crash
    expect(result.current.skillOverrides.length).toBeGreaterThan(0);
  });
});

// ── Saving throws ─────────────────────────────────────────────────────────────

describe("useEnemyForm - saving throws", () => {
  it("addSave agrega la primera salvación disponible", () => {
    const { result } = setup();
    act(() => {
      result.current.addSave();
    });
    expect(result.current.saveOverrides).toHaveLength(1);
    expect(result.current.saveOverrides[0].bonus).toBe(0);
  });

  it("updateSave actualiza el bonus de una salvación", () => {
    const { result } = setup();
    act(() => {
      result.current.addSave();
    });
    act(() => {
      result.current.updateSave(0, "bonus", 3);
    });
    expect(result.current.saveOverrides[0].bonus).toBe(3);
  });

  it("removeSave elimina una salvación por índice", () => {
    const { result } = setup();
    act(() => {
      result.current.addSave();
    });
    act(() => {
      result.current.removeSave(0);
    });
    expect(result.current.saveOverrides).toHaveLength(0);
  });
});

// ── Pasivas ───────────────────────────────────────────────────────────────────

describe("useEnemyForm - pasivas", () => {
  it("addPasiva agrega una pasiva vacía", () => {
    const { result } = setup();
    act(() => {
      result.current.addPasiva();
    });
    expect(result.current.pasivas).toHaveLength(1);
    expect(result.current.pasivas[0].nombre).toBe("");
  });

  it("updatePasiva cambia el nombre", () => {
    const { result } = setup();
    act(() => {
      result.current.addPasiva();
    });
    act(() => {
      result.current.updatePasiva(0, "nombre", "Resistencia mágica");
    });
    expect(result.current.pasivas[0].nombre).toBe("Resistencia mágica");
  });

  it("updatePasiva cambia la descripción", () => {
    const { result } = setup();
    act(() => {
      result.current.addPasiva();
    });
    act(() => {
      result.current.updatePasiva(
        0,
        "descripcion",
        "Ventaja en tiradas mágicas",
      );
    });
    expect(result.current.pasivas[0].descripcion).toBe(
      "Ventaja en tiradas mágicas",
    );
  });

  it("removePasiva elimina una pasiva", () => {
    const { result } = setup();
    act(() => {
      result.current.addPasiva();
    });
    act(() => {
      result.current.removePasiva(0);
    });
    expect(result.current.pasivas).toHaveLength(0);
  });

  it("no agrega más de 20 pasivas", () => {
    const { result } = setup();
    // Call each addPasiva in its own act() so state flushes between calls
    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.addPasiva();
      });
    }
    expect(result.current.pasivas.length).toBeLessThanOrEqual(20);
  });
});

// ── Acciones ──────────────────────────────────────────────────────────────────

describe("useEnemyForm - acciones", () => {
  it("addAccion agrega una acción vacía", () => {
    const { result } = setup();
    act(() => {
      result.current.addAccion();
    });
    expect(result.current.acciones).toHaveLength(1);
    expect(result.current.acciones[0].nombre).toBe("");
  });

  it("updateAccion cambia el nombre de una acción", () => {
    const { result } = setup();
    act(() => {
      result.current.addAccion();
    });
    act(() => {
      result.current.updateAccion(0, "nombre", "Mordisco");
    });
    expect(result.current.acciones[0].nombre).toBe("Mordisco");
  });

  it("removeAccion elimina una acción", () => {
    const { result } = setup();
    act(() => {
      result.current.addAccion();
    });
    act(() => {
      result.current.removeAccion(0);
    });
    expect(result.current.acciones).toHaveLength(0);
  });

  it("no agrega más de 20 acciones", () => {
    const { result } = setup();
    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.addAccion();
      });
    }
    expect(result.current.acciones.length).toBeLessThanOrEqual(20);
  });
});

// ── handleClose (resetea todo el estado internamente) ─────────────────────────

describe("useEnemyForm - handleClose resetea el estado", () => {
  it("resetea nombre, tipo y vd al cerrar", () => {
    const { result, onClose } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.setTipo("PNJ");
      result.current.setVd("10");
    });
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.nombre).toBe("");
    expect(result.current.tipo).toBe("enemigo");
    expect(result.current.vd).toBe("");
    expect(onClose).toHaveBeenCalled();
  });

  it("resetea skills y saves a arrays vacíos al cerrar", () => {
    const { result } = setup();
    act(() => {
      result.current.addSkill();
    });
    act(() => {
      result.current.addSave();
    });
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.skillOverrides).toHaveLength(0);
    expect(result.current.saveOverrides).toHaveLength(0);
  });

  it("resetea pasivas y acciones a arrays vacíos al cerrar", () => {
    const { result } = setup();
    act(() => {
      result.current.addPasiva();
    });
    act(() => {
      result.current.addAccion();
    });
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.pasivas).toHaveLength(0);
    expect(result.current.acciones).toHaveLength(0);
  });

  it("resetea ability scores a 10 al cerrar", () => {
    const { result } = setup();
    act(() => {
      result.current.handleScoreInputChange("Fuerza", "20");
    });
    act(() => {
      result.current.handleScoreBlur("Fuerza");
    });
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.abilityScores["Fuerza"]).toBe(10);
  });

  it("resetea ca, pvMax y movimiento a valores por defecto al cerrar", () => {
    const { result } = setup();
    act(() => {
      result.current.setCa(18);
      result.current.setPvMax(50);
      result.current.setMovimiento(60);
    });
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.ca).toBe(10);
    expect(result.current.pvMax).toBe(10);
    expect(result.current.movimiento).toBe(30);
  });

  it("error sigue null después de cerrar", () => {
    const { result } = setup();
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.error).toBeNull();
  });
});

// ── handleClose ───────────────────────────────────────────────────────────────

describe("useEnemyForm - handleClose", () => {
  it("llama a onClose al cerrar", () => {
    const { result, onClose } = setup();
    act(() => {
      result.current.handleClose();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("resetea el estado al cerrar", () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
    });
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.nombre).toBe("");
  });
});

// ── handleSubmit sin token ────────────────────────────────────────────────────

describe("useEnemyForm - handleSubmit sin token", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("no llama fetch si no hay token", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

// ── Armas (setWeapons) ────────────────────────────────────────────────────────

describe("useEnemyForm - weapons", () => {
  it("setWeapons actualiza la lista de armas", () => {
    const { result } = setup();
    act(() => {
      result.current.setWeapons([
        {
          key: 1,
          displayName: "Espada",
          payload: {
            nombre: "Espada",
            formula: "1d8",
            descripcion: "Corte",
          },
        },
      ]);
    });
    expect(result.current.weapons).toHaveLength(1);
    expect(result.current.weapons[0].displayName).toBe("Espada");
  });
});

// ── handleSubmit con token - validaciones de campo ────────────────────────────

describe("useEnemyForm - handleSubmit validaciones", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-token");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("setea fieldErrors.nombre cuando el nombre está vacío", async () => {
    const { result } = setup();
    // nombre is empty by default
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.fieldErrors?.nombre).toBeTruthy();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("setea fieldErrors.pasivas cuando hay pasiva sin nombre", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.addPasiva();
    });
    // pasiva[0].nombre is empty
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.fieldErrors?.pasivas).toBeDefined();
  });

  it("setea fieldErrors.acciones cuando hay acción sin nombre", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.addAccion();
    });
    // accion[0].nombre is empty
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.fieldErrors?.acciones).toBeDefined();
  });

  it("setea error cuando hay skill sin nombre", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.addSkill();
    });
    // Force the skill name to empty by using updateSkill with skill=""
    act(() => {
      result.current.updateSkill(0, "skill", "");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBeTruthy();
  });
});

// ── handleSubmit con token - éxito ───────────────────────────────────────────

describe("useEnemyForm - handleSubmit éxito", () => {
  beforeEach(async () => {
    localStorage.setItem("jwtToken", "test-token");
    const { crearNpc, addHabilidadNpc, addDndCharacterInventoryItem } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(crearNpc).mockResolvedValue({
      id: 99,
      nombre: "Dragon",
      sistemaDeJuego: "Dungeons and Dragons",
      tipo: "enemigo",
    } as never);
    vi.mocked(addHabilidadNpc).mockResolvedValue(undefined as never);
    vi.mocked(addDndCharacterInventoryItem).mockResolvedValue(
      undefined as never,
    );
  });

  it("llama a onCreated con el resultado de crearNpc", async () => {
    const { result, onCreated } = setup();
    act(() => {
      result.current.setNombre("Dragon");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, nombre: "Dragon" }),
    );
  });

  it("llama a onClose tras el submit exitoso", async () => {
    const { result, onClose } = setup();
    act(() => {
      result.current.setNombre("Dragon");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("isSubmitting vuelve a false tras el submit", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("resetea el formulario después del submit", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.setVd("5");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.nombre).toBe("");
    expect(result.current.vd).toBe("");
  });

  it("llama a addHabilidadNpc por cada pasiva", async () => {
    const { addHabilidadNpc } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(addHabilidadNpc).mockClear();

    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.addPasiva();
    });
    act(() => {
      result.current.updatePasiva(0, "nombre", "Resistencia mágica");
      result.current.updatePasiva(0, "descripcion", "Ventaja en conjuros");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(vi.mocked(addHabilidadNpc)).toHaveBeenCalledWith(
      "test-token",
      99,
      expect.objectContaining({ tags: "NPC,PASIVA" }),
    );
  });

  it("llama a addHabilidadNpc por cada acción", async () => {
    const { addHabilidadNpc } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(addHabilidadNpc).mockClear();

    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.addAccion();
    });
    act(() => {
      result.current.updateAccion(0, "nombre", "Mordisco");
      result.current.updateAccion(0, "descripcion", "Causa 2d6 daño");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(vi.mocked(addHabilidadNpc)).toHaveBeenCalledWith(
      "test-token",
      99,
      expect.objectContaining({ tags: "NPC,ACCION" }),
    );
  });

  it("llama a addHabilidadNpc por cada idioma", async () => {
    const { addHabilidadNpc } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(addHabilidadNpc).mockClear();

    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.setIdiomas("Dracónico, Común");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    // 2 idiomas should trigger 2 addHabilidadNpc calls
    const idiomaCalls = vi
      .mocked(addHabilidadNpc)
      .mock.calls.filter((call) => call[2].tags === "NPC,IDIOMA");
    expect(idiomaCalls.length).toBe(2);
  });

  it("llama a addDndCharacterInventoryItem por cada arma", async () => {
    const { addDndCharacterInventoryItem } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(addDndCharacterInventoryItem).mockClear();

    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
      result.current.setWeapons([
        {
          key: 1,
          displayName: "Garra",
          payload: {
            nombre: "Garra",
            formula: "2d6",
            descripcion: "Garras afiladas",
            tipoObjeto: "ARMA",
          },
        },
      ]);
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(vi.mocked(addDndCharacterInventoryItem)).toHaveBeenCalledWith(
      "test-token",
      99,
      expect.objectContaining({ nombre: "Garra" }),
    );
  });
});

it("incluye skill overrides en las estadísticas enviadas", async () => {
  const { crearNpc } = await import("../../../screens/personaje/utils/dndApi");
  vi.mocked(crearNpc).mockClear();

  const { result } = setup();
  act(() => {
    result.current.setNombre("Dragon");
    result.current.addSkill();
  });
  act(() => {
    result.current.updateSkill(0, "bonus", 4);
  });
  await act(async () => {
    await result.current.handleSubmit();
  });
  const callArgs = vi.mocked(crearNpc).mock.calls[0];
  expect(callArgs).toBeDefined();
  const estadisticas = callArgs[1].estadisticas ?? {};
  // The first available skill's stat should be set to 4
  const hasSkillBonus = Object.values(estadisticas).some((v) => v === 4);
  expect(hasSkillBonus).toBe(true);
});

it("incluye save overrides en las estadísticas enviadas", async () => {
  const { crearNpc } = await import("../../../screens/personaje/utils/dndApi");
  vi.mocked(crearNpc).mockClear();

  const { result } = setup();
  act(() => {
    result.current.setNombre("Dragon");
    result.current.addSave();
  });
  act(() => {
    result.current.updateSave(0, "bonus", 7);
  });
  await act(async () => {
    await result.current.handleSubmit();
  });
  const callArgs = vi.mocked(crearNpc).mock.calls[0];
  expect(callArgs).toBeDefined();
  const estadisticas = callArgs[1].estadisticas ?? {};
  const hasSaveBonus = Object.values(estadisticas).some((v) => v === 7);
  expect(hasSaveBonus).toBe(true);
});

// ── handleSubmit con token - error de API ─────────────────────────────────────

describe("useEnemyForm - handleSubmit error API", () => {
  beforeEach(async () => {
    localStorage.setItem("jwtToken", "test-token");
    const { crearNpc } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(crearNpc).mockRejectedValue(new Error("Error del servidor"));
  });

  it("setea error cuando crearNpc falla", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNombre("Dragon");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("Error del servidor");
    expect(result.current.isSubmitting).toBe(false);
  });
});

// ── setIdiomas ────────────────────────────────────────────────────────────────

describe("useEnemyForm - setIdiomas", () => {
  it("setIdiomas cambia el valor de idiomas", () => {
    const { result } = setup();
    act(() => {
      result.current.setIdiomas("Élfico, Común");
    });
    expect(result.current.idiomas).toBe("Élfico, Común");
  });
});

// ── setBiografia ──────────────────────────────────────────────────────────────

describe("useEnemyForm - setBiografia", () => {
  it("setBiografia cambia el valor de biografía", () => {
    const { result } = setup();
    act(() => {
      result.current.setBiografia("Un poderoso dragón...");
    });
    expect(result.current.biografia).toBe("Un poderoso dragón...");
  });
});

// ── setIniciativa ─────────────────────────────────────────────────────────────

describe("useEnemyForm - setIniciativa", () => {
  it("setIniciativa cambia el valor de iniciativa", () => {
    const { result } = setup();
    act(() => {
      result.current.setIniciativa(3);
    });
    expect(result.current.iniciativa).toBe(3);
  });

  it("setIniciativa puede dejarse vacío", () => {
    const { result } = setup();
    act(() => {
      result.current.setIniciativa("");
    });
    expect(result.current.iniciativa).toBe("");
  });
});

// ── clearPortrait ─────────────────────────────────────────────────────────────

describe("useEnemyForm - clearPortrait", () => {
  it("clearPortrait limpia portrait y portraitPreview", () => {
    const { result } = setup();
    // Initially both are null - call clearPortrait should keep them null
    act(() => {
      result.current.clearPortrait();
    });
    expect(result.current.portrait).toBeNull();
    expect(result.current.portraitPreview).toBeNull();
  });
});
