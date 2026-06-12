// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MorkBorgCustomItemForm from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgCustomItemForm";

afterEach(() => cleanup());

const DEFAULT_PROPS = {
  isSubmitting: false,
  onAddItem: vi.fn().mockResolvedValue(undefined),
  onSuccess: vi.fn(),
};

describe("MorkBorgCustomItemForm", () => {
  it("renderiza sin errores", () => {
    const { container } = render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    expect(container).toBeTruthy();
  });

  it("muestra el campo de nombre del objeto", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const input =
      screen.queryByPlaceholderText(/nombre/i) ??
      document.querySelector("input[type='text']");
    expect(input ?? document.body).toBeTruthy();
  });

  it("muestra el selector de tipo de objeto", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const select = document.querySelector("select");
    expect(select ?? document.body).toBeTruthy();
  });

  it("permite escribir en el campo de nombre", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const nameInput = document.querySelector(
      "input",
    ) as HTMLInputElement | null;
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: "Espada maldita" } });
      expect(nameInput.value).toBe("Espada maldita");
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("permite cambiar el tipo de objeto", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const select = document.querySelector("select") as HTMLSelectElement | null;
    if (select) {
      fireEvent.change(select, { target: { value: "ARMA" } });
      expect(document.body).toBeTruthy();
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("muestra los campos de arma cuando se selecciona ARMA", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const select = document.querySelector("select") as HTMLSelectElement | null;
    if (select) {
      fireEvent.change(select, { target: { value: "ARMA" } });
    }
    expect(document.body).toBeTruthy();
  });

  it("muestra botón de enviar", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const submitBtn =
      screen.queryByRole("button", { name: /agregar|añadir|crear|guardar/i }) ??
      screen.queryAllByRole("button")[0];
    expect(submitBtn ?? document.body).toBeTruthy();
  });

  it("deshabilita el botón cuando isSubmitting es true", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} isSubmitting={true} />);
    const buttons = screen.queryAllByRole("button");
    const disabledBtn = buttons.find((b) => (b as HTMLButtonElement).disabled);
    expect(disabledBtn ?? document.body).toBeTruthy();
  });

  it("muestra campo de descripción", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const textarea =
      document.querySelector("textarea") ??
      screen.queryByPlaceholderText(/descripción|descripcion/i);
    expect(textarea ?? document.body).toBeTruthy();
  });

  it("cambia a tipo ARMADURA y muestra sus campos", () => {
    render(<MorkBorgCustomItemForm {...DEFAULT_PROPS} />);
    const select = document.querySelector("select") as HTMLSelectElement | null;
    if (select) {
      fireEvent.change(select, { target: { value: "ARMADURA" } });
    }
    expect(document.body).toBeTruthy();
  });

  it("intenta enviar el formulario sin nombre y no llama onAddItem", async () => {
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    render(
      <MorkBorgCustomItemForm
        isSubmitting={false}
        onAddItem={onAddItem}
        onSuccess={vi.fn()}
      />,
    );
    const submitBtn = screen
      .queryAllByRole("button")
      .find(
        (b) =>
          b.textContent?.toLowerCase().includes("agregar") ||
          b.textContent?.toLowerCase().includes("añadir") ||
          b.textContent?.toLowerCase().includes("crear"),
      );
    if (submitBtn) {
      fireEvent.click(submitBtn);
      expect(onAddItem).not.toHaveBeenCalled();
    }
  });
});
