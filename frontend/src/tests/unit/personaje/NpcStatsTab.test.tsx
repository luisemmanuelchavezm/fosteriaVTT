// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import NpcStatsTab from "../../../screens/personaje/dndcharactersheet/components/npc/NpcStatsTab";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

const BASE_CHARACTER: DndCharacterDetailResponse = {
  id: 1,
  nombre: "Ogro",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "DND5",
  raza: null,
  subraza: null,
  clases: [],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    Fuerza: 19,
    Destreza: 8,
    Constitucion: 16,
    Inteligencia: 5,
    Sabiduria: 7,
    Carisma: 7,
    CA: 11,
    Movimiento: 10,
    Iniciativa: -1,
    "Puntos de vida": 59,
  },
  habilidades: [],
  mochila: [],
  usado: "",
  tipo: "NPC",
};

const NOOP = vi.fn();

const BASE_PROPS = {
  character: BASE_CHARACTER,
  isEditMode: false,
  editStats: {} as Record<string, number>,
  onEditStatsChange: NOOP,
  isOwner: false,
  currentHp: 59,
  totalHp: 59,
  tempHp: 0,
  hpDelta: "5",
  tempHpDelta: "0",
  onHpDeltaChange: NOOP,
  onTempHpDeltaChange: NOOP,
  onHeal: NOOP,
  onDamage: NOOP,
  onGainTempHp: NOOP,
  onLoseTempHp: NOOP,
  onIncrementHpDelta: NOOP,
  onDecrementHpDelta: NOOP,
  onIncrementTempHpDelta: NOOP,
  onDecrementTempHpDelta: NOOP,
  sanitizeNonNegativeNumber: (v: string) => v.replace(/\D+/g, ""),
};

describe("NpcStatsTab", () => {
  // ── Ability stats ─────────────────────────────────────────────────────────

  it("renders the six ability stat labels", () => {
    render(<NpcStatsTab {...BASE_PROPS} />);
    // ABILITY_STATS uses full Spanish names as displayName
    expect(screen.getByText("Fuerza")).toBeInTheDocument();
    expect(screen.getByText("Destreza")).toBeInTheDocument();
    expect(screen.getByText("Constitución")).toBeInTheDocument();
    expect(screen.getByText("Inteligencia")).toBeInTheDocument();
    expect(screen.getByText("Sabiduría")).toBeInTheDocument();
    expect(screen.getByText("Carisma")).toBeInTheDocument();
  });

  it("displays ability modifiers from character stats", () => {
    render(<NpcStatsTab {...BASE_PROPS} />);
    // Fuerza 19 → mod +4
    expect(screen.getByText("+4")).toBeInTheDocument();
  });

  // ── Secondary stats (CA / Movimiento / Iniciativa) ────────────────────────

  it("renders secondary stat labels", () => {
    render(<NpcStatsTab {...BASE_PROPS} />);
    expect(screen.getByText("Armadura")).toBeInTheDocument();
    expect(screen.getByText("Movimiento")).toBeInTheDocument();
    expect(screen.getByText("Iniciativa")).toBeInTheDocument();
  });

  it("formats Iniciativa with positive sign for positive value", () => {
    const character = {
      ...BASE_CHARACTER,
      estadisticas: { ...BASE_CHARACTER.estadisticas, Iniciativa: 3 },
    };
    render(<NpcStatsTab {...BASE_PROPS} character={character} />);
    // "+3" should appear at least once (Iniciativa formatted as fmtBonus)
    const matches = screen.getAllByText("+3");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("formats Movimiento with unit", () => {
    render(<NpcStatsTab {...BASE_PROPS} />);
    expect(screen.getByText("10 m")).toBeInTheDocument();
  });

  // ── HP display ────────────────────────────────────────────────────────────

  it("shows current and total HP", () => {
    render(<NpcStatsTab {...BASE_PROPS} currentHp={40} totalHp={59} />);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("59")).toBeInTheDocument();
    expect(screen.getByText("Puntos de vida")).toBeInTheDocument();
  });

  it("shows temp HP when tempHp > 0", () => {
    render(<NpcStatsTab {...BASE_PROPS} tempHp={10} />);
    expect(screen.getByText("+10 temp")).toBeInTheDocument();
  });

  it("does not show temp HP when tempHp is 0", () => {
    render(<NpcStatsTab {...BASE_PROPS} tempHp={0} />);
    expect(screen.queryByText(/temp/)).not.toBeInTheDocument();
  });

  // ── Owner controls ────────────────────────────────────────────────────────

  it("does not show HP controls when isOwner is false", () => {
    render(<NpcStatsTab {...BASE_PROPS} isOwner={false} />);
    expect(screen.queryByText("Curar")).not.toBeInTheDocument();
    expect(screen.queryByText("Daño")).not.toBeInTheDocument();
  });

  it("shows HP controls when isOwner is true", () => {
    render(<NpcStatsTab {...BASE_PROPS} isOwner />);
    expect(screen.getByText("Curar")).toBeInTheDocument();
    expect(screen.getByText("Daño")).toBeInTheDocument();
    expect(screen.getByText("Temp +")).toBeInTheDocument();
    expect(screen.getByText("Temp -")).toBeInTheDocument();
  });

  it("calls onHeal when Curar button is clicked", () => {
    const onHeal = vi.fn();
    render(<NpcStatsTab {...BASE_PROPS} isOwner onHeal={onHeal} />);
    fireEvent.click(screen.getByText("Curar"));
    expect(onHeal).toHaveBeenCalled();
  });

  it("calls onDamage when Daño button is clicked", () => {
    const onDamage = vi.fn();
    render(<NpcStatsTab {...BASE_PROPS} isOwner onDamage={onDamage} />);
    fireEvent.click(screen.getByText("Daño"));
    expect(onDamage).toHaveBeenCalled();
  });

  it("calls onGainTempHp when Temp + button is clicked", () => {
    const onGainTempHp = vi.fn();
    render(<NpcStatsTab {...BASE_PROPS} isOwner onGainTempHp={onGainTempHp} />);
    fireEvent.click(screen.getByText("Temp +"));
    expect(onGainTempHp).toHaveBeenCalled();
  });

  it("calls onLoseTempHp when Temp - button is clicked", () => {
    const onLoseTempHp = vi.fn();
    render(<NpcStatsTab {...BASE_PROPS} isOwner onLoseTempHp={onLoseTempHp} />);
    fireEvent.click(screen.getByText("Temp -"));
    expect(onLoseTempHp).toHaveBeenCalled();
  });

  it("calls onIncrementHpDelta when + button is clicked in HP delta row", () => {
    const onIncrementHpDelta = vi.fn();
    render(
      <NpcStatsTab
        {...BASE_PROPS}
        isOwner
        onIncrementHpDelta={onIncrementHpDelta}
      />,
    );
    // The + button in the HP delta row (first of two +'s)
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[0]);
    expect(onIncrementHpDelta).toHaveBeenCalled();
  });

  it("calls onHpDeltaChange when HP delta input changes", () => {
    const onHpDeltaChange = vi.fn();
    render(
      <NpcStatsTab {...BASE_PROPS} isOwner onHpDeltaChange={onHpDeltaChange} />,
    );
    const deltaInput = screen.getByLabelText("Cantidad de curación o daño");
    fireEvent.change(deltaInput, { target: { value: "10" } });
    expect(onHpDeltaChange).toHaveBeenCalled();
  });

  it("calls onTempHpDeltaChange when temp HP delta input changes", () => {
    const onTempHpDeltaChange = vi.fn();
    render(
      <NpcStatsTab
        {...BASE_PROPS}
        isOwner
        onTempHpDeltaChange={onTempHpDeltaChange}
      />,
    );
    const tempDeltaInput = screen.getByLabelText("Cantidad de vida temporal");
    fireEvent.change(tempDeltaInput, { target: { value: "5" } });
    expect(onTempHpDeltaChange).toHaveBeenCalled();
  });

  // ── Skill bonuses ─────────────────────────────────────────────────────────

  it("shows skill bonuses when non-zero stats exist", () => {
    const character = {
      ...BASE_CHARACTER,
      estadisticas: {
        ...BASE_CHARACTER.estadisticas,
        Acrobacias: 4,
      },
    };
    render(<NpcStatsTab {...BASE_PROPS} character={character} />);
    expect(screen.getByText("Habilidades:")).toBeInTheDocument();
    expect(screen.getByText(/Acrobacias \+4/)).toBeInTheDocument();
  });

  it("does not show skill bonuses section when all skill stats are 0 or absent", () => {
    render(<NpcStatsTab {...BASE_PROPS} />);
    expect(screen.queryByText("Habilidades:")).not.toBeInTheDocument();
  });

  // ── Saving throw bonuses ──────────────────────────────────────────────────

  it("shows saving throw bonuses when non-zero", () => {
    const character = {
      ...BASE_CHARACTER,
      estadisticas: {
        ...BASE_CHARACTER.estadisticas,
        "Salvacion de Fuerza": 6,
      },
    };
    render(<NpcStatsTab {...BASE_PROPS} character={character} />);
    expect(screen.getByText("Salvaciones:")).toBeInTheDocument();
    expect(screen.getByText(/Fuerza \+6/)).toBeInTheDocument();
  });

  // ── Edit mode ─────────────────────────────────────────────────────────────

  it("shows HP max edit input in edit mode", () => {
    render(
      <NpcStatsTab
        {...BASE_PROPS}
        isEditMode
        editStats={{ "Puntos de vida": 80 }}
        totalHp={59}
      />,
    );
    expect(screen.getByText("Puntos de vida máx.")).toBeInTheDocument();
  });

  it("renders ability number inputs in edit mode", () => {
    render(
      <NpcStatsTab {...BASE_PROPS} isEditMode editStats={{ Fuerza: 18 }} />,
    );
    // Should show number inputs for each ability stat
    const numberInputs = screen.getAllByRole("spinbutton");
    expect(numberInputs.length).toBeGreaterThan(0);
  });
});
