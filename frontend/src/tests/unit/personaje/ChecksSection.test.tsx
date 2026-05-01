// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";
import ChecksSection from "../../../screens/personaje/dndcharactersheet/components/ChecksSection";

afterEach(() => {
  cleanup();
});

const baseCharacter: DndCharacterDetailResponse = {
  id: 1,
  nombre: "Thorin",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "DnD",
  raza: "Enano",
  subraza: null,
  clases: [{ nombre: "Guerrero", nivel: 3 }],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    Fuerza: 16,
    Destreza: 12,
    Constitucion: 14,
    Inteligencia: 10,
    Sabiduria: 10,
    Carisma: 8,
    "Salvación de Fuerza": 5,
    "Salvacion de Fuerza": 5,
    Acrobacias: 3,
    Atletismo: 5,
  },
  habilidades: [],
  mochila: [],
  usado: "{}",
};

describe("ChecksSection", () => {
  it("renders saving throws section and skill section headings", () => {
    render(
      <ChecksSection
        character={baseCharacter}
        onRollSavingThrow={vi.fn()}
        onRollSkill={vi.fn()}
      />,
    );

    expect(screen.getByText("Tiradas de salvación")).toBeInTheDocument();
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
  });

  it("renders all 6 saving throw rows", () => {
    render(
      <ChecksSection
        character={baseCharacter}
        onRollSavingThrow={vi.fn()}
        onRollSkill={vi.fn()}
      />,
    );

    // Each row shows the stat name + abbreviation
    expect(screen.getByText(/Fuerza \(FUE\)/)).toBeInTheDocument();
    expect(screen.getByText(/Destreza \(DES\)/)).toBeInTheDocument();
    expect(screen.getByText(/Carisma \(CAR\)/)).toBeInTheDocument();
  });

  it("calls onRollSavingThrow when a saving throw row is clicked", () => {
    const onRollSavingThrow = vi.fn();
    render(
      <ChecksSection
        character={baseCharacter}
        onRollSavingThrow={onRollSavingThrow}
        onRollSkill={vi.fn()}
      />,
    );

    // Click the Fuerza saving throw button
    const fuerzaButton = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes("Fuerza (FUE)"));
    expect(fuerzaButton).toBeDefined();
    fireEvent.click(fuerzaButton!);
    expect(onRollSavingThrow).toHaveBeenCalledTimes(1);
  });

  it("calls onRollSkill when a skill row is clicked", () => {
    const onRollSkill = vi.fn();
    render(
      <ChecksSection
        character={baseCharacter}
        onRollSavingThrow={vi.fn()}
        onRollSkill={onRollSkill}
      />,
    );

    const atletismoButton = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes("Atletismo"));
    expect(atletismoButton).toBeDefined();
    fireEvent.click(atletismoButton!);
    expect(onRollSkill).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleSavingThrowProficiency in edit mode when saving throw clicked", () => {
    const onToggle = vi.fn();
    render(
      <ChecksSection
        character={baseCharacter}
        isEditMode
        editableSavingThrowProficiencies={[]}
        onRollSavingThrow={vi.fn()}
        onRollSkill={vi.fn()}
        onToggleSavingThrowProficiency={onToggle}
      />,
    );

    const fuerzaButton = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes("Fuerza (FUE)"));
    fireEvent.click(fuerzaButton!);
    expect(onToggle).toHaveBeenCalledWith("Fuerza");
  });

  it("calls onToggleSkillProficiency in edit mode when skill clicked", () => {
    const onToggle = vi.fn();
    render(
      <ChecksSection
        character={baseCharacter}
        isEditMode
        editableSkillProficiencies={[]}
        onRollSavingThrow={vi.fn()}
        onRollSkill={vi.fn()}
        onToggleSkillProficiency={onToggle}
      />,
    );

    const atletismoButton = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes("Atletismo"));
    fireEvent.click(atletismoButton!);
    expect(onToggle).toHaveBeenCalledWith("Atletismo");
  });
});
