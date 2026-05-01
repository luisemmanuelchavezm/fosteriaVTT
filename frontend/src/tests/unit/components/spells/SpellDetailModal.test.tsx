// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SpellDetailModal from "../../../../components/spells/SpellDetailModal";
import type { CharacterAbilityResponse } from "../../../../screens/personaje/utils/dndApi";

const baseSpell: CharacterAbilityResponse = {
  id: 11,
  nombre: "Misil arcano",
  bonificacion: null,
  formula: "2d6 + 3",
  descripcion:
    "Infliges 2d6 + 3 de daño de fuerza.\n\nCuando impactas, añade 1d4 adicional.",
  tags: "Hechizo;1,TiempoLanzamiento;1 accion,Alcance;120 pies,Componentes;V,S,Duracion;Instantaneo",
};

describe("SpellDetailModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("no renderiza contenido cuando está cerrado o no hay hechizo", () => {
    const { rerender } = render(
      <SpellDetailModal
        spell={null}
        isOpen={false}
        onClose={vi.fn()}
        onRollExpression={vi.fn()}
      />,
    );

    expect(screen.queryByText("Descripción")).not.toBeInTheDocument();

    rerender(
      <SpellDetailModal
        spell={baseSpell}
        isOpen={false}
        onClose={vi.fn()}
        onRollExpression={vi.fn()}
      />,
    );

    expect(screen.queryByText("Misil arcano")).not.toBeInTheDocument();
  });

  it("muestra metadatos, permite tirar fórmulas y ejecuta acciones del modal", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const onRollExpression = vi.fn();

    render(
      <SpellDetailModal
        spell={baseSpell}
        isOpen
        onClose={onClose}
        onDelete={onDelete}
        onRollExpression={onRollExpression}
      />,
    );

    expect(screen.getByText("Misil arcano")).toBeInTheDocument();
    expect(screen.getByText("Nivel 1")).toBeInTheDocument();
    expect(screen.getByText("Tiempo de lanzamiento")).toBeInTheDocument();
    expect(screen.getByText("1 accion")).toBeInTheDocument();
    expect(screen.getByText("120 pies")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2d6 + 3" }));
    expect(onRollExpression).toHaveBeenCalledWith("Misil arcano", "2d6 + 3");

    fireEvent.click(screen.getByRole("button", { name: "1d4" }));
    expect(onRollExpression).toHaveBeenCalledWith("Misil arcano", "1d4");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onDelete).toHaveBeenCalledWith(baseSpell);

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar modal de hechizo" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
