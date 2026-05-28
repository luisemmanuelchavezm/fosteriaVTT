// @vitest-environment jsdom
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CampaignChatPanel from "../../../screens/campaign/components/CampaignChatPanel";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));

const mockDiceRoller = {
  summary: null as null | {
    id: number;
    title: string;
    expression: string;
    diceValues: number[];
    modifier: number;
    total: number;
  },
  isRolling: false,
  diceBoxHostId: "dice-box-test",
  diceBoxError: null as string | null,
  rollExpression: vi.fn(),
  clearSummary: vi.fn(),
};

vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => mockDiceRoller),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface CampaignChatMessage {
  id: number;
  username: string;
  mensaje: string;
  enviadoEn: string;
}

const makeMessage = (
  overrides: Partial<CampaignChatMessage> = {},
): CampaignChatMessage => ({
  id: 1,
  username: "user1",
  mensaje: "Hola mundo",
  enviadoEn: "2024-01-01T10:00:00Z",
  ...overrides,
});

const DEFAULT_PROPS = {
  messages: [],
  onSendMessage: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDiceRoller.summary = null;
  mockDiceRoller.isRolling = false;
  mockDiceRoller.diceBoxError = null;
  DEFAULT_PROPS.onSendMessage = vi.fn().mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CampaignChatPanel", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders 'Chat' header", () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });

  it("shows 'No hay mensajes todavía.' when messages list is empty", () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("No hay mensajes todavía.")).toBeInTheDocument();
  });

  it("does not show empty state when there are messages", () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} messages={[makeMessage()]} />);
    expect(
      screen.queryByText("No hay mensajes todavía."),
    ).not.toBeInTheDocument();
  });

  it("renders message text", () => {
    render(
      <CampaignChatPanel
        {...DEFAULT_PROPS}
        messages={[makeMessage({ mensaje: "¡Ataco al ogro!" })]}
      />,
    );
    expect(screen.getByText("¡Ataco al ogro!")).toBeInTheDocument();
  });

  it("renders username for first message", () => {
    render(
      <CampaignChatPanel
        {...DEFAULT_PROPS}
        messages={[makeMessage({ username: "wizard99" })]}
      />,
    );
    expect(screen.getByText("wizard99")).toBeInTheDocument();
  });

  it("shows username only once for consecutive messages from same user", () => {
    render(
      <CampaignChatPanel
        {...DEFAULT_PROPS}
        messages={[
          makeMessage({
            id: 1,
            username: "player1",
            mensaje: "Primer mensaje",
          }),
          makeMessage({
            id: 2,
            username: "player1",
            mensaje: "Segundo mensaje",
          }),
        ]}
      />,
    );
    // Username should appear only once
    const usernames = screen.getAllByText("player1");
    expect(usernames).toHaveLength(1);
  });

  it("shows username again when sender changes", () => {
    render(
      <CampaignChatPanel
        {...DEFAULT_PROPS}
        messages={[
          makeMessage({ id: 1, username: "player1", mensaje: "Hola" }),
          makeMessage({ id: 2, username: "player2", mensaje: "Buenos días" }),
        ]}
      />,
    );
    expect(screen.getByText("player1")).toBeInTheDocument();
    expect(screen.getByText("player2")).toBeInTheDocument();
  });

  // ── Input ──────────────────────────────────────────────────────────────────

  it("renders message input with placeholder", () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} />);
    expect(
      screen.getByPlaceholderText("Escribe un mensaje"),
    ).toBeInTheDocument();
  });

  it("shows character count as user types", () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "Hola" } });
    expect(screen.getByText("4/500")).toBeInTheDocument();
  });

  it("shows 0/500 initially", () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("0/500")).toBeInTheDocument();
  });

  // ── Send message ───────────────────────────────────────────────────────────

  it("calls onSendMessage when Enter is pressed with a non-empty message", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "Hola mundo" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    expect(onSendMessage).toHaveBeenCalledWith("Hola mundo");
  });

  it("does not call onSendMessage when message is empty", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("does not call onSendMessage when message is only whitespace", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "   " } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("does not send when Shift+Enter is pressed", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "hola" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("clears input after successful send", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText(
      "Escribe un mensaje",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Mensaje test" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("shows 'Enviando...' suffix while sending", async () => {
    let resolvePromise: () => void;
    const slowSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    render(<CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={slowSend} />);
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "hola" } });
    act(() => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    await waitFor(() =>
      expect(screen.getByText(/Enviando/)).toBeInTheDocument(),
    );
    await act(async () => {
      resolvePromise();
    });
  });

  it("shows error message when onSendMessage rejects", async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error("Sin conexión"));
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "hola" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    await waitFor(() =>
      expect(screen.getByText("Sin conexión")).toBeInTheDocument(),
    );
  });

  it("shows error when message exceeds 500 characters", async () => {
    render(<CampaignChatPanel {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    // maxLength prevents typing >500, but we can force it via the handler logic
    // by testing the branch with a message manually constructed > MAX_MESSAGE_LENGTH
    // We simulate a paste or programmatic value update
    const longMessage = "A".repeat(501);
    fireEvent.change(input, { target: { value: longMessage } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    expect(
      screen.getByText("El mensaje no puede superar 500 caracteres."),
    ).toBeInTheDocument();
  });

  it("clears error message when user starts typing again", async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error("Error"));
    render(
      <CampaignChatPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "hola" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    await waitFor(() => expect(screen.getByText("Error")).toBeInTheDocument());
    fireEvent.change(input, { target: { value: "nuevo mensaje" } });
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });

  // ── WebSocket error ────────────────────────────────────────────────────────

  it("shows websocketError when provided", () => {
    render(
      <CampaignChatPanel
        {...DEFAULT_PROPS}
        websocketError="No se pudo conectar al servidor"
      />,
    );
    expect(
      screen.getByText("No se pudo conectar al servidor"),
    ).toBeInTheDocument();
  });

  it("prefers local errorMessage over websocketError when both present", async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error("Error local"));
    render(
      <CampaignChatPanel
        {...DEFAULT_PROPS}
        onSendMessage={onSendMessage}
        websocketError="WS error"
      />,
    );
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "hola" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    await waitFor(() =>
      expect(screen.getByText("Error local")).toBeInTheDocument(),
    );
    // WS error text should not appear simultaneously
    expect(screen.queryByText("WS error")).not.toBeInTheDocument();
  });
});
