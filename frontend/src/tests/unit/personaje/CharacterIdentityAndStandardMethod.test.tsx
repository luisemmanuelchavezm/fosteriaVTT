// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import CharacterIdentitySection from "../../../screens/personaje/creatednd/components/CharacterIdentitySection";
import StandardMethodSection from "../../../screens/personaje/creatednd/sections/statistics/StandardMethodSection";

describe("CharacterIdentitySection", () => {
  function renderIdentitySection(overrides = {}) {
    const ref = createRef<HTMLInputElement>();
    const defaults = {
      name: "",
      portraitPreview: null,
      fileInputRef: ref,
      onNameChange: vi.fn(),
      onPortraitSelection: vi.fn(),
      onOpenFilePicker: vi.fn(),
    };
    return render(<CharacterIdentitySection {...defaults} {...overrides} />);
  }

  it("renderiza el formulario de identidad con el nombre", () => {
    renderIdentitySection({ name: "Aria" });
    const input = screen.getByDisplayValue("Aria");
    expect(input).toBeInTheDocument();
  });

  it("renderiza preview del retrato si se proporciona", () => {
    renderIdentitySection({ portraitPreview: "http://img.test/avatar.png" });
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://img.test/avatar.png");
  });

  it("muestra mensaje de error de nombre si nameError esta definido", () => {
    renderIdentitySection({ nameError: "El nombre es obligatorio" });
    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("muestra mensaje de error de retrato si portraitError esta definido", () => {
    renderIdentitySection({ portraitError: "Retrato requerido" });
    expect(screen.getByText("Retrato requerido")).toBeInTheDocument();
  });

  it("llama onOpenFilePicker al hacer click en el area del retrato", async () => {
    const onOpenFilePicker = vi.fn();
    renderIdentitySection({ onOpenFilePicker });
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]);
    expect(onOpenFilePicker).toHaveBeenCalled();
  });

  it("llama onNameChange al escribir en el input de nombre", async () => {
    const onNameChange = vi.fn();
    renderIdentitySection({ onNameChange });
    const input =
      screen.getByPlaceholderText(/nombre/i) ??
      screen.getAllByRole("textbox")[0];
    await userEvent.type(input, "B");
    expect(onNameChange).toHaveBeenCalled();
  });
});

describe("StandardMethodSection", () => {
  const stats = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ];
  const defaultAssignments = Object.fromEntries(stats.map((s) => [s, ""]));

  it("renderiza selectores para cada estadistica", () => {
    render(
      <StandardMethodSection
        standardAssignments={defaultAssignments}
        usedStandardValues={[]}
        onAssignmentChange={vi.fn()}
      />,
    );
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(stats.length);
  });

  it("muestra un error de campo si fieldErrors contiene la estadistica", () => {
    render(
      <StandardMethodSection
        standardAssignments={defaultAssignments}
        usedStandardValues={[]}
        fieldErrors={{ strength: "Selecciona un valor" }}
        onAssignmentChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Selecciona un valor")).toBeInTheDocument();
  });

  it("llama onAssignmentChange al cambiar un selector", async () => {
    const onChange = vi.fn();
    render(
      <StandardMethodSection
        standardAssignments={defaultAssignments}
        usedStandardValues={[]}
        onAssignmentChange={onChange}
      />,
    );
    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[0], "15");
    expect(onChange).toHaveBeenCalled();
  });
});
