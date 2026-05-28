// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../../screens/personaje/utils/dndApi";
import ActionsTab from "../../../screens/personaje/dndcharactersheet/components/detailTabs/ActionsTab";
import InventoryTab from "../../../screens/personaje/dndcharactersheet/components/detailTabs/InventoryTab";
import PassivesTab from "../../../screens/personaje/dndcharactersheet/components/detailTabs/PassivesTab";

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
  },
  habilidades: [],
  mochila: [],
  usado: "{}",
};

// ---------------------------------------------------------------------------
// ActionsTab
// ---------------------------------------------------------------------------
describe("ActionsTab", () => {
  it("shows empty state message when there are no action abilities", () => {
    render(
      <ActionsTab
        character={baseCharacter}
        actionAbilities={[]}
        onRollWeaponAttack={vi.fn()}
        onRollActionDamage={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        /Este personaje no tiene acciones persistidas para mostrar/,
      ),
    ).toBeInTheDocument();
  });

  it("renders action rows when abilities are provided", () => {
    const action: CharacterAbilityResponse = {
      id: 1,
      nombre: "Espada larga",
      bonificacion: 5,
      formula: "1d8",
      descripcion: null,
      tags: "weapon,slashing",
    };
    render(
      <ActionsTab
        character={baseCharacter}
        actionAbilities={[action]}
        onRollWeaponAttack={vi.fn()}
        onRollActionDamage={vi.fn()}
      />,
    );

    expect(screen.getByText("Espada larga")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("shows '--' in the disabled bonus button when action bonificacion is null", () => {
    const action: CharacterAbilityResponse = {
      id: 3,
      nombre: "Mordisco",
      bonificacion: null,
      formula: "1d4",
      descripcion: null,
      tags: "weapon,piercing",
    };
    render(
      <ActionsTab
        character={baseCharacter}
        actionAbilities={[action]}
        onRollWeaponAttack={vi.fn()}
        onRollActionDamage={vi.fn()}
      />,
    );
    // "--" appears in both the bonus button and possibly the damage span
    const dashElements = screen.getAllByText("--");
    expect(dashElements.length).toBeGreaterThan(0);
    // The bonus button is disabled when bonificacion is null
    const disabledBtn = dashElements.find(
      (el) => el.tagName === "BUTTON" && (el as HTMLButtonElement).disabled,
    );
    expect(disabledBtn).toBeTruthy();
  });

  it("calls onRollWeaponAttack when bonus button is clicked", () => {
    const onRollWeaponAttack = vi.fn();
    const action: CharacterAbilityResponse = {
      id: 1,
      nombre: "Espada larga",
      bonificacion: 5,
      formula: "1d8",
      descripcion: null,
      tags: "weapon,slashing",
    };
    render(
      <ActionsTab
        character={baseCharacter}
        actionAbilities={[action]}
        onRollWeaponAttack={onRollWeaponAttack}
        onRollActionDamage={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("+5"));
    expect(onRollWeaponAttack).toHaveBeenCalledWith("Espada larga", 5);
  });
});

// ---------------------------------------------------------------------------
// PassivesTab
// ---------------------------------------------------------------------------
describe("PassivesTab", () => {
  it("renders Pasivas heading", () => {
    render(
      <PassivesTab
        passiveAbilities={[]}
        abilityUsage={{}}
        onToggleAbilityUsage={vi.fn()}
        onOpenPassiveDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("Pasivas")).toBeInTheDocument();
  });

  it("renders passive abilities when provided", () => {
    const ability: CharacterAbilityResponse = {
      id: 2,
      nombre: "Segundo aliento",
      bonificacion: null,
      formula: null,
      descripcion: "Recuperas PV",
      tags: "passive",
    };
    render(
      <PassivesTab
        passiveAbilities={[ability]}
        abilityUsage={{}}
        onToggleAbilityUsage={vi.fn()}
        onOpenPassiveDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("Segundo aliento")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InventoryTab
// ---------------------------------------------------------------------------
describe("InventoryTab", () => {
  it("renders inventory section headings and add button", () => {
    render(
      <InventoryTab
        equipmentItems={[]}
        additionalItems={[]}
        onToggleInventoryEquip={vi.fn()}
        onOpenInventoryDetails={vi.fn()}
        onOpenAddInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Equipamiento")).toBeInTheDocument();
    expect(screen.getByText("Objetos adicionales")).toBeInTheDocument();
    expect(screen.getByText("+ Añadir nuevo objeto")).toBeInTheDocument();
  });

  it("calls onOpenAddInventory when + Añadir nuevo objeto is clicked", () => {
    const onOpenAddInventory = vi.fn();
    render(
      <InventoryTab
        equipmentItems={[]}
        additionalItems={[]}
        onToggleInventoryEquip={vi.fn()}
        onOpenInventoryDetails={vi.fn()}
        onOpenAddInventory={onOpenAddInventory}
      />,
    );

    fireEvent.click(screen.getByText("+ Añadir nuevo objeto"));
    expect(onOpenAddInventory).toHaveBeenCalledTimes(1);
  });

  it("renders equipment item names when provided", () => {
    const item = {
      id: 10,
      nombre: "Escudo",
      cantidad: 1,
      equipado: true,
      tags: "armor",
      tipoObjeto: "armor",
      formula: null,
      descripcion: null,
    };
    render(
      <InventoryTab
        equipmentItems={[item]}
        additionalItems={[]}
        onToggleInventoryEquip={vi.fn()}
        onOpenInventoryDetails={vi.fn()}
        onOpenAddInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Escudo")).toBeInTheDocument();
  });
});
