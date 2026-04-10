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
