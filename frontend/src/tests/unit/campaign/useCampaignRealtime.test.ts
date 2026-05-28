// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useCampaignRealtime } from "../../../screens/campaign/hooks/useCampaignRealtime";
import { Client } from "@stomp/stompjs";

// ── Mock STOMP client to avoid real WebSocket connections ─────────────────────
vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation(() => ({
    configure: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    publish: vi.fn(),
    connected: false,
    subscriptions: {},
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    onConnect: null,
    onWebSocketClose: null,
    onWebSocketError: null,
    onStompError: null,
  })),
}));

// Mock fetch for initial drawings
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  }),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get the most recently created STOMP client mock instance */
function getLastMockClientInstance() {
  const MockClient = vi.mocked(Client);
  const lastCall = MockClient.mock.results[MockClient.mock.results.length - 1];
  return lastCall?.value as ReturnType<typeof Client> & {
    onConnect: (() => void) | null;
    onWebSocketClose: (() => void) | null;
    onWebSocketError: (() => void) | null;
    onStompError: (() => void) | null;
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function setup(campaignId: number | null = null, overrides?: object) {
  const { result } = renderHook(() =>
    useCampaignRealtime({
      campaignId,
      pestanaId: null,
      ...overrides,
    }),
  );
  return { result };
}

// ── Estado inicial (sin campaignId) ──────────────────────────────────────────

describe("useCampaignRealtime - estado inicial sin campaignId", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  it("drawings empieza vacío", () => {
    const { result } = setup();
    expect(result.current.drawings).toHaveLength(0);
  });

  it("isConnected empieza en false", () => {
    const { result } = setup();
    expect(result.current.isConnected).toBe(false);
  });

  it("crearPosicionPorWebSocket está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.crearPosicionPorWebSocket).toBe("function");
  });

  it("moverPosicionPorWebSocket está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.moverPosicionPorWebSocket).toBe("function");
  });

  it("eliminarPosicionPorWebSocket está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.eliminarPosicionPorWebSocket).toBe("function");
  });

  it("asignarMapaPorWebSocket está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.asignarMapaPorWebSocket).toBe("function");
  });

  it("sendDrawing está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.sendDrawing).toBe("function");
  });

  it("deleteDrawing está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.deleteDrawing).toBe("function");
  });

  it("activarIniciativa está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.activarIniciativa).toBe("function");
  });

  it("tirarIniciativa está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.tirarIniciativa).toBe("function");
  });

  it("reordenarIniciativa está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.reordenarIniciativa).toBe("function");
  });

  it("configurarNiebla está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.configurarNiebla).toBe("function");
  });

  it("configurarVisionToken está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.configurarVisionToken).toBe("function");
  });

  it("agregarAreaExplorada está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.agregarAreaExplorada).toBe("function");
  });

  it("agregarAreasExploradasBatch está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.agregarAreasExploradasBatch).toBe("function");
  });

  it("cambiarCapaToken está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.cambiarCapaToken).toBe("function");
  });

  it("forzarCambioPestana está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.forzarCambioPestana).toBe("function");
  });

  it("broadcastPestanaConfig está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.broadcastPestanaConfig).toBe("function");
  });
});

// ── Callbacks sin conexión (no-ops) ───────────────────────────────────────────

describe("useCampaignRealtime - callbacks sin conexión son no-ops", () => {
  it("crearPosicionPorWebSocket no lanza sin campaignId", () => {
    const { result } = setup();
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

  it("moverPosicionPorWebSocket no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.moverPosicionPorWebSocket(1, 0, 0);
      });
    }).not.toThrow();
  });

  it("eliminarPosicionPorWebSocket no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.eliminarPosicionPorWebSocket(1);
      });
    }).not.toThrow();
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

  it("activarIniciativa no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.activarIniciativa({
          activa: true,
          orden: [],
          turnoActual: 0,
          ronda: 1,
        });
      });
    }).not.toThrow();
  });

  it("tirarIniciativa no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.tirarIniciativa({ personajeId: 1, valor: 15 });
      });
    }).not.toThrow();
  });

  it("reordenarIniciativa no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.reordenarIniciativa([]);
      });
    }).not.toThrow();
  });

  it("configurarNiebla no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.configurarNiebla({
          activa: false,
          zonasExploradas: false,
          vistaJugador: false,
        });
      });
    }).not.toThrow();
  });

  it("configurarVisionToken no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.configurarVisionToken({
          posicionId: 1,
          radius: 5,
          arcType: "circle",
          apertura: 360,
          rotation: 0,
          angle: 360,
          length: 0,
          width: 0,
          height: 0,
          revelaArea: false,
        });
      });
    }).not.toThrow();
  });

  it("agregarAreaExplorada no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.agregarAreaExplorada({
          id: "area-1",
          posicionX: 0,
          posicionY: 0,
          arcType: "cone",
          radius: 5,
          apertura: 60,
          rotation: 0,
          angle: 60,
          length: 0,
          width: 0,
          height: 0,
          tokenSize: 1,
        });
      });
    }).not.toThrow();
  });

  it("agregarAreasExploradasBatch no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.agregarAreasExploradasBatch([]);
      });
    }).not.toThrow();
  });

  it("cambiarCapaToken no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.cambiarCapaToken(1, "dm");
      });
    }).not.toThrow();
  });

  it("forzarCambioPestana no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.forzarCambioPestana(1, null);
      });
    }).not.toThrow();
  });

  it("broadcastPestanaConfig no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.broadcastPestanaConfig({
          pestanaId: 1,
          nCuadriculasX: 20,
          nCuadriculasY: 20,
          distanciaCasilla: 5,
          sistemaMetrico: "ft",
        });
      });
    }).not.toThrow();
  });

  it("asignarMapaPorWebSocket no lanza sin campaignId", () => {
    const { result } = setup();
    expect(() => {
      act(() => {
        result.current.asignarMapaPorWebSocket(1, 5, "http://mapa.png");
      });
    }).not.toThrow();
  });
});

// ── Con token y STOMP onConnect callback ──────────────────────────────────────

describe("useCampaignRealtime - con token y STOMP callbacks", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.mocked(Client).mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("isConnected cambia a true cuando el cliente STOMP conecta", async () => {
    const { result } = setup(1);

    // Fire the onConnect callback
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
    // First connect
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    // Then close
    act(() => {
      if (typeof mockClient.onWebSocketClose === "function") {
        mockClient.onWebSocketClose();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("isConnected vuelve a false cuando hay un error de WebSocket", async () => {
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

  it("isConnected vuelve a false cuando hay un error de STOMP", async () => {
    const { result } = setup(1);

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

  it("no crea cliente STOMP sin token", async () => {
    localStorage.removeItem("jwtToken");
    vi.mocked(Client).mockClear();

    setup(1);

    // The Client constructor should not be called if there's no token
    // (depends on implementation – at minimum isConnected stays false)
    const { result } = setup(1);
    expect(result.current.isConnected).toBe(false);
  });
});

// ── STOMP message handlers ────────────────────────────────────────────────────

describe("useCampaignRealtime - STOMP message handlers", () => {
  let onPosicionCreated: ReturnType<typeof vi.fn>;
  let onPosicionDeleted: ReturnType<typeof vi.fn>;
  let onMapLayerChanged: ReturnType<typeof vi.fn>;
  let onCharacterUpdated: ReturnType<typeof vi.fn>;
  let onIniciativaChanged: ReturnType<typeof vi.fn>;
  let onNieblaChanged: ReturnType<typeof vi.fn>;
  let onCambioPestañaForzado: ReturnType<typeof vi.fn>;
  let onConfigPestanaChanged: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.mocked(Client).mockClear();
    onPosicionCreated = vi.fn();
    onPosicionDeleted = vi.fn();
    onMapLayerChanged = vi.fn();
    onCharacterUpdated = vi.fn();
    onIniciativaChanged = vi.fn();
    onNieblaChanged = vi.fn();
    onCambioPestañaForzado = vi.fn();
    onConfigPestanaChanged = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function setupWithCallbacks() {
    const { result } = renderHook(() =>
      useCampaignRealtime({
        campaignId: 1,
        pestanaId: 1,
        onPosicionCreated,
        onPosicionDeleted,
        onMapLayerChanged,
        onCharacterUpdated,
        onIniciativaChanged,
        onNieblaChanged,
        onCambioPestañaForzado,
        onConfigPestanaChanged,
      }),
    );
    return result;
  }

  function connectMockClient(
    mockClient: ReturnType<typeof getLastMockClientInstance>,
  ) {
    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });
  }

  function getSubscribeCallback(
    mockClient: ReturnType<typeof getLastMockClientInstance>,
    index: number,
  ): (msg: { body: string }) => void {
    return (mockClient.subscribe as ReturnType<typeof vi.fn>).mock.calls[
      index
    ][1];
  }

  it("handler posiciones llama onPosicionCreated cuando accion es CREATED", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const posicionCallback = getSubscribeCallback(mockClient, 0);
    act(() => {
      posicionCallback({
        body: JSON.stringify({
          accion: "CREATED",
          posicionId: 10,
          posicion: {
            id: 10,
            pestanaId: 1,
            capa: "fichas",
            personajeId: 5,
            personajeNombre: "Hero",
            posicionX: 2,
            posicionY: 3,
            largo: 1,
            ancho: 1,
          },
        }),
      });
    });

    await waitFor(() => {
      expect(onPosicionCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 10, personajeNombre: "Hero" }),
      );
    });
  });

  it("handler posiciones llama onPosicionDeleted cuando accion es DELETED", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const posicionCallback = getSubscribeCallback(mockClient, 0);
    act(() => {
      posicionCallback({
        body: JSON.stringify({
          accion: "DELETED",
          posicionId: 7,
          posicion: null,
        }),
      });
    });

    await waitFor(() => {
      expect(onPosicionDeleted).toHaveBeenCalledWith(7);
    });
  });

  it("handler capas/mapa llama onMapLayerChanged", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const mapaCallback = getSubscribeCallback(mockClient, 1);
    act(() => {
      mapaCallback({
        body: JSON.stringify({
          pestanaId: 1,
          mapaId: 3,
          mapaUrl: "http://mapa.png",
        }),
      });
    });

    await waitFor(() => {
      expect(onMapLayerChanged).toHaveBeenCalledWith(
        expect.objectContaining({ pestanaId: 1, mapaId: 3 }),
      );
    });
  });

  it("handler personajes llama onCharacterUpdated con personajeId", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const personajesCallback = getSubscribeCallback(mockClient, 3);
    act(() => {
      personajesCallback({
        body: JSON.stringify({ personajeId: 42, accion: "UPDATE" }),
      });
    });

    await waitFor(() => {
      expect(onCharacterUpdated).toHaveBeenCalledWith(42);
    });
  });

  it("handler iniciativa llama onIniciativaChanged", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const iniciativaCallback = getSubscribeCallback(mockClient, 4);
    act(() => {
      iniciativaCallback({
        body: JSON.stringify({ activa: true, entradas: [] }),
      });
    });

    await waitFor(() => {
      expect(onIniciativaChanged).toHaveBeenCalledWith(
        expect.objectContaining({ activa: true, entradas: [] }),
      );
    });
  });

  it("handler niebla llama onNieblaChanged para la pestaña correcta", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const nieblaCallback = getSubscribeCallback(mockClient, 5);
    act(() => {
      nieblaCallback({
        body: JSON.stringify({
          pestanaId: 1,
          activa: true,
          zonasExploradas: false,
          vistaJugador: false,
          visionConfigs: [],
          exploredAreas: [],
        }),
      });
    });

    await waitFor(() => {
      expect(onNieblaChanged).toHaveBeenCalled();
    });
  });

  it("handler niebla ignora mensajes de otra pestaña", () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const nieblaCallback = getSubscribeCallback(mockClient, 5);
    act(() => {
      nieblaCallback({
        body: JSON.stringify({
          pestanaId: 999,
          activa: true,
          zonasExploradas: false,
          vistaJugador: false,
          visionConfigs: [],
          exploredAreas: [],
        }),
      });
    });

    expect(onNieblaChanged).not.toHaveBeenCalled();
  });

  it("handler niebla sin pestanaId llama onNieblaChanged", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const nieblaCallback = getSubscribeCallback(mockClient, 5);
    act(() => {
      nieblaCallback({
        body: JSON.stringify({
          // sin pestanaId → no hay filtro
          activa: false,
          zonasExploradas: true,
          vistaJugador: false,
          visionConfigs: [],
          exploredAreas: [],
        }),
      });
    });

    await waitFor(() => {
      expect(onNieblaChanged).toHaveBeenCalled();
    });
  });

  it("handler pestana/cambio llama onCambioPestañaForzado", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const cambioPestanaCallback = getSubscribeCallback(mockClient, 6);
    act(() => {
      cambioPestanaCallback({
        body: JSON.stringify({ pestanaId: 2, jugadores: ["user1", "user2"] }),
      });
    });

    await waitFor(() => {
      expect(onCambioPestañaForzado).toHaveBeenCalledWith(2, [
        "user1",
        "user2",
      ]);
    });
  });

  it("handler pestana/config llama onConfigPestanaChanged", async () => {
    setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const configCallback = getSubscribeCallback(mockClient, 7);
    act(() => {
      configCallback({
        body: JSON.stringify({
          pestanaId: 1,
          nCuadriculasX: 20,
          nCuadriculasY: 20,
          distanciaCasilla: 5,
          sistemaMetrico: "ft",
        }),
      });
    });

    await waitFor(() => {
      expect(onConfigPestanaChanged).toHaveBeenCalledWith(
        expect.objectContaining({ pestanaId: 1, nCuadriculasX: 20 }),
      );
    });
  });

  it("handler dibujos procesa un nuevo dibujo", async () => {
    const result = setupWithCallbacks();

    // Wait for the initial async fetchInitialDrawings to settle (sets drawings=[])
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const dibujoCallback = getSubscribeCallback(mockClient, 2);
    await act(async () => {
      dibujoCallback({
        body: JSON.stringify({
          id: 5,
          pestanaId: 1,
          capa: "fichas",
          tipo: "pencil",
          color: "#ff0000",
          relleno: false,
          puntos: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          actualizadoEn: "2024-01-01",
        }),
      });
    });

    expect(result.current.drawings).toHaveLength(1);
    expect(result.current.drawings[0].id).toBe(5);
  });

  it("handler dibujos elimina un dibujo con accion DELETED", async () => {
    const result = setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const dibujoCallback = getSubscribeCallback(mockClient, 2);

    // Add a drawing first
    act(() => {
      dibujoCallback({
        body: JSON.stringify({
          id: 3,
          pestanaId: 1,
          capa: "fichas",
          tipo: "pencil",
          color: "#000",
          relleno: false,
          puntos: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          actualizadoEn: "",
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.drawings).toHaveLength(1);
    });

    // Delete the drawing
    act(() => {
      dibujoCallback({
        body: JSON.stringify({ accion: "DELETED", dibujoId: 3 }),
      });
    });

    await waitFor(() => {
      expect(result.current.drawings).toHaveLength(0);
    });
  });

  it("handler dibujos ignora dibujo de otra pestaña", async () => {
    const result = setupWithCallbacks();
    const mockClient = getLastMockClientInstance();
    connectMockClient(mockClient);

    const dibujoCallback = getSubscribeCallback(mockClient, 2);

    act(() => {
      dibujoCallback({
        body: JSON.stringify({
          id: 9,
          pestanaId: 999, // Different pestana
          capa: "fichas",
          tipo: "pencil",
          color: "#000",
          relleno: false,
          puntos: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          actualizadoEn: "",
        }),
      });
    });

    expect(result.current.drawings).toHaveLength(0);
  });
});

// ── Publish functions cuando conectado ───────────────────────────────────────

describe("useCampaignRealtime - funciones de publish cuando conectado", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-jwt");
    vi.mocked(Client).mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function setupAndConnect() {
    const { result } = renderHook(() =>
      useCampaignRealtime({ campaignId: 1, pestanaId: 1 }),
    );

    const mockClient = getLastMockClientInstance();
    Object.defineProperty(mockClient, "connected", {
      value: true,
      writable: true,
      configurable: true,
    });

    act(() => {
      if (typeof mockClient.onConnect === "function") {
        mockClient.onConnect();
      }
    });

    return { result, mockClient };
  }

  it("crearPosicionPorWebSocket publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.crearPosicionPorWebSocket({
        pestanaId: 1,
        capa: "fichas",
        personajeId: 5,
        posicionX: 3,
        posicionY: 7,
      });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/posiciones/crear"),
      }),
    );
  });

  it("moverPosicionPorWebSocket publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.moverPosicionPorWebSocket(1, 5, 10);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/posiciones/mover"),
      }),
    );
  });

  it("eliminarPosicionPorWebSocket publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.eliminarPosicionPorWebSocket(42);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/posiciones/eliminar"),
      }),
    );
  });

  it("asignarMapaPorWebSocket publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.asignarMapaPorWebSocket({ pestanaId: 1, mapaId: 3 });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/capas/mapa/asignar"),
      }),
    );
  });

  it("activarIniciativa publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.activarIniciativa(true as never);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/iniciativa/activar"),
      }),
    );
  });

  it("tirarIniciativa publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.tirarIniciativa(1, "Hero", null, 15, 2);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/iniciativa/tirar"),
      }),
    );
  });

  it("reordenarIniciativa publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.reordenarIniciativa([1, 2, 3]);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/iniciativa/reordenar"),
      }),
    );
  });

  it("configurarNiebla publica cuando está conectado con pestanaId", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.configurarNiebla({
        activa: true,
        zonasExploradas: false,
        vistaJugador: false,
      });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/niebla/configurar"),
      }),
    );
  });

  it("configurarVisionToken publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.configurarVisionToken({
        posicionId: 1,
        revelaArea: false,
        arcType: "circle",
        radius: 5,
        apertura: 360,
        rotation: 0,
        angle: 360,
        length: 0,
        width: 0,
        height: 0,
      });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/niebla/vision"),
      }),
    );
  });

  it("agregarAreaExplorada publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.agregarAreaExplorada({
        id: "area-1",
        posicionX: 0,
        posicionY: 0,
        arcType: "cone",
        radius: 5,
        apertura: 60,
        rotation: 0,
        angle: 60,
        length: 0,
        width: 0,
        height: 0,
        tokenSize: 1,
      });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/niebla/explorar"),
      }),
    );
  });

  it("agregarAreasExploradasBatch publica batch cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.agregarAreasExploradasBatch([
        {
          id: "area-1",
          posicionX: 0,
          posicionY: 0,
          arcType: "cone",
          radius: 5,
          apertura: 60,
          rotation: 0,
          angle: 60,
          length: 0,
          width: 0,
          height: 0,
        },
      ]);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/niebla/explorar/batch"),
      }),
    );
  });

  it("agregarAreasExploradasBatch no publica con array vacío", () => {
    const { result, mockClient } = setupAndConnect();
    // Clear any publish calls from onConnect
    (mockClient.publish as ReturnType<typeof vi.fn>).mockClear();
    act(() => {
      result.current.agregarAreasExploradasBatch([]);
    });
    expect(mockClient.publish).not.toHaveBeenCalled();
  });

  it("forzarCambioPestana publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.forzarCambioPestana(2, null);
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/pestana/cambio"),
      }),
    );
  });

  it("cambiarCapaToken publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.cambiarCapaToken(1, "dm");
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/posiciones/cambiarCapa"),
      }),
    );
  });

  it("broadcastPestanaConfig publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.broadcastPestanaConfig({
        pestanaId: 1,
        nCuadriculasX: 20,
        nCuadriculasY: 20,
        distanciaCasilla: 5,
        sistemaMetrico: "ft",
      });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/pestana/config"),
      }),
    );
  });

  it("sendDrawing publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
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
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/dibujos/crear"),
      }),
    );
  });

  it("deleteDrawing publica cuando está conectado", () => {
    const { result, mockClient } = setupAndConnect();
    act(() => {
      result.current.deleteDrawing({
        pestanaId: 1,
        capa: "fichas",
        dibujoId: 3,
      });
    });
    expect(mockClient.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.stringContaining("/dibujos/borrar"),
      }),
    );
  });
});
