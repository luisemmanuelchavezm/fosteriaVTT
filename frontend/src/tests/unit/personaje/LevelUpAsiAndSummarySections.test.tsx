// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import LevelUpAsiSection from "../../../screens/personaje/dndcharactersheet/components/levelUp/LevelUpAsiSection";
import LevelUpSummaryColumn from "../../../screens/personaje/dndcharactersheet/components/levelUp/LevelUpSummaryColumn";

function buildController() {
  return {
    asiSectionRef: { current: null },
    asiMode: "feat",
    asiPrimary: "Fuerza",
    asiSecondary: "Destreza",
    setAsiMode: vi.fn(),
    setAsiPrimary: vi.fn(),
    setAsiSecondary: vi.fn(),
    featOptions: [
      {
        feat: {
          id: "mage-initiate",
          nombre: "Iniciado en la magia",
          descripcion: "Aprendes magia",
          requisitos: ["Inteligencia 13"],
          selectableBonus: { count: 1, options: ["Fuerza", "Inteligencia"] },
          selectableCompetencies: {
            count: 1,
            options: ["Arco corto", "Bastón"],
          },
          selectableSkills: { count: 1, options: ["Sigilo", "Arcanos"] },
          selectableLanguages: { count: 1, options: ["Élfico", "Enano"] },
          spellSelection: {
            chooseClass: true,
            classOptions: ["mago"],
            cantrips: 1,
            spells: 1,
            spellLevel: 1,
          },
        },
        valid: true,
      },
    ],
    selectedFeat: {
      id: "mage-initiate",
      nombre: "Iniciado en la magia",
      descripcion: "Aprendes magia",
      requisitos: ["Inteligencia 13"],
      selectableBonus: { count: 1, options: ["Fuerza", "Inteligencia"] },
      selectableCompetencies: { count: 1, options: ["Arco corto", "Bastón"] },
      selectableSkills: { count: 1, options: ["Sigilo", "Arcanos"] },
      selectableLanguages: { count: 1, options: ["Élfico", "Enano"] },
      spellSelection: {
        chooseClass: true,
        classOptions: ["mago"],
        cantrips: 1,
        spells: 1,
        spellLevel: 1,
      },
    },
    selectedFeatId: "mage-initiate",
    setSelectedFeatDetail: vi.fn(),
    setSelectedFeatId: vi.fn(),
    setSelectedFeatStats: vi.fn(),
    setSelectedFeatCompetencies: vi.fn(),
    setSelectedFeatSkills: vi.fn(),
    setSelectedFeatLanguages: vi.fn(),
    setSelectedFeatSpellClass: vi.fn(),
    setSelectedFeatCantrips: vi.fn(),
    setSelectedFeatSpells: vi.fn(),
    selectedFeatStats: ["Fuerza"],
    selectedFeatCompetencies: ["Arco corto"],
    selectedFeatSkills: ["Sigilo"],
    selectedFeatLanguages: ["Élfico"],
    selectedFeatSpellClass: "mago",
    selectedFeatCantrips: ["Luz"],
    selectedFeatSpells: ["Dormir"],
    featCantripOptions: [{ id: 1, nombre: "Luz" }],
    featSpellOptions: [{ id: 2, nombre: "Dormir" }],

    isDownMode: false,
    levelFeatures: [
      { id: 1, nombre: "Ataque furtivo", descripcion: "Más daño" },
    ],
    subclassFeatures: [
      { id: 2, nombre: "Truco arcano", descripcion: "Aprendes magia" },
    ],
    totalCharacterLevel: 5,
    selectedClassLevel: 2,
    targetLevelAfterDown: 1,
    selectedClassDetail: { nombre: "Pícaro" },
    classIsNew: false,
    targetLevel: 3,
    effectiveSubclass: { nombre: "Embaucador Arcano" },
    requiresAsi: true,
    submitError: null,
    isSubmitting: false,
    handleSubmit: vi.fn().mockResolvedValue(undefined),
  };
}

describe("LevelUpAsiSection y LevelUpSummaryColumn", () => {
  it("renderiza y permite interacciones de dote y conjuros", () => {
    const controller = buildController();

    render(<LevelUpAsiSection controller={controller} />);

    expect(
      screen.getByText("Mejora de característica o dote"),
    ).toBeInTheDocument();
    expect(screen.getByText("Iniciado en la magia")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Info+" }));
    expect(controller.setSelectedFeatDetail).toHaveBeenCalled();

    const classSelect = screen.getByLabelText(/Clase de la dote/i);
    fireEvent.change(classSelect, {
      target: { value: "mago" },
    });
    expect(controller.setSelectedFeatSpellClass).toHaveBeenCalled();
  });

  it("muestra resumen y dispara acciones de envío/cancelación", () => {
    const controller = buildController();
    const onClose = vi.fn();

    render(<LevelUpSummaryColumn controller={controller} onClose={onClose} />);

    expect(screen.getByText("Rasgos que ganas")).toBeInTheDocument();
    expect(screen.getByText("Ataque furtivo")).toBeInTheDocument();
    expect(screen.getByText("Resumen de aplicación")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar subida de nivel" }),
    );
    expect(controller.handleSubmit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
