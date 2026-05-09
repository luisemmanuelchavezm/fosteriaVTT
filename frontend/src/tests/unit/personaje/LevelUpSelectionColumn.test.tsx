// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { LevelUpModalController } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpModalState";

import LevelUpSelectionColumn from "../../../screens/personaje/dndcharactersheet/components/levelUp/LevelUpSelectionColumn";

function buildController() {
  return {
    classSectionRef: { current: null },
    totalCharacterLevel: 3,
    visibleClassSummaries: [{ id: "picaro", nombre: "Pícaro" }],
    selectedClassId: "picaro",
    selectedClassDetail: {
      id: "picaro",
      nombre: "Pícaro",
      descripcion: "Clase",
      puntosGolpe: { dadoGolpe: "1d8" },
      lanzamientoConjuros: { modo: "conjuros conocidos" },
      elecciones: [],
      subclases: [
        {
          id: "embaucadorarcano",
          nombre: "Embaucador Arcano",
          descripcion: "Subclase",
          nivelDesbloqueo: 3,
        },
      ],
    },
    selectedClassLevel: 2,
    targetLevel: 3,
    isDownMode: false,
    classWarnings: () => true,
    setSelectedClassId: vi.fn(),
    classIsNew: false,
    classChoicesSectionRef: { current: null },
    classChoices: {},
    setClassChoices: vi.fn(),
    expertiseChoiceConfig: null,
    expertiseChoices: [],
    availableExpertiseOptions: [],
    missingChoiceErrors: {},
    openSpellDetailByName: vi.fn(),
    needsSubclass: true,
    subclassSectionRef: { current: null },
    selectedSubclassId: "embaucadorarcano",
    setSelectedSubclassId: vi.fn(),
    requiresAsi: true,
    eaChosenCantrips: ["Rayo de escarcha"],
    eaChosenSpells: ["Dormir"],
    eaCantripOptions: [{ id: 1, nombre: "Rayo de escarcha" }],
    eaSpellOptions: [{ id: 10, nombre: "Dormir" }],
    eaCantripCount: 1,
    eaSpellCount: 1,
    isGainingEa: true,
    isActiveEa: false,
    cantripUpgradeChosen: ["Luz"],
    cantripUpgradeOptions: [{ id: 99, nombre: "Luz" }],
    cantripUpgradeCount: 1,
    setCantripUpgradeChosen: vi.fn(),
    setExpertiseChoices: vi.fn(),
    setEaChosenCantrips: vi.fn(),
    setEaChosenSpells: vi.fn(),
  } as unknown as LevelUpModalController;
}

describe("LevelUpSelectionColumn", () => {
  it("muestra las secciones de trucos y conjuros del embaucador arcano", () => {
    const controller = buildController();

    render(
      <LevelUpSelectionColumn
        controller={controller}
        character={{ clases: [{ nombre: "Pícaro", nivel: 2 }] } as never}
        token="jwt"
        asiSection={<div data-testid="asi-section" />}
      />,
    );

    expect(
      screen.getByText("Trucos del Embaucador Arcano"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Conjuros del Embaucador Arcano"),
    ).toBeInTheDocument();
    expect(screen.getByText("Nuevo truco conocido")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /info\+/i })[0]);
    expect(controller.openSpellDetailByName).toHaveBeenCalled();
    expect(screen.getByTestId("asi-section")).toBeInTheDocument();
  });

  it("en modo down no muestra bloques de elecciones mágicas", () => {
    const controller = buildController();
    controller.isDownMode = true;

    render(
      <LevelUpSelectionColumn
        controller={controller}
        character={{ clases: [{ nombre: "Pícaro", nivel: 2 }] } as never}
        token="jwt"
        asiSection={<div data-testid="asi-section" />}
      />,
    );

    expect(
      screen.queryByText("Trucos del Embaucador Arcano"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Nuevo truco conocido")).not.toBeInTheDocument();
  });

  it("mantiene visibles las elecciones del embaucador y maestro de batalla aunque el catalogo llegue vacio", () => {
    const controller = buildController();
    controller.eaCantripOptions = [];
    controller.eaSpellOptions = [];
    controller.isGainingEa = false;
    controller.isActiveEa = false;
    controller.selectedClassId = "guerrero";
    controller.selectedClassDetail = {
      id: "guerrero",
      nombre: "Guerrero",
      descripcion: "Clase",
      puntosGolpe: { dadoGolpe: "1d10" },
      lanzamientoConjuros: null,
      elecciones: [],
      subclases: [
        {
          id: "maestrobatalla",
          nombre: "Maestro de Batalla",
          descripcion: "Subclase",
          nivelDesbloqueo: 3,
        },
      ],
    } as never;
    controller.selectedSubclassId = "maestrobatalla";
    controller.needsSubclass = true;
    controller.requiresAsi = false;
    controller.cantripUpgradeCount = 0;
    controller.isGainingBattleMaster = true;
    controller.isActiveBattleMaster = false;
    controller.battleMasterManeuverCount = 3;
    controller.battleMasterManeuverOptions = [];
    controller.battleMasterManeuvers = [];
    controller.setBattleMasterManeuvers = vi.fn();

    render(
      <LevelUpSelectionColumn
        controller={controller}
        character={{ clases: [{ nombre: "Guerrero", nivel: 2 }] } as never}
        token="jwt"
        asiSection={<div />}
      />,
    );

    expect(
      screen.getByText("Maniobras del Maestro de Batalla"),
    ).toBeInTheDocument();
  });

  it("muestra la seccion de pericia cuando la clase la obtiene en ese nivel", () => {
    const controller = buildController();
    controller.selectedClassLevel = 5;
    controller.targetLevel = 6;
    controller.needsSubclass = false;
    controller.requiresAsi = false;
    controller.eaCantripCount = 0;
    controller.eaSpellCount = 0;
    controller.cantripUpgradeCount = 0;
    controller.expertiseChoiceConfig = {
      count: 2,
      title: "Pericia",
      description: "Elige dos habilidades con competencia para ganar pericia.",
      allowThievesTools: false,
    };
    controller.availableExpertiseOptions = ["Acrobacias", "Sigilo", "Historia"];
    controller.expertiseChoices = ["Acrobacias", "Sigilo"];
    controller.setExpertiseChoices = vi.fn();

    render(
      <LevelUpSelectionColumn
        controller={controller}
        character={{ clases: [{ nombre: "Pícaro", nivel: 5 }] } as never}
        token="jwt"
        asiSection={<div />}
      />,
    );

    expect(screen.getByText("Elige tus nuevas pericias")).toBeInTheDocument();
    expect(screen.getByLabelText("Pericia 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Pericia 2")).toBeInTheDocument();
  });
});
