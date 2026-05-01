// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

type FeatDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type LevelUpSelectionColumnMockProps = {
  asiSection: React.ReactNode;
};

const controller = vi.hoisted(() => ({
  isDownMode: false,
  selectedSpell: { id: 2, nombre: "Luz" },
  closeSpellDetail: vi.fn(),
  selectedFeatDetail: { id: 9, nombre: "Alerta" },
  setSelectedFeatDetail: vi.fn(),
}));

vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpModalState",
  () => ({ useLevelUpModalState: () => controller }),
);
vi.mock("../../../components/spells/SpellDetailModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="spell-modal" /> : null,
}));
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/FeatDetailModal",
  () => ({
    default: ({ isOpen, onClose }: FeatDetailModalProps) =>
      isOpen ? <button onClick={onClose}>cerrar-dote</button> : null,
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/levelUp/LevelUpAsiSection",
  () => ({ default: () => <div data-testid="asi-section" /> }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/levelUp/LevelUpSelectionColumn",
  () => ({
    default: ({ asiSection }: LevelUpSelectionColumnMockProps) => (
      <div data-testid="selection-column">{asiSection}</div>
    ),
  }),
);
vi.mock(
  "../../../screens/personaje/dndcharactersheet/components/levelUp/LevelUpSummaryColumn",
  () => ({ default: () => <div data-testid="summary-column" /> }),
);

import LevelUpModal from "../../../screens/personaje/dndcharactersheet/components/LevelUpModal";

const baseProps = {
  token: "jwt",
  character: { nombre: "Aria" } as never,
  classCompetencies: ["Armas simples"],
  isOpen: true,
  mode: "up" as const,
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onLevelDown: vi.fn().mockResolvedValue(undefined),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  controller.isDownMode = false;
});

describe("LevelUpModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <LevelUpModal {...baseProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders level-up mode and closes from the header button", () => {
    render(<LevelUpModal {...baseProps} />);

    expect(screen.getByText("Avance de personaje")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Subir de nivel" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("spell-modal")).toBeInTheDocument();
    expect(screen.getByTestId("selection-column")).toBeInTheDocument();
    expect(screen.getByTestId("summary-column")).toBeInTheDocument();
    expect(screen.getByTestId("asi-section")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByText("cerrar-dote"));

    expect(baseProps.onClose).toHaveBeenCalled();
    expect(controller.setSelectedFeatDetail).toHaveBeenCalledWith(null);
  });

  it("renders level-down mode description", () => {
    controller.isDownMode = true;

    render(<LevelUpModal {...baseProps} mode="down" />);

    expect(
      screen.getByRole("heading", { name: "Bajar de nivel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Elige una clase existente del personaje para retirarle un nivel/i,
      ),
    ).toBeInTheDocument();
  });
});
