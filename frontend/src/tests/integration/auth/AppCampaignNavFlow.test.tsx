// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "../../../App";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../../lib/api", () => ({
  buildApiUrl: (path: string) => `http://localhost:8080${path}`,
}));

vi.mock("../../../screens/LoginScreen", () => ({
  default: ({
    onLoginSuccess,
  }: {
    onLoginSuccess: (
      token: string,
      username: string,
      avatarUrl: string,
    ) => void;
  }) => (
    <div>
      <button onClick={() => onLoginSuccess("jwt-token", "DM", "")}>
        login
      </button>
    </div>
  ),
}));

vi.mock("../../../screens/RegisterScreen", () => ({
  default: () => <div>register</div>,
}));

vi.mock("../../../screens/HomeScreen", () => ({
  default: ({
    onLogout,
    onGoCampaigns,
    onCreateCampaign,
    onOpenCampaignHome,
  }: {
    onLogout: () => void;
    onGoCampaigns: () => void;
    onCreateCampaign: (system: string) => void;
    onOpenCampaignHome: (id: string) => void;
  }) => (
    <div>
      <p>home</p>
      <button onClick={onLogout}>logout</button>
      <button onClick={onGoCampaigns}>ir campañas</button>
      <button onClick={() => onCreateCampaign("Dungeons and Dragons")}>
        crear campaña
      </button>
      <button onClick={() => onOpenCampaignHome("42")}>
        abrir campaña home
      </button>
    </div>
  ),
}));

vi.mock("../../../screens/CampaignsScreen.tsx", () => ({
  default: ({
    onGoHome,
    onCreateCampaign,
    onOpenCampaignHome,
  }: {
    onGoHome: () => void;
    onCreateCampaign: (system: string) => void;
    onOpenCampaignHome: (id: string) => void;
  }) => (
    <div>
      <p>campaigns</p>
      <button onClick={onGoHome}>volver home</button>
      <button onClick={() => onCreateCampaign("Dungeons and Dragons")}>
        crear campaña dnd
      </button>
      <button onClick={() => onOpenCampaignHome("55")}>abrir campaña</button>
    </div>
  ),
}));

vi.mock("../../../screens/CharactersScreen", () => ({
  default: () => <div>characters</div>,
}));

vi.mock("../../../screens/CreateCampaignScreen", () => ({
  default: ({
    initialSystem,
    onCampaignCreated,
    onGoHome,
  }: {
    initialSystem: string;
    onCampaignCreated: (id: string) => void;
    onGoHome: () => void;
  }) => (
    <div>
      <p>create-campaign:{initialSystem}</p>
      <button onClick={() => onCampaignCreated("99")}>campaña creada</button>
      <button onClick={onGoHome}>volver home</button>
    </div>
  ),
}));

vi.mock("../../../screens/campaign/CampaignHomeScreen", () => ({
  default: ({
    campaignId,
    onExit,
    onOpenCampaignPestaña,
  }: {
    campaignId: string;
    onExit: () => void;
    onOpenCampaignPestaña: () => void;
  }) => (
    <div>
      <p>campaign-home:{campaignId}</p>
      <button onClick={onExit}>salir campaña</button>
      <button onClick={onOpenCampaignPestaña}>abrir pestaña</button>
    </div>
  ),
}));

vi.mock("../../../screens/campaign/CampaignPestañaScreen", () => ({
  default: ({
    campaignId,
    onBack,
    onGoCampaigns,
  }: {
    campaignId: string;
    onBack: () => void;
    onGoCampaigns: () => void;
  }) => (
    <div>
      <p>campaign-pestaña:{campaignId}</p>
      <button onClick={onBack}>volver campaña</button>
      <button onClick={onGoCampaigns}>ir campañas</button>
    </div>
  ),
}));

vi.mock(
  "../../../screens/personaje/creatednd/CreateDndCharacterScreen",
  () => ({
    default: () => <div>create-dnd</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/DndCharacterSheetScreen",
  () => ({
    default: () => <div>dnd-sheet</div>,
  }),
);

// ─── Setup ────────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("App campaign navigation flow", () => {
  const loginAndGoHome = () => {
    localStorage.setItem("jwtToken", "jwt-token");
    localStorage.setItem("username", "DM");
    render(<App />);
    // Already logged in, starts at home
    expect(screen.getByText("home")).toBeInTheDocument();
  };

  // ── Create campaign flow ────────────────────────────────────────────────────

  it("navigates to CreateCampaignScreen when onCreateCampaign is called", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("crear campaña"));
    expect(
      screen.getByText("create-campaign:Dungeons and Dragons"),
    ).toBeInTheDocument();
  });

  it("navigates back to home from CreateCampaignScreen", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("crear campaña"));
    fireEvent.click(screen.getByText("volver home"));
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("navigates to CampaignHomeScreen when campaign is created", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("crear campaña"));
    fireEvent.click(screen.getByText("campaña creada"));
    expect(screen.getByText("campaign-home:99")).toBeInTheDocument();
  });

  // ── Campaign home flow ──────────────────────────────────────────────────────

  it("navigates to CampaignHomeScreen when onOpenCampaignHome is called from home", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("abrir campaña home"));
    expect(screen.getByText("campaign-home:42")).toBeInTheDocument();
  });

  it("navigates back to campaigns when exiting CampaignHomeScreen", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("abrir campaña home"));
    expect(screen.getByText("campaign-home:42")).toBeInTheDocument();
    fireEvent.click(screen.getByText("salir campaña"));
    expect(screen.getByText("campaigns")).toBeInTheDocument();
  });

  // ── Campaign pestaña flow ───────────────────────────────────────────────────

  it("navigates to CampaignPestañaScreen from CampaignHomeScreen", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("abrir campaña home"));
    fireEvent.click(screen.getByText("abrir pestaña"));
    expect(screen.getByText("campaign-pestaña:42")).toBeInTheDocument();
  });

  it("goes back to campaign-home from pestaña when onBack is called", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("abrir campaña home"));
    fireEvent.click(screen.getByText("abrir pestaña"));
    fireEvent.click(screen.getByText("volver campaña"));
    expect(screen.getByText("campaign-home:42")).toBeInTheDocument();
  });

  // ── Campaigns screen campaign navigation ────────────────────────────────────

  it("navigates to CreateCampaignScreen from CampaignsScreen", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("ir campañas"));
    expect(screen.getByText("campaigns")).toBeInTheDocument();
    fireEvent.click(screen.getByText("crear campaña dnd"));
    expect(
      screen.getByText("create-campaign:Dungeons and Dragons"),
    ).toBeInTheDocument();
  });

  it("opens CampaignHomeScreen from CampaignsScreen", () => {
    loginAndGoHome();
    fireEvent.click(screen.getByText("ir campañas"));
    fireEvent.click(screen.getByText("abrir campaña"));
    expect(screen.getByText("campaign-home:55")).toBeInTheDocument();
  });

  // ── Invite join flow ────────────────────────────────────────────────────────

  it("auto-joins campaign when pendingJoinId is present and user is logged in", async () => {
    // Set URL search param
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?join=77", pathname: "/" },
      writable: true,
    });

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    localStorage.setItem("jwtToken", "jwt-token");
    localStorage.setItem("username", "DM");

    render(<App />);

    // Should auto-navigate to campaign-home after joining
    await waitFor(() =>
      expect(screen.getByText("campaign-home:77")).toBeInTheDocument(),
    );

    vi.unstubAllGlobals();
    // Restore location
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "" },
      writable: true,
    });
  });
});
