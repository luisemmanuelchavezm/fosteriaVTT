// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ConfirmationModal from "../../../screens/personaje/dndcharactersheet/components/ConfirmationModal";

describe("ConfirmationModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("no renderiza cuando está cerrado", () => {
    render(
      <ConfirmationModal
        isOpen={false}
        title="Eliminar"
        description="¿Seguro?"
        confirmLabel="Confirmar"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });

  it("renderiza contenido y dispara confirmar/cancelar", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationModal
        isOpen
        title="Eliminar objeto"
        description="Esta acción no se puede deshacer"
        confirmLabel="Sí, eliminar"
        cancelLabel="No"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Eliminar objeto")).toBeInTheDocument();
    expect(
      screen.getByText("Esta acción no se puede deshacer"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
