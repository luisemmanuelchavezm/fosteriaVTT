// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useCampaignGridConfig } from "../../../screens/campaign/hooks/useCampaignGridConfig";
import type { CampaignPestañaResponse } from "../../../screens/campaign/types";

const makePestaña = (
  overrides?: Partial<CampaignPestañaResponse>,
): CampaignPestañaResponse => ({
  id: 1,
  nombre: "Mazmorra",
  nCuadriculasX: 30,
  nCuadriculasY: 25,
  distanciaCasilla: 10,
  sistemaMetrico: "ft",
  ...overrides,
});

describe("useCampaignGridConfig", () => {
  let onPestañaUpdated: ReturnType<typeof vi.fn>;
  let onAfterSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "test-token");
    onPestañaUpdated = vi.fn();
    onAfterSave = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    cleanup();
  });

  const render = (overrides?: {
    pestañaId?: number | null;
    pestaña?: CampaignPestañaResponse | null;
    mapLayerImage?: HTMLImageElement | null;
  }) => {
    const pestañaId =
      overrides && "pestañaId" in overrides ? overrides.pestañaId : 1;
    const pestaña =
      overrides && "pestaña" in overrides ? overrides.pestaña : makePestaña();
    const mapLayerImage =
      overrides && "mapLayerImage" in overrides
        ? overrides.mapLayerImage
        : null;
    return renderHook(() =>
      useCampaignGridConfig({
        campaignId: "10",
        pestañaId: pestañaId ?? null,
        pestaña: pestaña ?? null,
        mapLayerImage: mapLayerImage ?? null,
        onPestañaUpdated,
        onAfterSave,
      }),
    );
  };

  it("inicializa con settingsMode null y valores de grilla por defecto", () => {
    const { result } = render();
    expect(result.current.settingsMode).toBeNull();
    expect(result.current.gridConfigForm.nCuadriculasX).toBe(20);
    expect(result.current.gridConfigForm.nCuadriculasY).toBe(20);
    expect(result.current.gridConfigForm.distanciaCasilla).toBe(5);
    expect(result.current.gridConfigForm.sistemaMetrico).toBe("ft");
    expect(result.current.isSavingGridConfig).toBe(false);
  });

  it("setSettingsMode cambia el modo correctamente", () => {
    const { result } = render();
    act(() => {
      result.current.setSettingsMode("options");
    });
    expect(result.current.settingsMode).toBe("options");
  });

  it("al entrar en modo gridConfig rellena el formulario con datos de la pestaña", () => {
    const { result } = render({ pestaña: makePestaña() });
    act(() => {
      result.current.setSettingsMode("gridConfig");
    });
    expect(result.current.gridConfigForm.nCuadriculasX).toBe(30);
    expect(result.current.gridConfigForm.nCuadriculasY).toBe(25);
    expect(result.current.gridConfigForm.distanciaCasilla).toBe(10);
    expect(result.current.gridConfigForm.sistemaMetrico).toBe("ft");
  });

  it("setGridConfigForm actualiza los valores del formulario", () => {
    const { result } = render();
    act(() => {
      result.current.setGridConfigForm((prev) => ({
        ...prev,
        nCuadriculasX: 40,
        sistemaMetrico: "m",
      }));
    });
    expect(result.current.gridConfigForm.nCuadriculasX).toBe(40);
    expect(result.current.gridConfigForm.sistemaMetrico).toBe("m");
  });

  it("handleSaveGridConfig llama a fetch y ejecuta callbacks al guardar", async () => {
    const updatedPestaña = makePestaña({ nCuadriculasX: 50 });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedPestaña,
    } as Response);

    const { result } = render();
    await act(async () => {
      await result.current.handleSaveGridConfig();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/campanas/10/pestana/1/configuracion"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(onPestañaUpdated).toHaveBeenCalledWith(updatedPestaña);
    expect(onAfterSave).toHaveBeenCalledWith(updatedPestaña);
    expect(result.current.settingsMode).toBeNull();
  });

  it("handleSaveGridConfig no hace nada si pestañaId es null", async () => {
    const { result } = render({ pestañaId: null });
    await act(async () => {
      await result.current.handleSaveGridConfig();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("handleSaveGridConfig no hace nada si no hay token", async () => {
    localStorage.removeItem("jwtToken");
    const { result } = render();
    await act(async () => {
      await result.current.handleSaveGridConfig();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("handleSaveGridConfig ignora errores de respuesta no ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = render();
    await act(async () => {
      await result.current.handleSaveGridConfig();
    });
    expect(onPestañaUpdated).not.toHaveBeenCalled();
  });

  it("handleAutoGrid calcula grilla para imagen landscape", () => {
    const img = { naturalWidth: 2000, naturalHeight: 1000 } as HTMLImageElement;
    const { result } = render({ mapLayerImage: img });
    act(() => {
      result.current.handleAutoGrid();
    });
    expect(result.current.gridConfigForm.nCuadriculasX).toBe(20);
    expect(result.current.gridConfigForm.nCuadriculasY).toBe(10);
  });

  it("handleAutoGrid calcula grilla para imagen portrait", () => {
    const img = { naturalWidth: 1000, naturalHeight: 2000 } as HTMLImageElement;
    const { result } = render({ mapLayerImage: img });
    act(() => {
      result.current.handleAutoGrid();
    });
    expect(result.current.gridConfigForm.nCuadriculasX).toBe(10);
    expect(result.current.gridConfigForm.nCuadriculasY).toBe(20);
  });

  it("handleAutoGrid no hace nada si no hay imagen", () => {
    const { result } = render({ mapLayerImage: null });
    const before = { ...result.current.gridConfigForm };
    act(() => {
      result.current.handleAutoGrid();
    });
    expect(result.current.gridConfigForm).toEqual(before);
  });

  it("handleAutoGrid no hace nada si imagen tiene dimensiones 0", () => {
    const img = { naturalWidth: 0, naturalHeight: 0 } as HTMLImageElement;
    const { result } = render({ mapLayerImage: img });
    const before = { ...result.current.gridConfigForm };
    act(() => {
      result.current.handleAutoGrid();
    });
    expect(result.current.gridConfigForm).toEqual(before);
  });

  it("cierra settings al hacer click fuera del ref (con elemento asignado)", () => {
    const { result } = render();
    // Crear un elemento y asignarlo al ref
    const dropdown = document.createElement("div");
    document.body.appendChild(dropdown);
    Object.defineProperty(result.current.settingsDropdownRef, "current", {
      value: dropdown,
      writable: true,
    });

    act(() => {
      result.current.setSettingsMode("options");
    });
    expect(result.current.settingsMode).toBe("options");

    // Click fuera del dropdown (en body directamente)
    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });
    expect(result.current.settingsMode).toBeNull();

    document.body.removeChild(dropdown);
  });
});
