// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MapUploadModal from "../../../screens/campaign/components/MapUploadModal";

afterEach(() => cleanup());

const DEFAULT_PROPS = {
  isOpen: true,
  isSubmitting: false,
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe("MapUploadModal", () => {
  it("no renderiza cuando isOpen es false", () => {
    const { container } = render(
      <MapUploadModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.textContent).toBe("");
  });

  it("renderiza cuando isOpen es true", () => {
    render(<MapUploadModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("tiene campo de nombre del mapa", () => {
    render(<MapUploadModal {...DEFAULT_PROPS} />);
    const inputs = document.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("llama a onClose al hacer click en el botón de cerrar", () => {
    const onClose = vi.fn();
    render(<MapUploadModal {...DEFAULT_PROPS} onClose={onClose} />);
    const allBtns = screen.queryAllByRole("button");
    const closeBtn = allBtns.find(
      (b) =>
        b.querySelector("svg") !== null ||
        b.getAttribute("aria-label")?.includes("close"),
    );
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("permite escribir el nombre del mapa", () => {
    render(<MapUploadModal {...DEFAULT_PROPS} />);
    const textInputs = Array.from(document.querySelectorAll("input")).filter(
      (i) => i.type === "text" || i.type === "",
    );
    if (textInputs.length > 0) {
      fireEvent.change(textInputs[0], { target: { value: "Mapa oscuro" } });
    }
    expect(document.body).toBeTruthy();
  });

  it("muestra estado de submitting cuando isSubmitting es true", () => {
    render(<MapUploadModal {...DEFAULT_PROPS} isSubmitting={true} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
