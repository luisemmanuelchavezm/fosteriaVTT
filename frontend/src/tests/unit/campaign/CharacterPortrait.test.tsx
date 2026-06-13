// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CharacterPortrait from "../../../screens/campaign/components/CharacterPortrait";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";

function makePosition(
  overrides: Partial<CampaignPositionResponse> = {},
): CampaignPositionResponse {
  return {
    id: 1,
    pestanaId: 1,
    capa: "fichas",
    personajeId: 10,
    personajeNombre: "Aragorn",
    retrato: null,
    posicionX: 0,
    posicionY: 0,
    largo: 1,
    ancho: 1,
    tipo: "personaje",
    ...overrides,
  } as unknown as CampaignPositionResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CharacterPortrait", () => {
  it("renders character name", () => {
    render(
      <CharacterPortrait
        selectedPosition={makePosition()}
        portraitFailed={false}
        onPortraitError={vi.fn()}
      />,
    );
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("renders 'Seleccionado' label", () => {
    render(
      <CharacterPortrait
        selectedPosition={makePosition()}
        portraitFailed={false}
        onPortraitError={vi.fn()}
      />,
    );
    expect(screen.getByText("Seleccionado")).toBeInTheDocument();
  });

  it("renders SVG fallback when retrato is null", () => {
    render(
      <CharacterPortrait
        selectedPosition={makePosition()}
        portraitFailed={false}
        onPortraitError={vi.fn()}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders portrait image when retrato is set and portraitFailed is false", () => {
    render(
      <CharacterPortrait
        selectedPosition={makePosition({
          retrato: "http://example.com/img.png",
        })}
        portraitFailed={false}
        onPortraitError={vi.fn()}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://example.com/img.png");
    expect(img).toHaveAttribute("alt", "Aragorn");
  });

  it("renders SVG fallback when portraitFailed is true even if retrato is set", () => {
    render(
      <CharacterPortrait
        selectedPosition={makePosition({
          retrato: "http://example.com/img.png",
        })}
        portraitFailed={true}
        onPortraitError={vi.fn()}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("calls onPortraitError when image fails to load", () => {
    const onPortraitError = vi.fn();
    render(
      <CharacterPortrait
        selectedPosition={makePosition({
          retrato: "http://bad.url/img.png",
        })}
        portraitFailed={false}
        onPortraitError={onPortraitError}
      />,
    );
    const img = screen.getByRole("img");
    fireEvent.error(img);
    expect(onPortraitError).toHaveBeenCalledTimes(1);
  });

  it("renders a different character name when passed", () => {
    render(
      <CharacterPortrait
        selectedPosition={makePosition({ personajeNombre: "Gandalf" })}
        portraitFailed={false}
        onPortraitError={vi.fn()}
      />,
    );
    expect(screen.getByText("Gandalf")).toBeInTheDocument();
  });
});
