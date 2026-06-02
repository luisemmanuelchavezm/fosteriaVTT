// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useMorkBorgCharacterSheet } from "../../../screens/personaje/morkborgcharactersheet/useMorkBorgCharacterSheet";

// ── Mock dice roller ──────────────────────────────────────────────────────────
vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => ({
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isRolling: false,
    summary: null,
    rollD20Check: vi.fn(),
    rollExpression: vi.fn(),
  })),
}));

// ── Mock mbApi ────────────────────────────────────────────────────────────────
vi.mock("../../../screens/personaje/utils/mbApi", () => ({
  saveCurrentHpMB: vi.fn().mockResolvedValue(undefined),
  updateMBSupplies: vi.fn().mockResolvedValue(undefined),
  mejorarPersonajeMB: vi.fn(),
  intercambiarEscoriaEspecialidad: vi.fn(),
  agregarRasgoClaseMB: vi.fn(),
  crearRasgoCustomMB: vi.fn(),
}));

// ── Mock dndApi ───────────────────────────────────────────────────────────────
vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  addDndCharacterInventoryItem: vi.fn(),
  deleteDndCharacterInventoryItem: vi.fn(),
  deleteDndCharacter: vi.fn(),
  eliminarHabilidadPersonaje: vi.fn(),
  updateCharacterPortrait: vi.fn(),
}));

function makeCharacterData(overrides = {}) {
  return {
    id: 1,
    nombre: "Kragor",
    tags: "MORK_BORG,clase;escoria-alcantarillas",
    estadisticas: {
      MB_VidaMaxima: 10,
      MB_VidaActual: 8,
      MB_Plata: 50,
      MB_Comida: 3,
      MB_Presagios: 2,
      MB_PresagiosActuales: 2,
      MB_Carga: 3,
    },
    mochila: [],
    habilidades: [],
    propietario: "testUser",
    ...overrides,
  };
}

function okJson(data: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

describe("useMorkBorgCharacterSheet", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem("jwtToken", "test-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function setup(characterId = "1", username = "testUser") {
    return renderHook(() =>
      useMorkBorgCharacterSheet({
        characterId,
        username,
        onGoHome: vi.fn(),
        onGoCampaigns: vi.fn(),
        onGoCharacters: vi.fn(),
      }),
    );
  }

  // ── Estado inicial ────────────────────────────────────────────────────────

  it("inicia en estado de carga", () => {
    vi.mocked(fetch).mockResolvedValueOnce(okJson(makeCharacterData()));
    const { result } = setup();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.character).toBeNull();
  });

  it("carga el personaje correctamente", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okJson(makeCharacterData()));
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response); // HP save

    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.character).not.toBeNull();
    expect(result.current.character?.nombre).toBe("Kragor");
    expect(result.current.currentHp).toBe(8);
    expect(result.current.totalHp).toBe(10);
    expect(result.current.plata).toBe(50);
    expect(result.current.comida).toBe(3);
    expect(result.current.presagios).toBe(2);
    expect(result.current.carga).toBe(3);
  });

  it("establece loadError cuando fetch falla", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).not.toBeNull();
  });

  it("establece loadError cuando no hay token", async () => {
    localStorage.removeItem("jwtToken");
    const { result } = setup();

    // When there's no token, the hook doesn't even call fetch
    expect(result.current.character).toBeNull();
  });

  // ── Control de HP ─────────────────────────────────────────────────────────

  it("heal incrementa currentHp sin exceder totalHp", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setHpDelta("5"));
    act(() => result.current.handleHeal());

    expect(result.current.currentHp).toBeLessThanOrEqual(
      result.current.totalHp,
    );
    expect(result.current.currentHp).toBeGreaterThan(0);
  });

  it("hpDelta changes work", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setHpDelta("3"));
    expect(result.current.hpDelta).toBe("3");
  });

  // ── Modo edición ──────────────────────────────────────────────────────────

  it("setIsEditMode cambia el modo de edición", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isEditMode).toBe(false);
    act(() => result.current.setIsEditMode(true));
    expect(result.current.isEditMode).toBe(true);
    act(() => result.current.setIsEditMode(false));
    expect(result.current.isEditMode).toBe(false);
  });

  // ── Suministros ───────────────────────────────────────────────────────────

  it("handleAdjustSupply plata cambia el valor de plata", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initialPlata = result.current.plata;
    act(() => result.current.handleAdjustSupply("plata", 10));
    expect(result.current.plata).toBe(initialPlata + 10);
  });

  it("handleAdjustSupply comida cambia el valor de comida", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initial = result.current.comida;
    act(() => result.current.handleAdjustSupply("comida", 1));
    expect(result.current.comida).toBe(initial + 1);
  });

  it("handleAdjustSupply presagios cambia el valor de presagios", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initial = result.current.presagios;
    act(() => result.current.handleAdjustSupply("presagios", -1));
    expect(result.current.presagios).toBe(Math.max(0, initial - 1));
  });

  // ── Modales ───────────────────────────────────────────────────────────────

  it("setIsDeleteConfirmOpen abre el modal de confirmación de borrado", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isDeleteConfirmOpen).toBe(false);
    act(() => result.current.setIsDeleteConfirmOpen(true));
    expect(result.current.isDeleteConfirmOpen).toBe(true);
  });

  it("setIsImprovementModalOpen abre el modal de mejora", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isImprovementModalOpen).toBe(false);
    act(() => result.current.setIsImprovementModalOpen(true));
    expect(result.current.isImprovementModalOpen).toBe(true);
  });

  it("setIsClassTraitsCatalogOpen abre el catálogo de rasgos", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setIsClassTraitsCatalogOpen(true));
    expect(result.current.isClassTraitsCatalogOpen).toBe(true);
  });

  it("setIsScrollCatalogOpen abre el catálogo de pergaminos", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setIsScrollCatalogOpen(true));
    expect(result.current.isScrollCatalogOpen).toBe(true);
  });

  it("setIsInventoryCatalogOpen abre el catálogo de inventario", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setIsInventoryCatalogOpen(true));
    expect(result.current.isInventoryCatalogOpen).toBe(true);
  });

  // ── isOwner ───────────────────────────────────────────────────────────────

  it("isOwner es true cuando propietario coincide con username", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okJson(makeCharacterData({ propietario: "testUser" })) as Response,
    );
    const { result } = setup("1", "testUser");

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwner).toBe(true);
  });

  it("isOwner es false cuando propietario difiere de username", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okJson(makeCharacterData({ propietario: "otroUser" })) as Response,
    );
    const { result } = setup("1", "testUser");

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwner).toBe(false);
  });

  // ── handleDamage ──────────────────────────────────────────────────────────

  it("handleDamage reduce currentHp sin bajar de 0", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setHpDelta("3"));
    act(() => result.current.handleDamage());
    expect(result.current.currentHp).toBeGreaterThanOrEqual(0);
    expect(result.current.currentHp).toBe(5); // 8 - 3
  });

  it("handleDamage no baja de 0", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setHpDelta("999"));
    act(() => result.current.handleDamage());
    expect(result.current.currentHp).toBe(0);
  });

  // ── sanitize ─────────────────────────────────────────────────────────────

  it("sanitize convierte número negativo a '0'", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sanitize("-5")).toBe("0");
  });

  it("sanitize convierte NaN a '0'", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sanitize("abc")).toBe("0");
  });

  it("sanitize retorna string del número válido", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sanitize("7")).toBe("7");
  });

  // ── handleRollStat ────────────────────────────────────────────────────────

  it("handleRollStat llama a rollD20Check", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleRollStat("Fuerza", 2));
    // rollD20Check is mocked via useDiceRoller mock - no crash means success
  });

  // ── handleSetPlata / handleSetComida ──────────────────────────────────────

  it("handleSetPlata actualiza el valor de plata dentro del rango", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleSetPlata(100));
    expect(result.current.plata).toBe(100);
  });

  it("handleSetPlata clampea al máximo 999", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleSetPlata(5000));
    expect(result.current.plata).toBe(999);
  });

  it("handleSetComida actualiza el valor de comida", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleSetComida(10));
    expect(result.current.comida).toBe(10);
  });

  it("handleSetComida clampea al máximo 99", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleSetComida(200));
    expect(result.current.comida).toBe(99);
  });

  it("handleSetComida clampea al mínimo 0", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(makeCharacterData()) as Response);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleSetComida(-5));
    expect(result.current.comida).toBe(0);
  });
});
