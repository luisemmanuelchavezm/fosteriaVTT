// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import CharacterDetailModal from "../../../screens/personaje/dndcharactersheet/components/CharacterDetailModal";

const DEFAULT_PROPS = {
  isOpen: true,
  title: "Bola de fuego",
  onClose: vi.fn(),
};

describe("CharacterDetailModal", () => {
  it("returns null when isOpen is false", () => {
    const { container } = render(
      <CharacterDetailModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the title when open", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Bola de fuego")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <CharacterDetailModal {...DEFAULT_PROPS} subtitle="Hechizo nivel 3" />,
    );
    expect(screen.getByText("Hechizo nivel 3")).toBeInTheDocument();
  });

  it("does not render subtitle when omitted", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Hechizo nivel 3")).not.toBeInTheDocument();
  });

  it("renders the formula section when formula is provided", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} formula="8d6" />);
    expect(screen.getByText("Fórmula")).toBeInTheDocument();
    expect(screen.getByText("8d6")).toBeInTheDocument();
  });

  it("does not render formula section when formula is not provided", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Fórmula")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        description="Descripción del hechizo"
      />,
    );
    expect(screen.getByText("Descripción del hechizo")).toBeInTheDocument();
  });

  it("shows fallback description when description is empty", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} description="" />);
    expect(
      screen.getByText("No hay descripción disponible."),
    ).toBeInTheDocument();
  });

  it("shows fallback description when description is null", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} description={null} />);
    expect(
      screen.getByText("No hay descripción disponible."),
    ).toBeInTheDocument();
  });

  it("calls onClose when close (×) button is clicked", () => {
    const onClose = vi.fn();
    render(<CharacterDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when 'Cerrar' button at the bottom is clicked", () => {
    const onClose = vi.fn();
    render(<CharacterDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── onDelete ─────────────────────────────────────────────────────────────

  it("renders delete button with default label when onDelete is provided", () => {
    const onDelete = vi.fn();
    render(<CharacterDetailModal {...DEFAULT_PROPS} onDelete={onDelete} />);
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it("renders delete button with custom deleteLabel", () => {
    const onDelete = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onDelete={onDelete}
        deleteLabel="Borrar hechizo"
      />,
    );
    expect(screen.getByText("Borrar hechizo")).toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<CharacterDetailModal {...DEFAULT_PROPS} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not render delete button when onDelete is not provided", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });

  // ── onSaveQuantity / quantity editor ─────────────────────────────────────

  it("renders quantity editor when onSaveQuantity is provided", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={5}
      />,
    );
    expect(screen.getByText("Cantidad")).toBeInTheDocument();
    expect(screen.getByText("Guardar cantidad")).toBeInTheDocument();
  });

  it("does not render quantity editor when onSaveQuantity is not provided", () => {
    render(<CharacterDetailModal {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Cantidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardar cantidad")).not.toBeInTheDocument();
  });

  it("initializes quantity input with the given quantity value", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={7}
      />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("7");
  });

  it("initializes quantity input as empty string when quantity is null", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={null}
      />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("+ button increments quantity", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={3}
      />,
    );
    fireEvent.click(screen.getByText("+"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("4");
  });

  it("- button decrements quantity", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={3}
      />,
    );
    fireEvent.click(screen.getByText("-"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("2");
  });

  it("- button does not go below 0", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={0}
      />,
    );
    fireEvent.click(screen.getByText("-"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("0");
  });

  it("typing in quantity input updates value, stripping non-digits", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={0}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc12" } });
    expect((input as HTMLInputElement).value).toBe("12");
  });

  it("calls onSaveQuantity with parsed quantity when 'Guardar cantidad' is clicked", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={5}
      />,
    );
    fireEvent.click(screen.getByText("Guardar cantidad"));
    expect(onSaveQuantity).toHaveBeenCalledWith(5);
  });

  it("calls onSaveQuantity with 0 when input is empty", () => {
    const onSaveQuantity = vi.fn();
    render(
      <CharacterDetailModal
        {...DEFAULT_PROPS}
        onSaveQuantity={onSaveQuantity}
        quantity={null}
      />,
    );
    fireEvent.click(screen.getByText("Guardar cantidad"));
    expect(onSaveQuantity).toHaveBeenCalledWith(0);
  });
});
