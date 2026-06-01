import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FolderOpen,
  MessageSquare,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { useEffect } from "react";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import { parseRollMessage } from "./chatRollUtils";
import { ChatRollBubble } from "./ChatRollBubble";
import ChatDiceRollerPanel from "./ChatDiceRollerPanel";
import TokenCharacterCard from "./panel/TokenCharacterCard";
import HpModal from "./panel/HpModal";
import { useTokenPanelCharacter } from "../hooks/useTokenPanelCharacter";
import { saveMBEnemyMoral } from "../../personaje/utils/dndApi";
import type { CampaignChatMessage, CampaignPositionResponse } from "../types";

interface CharacterTokenPanelProps {
  positions: CampaignPositionResponse[];
  isDM?: boolean;
  chatMessages: CampaignChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onOpenCharacterSheet?: (characterId: number, sistemaDeJuego?: string) => void;
  onInteract?: () => void;
  iniciativaActiva?: boolean;
  personajesConIniciativa?: Set<number>;
  onTirarIniciativa?: (
    personajeId: number,
    nombre: string,
    retrato: string | undefined,
    bonificacion: number,
  ) => void;
  isTabSwitcherOpen?: boolean;
  onTabSwitcherToggle?: () => void;
  onBack?: () => void;
  onExit?: () => void;
  /** Click derecho en el retrato de un token → menú contextual */
  onTokenRightClick?: (posicionId: number, x: number, y: number) => void;
  /** Click izquierdo en el retrato → seleccionar token y centrar cámara */
  onTokenSelect?: (posicionId: number) => void;
}

const SECTION_DEFS = [
  {
    key: "personajes" as const,
    label: "Personajes",
    tipoMatch: "personaje",
    headerCls: "text-amber-100/85",
    articleCls: "border-white/15 bg-white/[0.06]",
    portraitCls: "border-amber-200/45",
  },
  {
    key: "enemigos" as const,
    label: "Enemigos",
    tipoMatch: "enemigo",
    headerCls: "text-red-300/90",
    articleCls: "border-red-900/40 bg-red-950/[0.18]",
    portraitCls: "border-red-400/55",
  },
  {
    key: "pnj" as const,
    label: "PNJ",
    tipoMatch: "pnj",
    headerCls: "text-sky-200/85",
    articleCls: "border-sky-900/35 bg-sky-950/[0.12]",
    portraitCls: "border-sky-400/50",
  },
] as const;

export default function CharacterTokenPanel({
  positions,
  isDM = false,
  chatMessages,
  onSendMessage,
  onOpenCharacterSheet,
  onInteract,
  iniciativaActiva = false,
  personajesConIniciativa,
  onTirarIniciativa,
  isTabSwitcherOpen = false,
  onTabSwitcherToggle,
  onBack,
  onExit,
  onTokenRightClick,
  onTokenSelect,
}: CharacterTokenPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"characters" | "chat">(
    "characters",
  );
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [expandedSections, setExpandedSections] = useState({
    personajes: true,
    enemigos: true,
    pnj: true,
  });

  // Moral modal state (MB enemies only)
  const [selectedMoralCharacterId, setSelectedMoralCharacterId] = useState<
    number | null
  >(null);
  const [moralDelta, setMoralDelta] = useState("1");
  const [isSavingMoral, setIsSavingMoral] = useState(false);

  const {
    detailsByCharacterId,
    visibleTokens,
    selectedHealthCharacter,
    setSelectedHealthCharacterId,
    hpDelta,
    setHpDelta,
    tempHpDelta,
    setTempHpDelta,
    healthSaveError,
    setHealthSaveError,
    isSavingHealth,
    adjustHealth,
    updateCharacterStat,
    diceRoller,
  } = useTokenPanelCharacter(positions, onSendMessage, isDM);

  useEffect(() => {
    if (activeTab === "chat" && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setIsSendingChat(true);
    try {
      await onSendMessage(text);
      setChatInput("");
      setChatError("");
    } catch (e) {
      setChatError((e as Error).message);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <>
      <aside
        className={`absolute bottom-0 right-0 top-0 z-20 flex h-full items-start transition-transform duration-300 ${
          isTabSwitcherOpen
            ? "translate-x-full"
            : isOpen
              ? "translate-x-0"
              : "translate-x-[calc(100%-40px)]"
        }`}
      >
        {/* Folder circle: solo visible para el DM */}
        {isDM && (
          <button
            type="button"
            onClick={onTabSwitcherToggle}
            className="absolute left-[2px] top-[80px] flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white/60 shadow-lg transition hover:border-amber-400/50 hover:bg-black/80 hover:text-amber-300"
            title="Cambiar pestaña"
          >
            <FolderOpen size={16} />
          </button>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`absolute left-[2px] ${isDM ? "top-[124px]" : "top-[80px]"} flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white/60 shadow-lg transition hover:border-white/50 hover:bg-black/80 hover:text-white`}
            title="Teatro de la mente"
          >
            <ArrowLeftRight size={16} />
          </button>
        )}

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className={`absolute left-[2px] ${isDM ? "top-[168px]" : "top-[124px]"} flex h-9 items-center justify-center rounded-full border border-white/20 bg-black/70 px-2.5 text-[11px] font-bold text-white/50 shadow-lg transition hover:border-red-500/50 hover:bg-red-950/60 hover:text-red-300`}
          >
            Salir
          </button>
        )}

        {/* Toggle — panel ear */}
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="mt-4 h-10 w-10 shrink-0 rounded-l-xl border border-r-0 border-white/20 bg-[linear-gradient(180deg,rgba(22,22,22,0.96)_0%,rgba(10,10,10,0.98)_100%)] text-white/85 shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition hover:bg-[linear-gradient(180deg,rgba(28,28,28,0.96)_0%,rgba(14,14,14,0.98)_100%)]"
          title={isOpen ? "Ocultar panel" : "Mostrar panel"}
        >
          {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="flex h-full w-[360px] rounded-l-2xl border border-white/20 bg-[linear-gradient(180deg,rgba(22,22,22,0.96)_0%,rgba(10,10,10,0.98)_100%)] text-white shadow-[0_20px_48px_rgba(0,0,0,0.55)] backdrop-blur-sm">
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Tab bar */}
            <div className="flex shrink-0 border-b border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("characters")}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold tracking-wide transition ${
                  activeTab === "characters"
                    ? "border-b-2 border-amber-300 text-amber-300"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Users size={13} />
                Personajes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold tracking-wide transition ${
                  activeTab === "chat"
                    ? "border-b-2 border-amber-300 text-amber-300"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <MessageSquare size={13} />
                Chat
              </button>
            </div>

            {/* Characters tab */}
            {activeTab === "characters" && (
              <div className="min-h-0 flex-1 overflow-y-auto pb-3 pt-2">
                {visibleTokens.length === 0 ? (
                  <div className="mx-4 mt-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                    No hay fichas en el tablero.
                  </div>
                ) : null}

                {SECTION_DEFS.map(
                  ({
                    key,
                    label,
                    tipoMatch,
                    headerCls,
                    articleCls,
                    portraitCls,
                  }) => {
                    const sectionTokens = visibleTokens.filter((t) => {
                      const tipo = (
                        detailsByCharacterId[t.personajeId]?.tipo ?? "personaje"
                      ).toLowerCase();
                      return tipo === tipoMatch;
                    });
                    if (sectionTokens.length === 0) return null;
                    const isExpanded = expandedSections[key];

                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSections((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                          className={`flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${headerCls} hover:bg-white/5`}
                        >
                          <span>
                            {label} ({sectionTokens.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>

                        {isExpanded &&
                          sectionTokens.map((token) => (
                            <TokenCharacterCard
                              key={token.id}
                              token={token}
                              detail={detailsByCharacterId[token.personajeId]}
                              articleCls={articleCls}
                              portraitCls={portraitCls}
                              iniciativaActiva={iniciativaActiva}
                              personajesConIniciativa={personajesConIniciativa}
                              diceRoller={diceRoller}
                              onOpenCharacterSheet={onOpenCharacterSheet}
                              onInteract={onInteract}
                              onTokenRightClick={onTokenRightClick}
                              onTokenSelect={onTokenSelect}
                              onSelectHealthCharacter={(id) => {
                                setSelectedHealthCharacterId(id);
                                setHealthSaveError(null);
                              }}
                              onSelectMoralCharacter={(id) =>
                                setSelectedMoralCharacterId(id)
                              }
                              onTirarIniciativa={onTirarIniciativa}
                            />
                          ))}
                      </div>
                    );
                  },
                )}
              </div>
            )}

            {/* Chat tab */}
            {activeTab === "chat" && (
              <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
                <div
                  ref={chatScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(203,213,225,0.4)_transparent]"
                >
                  {chatMessages.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/40">
                      No hay mensajes todavía.
                    </p>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const showName =
                        i === 0 ||
                        chatMessages[i - 1]?.username !== msg.username;
                      const rollData = parseRollMessage(msg.mensaje);
                      return (
                        <div key={msg.id}>
                          <div className="inline-block max-w-full rounded-2xl border border-white/20 bg-black/50 px-3 py-2 shadow">
                            {showName && (
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
                                {msg.username}
                              </p>
                            )}
                            {rollData ? (
                              <div className={showName ? "mt-1" : ""}>
                                <ChatRollBubble {...rollData} />
                              </div>
                            ) : (
                              <p
                                className={`${showName ? "mt-0.5" : ""} whitespace-pre-line break-words text-sm text-white [overflow-wrap:anywhere]`}
                              >
                                {msg.mensaje}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-2 shrink-0 border-t border-white/10 pt-2">
                  <div className="flex items-end gap-2">
                    <ChatDiceRollerPanel
                      disabled={isSendingChat}
                      onRollExpression={(title, expression) =>
                        diceRoller.rollExpression(title, expression)
                      }
                    />
                    <input
                      type="text"
                      value={chatInput}
                      maxLength={500}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendChat();
                        }
                      }}
                      placeholder="Escribe un mensaje"
                      className="h-10 w-full rounded-full border border-white/25 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/60"
                    />
                  </div>
                  {chatError && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-300">
                      {chatError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DiceRollOverlay
          diceBoxHostId={diceRoller.diceBoxHostId}
          diceBoxError={diceRoller.diceBoxError}
          isRolling={diceRoller.isRolling}
          summary={diceRoller.summary}
        />
      </aside>

      {/* HP management modal */}
      {selectedHealthCharacter ? (
        <HpModal
          character={selectedHealthCharacter}
          hpDelta={hpDelta}
          setHpDelta={setHpDelta}
          tempHpDelta={tempHpDelta}
          setTempHpDelta={setTempHpDelta}
          isSavingHealth={isSavingHealth}
          healthSaveError={healthSaveError}
          isMB={selectedHealthCharacter.sistemaDeJuego === "Mork Borg"}
          onClose={() => setSelectedHealthCharacterId(null)}
          onAdjust={(mode) => void adjustHealth(mode)}
        />
      ) : null}

      {/* Moral modal (MB enemies) */}
      {selectedMoralCharacterId !== null &&
        (() => {
          const mc = detailsByCharacterId[selectedMoralCharacterId];
          if (!mc) return null;
          const moralActual = mc.estadisticas["Moral actual"] ?? 0;
          const moralMaxima = mc.estadisticas["Moral maxima"] ?? 0;
          const moralPercent =
            moralMaxima > 0
              ? Math.min(100, Math.max(0, (moralActual / moralMaxima) * 100))
              : 0;

          const handleMoral = async (mode: "aumentar" | "disminuir") => {
            const token = localStorage.getItem("jwtToken");
            if (!token) return;
            const delta = Number.parseInt(moralDelta, 10) || 0;
            if (delta <= 0) return;
            const next =
              mode === "aumentar"
                ? Math.min(moralMaxima, moralActual + delta)
                : Math.max(0, moralActual - delta);
            // Optimistic update so the display reflects the change immediately
            updateCharacterStat(selectedMoralCharacterId, {
              "Moral actual": next,
            });
            setIsSavingMoral(true);
            try {
              await saveMBEnemyMoral(token, selectedMoralCharacterId, next);
            } finally {
              setIsSavingMoral(false);
            }
          };

          return (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-6 py-8 backdrop-blur-[2px]"
              onClick={() => setSelectedMoralCharacterId(null)}
            >
              <div
                className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[24px] border border-white/15 bg-[linear-gradient(180deg,rgba(20,20,20,0.98)_0%,rgba(10,10,10,0.99)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100/75">
                      Moral
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-white">
                      {mc.nombre}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMoralCharacterId(null)}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
                  <div className="grid grid-rows-[48px_48px_48px] gap-2">
                    <button
                      type="button"
                      onClick={() => void handleMoral("aumentar")}
                      className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 px-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
                    >
                      Aumentar
                    </button>
                    <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                      <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setMoralDelta(
                              String(
                                Math.max(
                                  0,
                                  (Number.parseInt(moralDelta, 10) || 0) - 1,
                                ),
                              ),
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={moralDelta}
                          onChange={(e) =>
                            setMoralDelta(
                              e.target.value.replace(/\D+/g, "") || "0",
                            )
                          }
                          className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMoralDelta(
                              String(
                                (Number.parseInt(moralDelta, 10) || 0) + 1,
                              ),
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleMoral("disminuir")}
                      className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                    >
                      Disminuir
                    </button>
                  </div>
                  <div className="flex min-h-[156px] flex-col items-center justify-center px-2 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-[2.3rem] font-bold leading-none text-white">
                        {moralActual}
                      </p>
                      <span className="text-[2rem] font-bold leading-none text-white/45">
                        /
                      </span>
                      <p className="text-[2.3rem] font-bold leading-none text-white">
                        {moralMaxima}
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
                      Moral
                    </p>
                    <div className="mt-3 w-full rounded-full border border-sky-300/30 bg-black/30 h-3 overflow-hidden">
                      <div
                        className="h-full bg-sky-600 transition-all"
                        style={{ width: `${moralPercent}%` }}
                      />
                    </div>
                    {isSavingMoral && (
                      <p className="mt-2 text-xs text-white/50">Guardando...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}
