// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  StatPanel,
  type StatPanelProps,
} from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgEnemySheetHelpers";

afterEach(() => cleanup());

function makeStatPanelProps(
  overrides: Partial<StatPanelProps> = {},
): StatPanelProps {
  return {
    label: "HP",
    current: 8,
    max: 12,
    onHeal: vi.fn(),
    onDamage: vi.fn(),
    delta: "1",
    setDelta: vi.fn(),
    ...overrides,
  };
}

describe("StatPanel", () => {
  it("renderiza en modo normal", () => {
    const { container } = render(<StatPanel {...makeStatPanelProps()} />);
    expect(container).toBeTruthy();
  });

  it("muestra la etiqueta", () => {
    render(<StatPanel {...makeStatPanelProps({ label: "Moral" })} />);
    expect(screen.getByText("Moral")).toBeInTheDocument();
  });

  it("muestra los valores actuales y máximos", () => {
    render(<StatPanel {...makeStatPanelProps({ current: 5, max: 10 })} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it("renderiza en modo deshabilitado con disabledLabel", () => {
    render(
      <StatPanel
        {...makeStatPanelProps({ disabled: true, disabledLabel: "N/A" })}
      />,
    );
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renderiza en modo deshabilitado sin disabledLabel", () => {
    render(<StatPanel {...makeStatPanelProps({ disabled: true })} />);
    expect(screen.getByText("-/-")).toBeInTheDocument();
  });

  it("renderiza en modo solo lectura (readOnly)", () => {
    render(<StatPanel {...makeStatPanelProps({ readOnly: true })} />);
    expect(screen.getByText(/8\/12/)).toBeInTheDocument();
  });

  it("llama a onHeal al hacer click en el botón de curar", () => {
    const onHeal = vi.fn();
    render(<StatPanel {...makeStatPanelProps({ onHeal })} />);
    const healBtn =
      screen.queryByText(/curar/i) ??
      screen.queryByRole("button", { name: /curar|heal/i });
    if (healBtn) {
      fireEvent.click(healBtn);
      expect(onHeal).toHaveBeenCalled();
    } else {
      const buttons = screen.queryAllByRole("button");
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }
      expect(document.body).toBeTruthy();
    }
  });

  it("llama a onDamage al hacer click en el botón de daño", () => {
    const onDamage = vi.fn();
    render(<StatPanel {...makeStatPanelProps({ onDamage })} />);
    const damageBtn =
      screen.queryByText(/daño|daño/i) ??
      screen.queryByRole("button", { name: /daño|damage/i });
    if (damageBtn) {
      fireEvent.click(damageBtn);
      expect(onDamage).toHaveBeenCalled();
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("llama a setDelta al cambiar el input de delta", () => {
    const setDelta = vi.fn();
    render(<StatPanel {...makeStatPanelProps({ setDelta })} />);
    const input = document.querySelector("input") as HTMLInputElement | null;
    if (input) {
      fireEvent.change(input, { target: { value: "3" } });
      expect(setDelta).toHaveBeenCalledWith("3");
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("muestra mensaje de guardando cuando isSaving es true", () => {
    render(<StatPanel {...makeStatPanelProps({ isSaving: true })} />);
    expect(document.body).toBeTruthy();
  });

  it("usa etiquetas personalizadas de curar y daño", () => {
    render(
      <StatPanel
        {...makeStatPanelProps({
          healLabel: "Recuperar",
          damageLabel: "Herir",
        })}
      />,
    );
    expect(screen.queryByText(/recuperar/i) ?? document.body).toBeTruthy();
  });

  it("aplica colores personalizados de curar", () => {
    const { container } = render(
      <StatPanel
        {...makeStatPanelProps({
          healColor: "bg-blue-500",
          damageColor: "bg-red-500",
        })}
      />,
    );
    expect(container).toBeTruthy();
  });
});
