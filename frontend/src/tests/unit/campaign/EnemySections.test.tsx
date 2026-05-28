// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import EnemyStatsSection from "../../../screens/campaign/components/enemy/EnemyStatsSection";
import ActionsSection from "../../../screens/campaign/components/enemy/ActionsSection";
import SkillsAndSavesSection from "../../../screens/campaign/components/enemy/SkillsAndSavesSection";

// ─── EnemyStatsSection ────────────────────────────────────────────────────────

const ABILITY_SCORES = {
  Fuerza: 16,
  Destreza: 14,
  Constitucion: 13,
  Inteligencia: 10,
  Sabiduria: 12,
  Carisma: 8,
};
const ABILITY_INPUTS = Object.fromEntries(
  Object.entries(ABILITY_SCORES).map(([k, v]) => [k, String(v)]),
);

describe("EnemyStatsSection", () => {
  it("renders stat names for all six abilities", () => {
    render(
      <EnemyStatsSection
        abilityScores={ABILITY_SCORES}
        abilityScoreInputs={ABILITY_INPUTS}
        onInputChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );
    expect(screen.getByText("Fuerza")).toBeInTheDocument();
    expect(screen.getByText("Destreza")).toBeInTheDocument();
    expect(screen.getByText("Constitución")).toBeInTheDocument();
    expect(screen.getByText("Inteligencia")).toBeInTheDocument();
    expect(screen.getByText("Sabiduría")).toBeInTheDocument();
    expect(screen.getByText("Carisma")).toBeInTheDocument();
  });

  it("renders 'Estadísticas' label", () => {
    render(
      <EnemyStatsSection
        abilityScores={ABILITY_SCORES}
        abilityScoreInputs={ABILITY_INPUTS}
        onInputChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );
    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
  });

  it("calls onInputChange when input changes", () => {
    const onInputChange = vi.fn();
    render(
      <EnemyStatsSection
        abilityScores={ABILITY_SCORES}
        abilityScoreInputs={ABILITY_INPUTS}
        onInputChange={onInputChange}
        onBlur={vi.fn()}
      />,
    );
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "18" } });
    expect(onInputChange).toHaveBeenCalled();
  });

  it("calls onBlur when input loses focus", () => {
    const onBlur = vi.fn();
    render(
      <EnemyStatsSection
        abilityScores={ABILITY_SCORES}
        abilityScoreInputs={ABILITY_INPUTS}
        onInputChange={vi.fn()}
        onBlur={onBlur}
      />,
    );
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.blur(inputs[0]);
    expect(onBlur).toHaveBeenCalled();
  });

  it("renders modifier for Fuerza (16 → +3)", () => {
    render(
      <EnemyStatsSection
        abilityScores={ABILITY_SCORES}
        abilityScoreInputs={ABILITY_INPUTS}
        onInputChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("renders modifier for Carisma (8 → -1)", () => {
    render(
      <EnemyStatsSection
        abilityScores={ABILITY_SCORES}
        abilityScoreInputs={ABILITY_INPUTS}
        onInputChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );
    expect(screen.getByText("-1")).toBeInTheDocument();
  });
});

// ─── ActionsSection ───────────────────────────────────────────────────────────

describe("ActionsSection", () => {
  const emptyProps = {
    pasivas: [],
    addPasiva: vi.fn(),
    updatePasiva: vi.fn(),
    removePasiva: vi.fn(),
    acciones: [],
    addAccion: vi.fn(),
    updateAccion: vi.fn(),
    removeAccion: vi.fn(),
  };

  it("renders Pasivas and Acciones headers", () => {
    render(<ActionsSection {...emptyProps} />);
    expect(screen.getByText("Pasivas")).toBeInTheDocument();
    expect(screen.getByText("Acciones")).toBeInTheDocument();
  });

  it("renders '+ Pasiva' and '+ Acción' buttons", () => {
    render(<ActionsSection {...emptyProps} />);
    expect(screen.getByText("+ Pasiva")).toBeInTheDocument();
    expect(screen.getByText("+ Acción")).toBeInTheDocument();
  });

  it("calls addPasiva when '+ Pasiva' is clicked", () => {
    const addPasiva = vi.fn();
    render(<ActionsSection {...emptyProps} addPasiva={addPasiva} />);
    fireEvent.click(screen.getByText("+ Pasiva"));
    expect(addPasiva).toHaveBeenCalledTimes(1);
  });

  it("calls addAccion when '+ Acción' is clicked", () => {
    const addAccion = vi.fn();
    render(<ActionsSection {...emptyProps} addAccion={addAccion} />);
    fireEvent.click(screen.getByText("+ Acción"));
    expect(addAccion).toHaveBeenCalledTimes(1);
  });

  it("renders pasiva entries with inputs", () => {
    render(
      <ActionsSection
        {...emptyProps}
        pasivas={[{ nombre: "Resistencia", descripcion: "Tira 2 veces." }]}
      />,
    );
    expect(screen.getByDisplayValue("Resistencia")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tira 2 veces.")).toBeInTheDocument();
  });

  it("calls updatePasiva when pasiva nombre changes", () => {
    const updatePasiva = vi.fn();
    render(
      <ActionsSection
        {...emptyProps}
        pasivas={[{ nombre: "Resistencia", descripcion: "" }]}
        updatePasiva={updatePasiva}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Resistencia"), {
      target: { value: "Nueva pasiva" },
    });
    expect(updatePasiva).toHaveBeenCalledWith(0, "nombre", "Nueva pasiva");
  });

  it("calls removePasiva when trash button in pasiva is clicked", () => {
    const removePasiva = vi.fn();
    render(
      <ActionsSection
        {...emptyProps}
        pasivas={[{ nombre: "Pasiva 1", descripcion: "" }]}
        removePasiva={removePasiva}
      />,
    );
    // The Trash2 icon renders as SVG; find the button by its container
    const trashBtns = document.querySelectorAll(".text-red-400");
    if (trashBtns[0]) fireEvent.click(trashBtns[0]);
    expect(removePasiva).toHaveBeenCalledWith(0);
  });

  it("renders accion entries with inputs", () => {
    render(
      <ActionsSection
        {...emptyProps}
        acciones={[{ nombre: "Ataque", descripcion: "Golpea al objetivo." }]}
      />,
    );
    expect(screen.getByDisplayValue("Ataque")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Golpea al objetivo.")).toBeInTheDocument();
  });

  it("shows field error for pasiva when provided", () => {
    render(
      <ActionsSection
        {...emptyProps}
        pasivas={[{ nombre: "", descripcion: "" }]}
        fieldErrorsPasivas={{ 0: "El nombre es requerido" }}
      />,
    );
    expect(screen.getByText("El nombre es requerido")).toBeInTheDocument();
  });

  it("shows character count warning when description exceeds 400 chars for pasiva", () => {
    const longDesc = "A".repeat(450);
    render(
      <ActionsSection
        {...emptyProps}
        pasivas={[{ nombre: "Test", descripcion: longDesc }]}
      />,
    );
    expect(screen.getByText("450/500")).toBeInTheDocument();
  });

  it("disables '+ Pasiva' button when 20 pasivas are present", () => {
    const pasivas = Array.from({ length: 20 }, (_, i) => ({
      nombre: `Pasiva ${i}`,
      descripcion: "",
    }));
    render(<ActionsSection {...emptyProps} pasivas={pasivas} />);
    const btn = screen.getByText("+ Pasiva") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

// ─── SkillsAndSavesSection ─────────────────────────────────────────────────

describe("SkillsAndSavesSection", () => {
  const baseProps = {
    skillOverrides: [],
    usedSkills: [],
    availableSkills: [
      { name: "acrobacia", displayName: "Acrobacia" },
      { name: "atletismo", displayName: "Atletismo" },
    ],
    addSkill: vi.fn(),
    updateSkill: vi.fn(),
    removeSkill: vi.fn(),
    saveOverrides: [],
    usedSaves: [],
    availableSaves: [
      { statName: "Fuerza", displayName: "Fuerza" },
      { statName: "Destreza", displayName: "Destreza" },
    ],
    addSave: vi.fn(),
    updateSave: vi.fn(),
    removeSave: vi.fn(),
  };

  it("renders Habilidades and Salvaciones headers", () => {
    render(<SkillsAndSavesSection {...baseProps} />);
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
    expect(screen.getByText("Salvaciones")).toBeInTheDocument();
  });

  it("renders '+ Habilidad' and '+ Salvación' buttons", () => {
    render(<SkillsAndSavesSection {...baseProps} />);
    expect(screen.getByText("+ Habilidad")).toBeInTheDocument();
    expect(screen.getByText("+ Salvación")).toBeInTheDocument();
  });

  it("calls addSkill when '+ Habilidad' is clicked", () => {
    const addSkill = vi.fn();
    render(<SkillsAndSavesSection {...baseProps} addSkill={addSkill} />);
    fireEvent.click(screen.getByText("+ Habilidad"));
    expect(addSkill).toHaveBeenCalledTimes(1);
  });

  it("calls addSave when '+ Salvación' is clicked", () => {
    const addSave = vi.fn();
    render(<SkillsAndSavesSection {...baseProps} addSave={addSave} />);
    fireEvent.click(screen.getByText("+ Salvación"));
    expect(addSave).toHaveBeenCalledTimes(1);
  });

  it("disables '+ Habilidad' when no available skills", () => {
    render(<SkillsAndSavesSection {...baseProps} availableSkills={[]} />);
    const btn = screen.getByText("+ Habilidad") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("disables '+ Salvación' when no available saves", () => {
    render(<SkillsAndSavesSection {...baseProps} availableSaves={[]} />);
    const btn = screen.getByText("+ Salvación") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("renders skill override row with select and bonus input", () => {
    render(
      <SkillsAndSavesSection
        {...baseProps}
        skillOverrides={[{ skill: "acrobacia", bonus: 3 }]}
        usedSkills={["acrobacia"]}
      />,
    );
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0]).toHaveValue(3);
  });

  it("calls updateSkill when skill bonus input changes", () => {
    const updateSkill = vi.fn();
    render(
      <SkillsAndSavesSection
        {...baseProps}
        skillOverrides={[{ skill: "acrobacia", bonus: 2 }]}
        updateSkill={updateSkill}
      />,
    );
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "5" } });
    expect(updateSkill).toHaveBeenCalled();
  });

  it("calls removeSkill when trash button for skill is clicked", () => {
    const removeSkill = vi.fn();
    render(
      <SkillsAndSavesSection
        {...baseProps}
        skillOverrides={[{ skill: "acrobacia", bonus: 2 }]}
        removeSkill={removeSkill}
      />,
    );
    const trashBtns = document.querySelectorAll(".text-red-400");
    if (trashBtns[0]) fireEvent.click(trashBtns[0]);
    expect(removeSkill).toHaveBeenCalledWith(0);
  });

  it("renders save override row with select and bonus input", () => {
    render(
      <SkillsAndSavesSection
        {...baseProps}
        saveOverrides={[{ ability: "Fuerza", bonus: 4 }]}
        usedSaves={["Fuerza"]}
      />,
    );
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("calls removeSave when trash button for save is clicked", () => {
    const removeSave = vi.fn();
    render(
      <SkillsAndSavesSection
        {...baseProps}
        saveOverrides={[{ ability: "Fuerza", bonus: 2 }]}
        removeSave={removeSave}
      />,
    );
    const trashBtns = document.querySelectorAll(".text-red-400");
    if (trashBtns[0]) fireEvent.click(trashBtns[0]);
    expect(removeSave).toHaveBeenCalledWith(0);
  });
});
