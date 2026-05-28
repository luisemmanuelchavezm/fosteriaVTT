// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import TokenContextMenu from "../../../screens/campaign/components/TokenContextMenu";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  posicionId: 1,
  x: 100,
  y: 200,
  fogActiva: false,
  isDM: false,
  currentCapa: "fichas" as const,
  visionConfig: null,
  onToggleRevela: vi.fn(),
  onOpenVisionArc: vi.fn(),
  onCambiarCapa: vi.fn(),
  onEliminar: vi.fn(),
  onClose: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TokenContextMenu", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders 'Eliminar token' button", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} />);
    expect(screen.getByText("Eliminar token")).toBeInTheDocument();
  });

  it("calls onEliminar and onClose when delete button is clicked", () => {
    const onEliminar = vi.fn();
    const onClose = vi.fn();
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        onEliminar={onEliminar}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Eliminar token"));
    expect(onEliminar).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  // ── Fog of war — non-DM ────────────────────────────────────────────────────

  it("does not show fog options when not DM", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM={false} />);
    expect(screen.queryByText("Revela niebla")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Activa la niebla de guerra para ver opciones de visión",
      ),
    ).not.toBeInTheDocument();
  });

  // ── Fog of war — DM, fogActiva=false ──────────────────────────────────────

  it("shows 'Activa la niebla de guerra' message when DM but fog is inactive", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM fogActiva={false} />);
    expect(
      screen.getByText(
        "Activa la niebla de guerra para ver opciones de visión",
      ),
    ).toBeInTheDocument();
  });

  it("does not show 'Revela niebla' checkbox when fogActiva=false", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM fogActiva={false} />);
    expect(screen.queryByText("Revela niebla")).not.toBeInTheDocument();
  });

  // ── Fog of war — DM, fogActiva=true ───────────────────────────────────────

  it("shows 'Revela niebla' checkbox when DM and fogActiva=true", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM fogActiva />);
    expect(screen.getByText("Revela niebla")).toBeInTheDocument();
  });

  it("checkbox is unchecked when revelaArea=false", () => {
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        fogActiva
        visionConfig={{ revelaArea: false } as never}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("checkbox is checked when revelaArea=true", () => {
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        fogActiva
        visionConfig={{ revelaArea: true } as never}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onToggleRevela when checkbox is changed", () => {
    const onToggleRevela = vi.fn();
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        fogActiva
        onToggleRevela={onToggleRevela}
        visionConfig={{ revelaArea: false } as never}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggleRevela).toHaveBeenCalledWith(1, true);
  });

  it("shows 'Modificar arco de visión' when revelaArea=true", () => {
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        fogActiva
        visionConfig={{ revelaArea: true } as never}
      />,
    );
    expect(screen.getByText("Modificar arco de visión")).toBeInTheDocument();
  });

  it("does not show vision arc button when revelaArea=false", () => {
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        fogActiva
        visionConfig={{ revelaArea: false } as never}
      />,
    );
    expect(
      screen.queryByText("Modificar arco de visión"),
    ).not.toBeInTheDocument();
  });

  it("calls onOpenVisionArc and onClose when arc button is clicked", () => {
    const onOpenVisionArc = vi.fn();
    const onClose = vi.fn();
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        fogActiva
        onOpenVisionArc={onOpenVisionArc}
        onClose={onClose}
        visionConfig={{ revelaArea: true } as never}
      />,
    );
    fireEvent.click(screen.getByText("Modificar arco de visión"));
    expect(onOpenVisionArc).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  // ── Resize ─────────────────────────────────────────────────────────────────

  it("shows 'Modificar tamaño' when onStartResize is provided", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} onStartResize={vi.fn()} />);
    expect(screen.getByText("Modificar tamaño")).toBeInTheDocument();
  });

  it("does not show 'Modificar tamaño' when onStartResize is not provided", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Modificar tamaño")).not.toBeInTheDocument();
  });

  it("calls onStartResize and onClose when resize button is clicked", () => {
    const onStartResize = vi.fn();
    const onClose = vi.fn();
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        onStartResize={onStartResize}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Modificar tamaño"));
    expect(onStartResize).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  // ── Layer change — DM only ─────────────────────────────────────────────────

  it("shows 'Cambiar capa' button for DM", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM />);
    expect(screen.getByText("Cambiar capa")).toBeInTheDocument();
  });

  it("does not show 'Cambiar capa' for non-DM", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM={false} />);
    expect(screen.queryByText("Cambiar capa")).not.toBeInTheDocument();
  });

  it("opens layer submenu when 'Cambiar capa' is clicked", () => {
    render(<TokenContextMenu {...DEFAULT_PROPS} isDM currentCapa="fichas" />);
    fireEvent.click(screen.getByText("Cambiar capa"));
    // Shows other layers (not current one)
    expect(screen.getByText("Mapa")).toBeInTheDocument();
    expect(screen.getByText("DM")).toBeInTheDocument();
    expect(screen.queryByText("Personajes")).not.toBeInTheDocument();
  });

  it("calls onCambiarCapa and onClose when a layer is selected", () => {
    const onCambiarCapa = vi.fn();
    const onClose = vi.fn();
    render(
      <TokenContextMenu
        {...DEFAULT_PROPS}
        isDM
        currentCapa="fichas"
        onCambiarCapa={onCambiarCapa}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Cambiar capa"));
    fireEvent.click(screen.getByText("Mapa"));
    expect(onCambiarCapa).toHaveBeenCalledWith(1, "mapa");
    expect(onClose).toHaveBeenCalled();
  });

  // ── Outside click ──────────────────────────────────────────────────────────

  it("calls onClose when clicking outside the menu", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<TokenContextMenu {...DEFAULT_PROPS} onClose={onClose} />);
    // Advance the setTimeout(0) that registers the mousedown listener
    vi.runAllTimers();
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
