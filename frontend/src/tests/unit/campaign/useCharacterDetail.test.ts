// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useCharacterDetail } from "../../../screens/campaign/hooks/useCharacterDetail";
import { CHARACTER_REMOTE_UPDATED_EVENT } from "../../../screens/campaign/types";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchDndCharacterDetail: vi.fn(),
}));

vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterInventory",
  () => ({
    getCharacterMoney: vi.fn().mockReturnValue({ ppt: 0, po: 5, pp: 0, pc: 0 }),
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterResources",
  () => ({
    extractExtraResources: vi.fn().mockReturnValue([]),
  }),
);

function makePosition(personajeId = 10): CampaignPositionResponse {
  return {
    id: 1,
    pestanaId: 1,
    capa: "fichas",
    personajeId,
    personajeNombre: "Aragorn",
    retrato: null,
    posicionX: 0,
    posicionY: 0,
    largo: 1,
    ancho: 1,
    tipo: "personaje",
  } as unknown as CampaignPositionResponse;
}

function makeDetail(): DndCharacterDetailResponse {
  return {
    id: 10,
    nombre: "Aragorn",
    retrato: null,
    sistemaDeJuego: "Dungeons and Dragons",
    estadisticas: {
      "Hechizos nivel 1": 2,
      "Hechizos nivel 1 gastados": 1,
    },
    habilidades: [],
  } as unknown as DndCharacterDetailResponse;
}

beforeEach(() => {
  localStorage.setItem("jwtToken", "test-token");
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe("useCharacterDetail", () => {
  it("returns initial state when selectedPosition is null", () => {
    const { result } = renderHook(() => useCharacterDetail(null));
    expect(result.current.detail).toBeNull();
    expect(result.current.isLoadingDetail).toBe(false);
    expect(result.current.portraitFailed).toBe(false);
    expect(result.current.resourceTab).toBe("spells");
    expect(result.current.resourceMoney).toEqual({
      ppt: 0,
      po: 0,
      pp: 0,
      pc: 0,
    });
  });

  it("fetches character detail when selectedPosition is provided", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    // Use stable reference to avoid infinite re-render loop
    const position = makePosition();
    const { result } = renderHook(() => useCharacterDetail(position));

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    expect(fetchDndCharacterDetail).toHaveBeenCalledWith(
      "test-token",
      10,
      expect.any(AbortSignal),
    );
    expect(result.current.detail?.nombre).toBe("Aragorn");
  });

  it("does not fetch when there is no jwtToken", async () => {
    localStorage.removeItem("jwtToken");
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");

    const position = makePosition();
    const { result } = renderHook(() => useCharacterDetail(position));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchDndCharacterDetail).not.toHaveBeenCalled();
    expect(result.current.detail).toBeNull();
    expect(result.current.isLoadingDetail).toBe(false);
  });

  it("resets state when selectedPosition changes to null", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    const position = makePosition();
    const { result, rerender } = renderHook(
      ({ pos }: { pos: CampaignPositionResponse | null }) =>
        useCharacterDetail(pos),
      { initialProps: { pos: position as CampaignPositionResponse | null } },
    );

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    rerender({ pos: null });
    expect(result.current.detail).toBeNull();
  });

  it("setPortraitFailed updates portraitFailed state", () => {
    const { result } = renderHook(() => useCharacterDetail(null));
    expect(result.current.portraitFailed).toBe(false);
    act(() => {
      result.current.setPortraitFailed(true);
    });
    expect(result.current.portraitFailed).toBe(true);
  });

  it("setResourceTab updates resourceTab state", () => {
    const { result } = renderHook(() => useCharacterDetail(null));
    act(() => {
      result.current.setResourceTab("money");
    });
    expect(result.current.resourceTab).toBe("money");
  });

  it("sets resourceMoney from getCharacterMoney after successful fetch", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    const position = makePosition();
    const { result } = renderHook(() => useCharacterDetail(position));

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    expect(result.current.resourceMoney).toEqual({
      ppt: 0,
      po: 5,
      pp: 0,
      pc: 0,
    });
  });

  it("re-fetches on CHARACTER_REMOTE_UPDATED_EVENT for same character", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    const position = makePosition(10);
    const { result } = renderHook(() => useCharacterDetail(position));

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    const callsBefore = vi.mocked(fetchDndCharacterDetail).mock.calls.length;

    act(() => {
      window.dispatchEvent(
        new CustomEvent(CHARACTER_REMOTE_UPDATED_EVENT, {
          detail: { characterId: 10 },
        }),
      );
    });

    await waitFor(() => {
      expect(
        vi.mocked(fetchDndCharacterDetail).mock.calls.length,
      ).toBeGreaterThan(callsBefore);
    });
  });

  it("ignores CHARACTER_REMOTE_UPDATED_EVENT for a different character", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    const position = makePosition(10);
    const { result } = renderHook(() => useCharacterDetail(position));

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    const callsBefore = vi.mocked(fetchDndCharacterDetail).mock.calls.length;

    act(() => {
      window.dispatchEvent(
        new CustomEvent(CHARACTER_REMOTE_UPDATED_EVENT, {
          detail: { characterId: 99 },
        }),
      );
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(vi.mocked(fetchDndCharacterDetail).mock.calls.length).toBe(
      callsBefore,
    );
  });

  it("sets detail to null when fetch throws an error", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockRejectedValue(new Error("network"));

    const position = makePosition();
    const { result } = renderHook(() => useCharacterDetail(position));

    await waitFor(() => {
      expect(result.current.isLoadingDetail).toBe(false);
    });

    expect(result.current.detail).toBeNull();
  });
});
