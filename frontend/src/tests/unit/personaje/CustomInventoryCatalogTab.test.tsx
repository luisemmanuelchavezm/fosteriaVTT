// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import CustomInventoryCatalogTab from "../../../screens/personaje/dndcharactersheet/components/inventoryCatalog/CustomInventoryCatalogTab";

type CustomObjectType = "ARMA" | "ARMADURA" | "CONSUMIBLE" | "MISCELANEO";
type ArmorSubtype = "Ligera" | "Media" | "Pesada" | "Escudo";

const sanitize = (value: string, max: number) =>
  value.replace(/\D+/g, "").slice(0, String(max).length);

const BASE_PROPS = {
  customName: "",
  customDescription: "",
  customType: "ARMA" as CustomObjectType,
  customArmorSubtype: "Ligera" as ArmorSubtype,
  armorBaseValue: "",
  armorModifierCode: "",
  builtFormula: null,
  baseBonus: "",
  showBaseBonusInput: false,
  diceParts: [] as { count: string; sides: string }[],
  selectedAbilityModifier: "",
  abilityModifiers: [] as string[],
  submitError: null,
  onCustomNameChange: vi.fn(),
  onCustomDescriptionChange: vi.fn(),
  onCustomTypeChange: vi.fn(),
  onCustomArmorSubtypeChange: vi.fn(),
  onArmorBaseValueChange: vi.fn(),
  onArmorModifierCodeChange: vi.fn(),
  onAddDie: vi.fn(),
  onAddBaseBonus: vi.fn(),
  onSelectedAbilityModifierChange: vi.fn(),
  onBaseBonusChange: vi.fn(),
  onDicePartsChange: vi.fn(),
  onAbilityModifiersChange: vi.fn(),
  sanitizePositiveNumericInput: sanitize,
};

describe("CustomInventoryCatalogTab", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders name label and input", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} customName="Daga" />);
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    const nameInputs = screen.getAllByRole("textbox");
    // The first text input should be the name input
    expect(nameInputs[0]).toHaveValue("Daga");
  });

  it("calls onCustomNameChange when name input changes", () => {
    const onCustomNameChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        onCustomNameChange={onCustomNameChange}
      />,
    );
    const nameInputs = screen.getAllByRole("textbox");
    fireEvent.change(nameInputs[0], { target: { value: "Lanza" } });
    expect(onCustomNameChange).toHaveBeenCalledWith("Lanza");
  });

  it("renders type select with options", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} />);
    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Arma" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Armadura" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Consumible" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Misceláneo" }),
    ).toBeInTheDocument();
  });

  it("calls onCustomTypeChange when type select changes", () => {
    const onCustomTypeChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        onCustomTypeChange={onCustomTypeChange}
      />,
    );
    // The type select is first after the name input row
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "ARMADURA" } });
    expect(onCustomTypeChange).toHaveBeenCalledWith("ARMADURA");
  });

  it("renders description textarea", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        customDescription="Descripción de prueba"
      />,
    );
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Descripción de prueba"),
    ).toBeInTheDocument();
  });

  it("calls onCustomDescriptionChange when description changes", () => {
    const onCustomDescriptionChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        onCustomDescriptionChange={onCustomDescriptionChange}
      />,
    );
    // The textarea is the last textbox element (name input + formula readonly + description textarea)
    const textboxes = screen.getAllByRole("textbox");
    const textarea = textboxes[textboxes.length - 1];
    fireEvent.change(textarea, { target: { value: "Nueva descripción" } });
    expect(onCustomDescriptionChange).toHaveBeenCalledWith("Nueva descripción");
  });

  // ── Non-ARMADURA type ─────────────────────────────────────────────────────

  it("shows Añadir dado and Bonif. base buttons for non-armor types", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} customType="ARMA" />);
    expect(screen.getByText("Añadir dado")).toBeInTheDocument();
    expect(screen.getByText("Bonif. base")).toBeInTheDocument();
  });

  it("calls onAddDie when Añadir dado is clicked", () => {
    const onAddDie = vi.fn();
    render(<CustomInventoryCatalogTab {...BASE_PROPS} onAddDie={onAddDie} />);
    fireEvent.click(screen.getByText("Añadir dado"));
    expect(onAddDie).toHaveBeenCalled();
  });

  it("calls onAddBaseBonus when Bonif. base is clicked", () => {
    const onAddBaseBonus = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        onAddBaseBonus={onAddBaseBonus}
      />,
    );
    fireEvent.click(screen.getByText("Bonif. base"));
    expect(onAddBaseBonus).toHaveBeenCalled();
  });

  it("shows base bonus input when showBaseBonusInput is true", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        showBaseBonusInput
        baseBonus="3"
      />,
    );
    // "Bonif. base" appears as both the button label and the input label — getAllByText is safe
    const bonifTexts = screen.getAllByText("Bonif. base");
    expect(bonifTexts.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("calls onBaseBonusChange when base bonus input changes", () => {
    const onBaseBonusChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        showBaseBonusInput
        onBaseBonusChange={onBaseBonusChange}
      />,
    );
    // The base bonus input has placeholder "0"
    const bonusInput = screen.getByPlaceholderText("0");
    fireEvent.change(bonusInput, { target: { value: "5" } });
    expect(onBaseBonusChange).toHaveBeenCalled();
  });

  // ── Dice parts ────────────────────────────────────────────────────────────

  it("renders die inputs when diceParts is non-empty", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        diceParts={[{ count: "1", sides: "6" }]}
      />,
    );
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("6")).toBeInTheDocument();
    expect(screen.getByText("Quitar")).toBeInTheDocument();
  });

  it("calls onDicePartsChange when Quitar is clicked", () => {
    const onDicePartsChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        diceParts={[{ count: "1", sides: "6" }]}
        onDicePartsChange={onDicePartsChange}
      />,
    );
    fireEvent.click(screen.getByText("Quitar"));
    expect(onDicePartsChange).toHaveBeenCalledWith(expect.any(Function));
  });

  // ── Ability modifiers ─────────────────────────────────────────────────────

  it("renders ability modifier chips when abilityModifiers is non-empty", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        abilityModifiers={["@fuerza"]}
      />,
    );
    // "Fuerza" appears in both the chip button and the select option
    const fuerzaEls = screen.getAllByText("Fuerza");
    const chipBtn = fuerzaEls.find(
      (el) => el.tagName.toLowerCase() === "button",
    );
    expect(chipBtn).toBeDefined();
  });

  it("calls onAbilityModifiersChange when modifier chip is clicked", () => {
    const onAbilityModifiersChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        abilityModifiers={["@destreza"]}
        onAbilityModifiersChange={onAbilityModifiersChange}
      />,
    );
    // "Destreza" appears in both the chip button and the select option;
    // find specifically the button chip (has rounded-full class)
    const destreza = screen.getAllByText("Destreza");
    const chipBtn = destreza.find(
      (el) => el.tagName.toLowerCase() === "button",
    );
    if (chipBtn) fireEvent.click(chipBtn);
    expect(onAbilityModifiersChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it("calls onSelectedAbilityModifierChange when modifier select changes", () => {
    const onSelectedAbilityModifierChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        onSelectedAbilityModifierChange={onSelectedAbilityModifierChange}
      />,
    );
    // Find the "Modificador" select
    const modSelect = screen.getByDisplayValue("Modificador");
    fireEvent.change(modSelect, { target: { value: "@fuerza" } });
    expect(onSelectedAbilityModifierChange).toHaveBeenCalledWith("@fuerza");
  });

  // ── Formula display ───────────────────────────────────────────────────────

  it("shows built formula when provided", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        builtFormula="1d6 + @fuerza"
      />,
    );
    expect(screen.getByText("1d6 + @fuerza")).toBeInTheDocument();
  });

  it("shows 'Sin fórmula' when builtFormula is null", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} builtFormula={null} />);
    expect(screen.getByText("Sin fórmula")).toBeInTheDocument();
  });

  // ── Error display ─────────────────────────────────────────────────────────

  it("shows submit error when provided", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        submitError="El nombre es obligatorio"
      />,
    );
    expect(screen.getByText(/El nombre es obligatorio/)).toBeInTheDocument();
  });

  it("does not show error when submitError is null", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} submitError={null} />);
    expect(
      screen.queryByText("El nombre es obligatorio"),
    ).not.toBeInTheDocument();
  });

  // ── ARMADURA type ─────────────────────────────────────────────────────────

  it("shows subtipo select when customType is ARMADURA", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} customType="ARMADURA" />);
    expect(screen.getByText("Subtipo")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Armadura ligera" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Escudo" })).toBeInTheDocument();
  });

  it("does not show Añadir dado when customType is ARMADURA", () => {
    render(<CustomInventoryCatalogTab {...BASE_PROPS} customType="ARMADURA" />);
    expect(screen.queryByText("Añadir dado")).not.toBeInTheDocument();
  });

  it("shows CA base input when ARMADURA with Ligera subtype", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        customType="ARMADURA"
        customArmorSubtype="Ligera"
      />,
    );
    expect(screen.getByText("Armadura base")).toBeInTheDocument();
    expect(screen.getByText("Mod. característica")).toBeInTheDocument();
  });

  it("shows Bono Armadura instead of Armadura base when ARMADURA with Escudo subtype", () => {
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        customType="ARMADURA"
        customArmorSubtype="Escudo"
      />,
    );
    expect(screen.getByText("Bono Armadura")).toBeInTheDocument();
    expect(screen.queryByText("Mod. característica")).not.toBeInTheDocument();
  });

  it("calls onArmorBaseValueChange when CA base input changes", () => {
    const onArmorBaseValueChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        customType="ARMADURA"
        customArmorSubtype="Ligera"
        onArmorBaseValueChange={onArmorBaseValueChange}
      />,
    );
    const caBaseInput = screen.getByPlaceholderText("Ej. 12");
    fireEvent.change(caBaseInput, { target: { value: "14" } });
    expect(onArmorBaseValueChange).toHaveBeenCalled();
  });

  it("calls onArmorModifierCodeChange when modifier select changes in ARMADURA", () => {
    const onArmorModifierCodeChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        customType="ARMADURA"
        customArmorSubtype="Ligera"
        onArmorModifierCodeChange={onArmorModifierCodeChange}
      />,
    );
    const modSelect = screen.getByDisplayValue("Sin modificador");
    fireEvent.change(modSelect, { target: { value: "DES" } });
    expect(onArmorModifierCodeChange).toHaveBeenCalledWith("DES");
  });

  it("calls onCustomArmorSubtypeChange when subtipo select changes", () => {
    const onCustomArmorSubtypeChange = vi.fn();
    render(
      <CustomInventoryCatalogTab
        {...BASE_PROPS}
        customType="ARMADURA"
        onCustomArmorSubtypeChange={onCustomArmorSubtypeChange}
      />,
    );
    const subtipoSelect = screen.getByDisplayValue("Armadura ligera");
    fireEvent.change(subtipoSelect, { target: { value: "Pesada" } });
    expect(onCustomArmorSubtypeChange).toHaveBeenCalledWith("Pesada");
  });
});
