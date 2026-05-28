// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useWebSocketDrawings } from "../../../screens/campaign/hooks/useWebSocketDrawings";
import { Client } from "@stomp/stompjs";

// ── Mock STOMP to avoid real WebSocket connections ────────────────────────────
vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation(() => ({
    configure: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn(),
    connected: false,
    subscriptions: {},
    onConnect: null,
    onWebSocketClose: null,
    onWebSocketError: null,
    onStompError: null,
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  })),
}));

function getLastMockClientInstance() {
  const MockClient = vi.mocked(Client);
  const lastCall = MockClient.mock.results[MockClient.mock.results.length - 1];
  return lastCall?.value as InstanceType<typeof Client> & {
    onConnect: (() => void) | null;
    onWebSocketClose: (() => void) | null;
    onWebSocketError: (() => void) | null;
    onStompError: (() => void) | null;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(campaignId = 1, pestanaId: number | null = 1) {
  const { result } = renderHook(() =>
    useWebSocketDrawings({ campaignId, pestanaId }),
  );
  return { result };
}

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useWebSocketDrawings - estado inicial", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drawings empieza vacío", () => {
    const { result } = setup();
    expect(result.current.drawings).toHaveLength(0);
  });

  it("isConnected empieza en false", () => {
    const { result } = setup();
    expect(result.current.isConnected).toBe(false);
  });

  it("sendDrawing está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.sendDrawing).toBe("function");
  });

  it("deleteDrawing está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.deleteDrawing).toBe("function");
  });
});

// ── sendDrawing / deleteDrawing sin conexión ──────────────────────────────────

describe("useWebSocketDrawings - sin conexión WS", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("sendDrawing lanza error si no hay conexión WebSocket", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.sendDrawing({
          pestanaId: 1,
          capa: "fichas",
          tipo: "pencil",
          color: "#000",
          relleno: false,
          puntos: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        });
      });
    }).toThrow("No hay conexión WebSocket para enviar el dibujo.");
  });

  it("deleteDrawing lanza error si no hay conexión WebSocket", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.deleteDrawing({
          pestanaId: 1,
          capa: "fichas",
          dibujoId: 5,
        });
      });
    }).toThrow("No hay conexión WebSocket para borrar el dibujo.");
  });
});

// ── Fetch sin token ───────────────────────────────────────────────────────────

describe("useWebSocketDrawings - sin token", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drawings empieza vacío cuando no hay token", async () => {
    const { result } = setup(1, 1);
    await waitFor(() => {
      expect(result.current.drawings).toHaveLength(0);
    });
  });

  it("isConnected sigue en false sin token", async () => {
    const { result } = setup(1, 1);
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });
});

// ── campaignId inválido ───────────────────────────────────────────────────────

describe("useWebSocketDrawings - campaignId inválido", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("drawings empieza vacío cuando campaignId es 0", async () => {
    const { result } = setup(0, 1);
    await waitFor(() => {
      expect(result.current.drawings).toHaveLength(0);
    });
  });

  it("no llama a fetch cuando campaignId es 0", async () => {
    setup(0, 1);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("drawings empieza vacío cuando pestanaId es null", async () => {
    const { result } = setup(1, null);
    await waitFor(() => {
      expect(result.current.drawings).toHaveLength(0);
    });
  });
});

// ── Con token y fetch exitoso ─────────────────────────────────────────────────

describe("useWebSocketDrawings - con token y fetch exitoso", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("carga dibujos desde el servidor al inicializar", async () => {
    const mockDrawing = {
      id: 1,
      pestanaId: 1,
      capa: "fichas",
      tipo: "pencil",
      color: "#ff0000",
      relleno: false,
      largo: null,
      ancho: null,
      puntos: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      actualizadoEn: "2024-01-01T00:00:00Z",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDrawing],
      }),
    );

    const { result } = setup(1, 1);

    await waitFor(() => {
      expect(result.current.drawings).toHaveLength(1);
    });
    expect(result.current.drawings[0].id).toBe(1);
    expect(result.current.drawings[0].color).toBe("#ff0000");
  });

  it("ignora dibujos con menos de 2 puntos", async () => {
    const invalidDrawing = {
      id: 1,
      pestanaId: 1,
      capa: "fichas",
      tipo: "pencil",
      color: "#000",
      relleno: false,
      puntos: [{ x: 0, y: 0 }], // only 1 point — invalid
      actualizadoEn: "",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [invalidDrawing],
      }),
    );

    const { result } = setup(1, 1);

    await waitFor(() => {
      // isConnected should resolve to known state
      expect(result.current.isConnected).toBe(false);
    });
    // invalid drawings filtered out
    expect(result.current.drawings).toHaveLength(0);
  });

  it("drawings vacío cuando el servidor responde con array vacío", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    const { result } = setup(1, 1);

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
    expect(result.current.drawings).toHaveLength(0);
  });
});

// ── Callbacks STOMP ───────────────────────────────────────────────────────────

describe("useWebSocketDrawings - STOMP callbacks con token", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.mocked(Client).mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("isConnected cambia a true cuando el cliente STOMP conecta", async () => {
    const { result } = setup(1, 1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it("isConnected vuelve a false cuando el WebSocket cierra", async () => {
    const { result } = setup(1, 1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    act(() => {
      if (typeof mockClient.onWebSocketClose === "function") {
        mockClient.onWebSocketClose();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("isConnected vuelve a false cuando hay error de WebSocket", async () => {
    const { result } = setup(1, 1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    act(() => {
      if (typeof mockClient.onWebSocketError === "function") {
        mockClient.onWebSocketError();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("isConnected vuelve a false cuando hay error STOMP", async () => {
    const { result } = setup(1, 1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    act(() => {
      if (typeof mockClient.onStompError === "function") {
        mockClient.onStompError();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });
});
