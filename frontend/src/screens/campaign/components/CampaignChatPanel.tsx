import { useMemo, useState } from "react";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { useWebSocketChat } from "../hooks/useWebSocketChat";
import ChatDiceRollerPanel from "./ChatDiceRollerPanel";

interface CampaignChatPanelProps {
  campaignId: string;
  username: string;
}

interface CampaignChatMessage {
  id: number;
  username: string;
  mensaje: string;
  enviadoEn: string;
}

export default function CampaignChatPanel({
  campaignId,
  username,
}: CampaignChatPanelProps) {
  const [messages, setMessages] = useState<CampaignChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const MAX_MESSAGE_LENGTH = 500;
  const diceRoller = useDiceRoller();

  const { sendMessage: sendWebSocketMessage } = useWebSocketChat({
    campaignId: parseInt(campaignId),
    username,
    onNewMessage: (message) => {
      setMessages((current) => [...current, message]);
    },
    onPlayersUpdate: () => {
      // Los jugadores se manejan en CampaignPlayersPanel.
    },
    onError: (error) => {
      setErrorMessage(`Error WebSocket: ${error}`);
    },
  });

  const groupedMessages = useMemo(
    () =>
      messages.map((message, index) => ({
        message,
        showUsername:
          index === 0 || messages[index - 1]?.username !== message.username,
      })),
    [messages],
  );

  const handleSendMessage = async () => {
    const message = messageInput.trim();

    if (!message) {
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(
        `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`,
      );
      return;
    }

    setIsSending(true);

    try {
      await sendWebSocketMessage(message);
      setMessageInput("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <aside className="flex h-full max-h-[72vh] min-h-0 w-full max-w-[460px] flex-col p-1 text-stone-50 md:max-h-[78vh]">
        <div
          className="w-full rounded-md border-y border-amber-200/70 px-3 py-2"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-amber-100">
            Chat
          </h2>
        </div>

        <div className="mt-4 max-h-[42vh] min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(203,213,225,0.75)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/75 hover:[&::-webkit-scrollbar-thumb]:bg-slate-200/85 md:max-h-[52vh]">
          {groupedMessages.length === 0 ? (
            <p className="text-sm text-white/90">No hay mensajes todavía.</p>
          ) : (
            <div className="space-y-3">
              {groupedMessages.map(({ message, showUsername }) => (
                <div key={message.id}>
                  <div
                    className="inline-block max-w-full rounded-2xl border border-white/30 px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                  >
                    {showUsername ? (
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-100">
                        {message.username}
                      </p>
                    ) : null}
                    <p
                      className={`${showUsername ? "mt-1" : ""} text-sm text-white break-words [overflow-wrap:anywhere] [word-break:break-word]`}
                    >
                      {message.mensaje}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-end gap-2">
            <ChatDiceRollerPanel
              disabled={isSending}
              onRollExpression={(title, expression) => {
                diceRoller.rollExpression(title, expression);
              }}
            />

            <input
              type="text"
              value={messageInput}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => {
                setMessageInput(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Escribe un mensaje"
              className="h-11 w-full rounded-full border border-white/35 bg-[rgba(0,0,0,0.5)] px-4 text-sm text-white outline-none transition placeholder:text-white/70 focus:border-white"
            />
          </div>

          <p className="mt-2 text-right text-xs text-white/80">
            {messageInput.length}/{MAX_MESSAGE_LENGTH}
            {isSending ? " · Enviando..." : ""}
          </p>

          {errorMessage ? (
            <p className="mt-2 rounded-md border border-red-400 bg-red-100/90 px-3 py-1 text-center text-[12px] font-extrabold text-red-800 shadow-md">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </aside>

      <DiceRollOverlay
        diceBoxHostId={diceRoller.diceBoxHostId}
        diceBoxError={diceRoller.diceBoxError}
        isRolling={diceRoller.isRolling}
        summary={diceRoller.summary}
      />
    </>
  );
}
