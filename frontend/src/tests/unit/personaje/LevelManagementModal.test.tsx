// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
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

  it("does not show 'Eliminar un nivel' when canLevelDown is false", () => {
    render(<LevelManagementModal {...baseProps} canLevelDown={false} />);
    expect(screen.queryByText("Eliminar un nivel")).not.toBeInTheDocument();
  });

  it("decrements experience by 100 when '-' is clicked", () => {
    render(
      <LevelManagementModal {...baseProps} currentXp={650} nextLevelXp={900} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "-" }));
    // safeExperience - 100 = 650 - 100 = 550
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("550");
  });

  it("updates experience value when input changes", () => {
    render(<LevelManagementModal {...baseProps} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "750" } });
    expect(input.value).toBe("750");
  });

  it("treats NaN input as 0 for safeExperience (clears to empty then tries to save)", async () => {
    render(<LevelManagementModal {...baseProps} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    // Type non-numeric - onChange strips non-digits → empty string → NaN → safeExperience=0
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar experiencia/i }),
    );
    await waitFor(() => {
      expect(baseProps.onSaveExperience).toHaveBeenCalledWith(0);
    });
  });

  it("shows generic error when onSaveExperience throws non-Error", async () => {
    const onSaveExperience = vi.fn().mockRejectedValue("string error");
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
      expect(
        screen.getByText("No se pudo actualizar la experiencia."),
      ).toBeInTheDocument();
    });
  });
});
