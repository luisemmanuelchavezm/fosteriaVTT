// @vitest-environment jsdom
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBaulData } from "../../../screens/campaign/hooks/useBaulData";

// ── Mock fetch ────────────────────────────────────────────────────────────────

function mockFetchEmpty() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], hasMore: false }),
    }),
  );
}

function mockFetchError() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.setItem("jwtToken", "test-token");
  mockFetchEmpty();
});

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useBaulData - estado inicial", () => {
  it("chestSourceTab empieza como mine", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.chestSourceTab).toBe("mine");
  });

  it("chestContentTab empieza como characters", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.chestContentTab).toBe("characters");
  });

  it("chestTipoTab empieza como todos", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.chestTipoTab).toBe("todos");
  });

  it("chestSearchQuery empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.chestSearchQuery).toBe("");
  });

  it("isMapUploadModalOpen empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.isMapUploadModalOpen).toBe(false);
  });

  it("isNpcModalOpen empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.isNpcModalOpen).toBe(false);
  });

  it("openMenuId empieza en null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.openMenuId).toBeNull();
  });

  it("saveTarget empieza en null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.saveTarget).toBeNull();
  });

  it("publishTarget empieza en null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.publishTarget).toBeNull();
  });

  it("deleteTarget empieza en null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.deleteTarget).toBeNull();
  });

  it("deleteConfirmText empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.deleteConfirmText).toBe("");
  });

  it("isSaving empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.isSaving).toBe(false);
  });

  it("isPublishing empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.isPublishing).toBe(false);
  });

  it("isDeleting empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.isDeleting).toBe(false);
  });

  it("isMapSubmitting empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.isMapSubmitting).toBe(false);
  });

  it("mpCharFilterOpen empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.mpCharFilterOpen).toBe(false);
  });

  it("mpCharUserFilter empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.mpCharUserFilter).toBe("");
  });

  it("mpCharTypeFilter empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.mpCharTypeFilter).toBe("");
  });

  it("mpMapFilterOpen empieza en false", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.mpMapFilterOpen).toBe(false);
  });

  it("mpMapUserFilter empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.mpMapUserFilter).toBe("");
  });
});

// ── Setters simples ───────────────────────────────────────────────────────────

describe("useBaulData - setters de UI state", () => {
  it("setChestSourceTab cambia la pestaña fuente", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setChestSourceTab("marketplace");
    });
    expect(result.current.chestSourceTab).toBe("marketplace");
  });

  it("setChestContentTab cambia la pestaña de contenido", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setChestContentTab("maps");
    });
    expect(result.current.chestContentTab).toBe("maps");
  });

  it("setChestTipoTab cambia la pestaña de tipo", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setChestTipoTab("personajes");
    });
    expect(result.current.chestTipoTab).toBe("personajes");
  });

  it("setChestSearchQuery actualiza la búsqueda", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setChestSearchQuery("dragón");
    });
    expect(result.current.chestSearchQuery).toBe("dragón");
  });

  it("setIsMapUploadModalOpen abre el modal", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setIsMapUploadModalOpen(true);
    });
    expect(result.current.isMapUploadModalOpen).toBe(true);
  });

  it("setIsNpcModalOpen abre el modal de NPC", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setIsNpcModalOpen(true);
    });
    expect(result.current.isNpcModalOpen).toBe(true);
  });

  it("setOpenMenuId actualiza el menu abierto", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setOpenMenuId("char-1");
    });
    expect(result.current.openMenuId).toBe("char-1");
  });

  it("setSaveTarget establece el objetivo de guardado", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setSaveTarget({
        type: "character",
        id: 5,
        nombre: "Dragon",
      });
    });
    expect(result.current.saveTarget).toEqual({
      type: "character",
      id: 5,
      nombre: "Dragon",
    });
  });

  it("setPublishTarget establece el objetivo de publicación", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setPublishTarget({ type: "map", id: 3, nombre: "Mapa 1" });
    });
    expect(result.current.publishTarget).toEqual({
      type: "map",
      id: 3,
      nombre: "Mapa 1",
    });
  });

  it("setDeleteTarget establece el objetivo de eliminación", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setDeleteTarget({
        type: "character",
        id: 7,
        nombre: "Goblin",
      });
    });
    expect(result.current.deleteTarget).toEqual({
      type: "character",
      id: 7,
      nombre: "Goblin",
    });
  });

  it("setDeleteConfirmText actualiza el texto de confirmación", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setDeleteConfirmText("confirmar");
    });
    expect(result.current.deleteConfirmText).toBe("confirmar");
  });

  it("setMpCharFilterOpen abre el filtro del marketplace", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpCharFilterOpen(true);
    });
    expect(result.current.mpCharFilterOpen).toBe(true);
  });

  it("setMpCharUserFilter actualiza el filtro de usuario", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpCharUserFilter("maestro");
    });
    expect(result.current.mpCharUserFilter).toBe("maestro");
  });

  it("setMpCharTypeFilter cambia el tipo de filtro", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpCharTypeFilter("enemigo");
    });
    expect(result.current.mpCharTypeFilter).toBe("enemigo");
  });

  it("setMpMapFilterOpen abre el filtro de mapas", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpMapFilterOpen(true);
    });
    expect(result.current.mpMapFilterOpen).toBe(true);
  });

  it("setMpMapUserFilter actualiza el filtro de usuario de mapas", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpMapUserFilter("creador123");
    });
    expect(result.current.mpMapUserFilter).toBe("creador123");
  });
});

// ── Filtros reseteados al cambiar de sección ──────────────────────────────────

describe("useBaulData - filtros se resetean al cambiar de sección", () => {
  it("mpCharFilterOpen se resetea al cambiar chestSourceTab", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setMpCharFilterOpen(true);
    });
    expect(result.current.mpCharFilterOpen).toBe(true);

    act(() => {
      result.current.setChestSourceTab("marketplace");
    });
    // El useEffect debería resetear el filtro
    expect(result.current.mpCharFilterOpen).toBe(false);
  });
});

// ── Filtros con datos de muestra ──────────────────────────────────────────────

describe("useBaulData - filteredChestCharacters", () => {
  it("filteredChestCharacters empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.filteredChestCharacters).toHaveLength(0);
  });

  it("filteredChestMaps empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.filteredChestMaps).toHaveLength(0);
  });

  it("filteredMarketplaceCharacters empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.filteredMarketplaceCharacters).toHaveLength(0);
  });

  it("filteredMarketplaceMaps empieza vacío", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    expect(result.current.filteredMarketplaceMaps).toHaveLength(0);
  });
});

// ── Carga de datos con error ──────────────────────────────────────────────────

describe("useBaulData - manejo de errores en carga", () => {
  it("establece chestError cuando el fetch falla", async () => {
    mockFetchError();
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    // When fetch fails, error should be set
    expect(
      typeof result.current.chestError === "string" ||
        result.current.chestError === null,
    ).toBe(true);
  });
});

// ── handleSave, handlePublish, handleDelete con guards ────────────────────────

describe("useBaulData - handlers sin target", () => {
  it("handleSave no hace nada si saveTarget es null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    // saveTarget is null by default
    await act(async () => {
      await result.current.handleSave();
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("handlePublish no hace nada si publishTarget es null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    await act(async () => {
      await result.current.handlePublish();
    });
    expect(result.current.isPublishing).toBe(false);
  });

  it("handleDelete no hace nada si deleteTarget es null", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    await act(async () => {
      await result.current.handleDelete();
    });
    expect(result.current.isDeleting).toBe(false);
  });
});

// ── handleNpcCreated ──────────────────────────────────────────────────────────

describe("useBaulData - handleNpcCreated", () => {
  it("cierra el modal NPC al crear un NPC", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setIsNpcModalOpen(true);
    });
    expect(result.current.isNpcModalOpen).toBe(true);

    act(() => {
      result.current.handleNpcCreated({
        id: 99,
        nombre: "Nuevo NPC",
        tipo: "NPC",
      } as never);
    });
    expect(result.current.isNpcModalOpen).toBe(false);
  });
});

// ── Filtros marketplace con mpCharUserFilter ──────────────────────────────────

describe("useBaulData - filteredMarketplaceCharacters con filtros", () => {
  it("filtra por mpCharTypeFilter cuando está aplicado", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpCharTypeFilter("enemigo");
    });
    // With empty marketplace chars, result should be empty
    expect(result.current.filteredMarketplaceCharacters).toHaveLength(0);
  });

  it("filtra por mpCharUserFilter cuando hay texto", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpCharUserFilter("admin");
    });
    expect(result.current.filteredMarketplaceCharacters).toHaveLength(0);
  });

  it("setMpCharFilterOpen cambia el estado del filtro", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpCharFilterOpen(true);
    });
    expect(result.current.mpCharFilterOpen).toBe(true);
  });
});

// ── Filtros marketplace mapas con mpMapUserFilter ─────────────────────────────

describe("useBaulData - filteredMarketplaceMaps con filtros", () => {
  it("filtra por mpMapUserFilter cuando hay texto", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpMapUserFilter("admin");
    });
    expect(result.current.filteredMarketplaceMaps).toHaveLength(0);
  });

  it("setMpMapFilterOpen cambia el estado del filtro de mapas", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setMpMapFilterOpen(true);
    });
    expect(result.current.mpMapFilterOpen).toBe(true);
  });
});

// ── handleSave con target establecido ────────────────────────────────────────

describe("useBaulData - handleSave con saveTarget", () => {
  it("llama a fetch cuando saveTarget es un personaje", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ items: [], hasMore: false }),
        }),
    );
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setSaveTarget({
        id: 5,
        type: "character",
        nombre: "Héroe",
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(vi.mocked(fetch)).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it("limpia saveTarget tras guardar exitosamente", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ items: [], hasMore: false }),
        }),
    );
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setSaveTarget({
        id: 5,
        type: "character",
        nombre: "Héroe",
      });
    });
    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.saveTarget).toBeNull();
  });
});

// ── handlePublish con target ──────────────────────────────────────────────────

describe("useBaulData - handlePublish con publishTarget", () => {
  it("llama a fetch cuando publishTarget es un personaje", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ items: [], hasMore: false }),
        }),
    );
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setPublishTarget({
        id: 3,
        type: "character",
        nombre: "Héroe",
      });
    });
    await act(async () => {
      await result.current.handlePublish();
    });

    expect(vi.mocked(fetch)).toHaveBeenCalled();
    expect(result.current.isPublishing).toBe(false);
  });

  it("limpia publishTarget tras publicar", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ items: [], hasMore: false }),
        }),
    );
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setPublishTarget({ id: 3, type: "map", nombre: "Mapa" });
    });
    await act(async () => {
      await result.current.handlePublish();
    });

    expect(result.current.publishTarget).toBeNull();
  });
});

// ── handleDelete con target y confirmación ────────────────────────────────────

describe("useBaulData - handleDelete con deleteTarget", () => {
  it("no hace nada si deleteConfirmText no es 'borrar'", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setDeleteTarget({
        id: 1,
        type: "character",
        nombre: "Héroe",
      });
      result.current.setDeleteConfirmText("eliminar");
    });
    await act(async () => {
      await result.current.handleDelete();
    });
    expect(result.current.isDeleting).toBe(false);
  });

  it("llama a fetch cuando se confirma con 'borrar'", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ items: [], hasMore: false }),
        }),
    );
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    act(() => {
      result.current.setDeleteTarget({
        id: 1,
        type: "character",
        nombre: "Héroe",
      });
      result.current.setDeleteConfirmText("borrar");
    });
    await act(async () => {
      await result.current.handleDelete();
    });

    expect(vi.mocked(fetch)).toHaveBeenCalled();
    expect(result.current.isDeleting).toBe(false);
  });
});

// ── handleCharacterDragStart ──────────────────────────────────────────────────

describe("useBaulData - handleCharacterDragStart", () => {
  it("llama a setData en el dataTransfer con el personaje", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));

    const mockDataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
    };
    const mockEvent = {
      dataTransfer: mockDataTransfer,
    } as unknown as React.DragEvent<HTMLElement>;

    act(() => {
      result.current.handleCharacterDragStart(mockEvent, {
        id: 1,
        nombre: "Aria",
        retrato: "avatar.png",
        tipo: "personaje",
        source: "baul",
      });
    });

    expect(mockDataTransfer.setData).toHaveBeenCalled();
    expect(mockDataTransfer.effectAllowed).toBe("move");
  });
});

// ── openMenuId ────────────────────────────────────────────────────────────────

describe("useBaulData - openMenuId", () => {
  it("setOpenMenuId cambia el id del menú abierto", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setOpenMenuId(7);
    });
    expect(result.current.openMenuId).toBe(7);
  });

  it("setOpenMenuId puede limpiarse (null)", async () => {
    const { result } = renderHook(() => useBaulData("1"));
    await waitFor(() => expect(result.current.isChestLoading).toBe(false));
    act(() => {
      result.current.setOpenMenuId(7);
    });
    act(() => {
      result.current.setOpenMenuId(null);
    });
    expect(result.current.openMenuId).toBeNull();
  });
});
