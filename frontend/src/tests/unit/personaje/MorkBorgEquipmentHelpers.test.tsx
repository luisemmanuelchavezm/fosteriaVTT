// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  SubRollButton,
  PresenciaNota,
  ResultChip,
} from "../../../screens/personaje/createmorkborg/sections/MorkBorgEquipmentHelpers";

afterEach(() => cleanup());

describe("SubRollButton", () => {
  it("renderiza con la etiqueta correcta", () => {
    render(
      <SubRollButton label="Tirar arma" onClick={vi.fn()} disabled={false} />,
    );
    expect(screen.getByText(/Tirar arma/)).toBeInTheDocument();
  });

  it("llama a onClick cuando se hace click", () => {
    const onClick = vi.fn();
    render(<SubRollButton label="Tirar" onClick={onClick} disabled={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("está deshabilitado cuando disabled es true", () => {
    render(<SubRollButton label="Tirar" onClick={vi.fn()} disabled={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("no llama onClick cuando está deshabilitado", () => {
    const onClick = vi.fn();
    render(<SubRollButton label="Tirar" onClick={onClick} disabled={true} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("PresenciaNota", () => {
  it("no renderiza cuando modifier no es null", () => {
    const { container } = render(<PresenciaNota modifier={3} />);
    expect(container.textContent).toBe("");
  });

  it("renderiza nota cuando modifier es null", () => {
    render(<PresenciaNota modifier={null} />);
    expect(screen.getByText(/Presencia/)).toBeInTheDocument();
  });
});

describe("ResultChip", () => {
  it("renderiza el contenido", () => {
    render(<ResultChip>Espada larga</ResultChip>);
    expect(screen.getByText("Espada larga")).toBeInTheDocument();
  });

  it("renderiza como span", () => {
    const { container } = render(<ResultChip>Test</ResultChip>);
    expect(container.querySelector("span")).toBeTruthy();
  });
});
