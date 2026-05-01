// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ChoiceChecklist from "../../../screens/personaje/creatednd/components/ChoiceChecklist";

afterEach(() => {
  cleanup();
});

const baseProps = {
  title: "Habilidades de clase",
  options: ["Atletismo", "Acrobacias", "Intimidación", "Persuasión"],
  selectedValues: [] as string[],
  maxSelections: 2,
  onChange: vi.fn(),
};

describe("ChoiceChecklist", () => {
  it("renders title and selection counter", () => {
    render(<ChoiceChecklist {...baseProps} />);

    expect(screen.getByText("Habilidades de clase")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
  });

  it("renders all options as buttons and marks selected items", () => {
    render(<ChoiceChecklist {...baseProps} selectedValues={["Atletismo"]} />);

    expect(screen.getByText("Atletismo")).toBeInTheDocument();
    expect(screen.getByText("Acrobacias")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("calls onChange with added value when an unselected option is clicked", () => {
    const onChange = vi.fn();
    render(<ChoiceChecklist {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByText("Atletismo"));
    expect(onChange).toHaveBeenCalledWith(["Atletismo"]);
  });

  it("calls onChange removing value when a selected option is clicked again", () => {
    const onChange = vi.fn();
    render(
      <ChoiceChecklist
        {...baseProps}
        selectedValues={["Atletismo"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByText("Atletismo"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("does not call onChange when max selections reached and new option clicked", () => {
    const onChange = vi.fn();
    render(
      <ChoiceChecklist
        {...baseProps}
        selectedValues={["Atletismo", "Acrobacias"]}
        onChange={onChange}
      />,
    );

    // Intimidación is unselected and max is reached — button should be disabled
    const intimidacion = screen.getByText("Intimidación").closest("button");
    expect(intimidacion).toBeDisabled();

    fireEvent.click(screen.getByText("Intimidación"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders description when provided", () => {
    render(
      <ChoiceChecklist
        {...baseProps}
        description="Elige 2 de las siguientes habilidades"
      />,
    );

    expect(
      screen.getByText("Elige 2 de las siguientes habilidades"),
    ).toBeInTheDocument();
  });

  it("renders validation error message when error prop is set", () => {
    render(
      <ChoiceChecklist
        {...baseProps}
        error="Debes elegir al menos una habilidad"
      />,
    );

    expect(
      screen.getByText("Debes elegir al menos una habilidad"),
    ).toBeInTheDocument();
  });

  it("renders Info+ buttons when showInfoAction and onInfoClick are provided", () => {
    const onInfoClick = vi.fn();
    render(
      <ChoiceChecklist
        {...baseProps}
        showInfoAction
        onInfoClick={onInfoClick}
      />,
    );

    const infoButtons = screen.getAllByText("Info+");
    expect(infoButtons).toHaveLength(baseProps.options.length);
  });

  it("calls onInfoClick with the option name when Info+ is clicked", () => {
    const onInfoClick = vi.fn();
    render(
      <ChoiceChecklist
        {...baseProps}
        showInfoAction
        onInfoClick={onInfoClick}
      />,
    );

    fireEvent.click(screen.getAllByText("Info+")[0]);
    expect(onInfoClick).toHaveBeenCalledWith("Atletismo");
  });
});
