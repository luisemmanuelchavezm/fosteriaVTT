// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import FogOfWarDropdown from "../../../screens/campaign/components/FogOfWarDropdown";

const BASE_ESTADO = {
  activa: false,
  zonasExploradas: false,
  vistaJugador: false,
};

const DEFAULT_PROPS = {
  estado: BASE_ESTADO,
  onChange: vi.fn(),
  onClose: vi.fn(),
};

describe("FogOfWarDropdown", () => {
  it("renders 'Niebla de guerra' label", () => {
    render(<FogOfWarDropdown {...DEFAULT_PROPS} />);
    expect(screen.getByText("Niebla de guerra")).toBeInTheDocument();
  });

  it("renders Activa, Zonas exploradas, Vista de jugador labels", () => {
    render(<FogOfWarDropdown {...DEFAULT_PROPS} />);
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Zonas exploradas")).toBeInTheDocument();
    expect(screen.getByText("Vista de jugador")).toBeInTheDocument();
  });

  it("renders toggle switches", () => {
    render(<FogOfWarDropdown {...DEFAULT_PROPS} />);
    const switches = screen.getAllByRole("switch");
    expect(switches.length).toBe(3);
  });

  it("Activa toggle is unchecked when activa=false", () => {
    render(<FogOfWarDropdown {...DEFAULT_PROPS} />);
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "false");
  });

  it("Activa toggle is checked when activa=true", () => {
    render(
      <FogOfWarDropdown
        {...DEFAULT_PROPS}
        estado={{ ...BASE_ESTADO, activa: true }}
      />,
    );
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with activa:true when Activa toggle is clicked", () => {
    const onChange = vi.fn();
    render(<FogOfWarDropdown {...DEFAULT_PROPS} onChange={onChange} />);
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]);
    expect(onChange).toHaveBeenCalledWith({ activa: true });
  });

  it("calls onChange with activa:false when Activa toggle is clicked and currently true", () => {
    const onChange = vi.fn();
    render(
      <FogOfWarDropdown
        {...DEFAULT_PROPS}
        onChange={onChange}
        estado={{ ...BASE_ESTADO, activa: true }}
      />,
    );
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]);
    expect(onChange).toHaveBeenCalledWith({ activa: false });
  });

  it("Zonas exploradas toggle is disabled when activa=false", () => {
    render(<FogOfWarDropdown {...DEFAULT_PROPS} />);
    const switches = screen.getAllByRole("switch");
    expect(switches[1]).toBeDisabled();
  });

  it("Zonas exploradas toggle is not disabled when activa=true", () => {
    render(
      <FogOfWarDropdown
        {...DEFAULT_PROPS}
        estado={{ ...BASE_ESTADO, activa: true }}
      />,
    );
    const switches = screen.getAllByRole("switch");
    expect(switches[1]).not.toBeDisabled();
  });

  it("calls onChange with zonasExploradas when Zonas exploradas toggle is clicked", () => {
    const onChange = vi.fn();
    render(
      <FogOfWarDropdown
        {...DEFAULT_PROPS}
        onChange={onChange}
        estado={{ ...BASE_ESTADO, activa: true }}
      />,
    );
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[1]);
    expect(onChange).toHaveBeenCalledWith({ zonasExploradas: true });
  });

  it("calls onChange with vistaJugador when Vista de jugador toggle is clicked", () => {
    const onChange = vi.fn();
    render(
      <FogOfWarDropdown
        {...DEFAULT_PROPS}
        onChange={onChange}
        estado={{ ...BASE_ESTADO, activa: true }}
      />,
    );
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[2]);
    expect(onChange).toHaveBeenCalledWith({ vistaJugador: true });
  });

  it("calls onClose when clicking outside the dropdown", () => {
    const onClose = vi.fn();
    render(<FogOfWarDropdown {...DEFAULT_PROPS} onClose={onClose} />);
    // Fire mousedown on document body (outside the dropdown)
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
