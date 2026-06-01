import {
  ArrowLeftRight,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FolderOpen,
  Minimize2,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useEffect } from "react";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import { parseRollMessage } from "./chatRollUtils";
import { ChatRollBubble } from "./ChatRollBubble";
import ChatDiceRollerPanel from "./ChatDiceRollerPanel";
import TokenCharacterCard from "./panel/TokenCharacterCard";
import HpModal from "./panel/HpModal";
import { useTokenPanelCharacter } from "../hooks/useTokenPanelCharacter";
import {
  getMBAyudaDm,
  saveMBEnemyMoral,
  type MBAyudaDmCatalogo,
  type MBAyudaDmCategoria,
  type MBAyudaDmColumna,
  type MBAyudaDmGrupo,
  type MBAyudaDmSeccion,
  type MBAyudaDmTabla,
} from "../../personaje/utils/mbApi";
import type { CampaignChatMessage, CampaignPositionResponse } from "../types";

interface CharacterTokenPanelProps {
  positions: CampaignPositionResponse[];
  isDM?: boolean;
  isMorkBorgCampaign?: boolean;
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

type DmHelpTableItem = {
  roll: number;
  label: string;
  etiqueta?: string;
};

const DM_HELP_TABLE_STYLE = {
  backgroundColor: "#171717",
  backgroundImage:
    "linear-gradient(45deg, rgba(166,166,166,0.12) 25%, transparent 25%, transparent 75%, rgba(166,166,166,0.12) 75%, rgba(166,166,166,0.12)), linear-gradient(45deg, rgba(75,75,75,0.2) 25%, transparent 25%, transparent 75%, rgba(75,75,75,0.2) 75%, rgba(75,75,75,0.2))",
  backgroundPosition: "0 0, 12px 12px",
  backgroundSize: "24px 24px",
};

function buildDmHelpTableItems(
  items: readonly string[],
  etiquetas?: readonly string[],
): DmHelpTableItem[] {
  return items.map((label, index) => ({
    roll: index + 1,
    label,
    etiqueta: etiquetas?.[index],
  }));
}

function buildTwoColumnRows(items: readonly DmHelpTableItem[]) {
  const rows: DmHelpTableItem[][] = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }

  return rows;
}

function renderDmHelpTable(
  items: readonly string[],
  selectedRoll: number | null,
  options?: {
    scrollable?: boolean;
    textClassName?: string;
    etiquetas?: readonly string[];
    isD66?: boolean;
  },
) {
  const rows = buildTwoColumnRows(
    buildDmHelpTableItems(items, options?.etiquetas),
  );

  return (
    <div
      className={[
        "rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
        options?.scrollable
          ? "max-h-[420px] overflow-y-auto"
          : "overflow-hidden",
      ].join(" ")}
      style={DM_HELP_TABLE_STYLE}
    >
      {rows.map((rowPair, index) => (
        <div
          key={rowPair.map((item) => item.roll).join("-")}
          className={`grid grid-cols-2 gap-0 ${index < rows.length - 1 ? "border-b border-white/10" : ""}`}
        >
          {rowPair.map((item, pairIndex) => {
            const isSelected = options?.isD66
              ? matchesD66Etiqueta(item.etiqueta, selectedRoll)
              : selectedRoll === item.roll;

            return (
              <div
                key={item.roll}
                className={[
                  "px-4 py-3 text-sm transition-colors duration-300",
                  pairIndex === 0 ? "border-r border-white/10" : "",
                  isSelected ? "animate-pulse bg-red-900/80" : "bg-black/35",
                ].join(" ")}
              >
                <span
                  className={`font-bold ${isSelected ? "text-red-100" : "text-amber-200"}`}
                >
                  {item.etiqueta ?? `${item.roll}.`}
                </span>{" "}
                {renderEntryText(
                  item.label,
                  [
                    options?.textClassName ?? "",
                    isSelected ? "text-red-50" : "text-stone-100",
                  ].join(" "),
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function renderEntryText(text: string, className: string) {
  const lines = text.split("\n");
  const hasSpecial = lines.some((l) => l.startsWith("*"));
  if (!hasSpecial) {
    return <span className={`whitespace-pre-line ${className}`}>{text}</span>;
  }
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={`${i}-${line.slice(0, 6)}`}>
          {i > 0 && <br />}
          {line.startsWith("**") ? (
            <strong className="font-bold text-amber-200">
              {line.slice(2)}
            </strong>
          ) : line.startsWith("*") ? (
            <em className="text-stone-300/70">{line.slice(1)}</em>
          ) : (
            line
          )}
        </span>
      ))}
    </span>
  );
}

function matchesD66Etiqueta(
  etiqueta: string | undefined,
  d66result: number | null,
): boolean {
  if (!etiqueta || d66result === null) return false;
  if (etiqueta.includes("-")) {
    const parts = etiqueta.split("-");
    return d66result >= Number(parts[0]) && d66result <= Number(parts[1]);
  }
  if (etiqueta.includes(":")) {
    const parts = etiqueta.split(":");
    return d66result === Number(parts[0]) * 10 + Number(parts[1]);
  }
  return Number(etiqueta) === d66result;
}

function renderDmHelpTableGrouped(
  grupos: readonly MBAyudaDmGrupo[],
  selectedD66Roll: number | null,
) {
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      style={DM_HELP_TABLE_STYLE}
    >
      {grupos.map((grupo) => {
        const items = grupo.entradas.map((label, index) => ({
          roll: index + 1,
          label,
          etiqueta: grupo.etiquetas?.[index],
        }));
        const rows = buildTwoColumnRows(items);
        return (
          <div key={grupo.titulo}>
            <div className="border-b border-amber-700/40 bg-amber-700/55 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-50">
              {grupo.titulo}
            </div>
            {rows.map((rowPair, rowIndex) => (
              <div
                key={`${grupo.titulo}-${rowPair.map((i) => i.roll).join("-")}`}
                className={`grid grid-cols-2 gap-0 ${rowIndex < rows.length - 1 ? "border-b border-white/10" : ""}`}
              >
                {rowPair.map((item, pairIndex) => {
                  const isSelected = matchesD66Etiqueta(
                    item.etiqueta,
                    selectedD66Roll,
                  );
                  const isAlone = rowPair.length === 1;
                  return (
                    <div
                      key={item.roll}
                      className={[
                        "px-4 py-3 text-sm transition-colors duration-300",
                        isAlone
                          ? "col-span-2"
                          : pairIndex === 0
                            ? "border-r border-white/10"
                            : "",
                        isSelected
                          ? "animate-pulse bg-red-900/80"
                          : "bg-black/35",
                      ].join(" ")}
                    >
                      <span
                        className={`font-bold ${isSelected ? "text-red-100" : "text-amber-200"}`}
                      >
                        {item.etiqueta ?? `${item.roll}.`}
                      </span>{" "}
                      {renderEntryText(
                        item.label,
                        `leading-6 ${isSelected ? "text-red-50" : "text-stone-100"}`,
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const TWO_COL_HEADER_STYLES = [
  "border-b border-amber-700/40 bg-amber-700/55 text-amber-50",
  "border-b border-rose-700/40 bg-rose-700/55 text-rose-50",
] as const;

function renderDmHelpTwoColumn(columnas: readonly MBAyudaDmColumna[]) {
  const isSingle = columnas.length === 1;
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      style={DM_HELP_TABLE_STYLE}
    >
      {/* Header row */}
      <div className={`grid ${isSingle ? "grid-cols-1" : "grid-cols-2"}`}>
        {columnas.map((col, idx) => (
          <div
            key={`h-${col.titulo}`}
            className={[
              "px-4 py-2.5 text-sm font-bold uppercase tracking-[0.16em]",
              TWO_COL_HEADER_STYLES[idx] ?? TWO_COL_HEADER_STYLES[0],
              !isSingle && idx === 0 ? "border-r border-amber-700/40" : "",
            ].join(" ")}
          >
            {col.titulo}
          </div>
        ))}
      </div>
      {/* Content row */}
      <div
        className={`grid ${isSingle ? "grid-cols-1" : "grid-cols-2 divide-x divide-white/10"}`}
      >
        {columnas.map((col) => (
          <div
            key={`c-${col.titulo}`}
            className="flex flex-col bg-black/35 px-4 py-4"
          >
            {col.bloques && col.bloques.length > 0 ? (
              <div className="space-y-0">
                {col.bloques.map((bloque, bIdx) => (
                  <div
                    key={bloque.titulo}
                    className={
                      bIdx > 0 ? "border-t border-white/10 pt-3 mt-3" : ""
                    }
                  >
                    {bIdx > 0 ? (
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">
                        {bloque.titulo}
                      </p>
                    ) : null}
                    {bloque.descripcion ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-300">
                        {bloque.descripcion}
                      </p>
                    ) : null}
                    {bloque.lista ? (
                      <ul className="mt-2 space-y-1.5">
                        {bloque.lista.map((entry: string) => {
                          const m = entry.match(/^(\d+)\.\s+([\s\S]*)/);
                          return (
                            <li key={entry} className="flex gap-1.5 text-sm">
                              <span className="shrink-0 font-bold text-amber-300">
                                {m ? `${m[1]}.` : "•"}
                              </span>
                              <span className="text-stone-100 leading-snug">
                                {m ? m[2] : entry}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {col.descripcion ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-stone-300">
                    {col.descripcion}
                  </p>
                ) : null}
                {col.lista ? (
                  <ul className="mt-3 space-y-2">
                    {col.lista.map((entry: string) => {
                      const m = entry.match(/^(\d+(?:-\d+)?)\s+(.*)/);
                      if (m) {
                        return (
                          <li
                            key={entry}
                            className="flex items-baseline gap-2 text-sm"
                          >
                            <span className="shrink-0 font-bold text-amber-300">
                              {m[1]}
                            </span>
                            <span className="text-stone-100">{m[2]}</span>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={entry}
                          className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-50"
                        >
                          {entry}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSingleTabla(tabla: MBAyudaDmTabla) {
  const gridCols = tabla.anchos
    ? tabla.anchos.map((a) => `${a}fr`).join(" ")
    : `repeat(${tabla.encabezados.length}, minmax(0, 1fr))`;
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      style={DM_HELP_TABLE_STYLE}
    >
      <div className="border-b border-amber-700/40 bg-amber-700/55 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-50">
        {tabla.titulo}
      </div>
      <div
        className="grid border-b border-white/10 bg-white/[0.04]"
        style={{ gridTemplateColumns: gridCols }}
      >
        {tabla.encabezados.map((enc, i) => (
          <div
            key={enc}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400/90 ${i > 0 ? "border-l border-white/10" : ""}`}
          >
            {enc}
          </div>
        ))}
      </div>
      {tabla.filas.map((fila, rowIdx) => (
        <div
          key={rowIdx}
          className={`grid bg-black/35 ${rowIdx < tabla.filas.length - 1 ? "border-b border-white/10" : ""}`}
          style={{ gridTemplateColumns: gridCols }}
        >
          {fila.map((celda, colIdx) => (
            <div
              key={colIdx}
              className={`px-3 py-2 text-sm leading-snug text-stone-100 ${colIdx > 0 ? "border-l border-white/10" : ""}`}
            >
              {celda}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function renderDmHelpTablas(
  tablas: readonly MBAyudaDmTabla[],
  layout?: string,
) {
  if (tablas.length === 0) return null;
  if (tablas.length === 1) return renderSingleTabla(tablas[0]);

  if (layout === "primera-izq-resto-der") {
    const [primera, ...resto] = tablas;
    return (
      <div className="grid grid-cols-2 items-start gap-3">
        <div>{renderSingleTabla(primera)}</div>
        <div className="space-y-3">
          {resto.map((tabla) => (
            <div key={tabla.titulo}>{renderSingleTabla(tabla)}</div>
          ))}
        </div>
      </div>
    );
  }

  if (tablas.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {tablas.map((tabla) => (
          <div key={tabla.titulo}>{renderSingleTabla(tabla)}</div>
        ))}
      </div>
    );
  }

  const [primera, ...resto] = tablas;
  return (
    <div className="space-y-3">
      {renderSingleTabla(primera)}
      <div className="grid grid-cols-2 gap-3">
        {resto.map((tabla) => (
          <div key={tabla.titulo}>{renderSingleTabla(tabla)}</div>
        ))}
      </div>
    </div>
  );
}

type DmHelpSection = "index" | string;
type PendingDmHelpRoll = {
  sectionId: string;
  max: number;
  expression: string;
  title: string;
  isD66: boolean;
};

function getDmHelpDiceLabel(expression: string) {
  return expression.replace(/^1(?=d)/i, "");
}

function getDmHelpDiceMax(expression: string) {
  const match = expression.match(/^(\d+)d(\d+)$/i);
  if (!match) return 20;
  return Number.parseInt(match[2], 10);
}

export default function CharacterTokenPanel({
  positions,
  isDM = false,
  isMorkBorgCampaign = false,
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
  const [isDmHelpOpen, setIsDmHelpOpen] = useState(false);
  const [isDmHelpMinimized, setIsDmHelpMinimized] = useState(false);
  const [dmHelpPosition, setDmHelpPosition] = useState({ x: 132, y: 108 });
  const [dmHelpSection, setDmHelpSection] = useState<DmHelpSection>("index");
  const [dmHelpCatalog, setDmHelpCatalog] = useState<MBAyudaDmCatalogo | null>(
    null,
  );
  const [dmHelpRolls, setDmHelpRolls] = useState<Record<string, number>>({});
  const [dmHelpError, setDmHelpError] = useState("");
  const [isLoadingDmHelp, setIsLoadingDmHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<"characters" | "chat">(
    "characters",
  );
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const dmHelpDragOffsetRef = useRef({ x: 0, y: 0 });
  const pendingDmHelpRollRef = useRef<PendingDmHelpRoll | null>(null);
  const [isDraggingDmHelp, setIsDraggingDmHelp] = useState(false);

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
  const dmHelpDiceRoller = useDiceRoller();

  useEffect(() => {
    if (activeTab === "chat" && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  useEffect(() => {
    if (!isDM || !isMorkBorgCampaign || !isDmHelpOpen || dmHelpCatalog) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setDmHelpError("No se pudo autenticar la carga de ayuda al DM.");
      return;
    }

    const abortController = new AbortController();
    setIsLoadingDmHelp(true);
    setDmHelpError("");

    getMBAyudaDm(token, abortController.signal)
      .then((catalog: MBAyudaDmCatalogo) => {
        setDmHelpCatalog(catalog);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) return;
        setDmHelpError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la ayuda al DM.",
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoadingDmHelp(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [dmHelpCatalog, isDM, isDmHelpOpen, isMorkBorgCampaign]);

  useEffect(() => {
    if (
      !pendingDmHelpRollRef.current ||
      !dmHelpDiceRoller.summary ||
      dmHelpDiceRoller.isRolling
    ) {
      return;
    }

    const pendingRoll = pendingDmHelpRollRef.current;
    pendingDmHelpRollRef.current = null;

    let resultRoll: number;
    if (pendingRoll.isD66 && dmHelpDiceRoller.summary.diceValues.length >= 2) {
      const d1 = dmHelpDiceRoller.summary.diceValues[0];
      const d2 = dmHelpDiceRoller.summary.diceValues[1];
      resultRoll = d1 * 10 + d2;
    } else {
      const raw =
        dmHelpDiceRoller.summary.diceValues[0] ??
        dmHelpDiceRoller.summary.total;
      resultRoll = Math.max(1, Math.min(pendingRoll.max, raw));
    }

    setDmHelpRolls((current) => ({
      ...current,
      [pendingRoll.sectionId]: resultRoll,
    }));
  }, [dmHelpDiceRoller.isRolling, dmHelpDiceRoller.summary]);

  useEffect(() => {
    if (!isDraggingDmHelp) return;

    const handleMouseMove = (event: MouseEvent) => {
      setDmHelpPosition({
        x: Math.max(16, event.clientX - dmHelpDragOffsetRef.current.x),
        y: Math.max(16, event.clientY - dmHelpDragOffsetRef.current.y),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingDmHelp(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingDmHelp]);

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

  const handleStartDmHelpDrag = (
    event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
  ) => {
    dmHelpDragOffsetRef.current = {
      x: event.clientX - dmHelpPosition.x,
      y: event.clientY - dmHelpPosition.y,
    };
    setIsDraggingDmHelp(true);
  };

  const openDmHelp = () => {
    setIsDmHelpOpen(true);
    setIsDmHelpMinimized(false);
    setDmHelpSection("index");
  };

  const dmHelpSections = dmHelpCatalog?.secciones ?? [];
  const activeDmHelpSection = dmHelpSections.find(
    (section: MBAyudaDmSeccion) => section.id === dmHelpSection,
  );

  const handleDmHelpRoll = (section: MBAyudaDmSeccion) => {
    if (dmHelpDiceRoller.isRolling) return;
    pendingDmHelpRollRef.current = {
      sectionId: section.id,
      max: getDmHelpDiceMax(section.dado),
      expression: section.dado,
      title: `${section.titulo} ${getDmHelpDiceLabel(section.dado)}`,
      isD66: !!(section.etiquetas || section.grupos),
    };
    dmHelpDiceRoller.rollExpression(
      `${section.titulo} ${getDmHelpDiceLabel(section.dado)}`,
      section.dado,
    );
  };

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={dmHelpDiceRoller.diceBoxHostId}
        diceBoxError={dmHelpDiceRoller.diceBoxError}
        isRolling={dmHelpDiceRoller.isRolling}
        summary={dmHelpDiceRoller.summary}
        hideTotals={activeDmHelpSection?.dado === "2d6"}
      />

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

        {isDM && isMorkBorgCampaign && (
          <button
            type="button"
            onClick={openDmHelp}
            className="absolute left-[2px] top-[168px] flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/25 bg-black/70 text-sky-100/80 shadow-lg transition hover:border-sky-300/50 hover:bg-black/80 hover:text-sky-100"
            title="Ayuda al DM"
          >
            <BookOpen size={14} />
          </button>
        )}

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className={`absolute -left-7 ${isDM ? (isMorkBorgCampaign ? "top-[212px]" : "top-[168px]") : "top-[124px]"} flex h-10 items-center justify-center rounded-full border border-white/20 bg-black/70 px-5 text-sm font-bold text-white/60 shadow-lg transition hover:border-red-500/50 hover:bg-red-950/60 hover:text-red-300`}
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

      {isDM && isMorkBorgCampaign && isDmHelpOpen ? (
        <div
          className="fixed z-[45]"
          style={{ left: dmHelpPosition.x, top: dmHelpPosition.y }}
        >
          {isDmHelpMinimized ? (
            <button
              type="button"
              onMouseDown={handleStartDmHelpDrag}
              onClick={() => setIsDmHelpMinimized(false)}
              className="flex h-11 min-w-[240px] items-center justify-between rounded-2xl border border-sky-300/25 bg-[linear-gradient(180deg,rgba(18,24,39,0.98)_0%,rgba(7,12,20,0.98)_100%)] px-4 text-sm font-semibold text-sky-100 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={15} />
                Ayuda al DM
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-sky-200/60">
                Abrir
              </span>
            </button>
          ) : (
            <div className="flex max-h-[80vh] w-[min(760px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(17,24,39,0.98)_0%,rgba(4,7,14,0.99)_100%)] text-white shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
              <div
                onMouseDown={handleStartDmHelpDrag}
                className="flex shrink-0 cursor-move items-center justify-between border-b border-white/10 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-sky-200" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/65">
                      DM
                    </p>
                    <p className="text-sm font-bold text-white">Ayuda al DM</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDmHelpMinimized(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    title="Minimizar"
                  >
                    <Minimize2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDmHelpOpen(false);
                      setDmHelpSection("index");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-black/10 px-5 py-4">
                {dmHelpSection === "index" ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-amber-300">Indice</h4>
                    {isLoadingDmHelp ? (
                      <p className="text-sm text-stone-300">
                        Cargando apartados...
                      </p>
                    ) : dmHelpError ? (
                      <p className="text-sm text-rose-300">{dmHelpError}</p>
                    ) : dmHelpSections.length === 0 ? (
                      <p className="text-sm text-stone-300">
                        No hay apartados disponibles.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(dmHelpCatalog?.categorias ?? []).length > 0 ? (
                          dmHelpCatalog!.categorias!.map(
                            (cat: MBAyudaDmCategoria) => {
                              const isVerde = cat.color === "verde";
                              const isRojo = cat.color === "rojo";
                              const catSections = cat.seccionIds
                                .map((sid) =>
                                  dmHelpSections.find(
                                    (s: MBAyudaDmSeccion) => s.id === sid,
                                  ),
                                )
                                .filter(Boolean) as MBAyudaDmSeccion[];
                              if (catSections.length === 0) return null;
                              return (
                                <div key={cat.id}>
                                  <p
                                    className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${isVerde ? "text-emerald-300/70" : isRojo ? "text-rose-300/70" : "text-stone-400/80"}`}
                                  >
                                    {cat.titulo}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {catSections.map((section) => (
                                      <button
                                        key={section.id}
                                        type="button"
                                        onClick={() =>
                                          setDmHelpSection(section.id)
                                        }
                                        className={
                                          isVerde
                                            ? "flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
                                            : isRojo
                                              ? "flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                                              : "flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
                                        }
                                      >
                                        {section.titulo}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            },
                          )
                        ) : (
                          <div className="flex flex-wrap items-center gap-3">
                            {dmHelpSections.map((section: MBAyudaDmSeccion) => (
                              <button
                                key={section.id}
                                type="button"
                                onClick={() => setDmHelpSection(section.id)}
                                className="flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
                              >
                                {section.titulo}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : activeDmHelpSection ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => setDmHelpSection("index")}
                          className="mb-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          Volver
                        </button>
                        <h4 className="text-lg font-bold text-amber-300">
                          {activeDmHelpSection.titulo}
                          {activeDmHelpSection.dado
                            ? ` ${getDmHelpDiceLabel(activeDmHelpSection.dado)}`
                            : ""}
                        </h4>
                      </div>

                      {activeDmHelpSection.dado ? (
                        <div className="flex items-center gap-2">
                          {activeDmHelpSection.dado !== "2d6" &&
                          dmHelpRolls[activeDmHelpSection.id] ? (
                            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-100">
                              {dmHelpRolls[activeDmHelpSection.id]}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              handleDmHelpRoll(activeDmHelpSection)
                            }
                            disabled={dmHelpDiceRoller.isRolling}
                            className="flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40"
                            title={`Tirar ${getDmHelpDiceLabel(activeDmHelpSection.dado)}`}
                          >
                            <span className="text-base leading-none">
                              {dmHelpDiceRoller.isRolling ? "..." : "🎲"}
                            </span>
                            {getDmHelpDiceLabel(activeDmHelpSection.dado)}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {activeDmHelpSection.descripcion ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
                        {activeDmHelpSection.descripcion}
                      </p>
                    ) : null}

                    {activeDmHelpSection.tablas &&
                    activeDmHelpSection.tablas.length > 0
                      ? renderDmHelpTablas(
                          activeDmHelpSection.tablas,
                          activeDmHelpSection.layout,
                        )
                      : activeDmHelpSection.columnas &&
                          activeDmHelpSection.columnas.length > 0
                        ? renderDmHelpTwoColumn(activeDmHelpSection.columnas)
                        : activeDmHelpSection.grupos &&
                            activeDmHelpSection.grupos.length > 0
                          ? renderDmHelpTableGrouped(
                              activeDmHelpSection.grupos,
                              dmHelpRolls[activeDmHelpSection.id] ?? null,
                            )
                          : renderDmHelpTable(
                              activeDmHelpSection.entradas,
                              dmHelpRolls[activeDmHelpSection.id] ?? null,
                              {
                                scrollable: false,
                                textClassName: "leading-6",
                                etiquetas: activeDmHelpSection.etiquetas,
                                isD66: !!activeDmHelpSection.etiquetas,
                              },
                            )}

                    {activeDmHelpSection.nota ? (
                      <div
                        className="overflow-hidden rounded-[18px] border border-white/10 bg-black/35 px-5 py-4 text-sm leading-relaxed shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                        style={DM_HELP_TABLE_STYLE}
                      >
                        {renderEntryText(
                          activeDmHelpSection.nota,
                          "text-stone-300 leading-relaxed",
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setDmHelpSection("index")}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      Volver
                    </button>
                    <p className="text-sm text-stone-300">
                      No se encontró la sección solicitada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
