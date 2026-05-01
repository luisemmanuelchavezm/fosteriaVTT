// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import FeatDetailModal from "../../../screens/personaje/dndcharactersheet/components/FeatDetailModal";
import type { FeatOption } from "../../../screens/personaje/dndcharactersheet/feats";

const feat: FeatOption = {
  id: "dote-alerta",
  nombre: "Alerta",
  descripcion: "Ganas iniciativa adicional.",
  descripcionCompleta: "No puedes ser sorprendido y ganas +5 iniciativa.",
  requisitos: ["Nivel 4"],
  validate: () => true,
};

describe("FeatDetailModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("no muestra modal si está cerrado o falta dote", () => {
    const { rerender } = render(
      <FeatDetailModal feat={null} isOpen onClose={vi.fn()} />,
    );

    expect(screen.queryByText("Detalle de dote")).not.toBeInTheDocument();

    rerender(<FeatDetailModal feat={feat} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText("Alerta")).not.toBeInTheDocument();
  });

  it("muestra detalle completo y requisitos, y permite cerrar", () => {
    const onClose = vi.fn();

    render(<FeatDetailModal feat={feat} isOpen onClose={onClose} />);

    expect(screen.getByText("Detalle de dote")).toBeInTheDocument();
    expect(screen.getByText("Alerta")).toBeInTheDocument();
    expect(
      screen.getByText("No puedes ser sorprendido y ganas +5 iniciativa."),
    ).toBeInTheDocument();
    expect(screen.getByText("Requisitos")).toBeInTheDocument();
    expect(screen.getByText("Nivel 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByRole("button", { name: "×" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
