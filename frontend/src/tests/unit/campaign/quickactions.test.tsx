// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import AdvantageResultOverlay from "../../../screens/campaign/components/quickactions/AdvantageResultOverlay";
import AttackPanel from "../../../screens/campaign/components/quickactions/AttackPanel";
import SpellsPanel from "../../../screens/campaign/components/quickactions/SpellsPanel";
import ResourcesPanel from "../../../screens/campaign/components/quickactions/ResourcesPanel";
import SkillPanel from "../../../screens/campaign/components/quickactions/SkillPanel";
import SavePanel from "../../../screens/campaign/components/quickactions/SavePanel";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ── AdvantageResultOverlay ─────────────────────────────────────────────────

describe("AdvantageResultOverlay", () => {
  const ADVANTAGE_RESULT = {
    die1: 15,
    die2: 8,
    modifier: 3,
    weaponName: "Espada larga",
    type: "ventaja" as const,
  };

  it("renders two dice results for advantage roll", () => {
    render(<AdvantageResultOverlay advantageResult={ADVANTAGE_RESULT} />);
    // Both dice values should appear
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8").length).toBeGreaterThan(0);
  });

  it("shows weapon name and type label", () => {
    render(<AdvantageResultOverlay advantageResult={ADVANTAGE_RESULT} />);
    expect(screen.getAllByText(/Espada larga · Con ventaja/).length).toBe(2);
  });

  it("shows 'Con desventaja' label for disadvantage rolls", () => {
    const disadvantage = { ...ADVANTAGE_RESULT, type: "desventaja" as const };
    render(<AdvantageResultOverlay advantageResult={disadvantage} />);
    expect(screen.getAllByText(/Con desventaja/).length).toBe(2);
  });

  it("shows modifier when it is non-zero", () => {
    render(<AdvantageResultOverlay advantageResult={ADVANTAGE_RESULT} />);
    // modifier +3 should appear
    expect(screen.getAllByText("+3").length).toBeGreaterThan(0);
  });

  it("does not show modifier block when modifier is 0", () => {
    const noMod = { ...ADVANTAGE_RESULT, modifier: 0 };
    render(<AdvantageResultOverlay advantageResult={noMod} />);
    // +0 should not appear in modifier blocks
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
  });

  it("shows totals for each die", () => {
    render(<AdvantageResultOverlay advantageResult={ADVANTAGE_RESULT} />);
    // die1=15 + mod=3 = 18 and die2=8 + mod=3 = 11
    expect(screen.getAllByText("18").length).toBeGreaterThan(0);
    expect(screen.getAllByText("11").length).toBeGreaterThan(0);
  });

  it("shows 'Resultado' header", () => {
    render(<AdvantageResultOverlay advantageResult={ADVANTAGE_RESULT} />);
    expect(screen.getAllByText("Resultado").length).toBe(2);
  });
});

// ── AttackPanel ────────────────────────────────────────────────────────────

describe("AttackPanel", () => {
  const WEAPONS = [
    { id: 1, name: "Espada corta", attackBonus: 5, damageExpression: "1d6+3" },
    { id: 2, name: "Arco largo", attackBonus: 4, damageExpression: "1d8+2" },
  ];

  it("shows loading state when isLoadingDetail is true", () => {
    render(
      <AttackPanel
        isLoadingDetail
        weaponOptions={[]}
        selectedWeapon={null}
        attackRollActions={[]}
        onSelectWeapon={vi.fn()}
      />,
    );
    expect(screen.getByText("Cargando armas...")).toBeInTheDocument();
  });

  it("shows empty message when no weapons", () => {
    render(
      <AttackPanel
        isLoadingDetail={false}
        weaponOptions={[]}
        selectedWeapon={null}
        attackRollActions={[]}
        onSelectWeapon={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Este personaje no tiene armas en su mochila."),
    ).toBeInTheDocument();
  });

  it("renders weapon list when weapons available", () => {
    render(
      <AttackPanel
        isLoadingDetail={false}
        weaponOptions={WEAPONS}
        selectedWeapon={null}
        attackRollActions={[]}
        onSelectWeapon={vi.fn()}
      />,
    );
    expect(screen.getByText("Espada corta")).toBeInTheDocument();
    expect(screen.getByText("Arco largo")).toBeInTheDocument();
  });

  it("calls onSelectWeapon when weapon button is clicked", () => {
    const onSelectWeapon = vi.fn();
    render(
      <AttackPanel
        isLoadingDetail={false}
        weaponOptions={WEAPONS}
        selectedWeapon={null}
        attackRollActions={[]}
        onSelectWeapon={onSelectWeapon}
      />,
    );
    fireEvent.click(screen.getByText("Espada corta"));
    expect(onSelectWeapon).toHaveBeenCalledWith(1);
  });

  it("shows selected weapon name when weapon is selected", () => {
    render(
      <AttackPanel
        isLoadingDetail={false}
        weaponOptions={WEAPONS}
        selectedWeapon={WEAPONS[0]}
        attackRollActions={[]}
        onSelectWeapon={vi.fn()}
      />,
    );
    expect(screen.getByText("Espada corta")).toBeInTheDocument();
  });

  it("renders attack roll action buttons when weapon is selected", () => {
    const actions = [
      { id: "normal", label: "Normal", image: "/img.png", onClick: vi.fn() },
      { id: "crit", label: "Crítico", image: "/img2.png", onClick: vi.fn() },
    ];
    render(
      <AttackPanel
        isLoadingDetail={false}
        weaponOptions={WEAPONS}
        selectedWeapon={WEAPONS[0]}
        attackRollActions={actions}
        onSelectWeapon={vi.fn()}
      />,
    );
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Crítico")).toBeInTheDocument();
  });

  it("calls action onClick when roll button is clicked", () => {
    const onClick = vi.fn();
    const actions = [
      { id: "normal", label: "Normal", image: "/img.png", onClick },
    ];
    render(
      <AttackPanel
        isLoadingDetail={false}
        weaponOptions={WEAPONS}
        selectedWeapon={WEAPONS[0]}
        attackRollActions={actions}
        onSelectWeapon={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Normal"));
    expect(onClick).toHaveBeenCalled();
  });
});

// ── SkillPanel ─────────────────────────────────────────────────────────────

const BASE_CHAR: DndCharacterDetailResponse = {
  id: 1,
  nombre: "Héroe",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "DND5",
  raza: null,
  subraza: null,
  clases: [
    { nombre: "Guerrero", nivel: 5, id: "fighter", subclase: null },
  ] as never,
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    Fuerza: 16,
    Destreza: 14,
    Constitucion: 14,
    Inteligencia: 10,
    Sabiduria: 12,
    Carisma: 8,
  },
  habilidades: [],
  mochila: [],
  usado: "",
};

describe("SkillPanel", () => {
  it("shows loading message when isLoadingDetail is true", () => {
    render(
      <SkillPanel
        detail={null}
        isLoadingDetail
        isEnemy={false}
        onRollSkill={vi.fn()}
      />,
    );
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("renders skill grid when not loading", () => {
    render(
      <SkillPanel
        detail={BASE_CHAR}
        isLoadingDetail={false}
        isEnemy={false}
        onRollSkill={vi.fn()}
      />,
    );
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
  });

  it("calls onRollSkill when skill button is clicked", () => {
    const onRollSkill = vi.fn();
    render(
      <SkillPanel
        detail={BASE_CHAR}
        isLoadingDetail={false}
        isEnemy={false}
        onRollSkill={onRollSkill}
      />,
    );
    // Click the first skill button
    const skillButtons = screen.getAllByRole("button");
    if (skillButtons.length > 0) {
      fireEvent.click(skillButtons[0]);
      expect(onRollSkill).toHaveBeenCalled();
    }
  });
});

// ── SavePanel ──────────────────────────────────────────────────────────────

describe("SavePanel", () => {
  it("renders saving throw title", () => {
    render(
      <SavePanel detail={BASE_CHAR} isEnemy={false} onRollSave={vi.fn()} />,
    );
    expect(screen.getByText("Salvaciones")).toBeInTheDocument();
  });

  it("renders 6 saving throw buttons", () => {
    render(
      <SavePanel detail={BASE_CHAR} isEnemy={false} onRollSave={vi.fn()} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(6);
  });

  it("calls onRollSave when a save button is clicked", () => {
    const onRollSave = vi.fn();
    render(
      <SavePanel detail={BASE_CHAR} isEnemy={false} onRollSave={onRollSave} />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onRollSave).toHaveBeenCalled();
  });

  it("renders for enemy character (isEnemy=true)", () => {
    render(
      <SavePanel
        detail={{ ...BASE_CHAR, tipo: "NPC" }}
        isEnemy
        onRollSave={vi.fn()}
      />,
    );
    expect(screen.getByText("Salvaciones")).toBeInTheDocument();
  });
});

// ── SpellsPanel ────────────────────────────────────────────────────────────

describe("SpellsPanel", () => {
  const BASE_SPELL = {
    id: 1,
    nombre: "Bola de fuego",
    bonificacion: null,
    formula: "8d6",
    descripcion: null,
    tags: null,
  };

  it("shows 'No se conoce ningún hechizo' when spellsByLevel is empty", () => {
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={new Map()}
        spellcastingModifier={3}
        spellAttackBonus={5}
        spellSaveDc={13}
        onCastSpell={vi.fn()}
        onRollSpellAttack={vi.fn()}
      />,
    );
    expect(screen.getByText("No se conoce ningún hechizo")).toBeInTheDocument();
    expect(screen.getByText("Hechizos")).toBeInTheDocument();
  });

  it("shows '--' when spellcastingModifier is null", () => {
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={new Map()}
        spellcastingModifier={null}
        spellAttackBonus={null}
        spellSaveDc={null}
        onCastSpell={vi.fn()}
        onRollSpellAttack={vi.fn()}
      />,
    );
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });

  it("renders spells from spellsByLevel map", () => {
    const spells = new Map([[3, [BASE_SPELL]]]);
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={spells}
        spellcastingModifier={3}
        spellAttackBonus={5}
        spellSaveDc={13}
        onCastSpell={vi.fn()}
        onRollSpellAttack={vi.fn()}
      />,
    );
    expect(screen.getByText("Bola de fuego")).toBeInTheDocument();
    expect(screen.getByText("Nivel 3")).toBeInTheDocument();
  });

  it("renders cantrips (level 0) as 'Trucos'", () => {
    const cantrip = { ...BASE_SPELL, id: 99, nombre: "Luz" };
    const spells = new Map([[0, [cantrip]]]);
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={spells}
        spellcastingModifier={3}
        spellAttackBonus={5}
        spellSaveDc={13}
        onCastSpell={vi.fn()}
        onRollSpellAttack={vi.fn()}
      />,
    );
    expect(screen.getByText("Trucos")).toBeInTheDocument();
    expect(screen.getByText("Luz")).toBeInTheDocument();
  });

  it("calls onCastSpell when spell button is clicked", () => {
    const onCastSpell = vi.fn();
    const spells = new Map([[1, [BASE_SPELL]]]);
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={spells}
        spellcastingModifier={3}
        spellAttackBonus={5}
        spellSaveDc={13}
        onCastSpell={onCastSpell}
        onRollSpellAttack={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Bola de fuego"));
    expect(onCastSpell).toHaveBeenCalledWith(BASE_SPELL);
  });

  it("calls onRollSpellAttack when spell attack button is clicked", () => {
    const onRollSpellAttack = vi.fn();
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={new Map()}
        spellcastingModifier={3}
        spellAttackBonus={5}
        spellSaveDc={13}
        onCastSpell={vi.fn()}
        onRollSpellAttack={onRollSpellAttack}
      />,
    );
    fireEvent.click(screen.getByText("Ataque de hechizos"));
    expect(onRollSpellAttack).toHaveBeenCalledWith(5);
  });

  it("shows formatted spell modifier", () => {
    render(
      <SpellsPanel
        detail={BASE_CHAR}
        spellsByLevel={new Map()}
        spellcastingModifier={4}
        spellAttackBonus={null}
        spellSaveDc={15}
        onCastSpell={vi.fn()}
        onRollSpellAttack={vi.fn()}
      />,
    );
    expect(screen.getByText("+4")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });
});

// ── ResourcesPanel ─────────────────────────────────────────────────────────

describe("ResourcesPanel", () => {
  const BASE_RESOURCES = {
    resourceTab: "spells" as const,
    spellSlotMaximums: { 1: 4, 2: 3 },
    resourceSpellSlots: { 1: 2, 2: 3 },
    extraResourceRows: [],
    resourceMoney: { ppt: 0, po: 10, pp: 0, pc: 5 },
    onTabChange: vi.fn(),
    onSpellSlotChange: vi.fn(),
    onExtraResourceChange: vi.fn(),
    onMoneyChange: vi.fn(),
  };

  it("renders tabs: Hechizos, Extra, Dinero", () => {
    render(<ResourcesPanel {...BASE_RESOURCES} />);
    expect(screen.getByText("Hechizos")).toBeInTheDocument();
    expect(screen.getByText("Extra")).toBeInTheDocument();
    expect(screen.getByText("Dinero")).toBeInTheDocument();
  });

  it("calls onTabChange when tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<ResourcesPanel {...BASE_RESOURCES} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText("Dinero"));
    expect(onTabChange).toHaveBeenCalledWith("money");
  });

  it("shows spell slots when resourceTab is spells", () => {
    render(<ResourcesPanel {...BASE_RESOURCES} resourceTab="spells" />);
    // Slot levels 1-9 should be rendered
    expect(screen.getByText("Recursos")).toBeInTheDocument();
    // Spell level indicators (1 through 9 appear in articles)
    const allArticles = screen.getAllByRole("article");
    expect(allArticles.length).toBeGreaterThan(0);
  });

  it("calls onSpellSlotChange when spell slot - is clicked", () => {
    const onSpellSlotChange = vi.fn();
    render(
      <ResourcesPanel
        {...BASE_RESOURCES}
        onSpellSlotChange={onSpellSlotChange}
      />,
    );
    // Find minus buttons - first enabled one should work
    const buttons = screen.getAllByText("-");
    // Click first non-disabled minus
    const enabledMinus = buttons.find(
      (b) => !(b as HTMLButtonElement).disabled,
    );
    if (enabledMinus) fireEvent.click(enabledMinus);
    expect(onSpellSlotChange).toHaveBeenCalled();
  });

  it("shows extra resource tab content", () => {
    const extraRows = [{ index: 1, max: 3, current: 2, valor: 2 }];
    render(
      <ResourcesPanel
        {...BASE_RESOURCES}
        resourceTab="extra"
        extraResourceRows={extraRows}
      />,
    );
    expect(screen.getByText("Extra 1")).toBeInTheDocument();
  });

  it("shows 'Este personaje no tiene recursos extra.' when extraResourceRows is empty", () => {
    render(
      <ResourcesPanel
        {...BASE_RESOURCES}
        resourceTab="extra"
        extraResourceRows={[]}
      />,
    );
    expect(
      screen.getByText("Este personaje no tiene recursos extra."),
    ).toBeInTheDocument();
  });

  it("calls onExtraResourceChange when extra resource +/- is clicked", () => {
    const onExtraResourceChange = vi.fn();
    const extraRows = [{ index: 1, max: 3, current: 2, valor: 2 }];
    render(
      <ResourcesPanel
        {...BASE_RESOURCES}
        resourceTab="extra"
        extraResourceRows={extraRows}
        onExtraResourceChange={onExtraResourceChange}
      />,
    );
    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[0]);
    expect(onExtraResourceChange).toHaveBeenCalledWith(1, -1);
  });

  it("shows money tab with currency values", () => {
    render(
      <ResourcesPanel
        {...BASE_RESOURCES}
        resourceTab="money"
        resourceMoney={{ ppt: 5, po: 10, pp: 2, pc: 100 }}
      />,
    );
    expect(screen.getByText("Platino")).toBeInTheDocument();
    expect(screen.getByText("Oro")).toBeInTheDocument();
    expect(screen.getByText("Plata")).toBeInTheDocument();
    expect(screen.getByText("Cobre")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("calls onMoneyChange when money - is clicked", () => {
    const onMoneyChange = vi.fn();
    render(
      <ResourcesPanel
        {...BASE_RESOURCES}
        resourceTab="money"
        onMoneyChange={onMoneyChange}
      />,
    );
    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[0]);
    expect(onMoneyChange).toHaveBeenCalled();
  });
});
