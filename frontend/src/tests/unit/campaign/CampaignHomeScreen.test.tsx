// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import CampaignHomeScreen from "../../../screens/campaign/CampaignHomeScreen";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSendMessage = vi.fn().mockResolvedValue(undefined);

vi.mock("../../../screens/campaign/hooks/useWebSocketChat", () => ({
  useWebSocketChat: vi.fn(() => ({
    sendMessage: mockSendMessage,
  })),
}));

vi.mock("../../../screens/campaign/components/CampaignPlayersPanel", () => ({
  default: ({
    players,
    errorMessage,
  }: {
    players: { username: string; dm: boolean }[];
    errorMessage: string;
  }) => (
    <div data-testid="players-panel">
      <span>Players: {players.length}</span>
      {errorMessage && <span data-testid="chat-error">{errorMessage}</span>}
    </div>
  ),
}));

vi.mock("../../../screens/campaign/components/CampaignChatPanel", () => ({
  default: ({
    messages,
    websocketError,
    onSendMessage,
  }: {
    messages: {
      id: number;
      username: string;
      mensaje: string;
      enviadoEn: string;
    }[];
    websocketError?: string;
    onSendMessage: (text: string) => Promise<void>;
  }) => (
    <div data-testid="chat-panel">
      <span>Messages: {messages.length}</span>
      {websocketError && <span data-testid="ws-error">{websocketError}</span>}
      <button onClick={() => void onSendMessage("test")}>Send</button>
    </div>
  ),
}));

// ─── Default props ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  campaignId: "42",
  onExit: vi.fn(),
  onOpenCampaignPestaña: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  vi.clearAllMocks();
  localStorage.setItem("username", "testuser");
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CampaignHomeScreen", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders exit button", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByText("Salir")).toBeInTheDocument();
  });

  it("renders invite button", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText("Invitar a la campaña")).toBeInTheDocument();
  });

  it("renders campaign pestaña button", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    expect(
      screen.getByLabelText("Abrir pestaña de campaña"),
    ).toBeInTheDocument();
  });

  it("renders players panel", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("players-panel")).toBeInTheDocument();
  });

  it("renders chat panel", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
  });

  // ── Callbacks ──────────────────────────────────────────────────────────────

  it("calls onExit when exit button is clicked", () => {
    const onExit = vi.fn();
    render(<CampaignHomeScreen {...DEFAULT_PROPS} onExit={onExit} />);
    fireEvent.click(screen.getByText("Salir"));
    expect(onExit).toHaveBeenCalled();
  });

  it("calls onOpenCampaignPestaña when map button is clicked", () => {
    const onOpenCampaignPestaña = vi.fn();
    render(
      <CampaignHomeScreen
        {...DEFAULT_PROPS}
        onOpenCampaignPestaña={onOpenCampaignPestaña}
      />,
    );
    fireEvent.click(screen.getByLabelText("Abrir pestaña de campaña"));
    expect(onOpenCampaignPestaña).toHaveBeenCalled();
  });

  // ── Invite popover ─────────────────────────────────────────────────────────

  it("shows invite popover when invite button is clicked", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByLabelText("Invitar a la campaña"));
    expect(screen.getByText("Link de invitación")).toBeInTheDocument();
  });

  it("shows 'Copiar' button in invite popover", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByLabelText("Invitar a la campaña"));
    expect(screen.getByText("Copiar")).toBeInTheDocument();
  });

  it("closes invite popover when clicking outside", () => {
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    // Open popover
    fireEvent.click(screen.getByLabelText("Invitar a la campaña"));
    expect(screen.getByText("Link de invitación")).toBeInTheDocument();
    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Link de invitación")).not.toBeInTheDocument();
  });

  it("calls clipboard.writeText when 'Copiar' is clicked", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByLabelText("Invitar a la campaña"));
    await act(async () => {
      fireEvent.click(screen.getByText("Copiar"));
    });
    expect(mockWriteText).toHaveBeenCalled();
  });

  it("shows '¡Copiado!' after clicking Copiar", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByLabelText("Invitar a la campaña"));
    // act flushes microtasks so the promise .then() runs and state updates
    await act(async () => {
      fireEvent.click(screen.getByText("Copiar"));
    });
    // After promise resolves, inviteCopied should be true
    expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
  });

  it("reverts '¡Copiado!' back to 'Copiar' after 2s", async () => {
    vi.useFakeTimers();
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByLabelText("Invitar a la campaña"));
    // Flush the click and resulting promise microtasks
    await act(async () => {
      fireEvent.click(screen.getByText("Copiar"));
    });
    expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
    // Advance past the 2000ms timeout
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByText("Copiar")).toBeInTheDocument();
    vi.useRealTimers();
  });

  // ── Username from localStorage ─────────────────────────────────────────────

  it("reads username from localStorage on mount", async () => {
    localStorage.setItem("username", "dm_player");
    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    // The username is used internally (passed to useWebSocketChat)
    // Just verify no crash occurs
    expect(screen.getByTestId("players-panel")).toBeInTheDocument();
  });

  it("reads username from JWT when localStorage username is empty", async () => {
    localStorage.removeItem("username");
    // Create a fake JWT with sub claim
    const header = btoa(JSON.stringify({ alg: "HS256" }));
    const payload = btoa(JSON.stringify({ sub: "jwtuser" }));
    const signature = "fake-sig";
    localStorage.setItem("jwtToken", `${header}.${payload}.${signature}`);

    render(<CampaignHomeScreen {...DEFAULT_PROPS} />);
    // Just verify no crash
    expect(screen.getByTestId("players-panel")).toBeInTheDocument();
  });
});
