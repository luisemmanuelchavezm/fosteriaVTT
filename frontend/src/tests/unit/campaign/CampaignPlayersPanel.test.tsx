// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CampaignPlayersPanel from "../../../screens/campaign/components/CampaignPlayersPanel";

afterEach(() => cleanup());

describe("CampaignPlayersPanel", () => {
  it("renderiza sin errores con lista vacía", () => {
    const { container } = render(<CampaignPlayersPanel players={[]} />);
    expect(container).toBeTruthy();
  });

  it("muestra 'Jugadores' como título", () => {
    render(<CampaignPlayersPanel players={[]} />);
    expect(screen.getByText("Jugadores")).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay jugadores", () => {
    render(<CampaignPlayersPanel players={[]} />);
    expect(screen.getByText(/no hay jugadores/i)).toBeInTheDocument();
  });

  it("muestra el nombre de los jugadores", () => {
    const players = [
      { username: "Alice", dm: false },
      { username: "Bob", dm: true },
    ];
    render(<CampaignPlayersPanel players={players} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob.*dm/i)).toBeInTheDocument();
  });

  it("muestra mensaje de error cuando se proporciona", () => {
    render(
      <CampaignPlayersPanel players={[]} errorMessage="Error de conexión" />,
    );
    expect(screen.getByText("Error de conexión")).toBeInTheDocument();
  });

  it("no muestra 'no hay jugadores' cuando hay un mensaje de error", () => {
    render(<CampaignPlayersPanel players={[]} errorMessage="Error" />);
    expect(screen.queryByText(/no hay jugadores/i)).not.toBeInTheDocument();
  });

  it("indica el rol de DM con (dm) en el nombre", () => {
    const players = [{ username: "GameMaster", dm: true }];
    render(<CampaignPlayersPanel players={players} />);
    expect(screen.getByText(/GameMaster.*dm/i)).toBeInTheDocument();
  });
});
