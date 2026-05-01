// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const tabMocks = vi.hoisted(() => ({
  ActionsTab: vi.fn(() => <div data-testid="actions-tab" />),
  SpellsTab: vi.fn(() => <div data-testid="spells-tab" />),
  PassivesTab: vi.fn(() => <div data-testid="passives-tab" />),
  InventoryTab: vi.fn(() => <div data-testid="inventory-tab" />),
  BiographyTab: vi.fn(() => <div data-testid="biography-tab" />),
}));

vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/detailTabs/ActionsTab",
  () => ({ default: tabMocks.ActionsTab }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/detailTabs/SpellsTab",
  () => ({ default: tabMocks.SpellsTab }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/detailTabs/PassivesTab",
  () => ({ default: tabMocks.PassivesTab }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/detailTabs/InventoryTab",
  () => ({ default: tabMocks.InventoryTab }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/detailTabs/BiographyTab",
  () => ({ default: tabMocks.BiographyTab }),
);

vi.mock("../../../screens/personaje/dndcharactersheet/utils", () => ({
  getAbilityModifierByName: () => 3,
  getCharacterLanguages: () => ["Comun", "Silvano"],
  getProficiencyBonus: () => 2,
  getSpellLevel: (item: { nivel?: number | null }) =>
    typeof item.nivel === "number" ? item.nivel : null,
  isActionAbility: (item: { tipo?: string }) => item.tipo === "action",
  isPassiveAbility: (item: { tipo?: string }) => item.tipo === "passive",
  isSpellAbility: (item: { tipo?: string }) => item.tipo === "spell",
  isWeaponArmorCompetencyName: (value: string) =>
    /arma|armadura|escudo/i.test(value),
  parseBiographySections: () => ({
    alignment: "Neutral",
    personalHistory: "Veterano",
  }),
}));

import DetailTabsSection from "../../../screens/personaje/dndcharactersheet/components/DetailTabsSection";

const character = {
  caracteristicaLanzamientoConjuros: "Inteligencia",
  biografia: "alignment:Neutral",
  habilidades: [
    { id: 1, nombre: "Golpe", tipo: "action", bonificacion: 5, nivel: null },
    { id: 2, nombre: "Misil mágico", tipo: "spell", nivel: 1 },
    { id: 3, nombre: "Luz", tipo: "spell", nivel: 0 },
    { id: 4, nombre: "Sentidos agudos", tipo: "passive", nivel: null },
  ],
  mochila: [
    { id: 7, nombre: "Espada larga", tipoObjeto: "ARMA", equipada: true },
    { id: 8, nombre: "Mochila", tipoObjeto: "OTRO", equipada: false },
  ],
} as never;

const baseProps = {
  character,
  activeTab: "actions" as const,
  abilityUsage: { 4: true },
  isEditMode: true,
  editableAlignment: "Neutral",
  editableLanguagesText: "Comun, Silvano",
  editablePersonalHistory: "Veterano",
  editableWeaponArmorCompetencies: ["Armas simples"],
  editableToolCompetencies: ["Laúd"],
  onTabChange: vi.fn(),
  onRollWeaponAttack: vi.fn(),
  onRollSpellAttack: vi.fn(),
  onRollActionDamage: vi.fn(),
  onOpenSpellDetails: vi.fn(),
  onRollSpellExpression: vi.fn(),
  onToggleAbilityUsage: vi.fn(),
  onToggleInventoryEquip: vi.fn(),
  onOpenPassiveDetails: vi.fn(),
  onOpenInventoryDetails: vi.fn(),
  onOpenAddInventory: vi.fn(),
  onOpenAddSpell: vi.fn(),
  onAlignmentChange: vi.fn(),
  onLanguagesTextChange: vi.fn(),
  onPersonalHistoryChange: vi.fn(),
  onRemoveWeaponArmorCompetency: vi.fn(),
  onRemoveToolCompetency: vi.fn(),
  onAddWeaponArmorCompetency: vi.fn(),
  onAddToolCompetency: vi.fn(),
  classCompetencies: ["Armas simples", "Laúd", "Escudos", "Juego de dados"],
  competencyCatalog: {
    habilidades: ["Arcanos", "Sigilo"],
    armasArmaduras: ["Armas marciales", "Escudos", "Armas simples"],
    herramientas: ["Juego de dados", "Laúd", "Flauta"],
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DetailTabsSection", () => {
  it("changes tabs and renders actions tab with derived actions", () => {
    render(<DetailTabsSection {...baseProps} />);

    expect(screen.getByTestId("actions-tab")).toBeInTheDocument();
    expect(tabMocks.ActionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        actionAbilities: [expect.objectContaining({ nombre: "Golpe" })],
      }),
      undefined,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hechizos" }));
    expect(baseProps.onTabChange).toHaveBeenCalledWith("spells");
  });

  it("passes spellcasting and grouped spells to spells tab", () => {
    render(<DetailTabsSection {...baseProps} activeTab="spells" />);

    expect(screen.getByTestId("spells-tab")).toBeInTheDocument();
    expect(tabMocks.SpellsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        spellcastingModifier: 3,
        spellAttackBonus: 5,
        spellSaveDc: 13,
        cantrips: [expect.objectContaining({ nombre: "Luz" })],
        spellsByLevel: [expect.objectContaining({ level: 1 })],
      }),
      undefined,
    );
  });

  it("builds biography props with filtered catalogs", () => {
    render(<DetailTabsSection {...baseProps} activeTab="biography" />);

    expect(screen.getByTestId("biography-tab")).toBeInTheDocument();
    expect(tabMocks.BiographyTab).toHaveBeenCalledWith(
      expect.objectContaining({
        languages: ["Comun", "Silvano"],
        biographySections: {
          alignment: "Neutral",
          personalHistory: "Veterano",
        },
        filteredWeaponArmorCatalog: ["Armas marciales", "Escudos"],
        filteredToolCatalog: [
          { name: "Flauta", category: "instrumentos" },
          { name: "Juego de dados", category: "juegos" },
        ],
      }),
      undefined,
    );
  });

  it("routes passive and inventory tabs to their child components", () => {
    const { rerender } = render(
      <DetailTabsSection {...baseProps} activeTab="passives" />,
    );

    expect(screen.getByTestId("passives-tab")).toBeInTheDocument();
    expect(tabMocks.PassivesTab).toHaveBeenCalledWith(
      expect.objectContaining({
        passiveAbilities: [
          expect.objectContaining({ nombre: "Sentidos agudos" }),
        ],
      }),
      undefined,
    );

    rerender(<DetailTabsSection {...baseProps} activeTab="inventory" />);

    expect(screen.getByTestId("inventory-tab")).toBeInTheDocument();
    expect(tabMocks.InventoryTab).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentItems: [expect.objectContaining({ nombre: "Espada larga" })],
        additionalItems: [expect.objectContaining({ nombre: "Mochila" })],
      }),
      undefined,
    );
  });
});
