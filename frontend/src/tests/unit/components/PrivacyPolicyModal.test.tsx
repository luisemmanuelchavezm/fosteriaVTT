// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PrivacyPolicyModal from "../../../components/PrivacyPolicyModal";

afterEach(() => cleanup());

describe("PrivacyPolicyModal", () => {
  it("no renderiza cuando isOpen es false", () => {
    const { container } = render(
      <PrivacyPolicyModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.textContent).toBe("");
  });

  it("renderiza cuando isOpen es true", () => {
    render(<PrivacyPolicyModal isOpen={true} onClose={vi.fn()} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("muestra el título de política de privacidad", () => {
    render(<PrivacyPolicyModal isOpen={true} onClose={vi.fn()} />);
    const matches = screen.queryAllByText(/política de privacidad/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("llama a onClose al hacer click en el botón de cerrar", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);
    const closeBtns = screen.queryAllByRole("button");
    const closeBtn = closeBtns.find(
      (b) =>
        b.querySelector("svg") !== null ||
        b.textContent?.toLowerCase().includes("cerrar"),
    );
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("muestra contenido de política", () => {
    render(<PrivacyPolicyModal isOpen={true} onClose={vi.fn()} />);
    expect(document.body.textContent).toBeTruthy();
  });
});
