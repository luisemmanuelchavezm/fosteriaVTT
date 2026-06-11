// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import MorkBorgDisclaimerModal from "../../../components/MorkBorgDisclaimerModal";

describe("MorkBorgDisclaimerModal", () => {
  it("no renderiza nada cuando isOpen es false", () => {
    const { container } = render(
      <MorkBorgDisclaimerModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza el modal cuando isOpen es true", () => {
    render(<MorkBorgDisclaimerModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Disclaimer Mork Borg")).toBeInTheDocument();
  });

  it("muestra el texto del disclaimer", () => {
    render(<MorkBorgDisclaimerModal isOpen={true} onClose={vi.fn()} />);
    expect(
      screen.getByText(/FosteriaVTT is an independent production/i),
    ).toBeInTheDocument();
  });

  it("llama a onClose cuando se hace click en el botón X", () => {
    const onClose = vi.fn();
    render(<MorkBorgDisclaimerModal isOpen={true} onClose={onClose} />);
    const closeButtons = screen.getAllByRole("button");
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("llama a onClose cuando se hace click en el botón Entendido", () => {
    const onClose = vi.fn();
    render(<MorkBorgDisclaimerModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Entendido"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renderiza el botón Entendido", () => {
    render(<MorkBorgDisclaimerModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Entendido")).toBeInTheDocument();
  });
});
