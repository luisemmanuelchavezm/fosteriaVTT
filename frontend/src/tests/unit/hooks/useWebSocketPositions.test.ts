// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useWebSocketPositions } from "../../../hooks/useWebSocketPositions";
import { Client } from "@stomp/stompjs";

// ── Mock STOMP to avoid real WebSocket connections ────────────────────────────
vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation(() => ({
    configure: vi.fn(),
    activate: vi.fn().mockResolvedValue(undefined),
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

function setup(campaignId: number | null = null) {
  const onPosicionCreated = vi.fn();
  const onPosicionMoved = vi.fn();
  const onMapLayerChanged = vi.fn();

  const { result } = renderHook(() =>
    useWebSocketPositions({
      campaignId,
      onPosicionCreated,
      onPosicionMoved,
      onMapLayerChanged,
    }),
  );

  return { result, onPosicionCreated, onPosicionMoved, onMapLayerChanged };
}

// ── Estado inicial sin campaignId ──────────────────────────────────────────────

describe("useWebSocketPositions - estado inicial sin campaignId", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("isConnected empieza en false", () => {
    const { result } = setup(null);
    expect(result.current.isConnected).toBe(false);
  });

  it("crearPosicionPorWebSocket está disponible", () => {
    const { result } = setup(null);
    expect(typeof result.current.crearPosicionPorWebSocket).toBe("function");
  });

  it("moverPosicionPorWebSocket está disponible", () => {
    const { result } = setup(null);
    expect(typeof result.current.moverPosicionPorWebSocket).toBe("function");
  });

  it("asignarMapaPorWebSocket está disponible", () => {
    const { result } = setup(null);
    expect(typeof result.current.asignarMapaPorWebSocket).toBe("function");
  });
});

// ── Sin token ─────────────────────────────────────────────────────────────────

describe("useWebSocketPositions - sin token", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("isConnected sigue en false sin token aunque haya campaignId", async () => {
    const { result } = setup(1);
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });
});

// ── Con campaignId inválido ───────────────────────────────────────────────────

describe("useWebSocketPositions - campaignId inválido", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("isConnected es false cuando campaignId es 0", async () => {
    const { result } = setup(0);
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("isConnected es false cuando campaignId es null", async () => {
    const { result } = setup(null);
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });
});

// ── Callbacks sin conexión activa ─────────────────────────────────────────────

describe("useWebSocketPositions - callbacks sin conexión son no-ops", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("crearPosicionPorWebSocket no lanza cuando no hay conexión", () => {
    const { result } = setup(1);
    expect(() => {
      act(() => {
        result.current.crearPosicionPorWebSocket({
          pestanaId: 1,
          capa: "fichas",
          personajeId: 1,
          posicionX: 0,
          posicionY: 0,
        });
      });
    }).not.toThrow();
  });

  it("moverPosicionPorWebSocket no lanza cuando no hay conexión", () => {
    const { result } = setup(1);
    expect(() => {
      act(() => {
        result.current.moverPosicionPorWebSocket(1, 5, 10);
      });
    }).not.toThrow();
  });

  it("asignarMapaPorWebSocket no lanza cuando no hay conexión", () => {
    const { result } = setup(1);
    expect(() => {
      act(() => {
        result.current.asignarMapaPorWebSocket({ pestanaId: 1, mapaId: 2 });
      });
    }).not.toThrow();
  });
});

// ── Con campaignId válido y token ─────────────────────────────────────────────

describe("useWebSocketPositions - con campaignId válido y token", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("isConnected sigue en false mientras el STOMP mock no conecta", async () => {
    const { result } = setup(1);
    // The mock STOMP client doesn't fire onConnect automatically
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("crearPosicionPorWebSocket no lanza cuando el cliente no está conectado", () => {
    const { result } = setup(1);
    expect(() => {
      act(() => {
        result.current.crearPosicionPorWebSocket({
          pestanaId: 1,
          capa: "fichas",
          personajeId: 5,
          posicionX: 3,
          posicionY: 7,
        });
      });
    }).not.toThrow();
  });

  it("moverPosicionPorWebSocket no lanza cuando el cliente no está conectado", () => {
    const { result } = setup(1);
    expect(() => {
      act(() => {
        result.current.moverPosicionPorWebSocket(1, 2, 3);
      });
    }).not.toThrow();
  });

  it("asignarMapaPorWebSocket no lanza cuando el cliente no está conectado", () => {
    const { result } = setup(1);
    expect(() => {
      act(() => {
        result.current.asignarMapaPorWebSocket({ pestanaId: 1, mapaId: 10 });
      });
    }).not.toThrow();
  });
});

// ── Callbacks STOMP ───────────────────────────────────────────────────────────

describe("useWebSocketPositions - STOMP callbacks con token", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.mocked(Client).mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("isConnected cambia a true cuando el cliente STOMP conecta", async () => {
    const { result } = setup(1);

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
    const { result } = setup(1);

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
    const { result } = setup(1);

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
    const { result } = setup(1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
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

  it("crearPosicionPorWebSocket llama publish cuando el cliente está conectado", async () => {
    localStorage.setItem("jwtToken", "token");
    const { result } = setup(1);
    const mockClient = getLastMockClientInstance();

    act(() => {
      if (typeof mockClient.onConnect === "function") mockClient.onConnect();
      (mockClient as { connected: boolean }).connected = true;
    });

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    act(() => {
      result.current.crearPosicionPorWebSocket({ personajeId: 10, x: 5, y: 3 });
    });

    expect(mockClient.publish).toHaveBeenCalled();
  });

  it("moverPosicionPorWebSocket llama publish cuando el cliente está conectado", async () => {
    localStorage.setItem("jwtToken", "token");
    const { result } = setup(1);
    const mockClient = getLastMockClientInstance();

    act(() => {
      if (typeof mockClient.onConnect === "function") mockClient.onConnect();
      (mockClient as { connected: boolean }).connected = true;
    });

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    act(() => {
      result.current.moverPosicionPorWebSocket(1, 10, 20);
    });

    expect(mockClient.publish).toHaveBeenCalled();
  });

  it("llama a deactivate al desmontar cuando el cliente está conectado", async () => {
    const { unmount } = renderHook(() =>
      useWebSocketPositions({ campaignId: 1 }),
    );

    const mockClient = getLastMockClientInstance();
    // Simulate connection
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
      // Mark client as connected so cleanup branch runs
      (mockClient as { connected: boolean }).connected = true;
    });

    unmount();

    expect(mockClient.deactivate).toHaveBeenCalled();
  });
});
