// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNpcEdit } from "../../../screens/personaje/dndcharactersheet/hooks/useNpcEdit";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHabilidad(id: number, tags: string) {
  return {
    id,
    nombre: `habilidad-${id}`,
    tags,
    tipo: "habilidad" as const,
    formula: null,
    bonificacion: null,
    descripcion: "",
  };
}

function makeCharacter(
  overrides?: Partial<DndCharacterDetailResponse>,
): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Goblin",
    habilidades: [
      makeHabilidad(1, "NPC,ACCION"),
      makeHabilidad(2, "NPC,PASIVA"),
      makeHabilidad(3, "NPC,ARMA"),
      makeHabilidad(4, "OTRO"),
    ],
    estadisticas: {
      Fuerza: 8,
      Destreza: 14,
      Constitución: 10,
      Inteligencia: 10,
      Sabiduría: 8,
      Carisma: 8,
      CA: 13,
      Movimiento: 30,
      Iniciativa: 2,
      "Puntos de vida": 7,
    },
    biografia: "Un goblin travieso",
    vd: "1/4",
    clases: [],
    trasfondo: null,
    raza: null,
    subraza: null,
    retrato: null,
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

function setup(overrides?: Partial<Parameters<typeof useNpcEdit>[0]>) {
  const onNpcSaved = vi.fn();
  const { result } = renderHook(() =>
    useNpcEdit({
      character: makeCharacter(),
      characterId: "1",
      onNpcSaved,
      ...overrides,
    }),
  );
  return { result, onNpcSaved };
}

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useNpcEdit - estado inicial", () => {
  it("isEditMode es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.isEditMode).toBe(false);
  });

  it("isSaving es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.isSaving).toBe(false);
  });

  it("saveError es null inicialmente", () => {
    const { result } = setup();
    expect(result.current.saveError).toBeNull();
  });

  it("weaponModal es null inicialmente", () => {
    const { result } = setup();
    expect(result.current.weaponModal).toBeNull();
  });

  it("showAddForm es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.showAddForm).toBe(false);
  });

  it("newIdioma es string vacío inicialmente", () => {
    const { result } = setup();
    expect(result.current.newIdioma).toBe("");
  });

  it("newHabilidadTipo es PASIVA por defecto", () => {
    const { result } = setup();
    expect(result.current.newHabilidadTipo).toBe("PASIVA");
  });

  it("isAddingHabilidad es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.isAddingHabilidad).toBe(false);
  });

  it("isWeaponSaving es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.isWeaponSaving).toBe(false);
  });

  it("isUploadingPortrait es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.isUploadingPortrait).toBe(false);
  });

  it("isAddingIdioma es false inicialmente", () => {
    const { result } = setup();
    expect(result.current.isAddingIdioma).toBe(false);
  });
});

// ── Valores derivados ─────────────────────────────────────────────────────────

describe("useNpcEdit - valores derivados", () => {
  it("acciones filtra solo habilidades con tag NPC,ACCION", () => {
    const { result } = setup();
    expect(result.current.acciones).toHaveLength(1);
    expect(result.current.acciones[0].id).toBe(1);
  });

  it("pasivas filtra solo habilidades con tag NPC,PASIVA", () => {
    const { result } = setup();
    expect(result.current.pasivas).toHaveLength(1);
    expect(result.current.pasivas[0].id).toBe(2);
  });

  it("armas filtra solo habilidades con tag NPC,ARMA", () => {
    const { result } = setup();
    expect(result.current.armas).toHaveLength(1);
    expect(result.current.armas[0].id).toBe(3);
  });

  it("displayHabilidades usa character.habilidades cuando isEditMode es false", () => {
    const { result } = setup();
    expect(result.current.displayHabilidades).toEqual(
      makeCharacter().habilidades,
    );
  });

  it("displayHabilidades usa localHabilidades cuando isEditMode es true", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.isEditMode).toBe(true);
    // After toggle, displayHabilidades is the local copy
    expect(result.current.displayHabilidades).toEqual(
      makeCharacter().habilidades,
    );
  });

  it("no cuenta habilidades sin tag NPC", () => {
    const { result } = setup();
    // habilidad 4 has tag OTRO, not NPC
    const allDerived = [
      ...result.current.acciones,
      ...result.current.pasivas,
      ...result.current.armas,
    ];
    expect(allDerived.every((h) => h.id !== 4)).toBe(true);
  });
});

// ── handleToggleEdit ──────────────────────────────────────────────────────────

describe("useNpcEdit - handleToggleEdit", () => {
  it("activa el modo edición al llamarlo", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.isEditMode).toBe(true);
  });

  it("desactiva el modo edición al llamarlo dos veces", () => {
    const { result } = setup();
    act(() => result.current.handleToggleEdit());
    act(() => result.current.handleToggleEdit());
    expect(result.current.isEditMode).toBe(false);
  });

  it("resetea showAddForm a false al cambiar modo", () => {
    const { result } = setup();
    act(() => {
      result.current.setShowAddForm(true);
    });
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.showAddForm).toBe(false);
  });

  it("resetea weaponModal a null al cambiar modo", () => {
    const { result } = setup();
    act(() => {
      result.current.setWeaponModal({ mode: "add" });
    });
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.weaponModal).toBeNull();
  });

  it("resetea newIdioma a string vacío al cambiar modo", () => {
    const { result } = setup();
    act(() => {
      result.current.setNewIdioma("Élfico");
    });
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.newIdioma).toBe("");
  });

  it("al activar edición copia nombre y biografía del personaje", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.editNombre).toBe("Goblin");
    expect(result.current.editBiografia).toBe("Un goblin travieso");
    expect(result.current.editVd).toBe("1/4");
  });

  it("al activar edición carga las estadísticas del personaje", () => {
    const { result } = setup();
    act(() => {
      result.current.handleToggleEdit();
    });
    expect(result.current.editStats["Fuerza"]).toBe(8);
    expect(result.current.editStats["CA"]).toBe(13);
    expect(result.current.editStats["Puntos de vida"]).toBe(7);
  });
});

// ── Setters simples ───────────────────────────────────────────────────────────

describe("useNpcEdit - setters simples", () => {
  it("setEditNombre actualiza editNombre", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditNombre("Dragon Rojo");
    });
    expect(result.current.editNombre).toBe("Dragon Rojo");
  });

  it("setEditBiografia actualiza editBiografia", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditBiografia("Una criatura terrible");
    });
    expect(result.current.editBiografia).toBe("Una criatura terrible");
  });

  it("setEditVd actualiza editVd", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditVd("5");
    });
    expect(result.current.editVd).toBe("5");
  });

  it("setShowAddForm cambia showAddForm", () => {
    const { result } = setup();
    act(() => {
      result.current.setShowAddForm(true);
    });
    expect(result.current.showAddForm).toBe(true);
  });

  it("setNewHabilidadNombre actualiza newHabilidadNombre", () => {
    const { result } = setup();
    act(() => {
      result.current.setNewHabilidadNombre("Ataque especial");
    });
    expect(result.current.newHabilidadNombre).toBe("Ataque especial");
  });

  it("setNewHabilidadDesc actualiza newHabilidadDesc", () => {
    const { result } = setup();
    act(() => {
      result.current.setNewHabilidadDesc("Descripción del ataque");
    });
    expect(result.current.newHabilidadDesc).toBe("Descripción del ataque");
  });

  it("setNewHabilidadTipo cambia entre PASIVA y ACCION", () => {
    const { result } = setup();
    act(() => {
      result.current.setNewHabilidadTipo("ACCION");
    });
    expect(result.current.newHabilidadTipo).toBe("ACCION");
  });

  it("setWeaponModal cambia el modo del modal", () => {
    const { result } = setup();
    act(() => {
      result.current.setWeaponModal({ mode: "add" });
    });
    expect(result.current.weaponModal).toEqual({ mode: "add" });
  });

  it("setNewIdioma actualiza newIdioma", () => {
    const { result } = setup();
    act(() => {
      result.current.setNewIdioma("Goblin");
    });
    expect(result.current.newIdioma).toBe("Goblin");
  });

  it("setEditStats actualiza editStats", () => {
    const { result } = setup();
    act(() => {
      result.current.setEditStats({ Fuerza: 20 });
    });
    expect(result.current.editStats["Fuerza"]).toBe(20);
  });
});

// ── Handlers con guards de early-return ──────────────────────────────────────

describe("useNpcEdit - guards early-return (sin token)", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("handleSaveNpc no llama fetch si no hay token", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleSaveNpc();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("handleDeleteHabilidad no llama fetch si no hay token", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleDeleteHabilidad(1);
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("handleAddHabilidad no llama fetch si no hay token", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNewHabilidadNombre("Ataque");
    });
    await act(async () => {
      await result.current.handleAddHabilidad();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("handleWeaponConfirm no llama fetch si no hay token", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleWeaponConfirm({
        nombre: "Espada",
        formula: "1d6",
        bonificacion: 3,
        descripcion: "",
      });
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("handleAddIdioma no llama fetch si no hay token", async () => {
    const { result } = setup();
    act(() => {
      result.current.setNewIdioma("Élfico");
    });
    await act(async () => {
      await result.current.handleAddIdioma();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

describe("useNpcEdit - guards early-return (sin characterId)", () => {
  it("handleSaveNpc no llama fetch si no hay characterId", async () => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "test-token");
    const { result } = renderHook(() =>
      useNpcEdit({
        character: makeCharacter(),
        characterId: undefined,
        onNpcSaved: vi.fn(),
      }),
    );
    await act(async () => {
      await result.current.handleSaveNpc();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("handleAddHabilidad no llama fetch si nombre está vacío", async () => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "test-token");
    const { result } = setup();
    // newHabilidadNombre is empty (default)
    await act(async () => {
      await result.current.handleAddHabilidad();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("handleAddIdioma no llama fetch si newIdioma está vacío", async () => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "test-token");
    const { result } = setup();
    // newIdioma is empty (default)
    await act(async () => {
      await result.current.handleAddIdioma();
    });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

// ── handleSaveNpc con fetch exitoso ──────────────────────────────────────────

describe("useNpcEdit - handleSaveNpc con fetch", () => {
  it("llama fetch y actualiza el personaje en caso de éxito", async () => {
    const updatedCharacter = makeCharacter({ nombre: "Goblin Actualizado" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedCharacter,
      }),
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    await act(async () => {
      await result.current.handleSaveNpc();
    });

    expect(vi.mocked(fetch)).toHaveBeenCalled();
    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.isEditMode).toBe(false);
  });

  it("guarda error en saveError si el fetch falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Error del servidor",
      }),
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result } = setup();
    await act(async () => {
      await result.current.handleSaveNpc();
    });

    expect(result.current.saveError).toBe("Error del servidor");
    expect(result.current.isSaving).toBe(false);
  });
});

// ── handleDeleteHabilidad con fetch ──────────────────────────────────────────

describe("useNpcEdit - handleDeleteHabilidad con fetch", () => {
  it("elimina habilidad y actualiza personaje en caso de éxito", async () => {
    const updatedCharacter = makeCharacter({ habilidades: [] as never[] });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedCharacter,
      }),
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    await act(async () => {
      await result.current.handleDeleteHabilidad(1);
    });

    expect(vi.mocked(fetch)).toHaveBeenCalled();
    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
  });

  it("no hace nada si el fetch devuelve error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    await act(async () => {
      await result.current.handleDeleteHabilidad(1);
    });

    expect(onNpcSaved).not.toHaveBeenCalled();
  });
});

// ── handleAddHabilidad con fetch ─────────────────────────────────────────────

describe("useNpcEdit - handleAddHabilidad con fetch", () => {
  it("agrega habilidad y actualiza personaje en caso de éxito", async () => {
    const updatedCharacter = makeCharacter();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true }) // POST habilidad
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedCharacter,
        }), // GET personaje
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    act(() => {
      result.current.setNewHabilidadNombre("Mordisco");
    });
    await act(async () => {
      await result.current.handleAddHabilidad();
    });

    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.newHabilidadNombre).toBe("");
    expect(result.current.showAddForm).toBe(false);
  });

  it("no actualiza personaje si el POST falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    act(() => {
      result.current.setNewHabilidadNombre("Mordisco");
    });
    await act(async () => {
      await result.current.handleAddHabilidad();
    });

    expect(onNpcSaved).not.toHaveBeenCalled();
    expect(result.current.isAddingHabilidad).toBe(false);
  });
});

// ── handleWeaponConfirm con fetch ─────────────────────────────────────────────

describe("useNpcEdit - handleWeaponConfirm con fetch", () => {
  it("crea arma nueva (modo add) y actualiza personaje", async () => {
    const updatedCharacter = makeCharacter();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true }) // POST arma
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedCharacter,
        }), // GET personaje
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    // weaponModal is null by default, so mode is "add"
    await act(async () => {
      await result.current.handleWeaponConfirm({
        nombre: "Espada oxidada",
        formula: "1d6",
        bonificacion: 0,
        descripcion: "",
      });
    });

    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.weaponModal).toBeNull();
  });

  it("edita arma existente (modo edit) y actualiza personaje", async () => {
    const updatedCharacter = makeCharacter();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true }) // PATCH arma
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedCharacter,
        }), // GET personaje
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    act(() => {
      result.current.setWeaponModal({
        mode: "edit",
        id: 3,
        nombre: "Espada",
        formula: "1d6",
        bonificacion: 3,
        descripcion: "",
      });
    });
    await act(async () => {
      await result.current.handleWeaponConfirm({
        nombre: "Gran Espada",
        formula: "2d6",
        bonificacion: 4,
        descripcion: "",
      });
    });

    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.weaponModal).toBeNull();
  });
});

// ── handleAddIdioma con fetch ─────────────────────────────────────────────────

describe("useNpcEdit - handleAddIdioma con fetch", () => {
  it("agrega idioma y actualiza personaje en caso de éxito", async () => {
    const updatedCharacter = makeCharacter();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true }) // POST idioma
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedCharacter,
        }), // GET personaje
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    act(() => {
      result.current.setNewIdioma("Élfico");
    });
    await act(async () => {
      await result.current.handleAddIdioma();
    });

    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.newIdioma).toBe("");
    expect(result.current.isAddingIdioma).toBe(false);
  });

  it("no actualiza si el POST falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    act(() => {
      result.current.setNewIdioma("Élfico");
    });
    await act(async () => {
      await result.current.handleAddIdioma();
    });

    expect(onNpcSaved).not.toHaveBeenCalled();
  });
});

// ── handlePortraitChange con fetch ────────────────────────────────────────────

describe("useNpcEdit - handlePortraitChange con fetch", () => {
  it("sube retrato y actualiza personaje en caso de éxito", async () => {
    const updatedCharacter = makeCharacter({
      retrato: "https://img.test/new.jpg",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedCharacter,
      }),
    );
    localStorage.setItem("jwtToken", "test-token");

    const { result, onNpcSaved } = setup();
    const file = new File(["img"], "portrait.jpg", { type: "image/jpeg" });
    await act(async () => {
      await result.current.handlePortraitChange(file);
    });

    expect(onNpcSaved).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.isUploadingPortrait).toBe(false);
  });
});
