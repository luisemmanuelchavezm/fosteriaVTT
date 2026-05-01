// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CharacterAbilityResponse } from "../../../screens/personaje/utils/dndApi";
import SpellsTab from "../../../screens/personaje/dndcharactersheet/components/detailTabs/SpellsTab";

afterEach(() => {
  cleanup();
});

const spellAbility: CharacterAbilityResponse = {
  id: 10,
  nombre: "Bola de fuego",
  bonificacion: null,
  formula: "8d6 fuego",
  descripcion: "Lanza una bola de fuego",
  tags: "spell",
};

const defaultProps = {
  spellcastingModifier: 3,
  spellAttackBonus: 5,
  spellSaveDc: 13,
  cantrips: [] as CharacterAbilityResponse[],
  spellsByLevel: [] as Array<{
    level: number;
    spells: CharacterAbilityResponse[];
  }>,
  abilityUsage: {},
  characteristicName: "Inteligencia",
  onOpenAddSpell: vi.fn(),
  onRollSpellAttack: vi.fn(),
  onOpenSpellDetails: vi.fn(),
  onRollSpellExpression: vi.fn(),
  onToggleAbilityUsage: vi.fn(),
};

describe("SpellsTab", () => {
  it("renders spell statistics cards", () => {
    render(<SpellsTab {...defaultProps} />);

    expect(screen.getByText("Modificador")).toBeInTheDocument();
    expect(screen.getByText("Ataque de hechizos")).toBeInTheDocument();
    expect(screen.getByText("Salvacion de hechizos")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
  });

  it("renders null stats as dashes", () => {
    render(
      <SpellsTab
        {...defaultProps}
        spellcastingModifier={null}
        spellAttackBonus={null}
        spellSaveDc={null}
      />,
    );

    expect(screen.getAllByText("--").length).toBeGreaterThanOrEqual(2);
  });

  it("renders Añadir hechizos button and calls onOpenAddSpell on click", () => {
    const onOpenAddSpell = vi.fn();
    render(<SpellsTab {...defaultProps} onOpenAddSpell={onOpenAddSpell} />);

    fireEvent.click(screen.getByText("Añadir hechizos"));
    expect(onOpenAddSpell).toHaveBeenCalledTimes(1);
  });

  it("renders cantrip name when cantrips are provided", () => {
    const cantrip: CharacterAbilityResponse = {
      id: 1,
      nombre: "Rayo de escarcha",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "cantrip",
    };
    render(<SpellsTab {...defaultProps} cantrips={[cantrip]} />);

    expect(screen.getByText("Rayo de escarcha")).toBeInTheDocument();
  });

  it("renders spells by level group title", () => {
    render(
      <SpellsTab
        {...defaultProps}
        spellsByLevel={[{ level: 1, spells: [spellAbility] }]}
      />,
    );

    expect(screen.getByText("Nivel 1")).toBeInTheDocument();
    expect(screen.getByText("Bola de fuego")).toBeInTheDocument();
  });

  it("calls onRollSpellAttack when attack bonus button is clicked", () => {
    const onRollSpellAttack = vi.fn();
    render(
      <SpellsTab {...defaultProps} onRollSpellAttack={onRollSpellAttack} />,
    );

    fireEvent.click(screen.getByText("+5"));
    expect(onRollSpellAttack).toHaveBeenCalledWith(5);
  });

  it("calls onOpenSpellDetails when a spell name is clicked", () => {
    const onOpenSpellDetails = vi.fn();
    render(
      <SpellsTab
        {...defaultProps}
        cantrips={[spellAbility]}
        onOpenSpellDetails={onOpenSpellDetails}
      />,
    );

    fireEvent.click(screen.getByText("Bola de fuego"));
    expect(onOpenSpellDetails).toHaveBeenCalledWith(spellAbility);
  });
});
