// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import LevelManagementModal from "../../../screens/personaje/dndcharactersheet/components/LevelManagementModal";

const baseProps = {
  isOpen: true,
  currentXp: 650,
  nextLevelXp: 900,
  canLevelDown: true,
  onClose: vi.fn(),
  onSaveExperience: vi.fn().mockResolvedValue(undefined),
  onOpenLevelUp: vi.fn(),
  onOpenLevelDown: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LevelManagementModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <LevelManagementModal {...baseProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("saves bounded experience and opens level actions", async () => {
    render(<LevelManagementModal {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: /Eliminar un nivel/i }));
    fireEvent.click(screen.getByRole("button", { name: /Subir de nivel/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar experiencia/i }),
    );

    await waitFor(() => {
      expect(baseProps.onSaveExperience).toHaveBeenCalledWith(750);
    });

    expect(baseProps.onOpenLevelDown).toHaveBeenCalled();
    expect(baseProps.onOpenLevelUp).toHaveBeenCalled();
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("shows save error when saving fails", async () => {
    const onSaveExperience = vi.fn().mockRejectedValue(new Error("falló XP"));

    render(
      <LevelManagementModal
        {...baseProps}
        onSaveExperience={onSaveExperience}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Guardar experiencia/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("falló XP")).toBeInTheDocument();
    });
  });
});
