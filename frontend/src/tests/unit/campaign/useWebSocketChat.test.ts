// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useWebSocketChat } from "../../../screens/campaign/hooks/useWebSocketChat";
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
  return lastCall?.value as ReturnType<typeof Client> & {
    onConnect: (() => void) | null;
    onWebSocketClose: (() => void) | null;
    onWebSocketError: (() => void) | null;
    onStompError: ((frame: { headers: Record<string, string> }) => void) | null;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(campaignId = 1) {
  const onNewMessage = vi.fn();
  const onPlayersUpdate = vi.fn();
  const onError = vi.fn();

  const { result } = renderHook(() =>
    useWebSocketChat({
      campaignId,
      username: "testUser",
      onNewMessage,
      onPlayersUpdate,
      onError,
    }),
  );

  return { result, onNewMessage, onPlayersUpdate, onError };
}

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useWebSocketChat - estado inicial", () => {
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

  it("isConnected empieza en false", () => {
    const { result } = setup();
    expect(result.current.isConnected).toBe(false);
  });

  it("sendMessage está disponible", () => {
    const { result } = setup();
    expect(typeof result.current.sendMessage).toBe("function");
  });
});

// ── Comportamiento sin token ──────────────────────────────────────────────────

describe("useWebSocketChat - sin token", () => {
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

  it("llama onError cuando no hay token", async () => {
    const { onError } = setup(1);
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("onError recibe mensaje de error de sesión", async () => {
    const { onError } = setup(1);
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("sesión"));
    });
  });

  it("sendMessage lanza error si campaignId no es válido (0)", async () => {
    const { result } = setup(0);
    await expect(result.current.sendMessage("hola")).rejects.toThrow(
      "La campaña no es válida.",
    );
  });

  it("sendMessage lanza error sin token para campaignId válido", async () => {
    const { result } = setup(1);
    await expect(result.current.sendMessage("hola")).rejects.toThrow(
      "No hay sesión activa para enviar mensajes.",
    );
  });
});

// ── Comportamiento con token y fetch ──────────────────────────────────────────

describe("useWebSocketChat - con token y fetch mock", () => {
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

  it("isConnected sigue en false si el cliente STOMP no conecta", async () => {
    const { result } = setup(1);
    // Even with a token, the mock STOMP client doesn't fire onConnect
    await waitFor(() => {
      // just wait for effects to settle
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("sendMessage no lanza si el mensaje está vacío", async () => {
    const { result } = setup(1);
    await expect(result.current.sendMessage("   ")).resolves.toBeUndefined();
  });

  it("sendMessage intenta POST cuando no hay conexión WS activa", async () => {
    const createdMsg = {
      id: 1,
      username: "testUser",
      mensaje: "hola",
      enviadoEn: "2024-01-01T00:00:00Z",
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => createdMsg,
    } as Response);

    const { result, onNewMessage } = setup(1);

    await act(async () => {
      await result.current.sendMessage("hola");
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/campanas/1/chat`),
      expect.objectContaining({ method: "POST" }),
    );
    expect(onNewMessage).toHaveBeenCalledWith(createdMsg);
  });

  it("sendMessage lanza error si el POST falla", async () => {
    vi.mocked(fetch)
      // First call is fetchMessages (ok: true, [])
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      // Second call is fetchPlayers (ok: true, [])
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      // Third call is the POST for sendMessage (fails)
      .mockResolvedValueOnce({ ok: false } as Response);

    const { result } = setup(1);

    await expect(result.current.sendMessage("hola")).rejects.toThrow(
      "No se pudo enviar el mensaje.",
    );
  });

  it("campaignId <= 0 impide fetchMessages", async () => {
    const { result } = setup(0);
    // sendMessage returns early for invalid campaignId
    await expect(result.current.sendMessage("hola")).rejects.toThrow(
      "La campaña no es válida.",
    );
  });
});

// ── campaignId inválido ───────────────────────────────────────────────────────

describe("useWebSocketChat - campaignId inválido (NaN)", () => {
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

  it("no hace fetch cuando campaignId es NaN", async () => {
    setup(NaN);
    // wait a tick
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sendMessage lanza error cuando campaignId es NaN", async () => {
    const { result } = setup(NaN);
    await expect(result.current.sendMessage("hola")).rejects.toThrow(
      "La campaña no es válida.",
    );
  });
});

// ── Callbacks STOMP ───────────────────────────────────────────────────────────

describe("useWebSocketChat - STOMP callbacks con token", () => {
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

  it("onError recibe 'perdió la conexión' cuando hay error de WebSocket", async () => {
    const { onError } = setup(1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onWebSocketError === "function") {
        mockClient.onWebSocketError();
      }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("conexión"));
    });
  });

  it("onError recibe mensaje cuando hay error STOMP", async () => {
    const { onError } = setup(1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onStompError === "function") {
        mockClient.onStompError({ headers: { message: "STOMP broker error" } });
      }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("STOMP broker error");
    });
  });

  it("onError recibe mensaje default cuando onStompError no tiene header message", async () => {
    const { onError } = setup(1);

    const mockClient = getLastMockClientInstance();
    act(() => {
      if (typeof mockClient.onStompError === "function") {
        mockClient.onStompError({ headers: {} });
      }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("broker"));
    });
  });
});
