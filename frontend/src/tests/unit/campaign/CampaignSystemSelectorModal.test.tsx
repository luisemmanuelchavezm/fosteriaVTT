// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import CampaignSystemSelectorModal from "../../../components/CampaignSystemSelectorModal";

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  onSelect: vi.fn(),
};

describe("CampaignSystemSelectorModal", () => {
  it("renders null when isOpen is false", () => {
    const { container } = render(
      <CampaignSystemSelectorModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders title and description when open", () => {
    render(<CampaignSystemSelectorModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Elige el sistema de juego")).toBeInTheDocument();
    expect(screen.getByText("Nueva campaña")).toBeInTheDocument();
    expect(
      screen.getByText("Selecciona el sistema para comenzar la campaña."),
    ).toBeInTheDocument();
  });

  it("renders D&D and Mork Borg options", () => {
    render(<CampaignSystemSelectorModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Dungeons and Dragons")).toBeInTheDocument();
    expect(screen.getByText("Mork Borg")).toBeInTheDocument();
  });

  it("renders D&D description", () => {
    render(<CampaignSystemSelectorModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Crea una campaña de D&D.")).toBeInTheDocument();
  });

  it("renders Mork Borg description", () => {
    render(<CampaignSystemSelectorModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByText("Crea una campaña de Mork Borg."),
    ).toBeInTheDocument();
  });

  it("calls onClose when × button is clicked", () => {
    const onClose = vi.fn();
    render(
      <CampaignSystemSelectorModal {...DEFAULT_PROPS} onClose={onClose} />,
    );
    fireEvent.click(screen.getByLabelText("Cerrar modal de creación"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect with 'Dungeons and Dragons' when D&D button is clicked", () => {
    const onSelect = vi.fn();
    render(
      <CampaignSystemSelectorModal {...DEFAULT_PROPS} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Dungeons and Dragons"));
    expect(onSelect).toHaveBeenCalledWith("Dungeons and Dragons");
  });

  it("calls onSelect with 'Mork Borg' when Mork Borg button is clicked", () => {
    const onSelect = vi.fn();
    render(
      <CampaignSystemSelectorModal {...DEFAULT_PROPS} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Mork Borg"));
    expect(onSelect).toHaveBeenCalledWith("Mork Borg");
  });

  it("renders the D&D abbreviation badge", () => {
    render(<CampaignSystemSelectorModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("D&D")).toBeInTheDocument();
  });

  it("renders the MB abbreviation badge", () => {
    render(<CampaignSystemSelectorModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("MB")).toBeInTheDocument();
  });
});
