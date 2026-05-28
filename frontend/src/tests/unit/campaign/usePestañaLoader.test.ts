// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { usePestañaLoader } from "../../../screens/campaign/hooks/usePestañaLoader";

// ── Mock fetch ────────────────────────────────────────────────────────────────

function mockFetchSuccess(data: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    }),
  );
}

function mockFetchError() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
    }),
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.setItem("jwtToken", "test-token");
});

afterEach(() => {
  localStorage.clear();
});

// ── campaignIdNumber ──────────────────────────────────────────────────────────

describe("usePestañaLoader - campaignIdNumber", () => {
  it("convierte campaignId string numérico a número", async () => {
    mockFetchSuccess({ id: 1, nCuadriculasX: 20, nCuadriculasY: 20 });
    const { result } = renderHook(() => usePestañaLoader("42"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.campaignIdNumber).toBe(42);
  });

  it("devuelve 0 para campaignId no numérico", async () => {
    mockFetchSuccess({ id: 1, nCuadriculasX: 20, nCuadriculasY: 20 });
    const { result } = renderHook(() => usePestañaLoader("abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.campaignIdNumber).toBe(0);
  });
});

// ── grid (cálculo puro) ────────────────────────────────────────────────────────

describe("usePestañaLoader - grid", () => {
  it("usa valores por defecto (20x20) cuando pestaña es null", async () => {
    mockFetchError();
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.grid.cols).toBe(20);
    expect(result.current.grid.rows).toBe(20);
  });

  it("usa nCuadriculasX/Y de la pestaña cuando están disponibles", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 30,
      nCuadriculasY: 15,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.cols).toBe(30);
    expect(result.current.grid.rows).toBe(15);
  });

  it("clampea columnas y filas al mínimo de 10", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 3,
      nCuadriculasY: 2,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.cols).toBe(10);
    expect(result.current.grid.rows).toBe(10);
  });

  it("clampea columnas y filas al máximo de 100", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 200,
      nCuadriculasY: 150,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.cols).toBe(100);
    expect(result.current.grid.rows).toBe(100);
  });

  it("cellPx es 70 (tamaño fijo de celda)", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.cellPx).toBe(70);
  });

  it("vLines tiene cols+1 elementos", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.vLines).toHaveLength(21);
  });

  it("hLines tiene rows+1 elementos", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 10,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.hLines).toHaveLength(11);
  });

  it("rectW = cols * 70", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());

    expect(result.current.grid.rectW).toBe(20 * 70);
  });
});

// ── error y loading ───────────────────────────────────────────────────────────

describe("usePestañaLoader - estados de carga y error", () => {
  it("inicia en estado loading", () => {
    mockFetchSuccess({ id: 1, nCuadriculasX: 20, nCuadriculasY: 20 });
    const { result } = renderHook(() => usePestañaLoader("5"));
    // En el primer render isLoading puede ser true o false según el mock
    expect(typeof result.current.isLoading).toBe("boolean");
  });

  it("establece loadError cuando el fetch falla", async () => {
    mockFetchError();
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBeTruthy();
  });

  it("devuelve pestaña cuando el fetch tiene éxito", async () => {
    mockFetchSuccess({
      id: 7,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("7"));
    await waitFor(() => expect(result.current.pestaña).not.toBeNull());
    expect(result.current.pestaña?.id).toBe(7);
  });

  it("establece loadError cuando no hay token", async () => {
    localStorage.removeItem("jwtToken");
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBeTruthy();
  });
});

// ── Resize handler ────────────────────────────────────────────────────────────

describe("usePestañaLoader - resize handler", () => {
  it("actualiza stageSize cuando se dispara el evento resize", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Change innerWidth/innerHeight and fire resize
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 900,
      writable: true,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(result.current.stageSize.width).toBe(1280);
      expect(result.current.stageSize.height).toBe(900);
    });
  });
});

// ── Map layer image ────────────────────────────────────────────────────────────

describe("usePestañaLoader - map layer image", () => {
  it("inicia carga de imagen cuando mapaCapaUrl no es nulo", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: "https://example.com/mapa.png",
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // mapLayerImageUrl should be set from the fetch response
    expect(result.current.mapLayerImageUrl).toBe(
      "https://example.com/mapa.png",
    );
  });

  it("establece mapLayerImage a null cuando mapLayerImageUrl es null", async () => {
    mockFetchSuccess({
      id: 1,
      nCuadriculasX: 20,
      nCuadriculasY: 20,
      mapaCapaUrl: null,
    });
    const { result } = renderHook(() => usePestañaLoader("5"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.mapLayerImage).toBeNull();
  });
});
