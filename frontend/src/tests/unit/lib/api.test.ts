// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

describe("buildApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("devuelve rutas relativas cuando no hay base configurada", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildApiUrl } = await import("../../../lib/api");

    expect(buildApiUrl("api/auth/login")).toBe("/api/auth/login");
  });

  it("devuelve la url absoluta sin modificar", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
    const { buildApiUrl } = await import("../../../lib/api");

    expect(buildApiUrl("https://example.com/test")).toBe(
      "https://example.com/test",
    );
  });

  it("concatena la base y normaliza la barra final", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080/");
    const { buildApiUrl } = await import("../../../lib/api");

    expect(buildApiUrl("/api/personajes")).toBe(
      "http://localhost:8080/api/personajes",
    );
  });
});

describe("buildWebSocketUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("devuelve la URL ws:// tal cual si ya comienza con ws://", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    expect(buildWebSocketUrl("ws://example.com/ws")).toBe(
      "ws://example.com/ws",
    );
  });

  it("devuelve la URL wss:// tal cual si ya comienza con wss://", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    expect(buildWebSocketUrl("wss://example.com/ws")).toBe(
      "wss://example.com/ws",
    );
  });

  it("convierte http:// a ws://", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    const result = buildWebSocketUrl("http://example.com/ws");
    expect(result).toBe("ws://example.com/ws");
  });

  it("convierte https:// a wss://", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    const result = buildWebSocketUrl("https://example.com/ws");
    expect(result).toBe("wss://example.com/ws");
  });

  it("construye URL ws desde path relativo y apiBaseUrl con http", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example.com");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    const result = buildWebSocketUrl("/ws");
    expect(result).toBe("ws://api.example.com/ws");
  });

  it("construye URL wss desde path relativo y apiBaseUrl con https", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    const result = buildWebSocketUrl("/ws");
    expect(result).toBe("wss://api.example.com/ws");
  });

  it("usa window.location cuando no hay apiBaseUrl", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    // En jsdom, window.location.protocol es 'http:' → debe usar ws:
    const result = buildWebSocketUrl("/ws");
    expect(result).toMatch(/^ws:\/\//);
    expect(result).toContain("/ws");
  });

  it("agrega / al path relativo si no lo tiene (sin apiBaseUrl)", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { buildWebSocketUrl } = await import("../../../lib/api");
    const result = buildWebSocketUrl("ws");
    expect(result).toContain("/ws");
  });
});
