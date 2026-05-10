// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

type DetailModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onDelete?: () => void | Promise<void>;
  onSaveQuantity?: (quantity: number) => void | Promise<void>;
};

type CatalogModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ConfirmationModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

type LevelManagementModalProps = {
  isOpen: boolean;
  onOpenLevelDown: () => void;
  onOpenLevelUp: () => void;
  onSaveExperience: (xp: number) => void | Promise<void>;
};

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: ({ summary }: { summary: { title: string } | null }) => (
    <div data-testid="dice-roll-overlay">{summary?.title ?? "sin-resumen"}</div>
  ),
}));
vi.mock("../../../components/spells/SpellDetailModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="spell-detail-modal" /> : null,
}));
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/CharacterDetailModal",
  () => ({
    default: ({
      isOpen,
      title,
      onClose,
      onDelete,
      onSaveQuantity,
    }: DetailModalProps) =>
      isOpen ? (
        <div data-testid={`detail-modal-${title}`}>
          <button onClick={onClose}>cerrar-{title}</button>
          {onDelete ? (
            <button onClick={() => void onDelete()}>eliminar-{title}</button>
          ) : null}
          {onSaveQuantity ? (
            <button onClick={() => void onSaveQuantity(4)}>
              guardar-{title}
            </button>
          ) : null}
        </div>
      ) : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/InventoryCatalogModal",
  () => ({
    default: ({ isOpen, onClose }: CatalogModalProps) =>
      isOpen ? (
        <button onClick={onClose}>cerrar-catalogo-inventario</button>
      ) : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/SpellCatalogModal",
  () => ({
    default: ({ isOpen, onClose }: CatalogModalProps) =>
      isOpen ? (
        <button onClick={onClose}>cerrar-catalogo-hechizos</button>
      ) : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/ConfirmationModal",
  () => ({
    default: ({ isOpen, onCancel, onConfirm }: ConfirmationModalProps) =>
      isOpen ? (
        <div data-testid="confirm-modal">
          <button onClick={onCancel}>cancelar-confirmacion</button>
          <button onClick={onConfirm}>confirmar-borrado</button>
        </div>
      ) : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/LevelManagementModal",
  () => ({
    default: ({
      isOpen,
      onOpenLevelDown,
      onOpenLevelUp,
      onSaveExperience,
    }: LevelManagementModalProps) =>
      isOpen ? (
        <div data-testid="level-management-modal">
          <button onClick={onOpenLevelDown}>abrir-bajada</button>
          <button onClick={onOpenLevelUp}>abrir-subida</button>
          <button onClick={() => void onSaveExperience(700)}>guardar-xp</button>
        </div>
      ) : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/LevelUpModal",
  () => ({
    default: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="level-up-modal" /> : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterCore",
  () => ({
    getExperienceProgress: () => ({ nextLevelXp: 900 }),
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterAbilities",
  () => ({
    resolveCharacterFormula: () => "1d8 + 3",
  }),
);

import CharacterSheetOverlays from "../../../screens/personaje/dndcharactersheet/components/CharacterSheetOverlays";

const baseProps = {
  token: "jwt",
  character: {
    clases: [{ nombre: "Mago", nivel: 1 }],
    estadisticas: { Experiencia: 450 },
  } as never,
  classCompetencies: ["Armas simples"],
  totalCharacterLevel: 2,
  isEditMode: true,
  isInventoryCatalogOpen: true,
  isSpellCatalogOpen: true,
  isDeleteCharacterConfirmOpen: true,
  isLevelManagementOpen: true,
  isLevelUpOpen: true,
  levelModalMode: "up" as const,
  selectedPassive: { id: 2, nombre: "Visión en la oscuridad" } as never,
  selectedInventoryItem: {
    id: 3,
    nombre: "Poción",
    cantidad: 2,
    tipoObjeto: "CONSUMIBLE",
    formula: "1d8+3",
  } as never,
  spellInteractions: {
    selectedSpell: {
      id: 4,
      nombre: "Luz",
      bonificacion: null,
      formula: "1d8",
      descripcion: "Ilumina un objeto.",
      tags: null,
    },
    openSpellDetail: vi.fn(),
    openSpellDetailByName: vi.fn(),
    closeSpellDetail: vi.fn(),
    rollSpellExpression: vi.fn(),
    diceRoller: {
      diceBoxHostId: "dice-host",
      diceBoxError: null,
      isDiceBoxReady: true,
      isRolling: false,
      summary: {
        id: 1,
        title: "Ataque",
        expression: "1d20+5",
        diceValues: [17],
        modifier: 5,
        total: 22,
      },
      rollD20Check: vi.fn(),
      rollExpression: vi.fn(),
      rollDicePool: vi.fn(),
      rollExpressionsSequence: vi.fn(),
      formatModifier: vi.fn(),
    },
  },
  onSetInventoryCatalogOpen: vi.fn(),
  onSetSpellCatalogOpen: vi.fn(),
  onSetDeleteCharacterConfirmOpen: vi.fn(),
  onSetLevelManagementOpen: vi.fn(),
  onSetLevelUpOpen: vi.fn(),
  onSetLevelModalMode: vi.fn(),
  onSetSelectedPassive: vi.fn(),
  onSetSelectedInventoryItem: vi.fn(),
  onDeleteSelectedSpell: vi.fn().mockResolvedValue(undefined),
  onDeleteSelectedInventoryItem: vi.fn().mockResolvedValue(undefined),
  onUpdateSelectedInventoryQuantity: vi.fn().mockResolvedValue(undefined),
  onAddInventoryItem: vi.fn().mockResolvedValue(undefined),
  onAddSpell: vi.fn().mockResolvedValue(undefined),
  onDeleteCharacter: vi.fn().mockResolvedValue(undefined),
  onSaveExperience: vi.fn().mockResolvedValue(undefined),
  onSubmitLevelUp: vi.fn().mockResolvedValue(undefined),
  onLevelDown: vi.fn().mockResolvedValue(undefined),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CharacterSheetOverlays", () => {
  it("renders all open overlays and routes close/delete actions", () => {
    render(<CharacterSheetOverlays {...baseProps} />);

    expect(screen.getByTestId("dice-roll-overlay")).toHaveTextContent("Ataque");
    expect(screen.getByTestId("spell-detail-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(screen.getByTestId("level-management-modal")).toBeInTheDocument();
    expect(screen.getByTestId("level-up-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("cerrar-catalogo-inventario"));
    fireEvent.click(screen.getByText("cerrar-catalogo-hechizos"));
    fireEvent.click(screen.getByText("cancelar-confirmacion"));
    fireEvent.click(screen.getByText("confirmar-borrado"));
    fireEvent.click(screen.getByText("cerrar-Visión en la oscuridad"));
    fireEvent.click(screen.getByText("cerrar-Poción"));
    fireEvent.click(screen.getByText("guardar-Poción"));

    expect(baseProps.onSetInventoryCatalogOpen).toHaveBeenCalledWith(false);
    expect(baseProps.onSetSpellCatalogOpen).toHaveBeenCalledWith(false);
    expect(baseProps.onSetDeleteCharacterConfirmOpen).toHaveBeenCalledWith(
      false,
    );
    expect(baseProps.onDeleteCharacter).toHaveBeenCalled();
    expect(baseProps.onSetSelectedPassive).toHaveBeenCalledWith(null);
    expect(baseProps.onSetSelectedInventoryItem).toHaveBeenCalledWith(null);
    expect(baseProps.onUpdateSelectedInventoryQuantity).toHaveBeenCalledWith(4);
  });

  it("routes level-management actions into the expected modal state changes", () => {
    render(<CharacterSheetOverlays {...baseProps} />);

    fireEvent.click(screen.getByText("abrir-bajada"));
    fireEvent.click(screen.getByText("abrir-subida"));
    fireEvent.click(screen.getByText("guardar-xp"));

    expect(baseProps.onSetLevelManagementOpen).toHaveBeenCalledWith(false);
    expect(baseProps.onSetLevelModalMode).toHaveBeenCalledWith("down");
    expect(baseProps.onSetLevelModalMode).toHaveBeenCalledWith("up");
    expect(baseProps.onSetLevelUpOpen).toHaveBeenCalledWith(true);
    expect(baseProps.onSaveExperience).toHaveBeenCalledWith(700);
  });

  it("hides level overlays when there is no character", () => {
    render(<CharacterSheetOverlays {...baseProps} character={null} />);

    expect(
      screen.queryByTestId("level-management-modal"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("level-up-modal")).not.toBeInTheDocument();
  });
});
