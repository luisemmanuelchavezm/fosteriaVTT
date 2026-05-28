// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import CharacterSheetModal from "../../../screens/campaign/components/CharacterSheetModal";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock(
  "../../../screens/personaje/dndcharactersheet/DndCharacterSheetScreen",
  () => ({
    default: ({ characterId }: { characterId: string }) => (
      <div data-testid="character-sheet">CharacterSheet:{characterId}</div>
    ),
  }),
);

// ─── Default props ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  characterId: 42,
  username: "player1",
  avatarUrl: "https://example.com/avatar.png",
  onLogout: vi.fn(),
  onGoHome: vi.fn(),
  onGoCampaigns: vi.fn(),
  onClose: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CharacterSheetModal", () => {
  it("renders the 'Cerrar' button", () => {
    render(<CharacterSheetModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Cerrar")).toBeInTheDocument();
  });

  it("renders DndCharacterSheetScreen with correct characterId", () => {
    render(<CharacterSheetModal {...DEFAULT_PROPS} characterId={99} />);
    expect(screen.getByTestId("character-sheet")).toBeInTheDocument();
    expect(screen.getByText("CharacterSheet:99")).toBeInTheDocument();
  });

  it("calls onClose when 'Cerrar' button is clicked", () => {
    const onClose = vi.fn();
    render(<CharacterSheetModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <CharacterSheetModal {...DEFAULT_PROPS} onClose={onClose} />,
    );
    // The outer div is the backdrop
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("does NOT call onClose when clicking inside the modal content", () => {
    const onClose = vi.fn();
    render(<CharacterSheetModal {...DEFAULT_PROPS} onClose={onClose} />);
    // The character sheet area should stop propagation
    const sheetEl = screen.getByTestId("character-sheet");
    fireEvent.click(sheetEl);
    expect(onClose).not.toHaveBeenCalled();
  });
});
