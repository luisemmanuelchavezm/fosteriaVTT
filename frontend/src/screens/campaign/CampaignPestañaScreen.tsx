/* eslint-disable react-refresh/only-export-components */
import type Konva from "konva";
import {
  ArrowLeftRight,
  Archive,
  BookOpen,
  Cloud,
  Map,
  Move,
  MousePointer2,
  Pencil,
  Ruler,
  Settings,
  Timer,
  User,
} from "lucide-react";
import FogOfWarDropdown from "./components/FogOfWarDropdown";
import TokenContextMenu from "./components/TokenContextMenu";
import VisionArcModal from "./components/VisionArcModal";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Layer,
  Image as KonvaImage,
  Line,
  Rect,
  Shape,
  Stage,
} from "react-konva";
import { buildApiUrl } from "../../lib/api";
import {
  CampaignRulerOverlay,
  CampaignRulerShapeSelector,
  useCampaignRulerTool,
} from "./campaignRulerTool";
import {
  CampaignPencilOverlay,
  CampaignPencilShapeSelector,
  CampaignPencilOptionsModal,
  useCampaignPencilTool,
} from "./campaignPencilTool";
import CharacterTokenPanel from "./components/CharacterTokenPanel";
import PestañaSwitcherPanel from "./components/PestañaSwitcherPanel";
import IniciativaBar from "./components/IniciativaBar";
import Baul from "./components/Baul";
import { PosicionFicha } from "./components/PosicionFicha";
import QuickActionBar from "./components/QuickActionBar";
import DndCharacterSheetScreen from "../personaje/dndcharactersheet/DndCharacterSheetScreen";
import {
  useCampaignRealtime,
  type ExploredArea,
  type IniciativaEstado,
  type NieblaEstado,
  type VisionConfig,
} from "./hooks/useCampaignRealtime";
import { useWebSocketChat } from "./hooks/useWebSocketChat";

interface CampaignChatMessage {
  id: number;
  username: string;
  mensaje: string;
  enviadoEn: string;
}

interface CampaignPestañaScreenProps {
  campaignId: string;
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onBack?: () => void;
}

interface CampaignPestañaResponse {
  id: number;
  nombre: string;
  nCuadriculasX: number;
  nCuadriculasY: number;
  distanciaCasilla: number;
  sistemaMetrico: string;
  nieblaDeGuerra: string;
  imagenBaseUrl: string;
  mapaCapaUrl?: string;
  dmUsername?: string;
}

interface CampaignPositionResponse {
  id: number;
  pestanaId: number;
  capa: LayerSelection;
  personajeId: number;
  personajeNombre: string;
  retrato?: string;
  posicionX: number;
  posicionY: number;
  largo: number;
  ancho: number;
  tipo?: string;
}

interface CharacterDropPayload {
  id: number;
  nombre: string;
  retrato?: string;
}

const CHARACTER_DRAG_MIME = "application/x-fosteria-character";

const CELL_PX = 70;
type LayerSelection = "fichas" | "mapa" | "dm";

type VisionShape = {
  radius: number;
  apertura: number;
  rotation: number;
  angle: number;
  length: number;
  width: number;
  height: number;
};

// No save/restore/translate/rotate — all coords computed directly (fast in tight loops)
function addVisionShapeToPath(
  ctx: CanvasRenderingContext2D,
  arcType: string,
  shape: VisionShape,
  posicionX: number,
  posicionY: number,
  grid: { rectX: number; rectY: number },
  cellPx: number,
) {
  const cx = grid.rectX + (posicionX + 0.5) * cellPx;
  const cy = grid.rectY + (posicionY + 0.5) * cellPx;
  const rot = (shape.rotation * Math.PI) / 180;

  if (arcType === "semicircle") {
    const halfAp = ((shape.apertura / 2) * Math.PI) / 180;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, shape.radius * cellPx, rot - halfAp, rot + halfAp);
    ctx.closePath();
  } else if (arcType === "cone") {
    const halfA = ((shape.angle / 2) * Math.PI) / 180;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, shape.length * cellPx, rot - halfA, rot + halfA);
    ctx.closePath();
  } else if (arcType === "rectangle") {
    const hw = (shape.width / 2) * cellPx;
    const h = shape.height * cellPx;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    // Rotate corners around (cx, cy) without modifying ctx transform
    ctx.moveTo(cx - hw * cosR, cy - hw * sinR);
    ctx.lineTo(cx + hw * cosR, cy + hw * sinR);
    ctx.lineTo(cx + hw * cosR - h * sinR, cy + hw * sinR + h * cosR);
    ctx.lineTo(cx - hw * cosR - h * sinR, cy - hw * sinR + h * cosR);
    ctx.closePath();
  }
}

function drawVisionShape(
  ctx: CanvasRenderingContext2D,
  arcType: string,
  shape: VisionShape,
  posicionX: number,
  posicionY: number,
  grid: { rectX: number; rectY: number },
  cellPx: number,
) {
  ctx.beginPath();
  addVisionShapeToPath(ctx, arcType, shape, posicionX, posicionY, grid, cellPx);
  ctx.fill();
}
type ToolSelection =
  | "move"
  | "select"
  | "pencil"
  | "ruler"
  | "fog"
  | "timer"
  | "chest";

const CHARACTER_REMOTE_UPDATED_EVENT = "fosteria:character-remote-updated";

function SidebarBtn({
  children,
  title,
  isActive = false,
  onClick,
}: {
  children: ReactNode;
  title: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded transition-all ${
        isActive
          ? "border border-amber-400/95 bg-amber-700/18 text-amber-100 shadow-[inset_0_0_0_1px_rgba(146,64,14,0.55)]"
          : "border border-transparent text-white/75 hover:bg-white/12 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SidebarDivider({ label }: { label?: string }) {
  return (
    <div className="my-1 flex w-full flex-col items-center gap-0.5">
      {label ? (
        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/75">
          {label}
        </span>
      ) : null}
      <div className="h-px w-5.5 bg-white/20" />
    </div>
  );
}

export default function CampaignPestañaScreen({
  campaignId,
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onBack,
}: CampaignPestañaScreenProps) {
  const [pestaña, setPestaña] = useState<CampaignPestañaResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<LayerSelection>("fichas");
  const [selectedTool, setSelectedTool] = useState<ToolSelection>("move");
  const [mapLayerImageUrl, setMapLayerImageUrl] = useState<string | null>(null);
  const [mapLayerImage, setMapLayerImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [positions, setPositions] = useState<CampaignPositionResponse[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null,
  );
  const [modalCharacterId, setModalCharacterId] = useState<number | null>(null);
  const [iniciativaEstado, setIniciativaEstado] = useState<IniciativaEstado>({
    activa: false,
    entradas: [],
  });
  const [nieblaEstado, setNieblaEstado] = useState<NieblaEstado>({
    activa: false,
    zonasExploradas: false,
    vistaJugador: false,
    visionConfigs: [],
    exploredAreas: [],
  });
  const [isFogDropdownOpen, setIsFogDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    posicionId: number;
    x: number;
    y: number;
  } | null>(null);
  const [visionArcTarget, setVisionArcTarget] = useState<number | null>(null);
  const liveRotationRef = useRef(0);
  const pestañaIdRef = useRef<number | null>(pestaña?.id ?? null);
  useEffect(() => {
    pestañaIdRef.current = pestaña?.id ?? null;
  }, [pestaña?.id]);
  // Use a ref (not state) for the dragging token so fog updates are frame-synchronous
  const draggingTokenRef = useRef<{
    posicionId: number;
    posicionX: number; // fractional grid coords
    posicionY: number;
  } | null>(null);
  const fogLayerRef = useRef<Konva.Layer>(null);
  // Cells explored locally during the current drag (keyed by "posicionId-cellX-cellY")
  const localPathRef = useRef<ExploredArea[]>([]);
  // Last integer cell the dragging token occupied
  const lastDragCellRef = useRef<{
    x: number;
    y: number;
    posicionId: number;
  } | null>(null);
  const rotationDragRef = useRef<{
    posicionId: number;
    tokenCenterClientX: number;
    tokenCenterClientY: number;
    startClientX: number;
    startClientY: number;
    hasMoved: boolean;
  } | null>(null);
  // Offscreen canvas cache for server-side explored areas (invalidated on list change or transform change)
  const exploredBitmapRef = useRef<{
    canvas: HTMLCanvasElement;
    key: string;
  } | null>(null);
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);
  const [isRulerSelectorOpen, setIsRulerSelectorOpen] = useState(false);
  const [isPencilSelectorOpen, setIsPencilSelectorOpen] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mapLayerImageUrl) {
      setMapLayerImage(null);
      return;
    }
    const img = new Image();
    img.src = mapLayerImageUrl;
    img.onload = () => setMapLayerImage(img);
  }, [mapLayerImageUrl]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setLoadError("No hay sesión activa.");
      setIsLoading(false);
      return;
    }

    const openOrCreatePestaña = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(
          buildApiUrl(`/api/campanas/${campaignId}/pestana/abrir`),
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          throw new Error("No se pudo abrir la pestaña de campaña.");
        }

        const data = (await response.json()) as CampaignPestañaResponse;
        setPestaña(data);
        setMapLayerImageUrl(data.mapaCapaUrl ?? null);
      } catch (error) {
        setLoadError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void openOrCreatePestaña();
  }, [campaignId]);

  const grid = useMemo(() => {
    const cols = Math.max(4, pestaña?.nCuadriculasX ?? 20);
    const rows = Math.max(4, pestaña?.nCuadriculasY ?? 20);
    const rectW = cols * CELL_PX;
    const rectH = rows * CELL_PX;
    const rectX = (stageSize.width - rectW) / 2;
    const rectY = (stageSize.height - rectH) / 2;
    const vLines = Array.from(
      { length: cols + 1 },
      (_, index) => index * CELL_PX,
    );
    const hLines = Array.from(
      { length: rows + 1 },
      (_, index) => index * CELL_PX,
    );

    return { cols, rows, rectW, rectH, rectX, rectY, vLines, hLines };
  }, [pestaña, stageSize]);

  const campaignIdNumber = useMemo(() => {
    const parsed = Number(campaignId);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [campaignId]);

  const [chatMessages, setChatMessages] = useState<CampaignChatMessage[]>([]);
  const { sendMessage: sendChatMessage } = useWebSocketChat({
    campaignId: campaignIdNumber,
    username,
    onNewMessage: (msg) => setChatMessages((prev) => [...prev, msg]),
    onPlayersUpdate: () => {},
    onError: () => {},
  });

  const handlePosicionCreated = useCallback(
    (posicion: Omit<CampaignPositionResponse, "capa"> & { capa: string }) => {
      setPositions((current) => {
        const next = current.filter((item) => item.id !== posicion.id);
        if (posicion.pestanaId !== pestañaIdRef.current) {
          // Token moved to another tab — remove it from this view
          return next;
        }
        return [...next, posicion as CampaignPositionResponse].sort(
          (left, right) => left.id - right.id,
        );
      });
    },
    [],
  );

  const handleMapLayerChanged = useCallback(
    (payload: { pestanaId: number; mapaUrl?: string | null }) => {
      if (!pestaña?.id || payload.pestanaId !== pestaña.id) {
        return;
      }
      setMapLayerImageUrl(payload.mapaUrl ?? null);
    },
    [pestaña?.id],
  );

  const handleCharacterUpdated = useCallback((characterId: number) => {
    window.dispatchEvent(
      new CustomEvent(CHARACTER_REMOTE_UPDATED_EVENT, {
        detail: { characterId },
      }),
    );
  }, []);

  const handleIniciativaChanged = useCallback((estado: IniciativaEstado) => {
    setIniciativaEstado(estado);
  }, []);

  const handleNieblaChanged = useCallback((estado: NieblaEstado) => {
    setNieblaEstado(estado);
  }, []);

  const cambioPestañaImplRef = useRef<
    ((pestanaId: number, jugadores: string[] | null) => void) | null
  >(null);
  const handleCambioPestañaForzado = useCallback(
    (pestanaId: number, jugadores: string[] | null) => {
      cambioPestañaImplRef.current?.(pestanaId, jugadores);
    },
    [],
  );

  const realtime = useCampaignRealtime({
    campaignId: campaignIdNumber,
    pestanaId: pestaña?.id ?? null,
    onPosicionCreated: handlePosicionCreated,
    onMapLayerChanged: handleMapLayerChanged,
    onCharacterUpdated: handleCharacterUpdated,
    onIniciativaChanged: handleIniciativaChanged,
    onNieblaChanged: handleNieblaChanged,
    onCambioPestañaForzado: handleCambioPestañaForzado,
  });

  const {
    crearPosicionPorWebSocket,
    moverPosicionPorWebSocket,
    asignarMapaPorWebSocket,
    drawings,
    sendDrawing,
    deleteDrawing,
    activarIniciativa,
    tirarIniciativa,
    reordenarIniciativa,
    configurarNiebla,
    configurarVisionToken,
    agregarAreaExplorada,
    cambiarCapaToken,
    forzarCambioPestana,
  } = realtime;

  // Rotation drag via right-click-hold + mouse movement
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = rotationDragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (!drag.hasMoved && (Math.abs(dx) >= 5 || Math.abs(dy) >= 5)) {
        drag.hasMoved = true;
      }
      if (drag.hasMoved) {
        const angleDeg =
          (Math.atan2(
            e.clientY - drag.tokenCenterClientY,
            e.clientX - drag.tokenCenterClientX,
          ) *
            180) /
          Math.PI;
        const normalized = (angleDeg + 360) % 360;
        liveRotationRef.current = normalized;
        setNieblaEstado((prev) => ({
          ...prev,
          visionConfigs: prev.visionConfigs.map((vc) =>
            vc.posicionId === drag.posicionId
              ? { ...vc, rotation: normalized }
              : vc,
          ),
        }));
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const drag = rotationDragRef.current;
      if (!drag) return;
      rotationDragRef.current = null;
      if (drag.hasMoved) {
        // Persist the final rotation via WebSocket
        setNieblaEstado((prev) => {
          const vc = prev.visionConfigs.find(
            (v) => v.posicionId === drag.posicionId,
          );
          if (vc) configurarVisionToken(vc);
          return prev;
        });
      } else {
        // Treat as right-click → show context menu
        setContextMenu({
          posicionId: drag.posicionId,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [configurarVisionToken]);

  const drawingsSocket = useMemo(
    () => ({ drawings, sendDrawing, deleteDrawing }),
    [drawings, sendDrawing, deleteDrawing],
  );

  const handleMapSelect = useCallback(
    async ({ mapaId, mapaUrl }: { mapaId: number; mapaUrl: string }) => {
      if (!pestaña?.id || !campaignIdNumber) {
        return;
      }

      try {
        asignarMapaPorWebSocket({
          pestanaId: pestaña.id,
          mapaId,
        });

        // Respuesta optimista local: si la emisión tarda, el usuario ve el cambio al instante.
        setMapLayerImageUrl(mapaUrl);
      } catch (error) {
        console.error(error);
      }
    },
    [asignarMapaPorWebSocket, campaignIdNumber, pestaña?.id],
  );

  const loadPositions = useCallback(async () => {
    if (!campaignIdNumber || !pestaña?.id) {
      setPositions([]);
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setPositions([]);
      return;
    }

    const response = await fetch(
      buildApiUrl(
        `/api/campanas/${campaignIdNumber}/posiciones?pestanaId=${pestaña.id}`,
      ),
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error("No se pudieron cargar las fichas de la pestaña.");
    }

    const payload = (await response.json()) as CampaignPositionResponse[];
    setPositions(payload ?? []);
  }, [campaignIdNumber, pestaña?.id]);

  useEffect(() => {
    void loadPositions().catch(() => {
      setPositions([]);
    });
  }, [loadPositions]);

  const switchPestaña = useCallback(
    async (pestañaId: number) => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;
      try {
        const response = await fetch(
          buildApiUrl(`/api/campanas/${campaignId}/pestana/${pestañaId}/abrir`),
          { method: "POST", headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) return;
        const data = (await response.json()) as CampaignPestañaResponse;
        setPestaña(data);
        setMapLayerImageUrl(data.mapaCapaUrl ?? null);
      } catch {
        // ignore
      } finally {
        setIsTabSwitcherOpen(false);
      }
    },
    [campaignId],
  );

  cambioPestañaImplRef.current = (
    pestanaId: number,
    jugadores: string[] | null,
  ) => {
    if (jugadores === null || jugadores.includes(username)) {
      void switchPestaña(pestanaId);
    }
  };

  const handlePencilCompleteDrawing = useCallback(
    (drawing: {
      pestanaId: number;
      capa: "fichas" | "mapa" | "dm";
      tipo: "pencil" | "rectangle" | "ellipse" | "triangle";
      color: string;
      relleno: boolean;
      puntos: Array<{ x: number; y: number }>;
    }) => {
      try {
        drawingsSocket.sendDrawing(drawing);
      } catch {
        // Evita bloquear la pantalla completa por un error temporal de WebSocket.
        console.error("No hay conexión en tiempo real para enviar el dibujo.");
      }
    },
    [drawingsSocket],
  );

  const handlePencilEraseDrawing = useCallback(
    (drawingId: number) => {
      if (!pestaña?.id) {
        return;
      }

      try {
        drawingsSocket.deleteDrawing({
          pestanaId: pestaña.id,
          capa: selectedLayer,
          dibujoId: drawingId,
        });
      } catch {
        console.error("No hay conexión en tiempo real para borrar el dibujo.");
      }
    },
    [drawingsSocket, pestaña?.id, selectedLayer],
  );

  const rulerTool = useCampaignRulerTool({
    enabled: selectedTool === "ruler",
    stageRef,
    grid,
    cellPx: CELL_PX,
    unitDistance: pestaña?.distanciaCasilla ?? 5,
    metric: pestaña?.sistemaMetrico ?? "ft",
  });

  const pencilTool = useCampaignPencilTool({
    enabled: selectedTool === "pencil",
    stageRef,
    selectedLayer,
    pestanaId: pestaña?.id ?? null,
    drawings: drawingsSocket.drawings,
    onCompleteDrawing: handlePencilCompleteDrawing,
    onEraseDrawing: handlePencilEraseDrawing,
  });

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const scaleBy = 1.08;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.1), 10);

    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const handleToolSelection = (tool: ToolSelection) => {
    setSelectedTool(tool);
    setIsRulerSelectorOpen(tool === "ruler");
    setIsPencilSelectorOpen(tool === "pencil");
  };

  const handleStageMouseDown = () => {
    const rulerStarted = rulerTool.handleMouseDown();
    if (rulerStarted) {
      setIsRulerSelectorOpen(false);
    }

    const pencilStarted = pencilTool.handleMouseDown();
    if (pencilStarted) {
      setIsPencilSelectorOpen(false);
    }
  };

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes(CHARACTER_DRAG_MIME)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [],
  );

  const handleCharacterDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes(CHARACTER_DRAG_MIME)) {
        return;
      }

      event.preventDefault();

      const stage = stageRef.current;
      const token = localStorage.getItem("jwtToken");
      if (!stage || !token || !pestaña?.id || !campaignIdNumber) {
        return;
      }

      const rawPayload = event.dataTransfer.getData(CHARACTER_DRAG_MIME);
      if (!rawPayload) {
        return;
      }

      let payload: CharacterDropPayload;
      try {
        payload = JSON.parse(rawPayload) as CharacterDropPayload;
      } catch {
        return;
      }

      if (!payload.id) {
        return;
      }

      const containerRect = stage.container().getBoundingClientRect();
      const pointer = {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      };

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePoint = transform.point(pointer);

      const relativeX = stagePoint.x - grid.rectX;
      const relativeY = stagePoint.y - grid.rectY;
      if (
        relativeX < 0 ||
        relativeY < 0 ||
        relativeX >= grid.rectW ||
        relativeY >= grid.rectH
      ) {
        return;
      }

      const posicionX = Math.floor(relativeX / CELL_PX);
      const posicionY = Math.floor(relativeY / CELL_PX);
      if (
        posicionX < 0 ||
        posicionY < 0 ||
        posicionX >= grid.cols ||
        posicionY >= grid.rows
      ) {
        return;
      }

      // Enviar por WebSocket en lugar de REST
      crearPosicionPorWebSocket({
        pestanaId: pestaña.id,
        capa: selectedLayer,
        personajeId: payload.id,
        posicionX,
        posicionY,
      });
    },
    [
      campaignIdNumber,
      crearPosicionPorWebSocket,
      grid,
      pestaña?.id,
      selectedLayer,
    ],
  );

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-stone-400"
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver}
      onDrop={(event) => {
        void handleCharacterDrop(event).catch((error: unknown) => {
          console.error(error);
        });
      }}
    >
      <CampaignRulerShapeSelector
        visible={selectedTool === "ruler" && isRulerSelectorOpen}
        selectedShape={rulerTool.selectedShape}
        onSelectShape={rulerTool.setSelectedShape}
      />

      <CampaignPencilShapeSelector
        visible={selectedTool === "pencil" && isPencilSelectorOpen}
        selectedShape={pencilTool.selectedShape}
        onSelectShape={pencilTool.setSelectedShape}
      />

      <CampaignPencilOptionsModal
        visible={selectedTool === "pencil"}
        color={pencilTool.strokeColor}
        onColorChange={pencilTool.setStrokeColor}
        fillEnabled={pencilTool.fillEnabled}
        onFillToggle={pencilTool.setFillEnabled}
      />

      {iniciativaEstado.activa ? (
        <IniciativaBar
          entradas={iniciativaEstado.entradas}
          onReordenar={reordenarIniciativa}
        />
      ) : null}

      {isTabSwitcherOpen ? (
        <PestañaSwitcherPanel
          campaignId={campaignId}
          currentPestañaId={pestaña?.id ?? null}
          isDM={username === (pestaña?.dmUsername ?? "")}
          username={username}
          onSelect={(id) => {
            void switchPestaña(id);
          }}
          onClose={() => setIsTabSwitcherOpen(false)}
          onForzarTodos={(pestañaId) => {
            forzarCambioPestana(pestañaId, null);
          }}
          onForzarJugadores={(pestañaId, jugadores) => {
            forzarCambioPestana(pestañaId, jugadores);
          }}
        />
      ) : null}

      <CharacterTokenPanel
        positions={positions}
        isDM={username === (pestaña?.dmUsername ?? "")}
        chatMessages={chatMessages}
        onSendMessage={sendChatMessage}
        onOpenCharacterSheet={(characterId) => {
          setModalCharacterId(characterId);
          setSelectedPositionId(null);
        }}
        onInteract={() => setSelectedPositionId(null)}
        iniciativaActiva={iniciativaEstado.activa}
        personajesConIniciativa={
          new Set(iniciativaEstado.entradas.map((e) => e.personajeId))
        }
        onTirarIniciativa={(personajeId, nombre, retrato, bonificacion) => {
          const tirada = Math.floor(Math.random() * 20) + 1;
          tirarIniciativa(personajeId, nombre, retrato, tirada, bonificacion);
        }}
        isTabSwitcherOpen={isTabSwitcherOpen}
        onTabSwitcherToggle={() => setIsTabSwitcherOpen(true)}
      />

      <QuickActionBar
        selectedPosition={
          selectedPositionId != null
            ? (positions.find((p) => p.id === selectedPositionId) ?? null)
            : null
        }
        onClose={() => setSelectedPositionId(null)}
        onRollResult={(text) => {
          void sendChatMessage(text);
        }}
      />

      {modalCharacterId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setModalCharacterId(null)}
        >
          <div
            className="relative h-[92vh] w-[min(1500px,96vw)] overflow-hidden rounded-[28px] border border-white/15 bg-[linear-gradient(180deg,rgba(18,18,18,0.98)_0%,rgba(10,10,10,0.99)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalCharacterId(null)}
              className="absolute right-4 top-4 z-[60] rounded-full border border-white/25 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80"
            >
              Cerrar
            </button>

            <div className="h-full overflow-auto">
              <DndCharacterSheetScreen
                username={username}
                avatarUrl={avatarUrl}
                characterId={String(modalCharacterId)}
                onLogout={onLogout}
                onGoHome={onGoHome}
                onGoCampaigns={onGoCampaigns}
                onGoCharacters={() => setModalCharacterId(null)}
                modalMode
              />
            </div>
          </div>
        </div>
      ) : null}

      {selectedTool === "chest" ? (
        <Baul
          campaignId={campaignId}
          onClose={() => handleToolSelection("move")}
          onMapSelect={handleMapSelect}
        />
      ) : !isTabSwitcherOpen ? (
        <div className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center gap-1 rounded-[12px] border border-white/15 bg-black/50 p-[8px_6px]">
          <SidebarBtn title="Volver a campaña" onClick={onBack}>
            <ArrowLeftRight size={18} />
          </SidebarBtn>

          <SidebarBtn title="Ajustes">
            <Settings size={18} />
          </SidebarBtn>

          <SidebarDivider label="click" />

          <SidebarBtn
            title="Mover"
            isActive={selectedTool === "move"}
            onClick={() => handleToolSelection("move")}
          >
            <Move size={18} />
          </SidebarBtn>
          <SidebarBtn
            title="Seleccionar"
            isActive={selectedTool === "select"}
            onClick={() => handleToolSelection("select")}
          >
            <MousePointer2 size={18} />
          </SidebarBtn>

          <SidebarDivider label="Herramientas" />

          <SidebarBtn
            title="Lápiz"
            isActive={selectedTool === "pencil"}
            onClick={() => handleToolSelection("pencil")}
          >
            <Pencil size={18} />
          </SidebarBtn>
          <SidebarBtn
            title="Regla"
            isActive={selectedTool === "ruler"}
            onClick={() => handleToolSelection("ruler")}
          >
            <Ruler size={18} />
          </SidebarBtn>
          <div className="relative">
            <SidebarBtn
              title="Niebla de guerra"
              isActive={selectedTool === "fog" || isFogDropdownOpen}
              onClick={() => {
                handleToolSelection("fog");
                setIsFogDropdownOpen((v) => !v);
              }}
            >
              <Cloud size={18} />
            </SidebarBtn>
            {isFogDropdownOpen && (
              <FogOfWarDropdown
                estado={nieblaEstado}
                onChange={(patch) => {
                  const next = { ...nieblaEstado, ...patch };
                  setNieblaEstado(next);
                  configurarNiebla(patch);
                }}
                onClose={() => setIsFogDropdownOpen(false)}
              />
            )}
          </div>
          <SidebarBtn
            title="Temporizador"
            isActive={selectedTool === "timer"}
            onClick={() => {
              if (selectedTool === "timer") {
                activarIniciativa(false);
                handleToolSelection("move");
              } else {
                activarIniciativa(true);
                handleToolSelection("timer");
              }
            }}
          >
            <Timer size={18} />
          </SidebarBtn>
          <SidebarBtn title="Baúl" onClick={() => handleToolSelection("chest")}>
            <Archive size={18} />
          </SidebarBtn>

          <SidebarDivider label="Capas" />

          <SidebarBtn
            title="Fichas"
            isActive={selectedLayer === "fichas"}
            onClick={() => setSelectedLayer("fichas")}
          >
            <User size={18} />
          </SidebarBtn>
          <SidebarBtn
            title="Mapa"
            isActive={selectedLayer === "mapa"}
            onClick={() => setSelectedLayer("mapa")}
          >
            <Map size={18} />
          </SidebarBtn>
          <SidebarBtn
            title="DM"
            isActive={selectedLayer === "dm"}
            onClick={() => setSelectedLayer("dm")}
          >
            <BookOpen size={18} />
          </SidebarBtn>
        </div>
      ) : null}

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
          Cargando pestaña...
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg border border-red-300/40 bg-red-900/50 px-3.5 py-2 text-sm text-red-300">
            {loadError}
          </p>
        </div>
      ) : null}

      {!isLoading && !loadError ? (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={selectedTool !== "pencil" && selectedTool !== "ruler"}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (
              e.evt.button === 0 &&
              selectedTool !== "pencil" &&
              selectedTool !== "ruler"
            ) {
              setSelectedTool("move");
            }
          }}
          onMouseMove={() => {
            rulerTool.handleMouseMove();
            pencilTool.handleMouseMove();
          }}
          onMouseUp={() => {
            rulerTool.handleMouseUp();
            pencilTool.handleMouseUp();
          }}
          onMouseLeave={() => {
            rulerTool.handleMouseUp();
            pencilTool.handleMouseUp();
          }}
          style={{
            cursor:
              selectedTool === "ruler"
                ? "crosshair"
                : selectedTool === "pencil"
                  ? pencilTool.selectedShape === "eraser"
                    ? "cell"
                    : "crosshair"
                  : selectedTool === "move"
                    ? "grab"
                    : "default",
          }}
        >
          <Layer>
            <Rect
              x={grid.rectX}
              y={grid.rectY}
              width={grid.rectW}
              height={grid.rectH}
              fill="white"
              shadowColor="black"
              shadowBlur={30}
              shadowOpacity={0.4}
            />

            {mapLayerImage ? (
              <KonvaImage
                x={grid.rectX}
                y={grid.rectY}
                width={grid.rectW}
                height={grid.rectH}
                image={mapLayerImage}
                shadowColor="black"
                shadowBlur={30}
                shadowOpacity={0.4}
              />
            ) : null}

            {grid.vLines.map((x) => (
              <Line
                key={`v-${x}`}
                points={[
                  x + grid.rectX,
                  grid.rectY,
                  x + grid.rectX,
                  grid.rectY + grid.rectH,
                ]}
                stroke="#d4d4d4"
                strokeWidth={1}
              />
            ))}

            {grid.hLines.map((y) => (
              <Line
                key={`h-${y}`}
                points={[
                  grid.rectX,
                  y + grid.rectY,
                  grid.rectX + grid.rectW,
                  y + grid.rectY,
                ]}
                stroke="#d4d4d4"
                strokeWidth={1}
              />
            ))}

            {positions
              .filter((p) => {
                if (p.pestanaId !== pestaña?.id) return false;
                const isDM = username === (pestaña?.dmUsername ?? "");
                return isDM || p.capa !== "dm";
              })
              .map((position) => {
                const isDM = username === (pestaña?.dmUsername ?? "");
                const isInteractable =
                  position.capa === "dm"
                    ? isDM
                    : position.capa === "mapa"
                      ? isDM && selectedLayer === "mapa"
                      : isDM || (position.tipo ?? "personaje") !== "enemigo";
                return (
                  <PosicionFicha
                    key={position.id}
                    position={position}
                    grid={grid}
                    isInteractable={isInteractable}
                    isSelected={selectedPositionId === position.id}
                    onDragStart={() => {
                      localPathRef.current = [];
                      lastDragCellRef.current = {
                        x: position.posicionX,
                        y: position.posicionY,
                        posicionId: position.id,
                      };
                      draggingTokenRef.current = {
                        posicionId: position.id,
                        posicionX: position.posicionX,
                        posicionY: position.posicionY,
                      };
                    }}
                    onDragMove={(id, gx, gy) => {
                      draggingTokenRef.current = {
                        posicionId: id,
                        posicionX: gx,
                        posicionY: gy,
                      };
                      fogLayerRef.current?.batchDraw();

                      // Accumulate explored cells as the token moves through them
                      if (nieblaEstado.zonasExploradas) {
                        const vc = nieblaEstado.visionConfigs.find(
                          (v) => v.posicionId === id,
                        );
                        if (vc?.revelaArea) {
                          const cellX = Math.floor(gx);
                          const cellY = Math.floor(gy);
                          const last = lastDragCellRef.current;
                          if (last && (last.x !== cellX || last.y !== cellY)) {
                            const areaId = `${id}-${last.x}-${last.y}`;
                            const alreadyLocal = localPathRef.current.some(
                              (a) => a.id === areaId,
                            );
                            if (!alreadyLocal) {
                              localPathRef.current = [
                                ...localPathRef.current,
                                {
                                  id: areaId,
                                  posicionX: last.x,
                                  posicionY: last.y,
                                  arcType: vc.arcType,
                                  radius: vc.radius,
                                  apertura: vc.apertura,
                                  rotation: vc.rotation,
                                  angle: vc.angle,
                                  length: vc.length,
                                  width: vc.width,
                                  height: vc.height,
                                },
                              ];
                            }
                            lastDragCellRef.current = {
                              x: cellX,
                              y: cellY,
                              posicionId: id,
                            };
                          }
                        }
                      }
                    }}
                    onDragEnd={(x, y) => {
                      draggingTokenRef.current = null;
                      // Optimistic update so fog moves to new position immediately
                      setPositions((prev) =>
                        prev.map((p) =>
                          p.id === position.id
                            ? { ...p, posicionX: x, posicionY: y }
                            : p,
                        ),
                      );
                      // Flush locally accumulated path to server
                      for (const area of localPathRef.current) {
                        agregarAreaExplorada(area);
                      }
                      localPathRef.current = [];
                      lastDragCellRef.current = null;
                      moverPosicionPorWebSocket(position.id, x, y);
                    }}
                    onTokenClick={(id) =>
                      setSelectedPositionId((prev) => (prev === id ? null : id))
                    }
                    onRightMouseDown={(id, tcx, tcy, sx, sy) => {
                      rotationDragRef.current = {
                        posicionId: id,
                        tokenCenterClientX: tcx,
                        tokenCenterClientY: tcy,
                        startClientX: sx,
                        startClientY: sy,
                        hasMoved: false,
                      };
                    }}
                  />
                );
              })}

            <CampaignRulerOverlay
              visible={selectedTool === "ruler"}
              selectedShape={rulerTool.selectedShape}
              measurement={rulerTool.measurement}
              overlay={rulerTool.overlay}
            />

            <CampaignPencilOverlay
              drawings={drawingsSocket.drawings}
              selectedLayer={selectedLayer}
              previewDrawing={pencilTool.previewDrawing}
            />
          </Layer>

          {/* Fog of war layer */}
          {nieblaEstado.activa && (
            <Layer ref={fogLayerRef} listening={false}>
              <Shape
                perfectDrawEnabled={false}
                sceneFunc={(konvaCtx) => {
                  const ctx = (
                    konvaCtx as unknown as {
                      _context: CanvasRenderingContext2D;
                    }
                  )._context;
                  ctx.save();

                  const isDmView = !nieblaEstado.vistaJugador;
                  ctx.globalCompositeOperation = "source-over";
                  ctx.fillStyle = isDmView
                    ? "rgba(0,0,0,0.75)"
                    : "rgba(0,0,0,1)";
                  ctx.fillRect(grid.rectX, grid.rectY, grid.rectW, grid.rectH);

                  ctx.globalCompositeOperation = "destination-out";

                  // Explored areas: server-side areas are cached in an offscreen bitmap
                  // (O(1) per frame after first build); local drag areas are redrawn fresh (small count).
                  if (nieblaEstado.zonasExploradas) {
                    const serverAreas = nieblaEstado.exploredAreas ?? [];
                    const localAreas = localPathRef.current;

                    if (serverAreas.length > 0) {
                      const transform = ctx.getTransform();
                      const cacheKey = [
                        serverAreas.length,
                        serverAreas.at(-1)?.id ?? "",
                        ctx.canvas.width,
                        ctx.canvas.height,
                        transform.a.toFixed(4),
                        transform.e.toFixed(1),
                        transform.f.toFixed(1),
                        grid.rectX.toFixed(1),
                        grid.rectY.toFixed(1),
                        grid.cols,
                        grid.rows,
                      ].join("|");

                      if (exploredBitmapRef.current?.key !== cacheKey) {
                        const off = document.createElement("canvas");
                        off.width = ctx.canvas.width;
                        off.height = ctx.canvas.height;
                        const offCtx = off.getContext("2d")!;
                        offCtx.setTransform(transform);
                        offCtx.beginPath();
                        for (const area of serverAreas) {
                          addVisionShapeToPath(
                            offCtx,
                            area.arcType,
                            area,
                            area.posicionX,
                            area.posicionY,
                            grid,
                            CELL_PX,
                          );
                        }
                        offCtx.fillStyle = "#000";
                        offCtx.fill();
                        exploredBitmapRef.current = {
                          canvas: off,
                          key: cacheKey,
                        };
                      }

                      const savedTransform = ctx.getTransform();
                      ctx.setTransform(1, 0, 0, 1, 0, 0);
                      ctx.globalAlpha = 0.25;
                      ctx.drawImage(exploredBitmapRef.current.canvas, 0, 0);
                      ctx.setTransform(savedTransform);
                      ctx.globalAlpha = 1;
                    }

                    if (localAreas.length > 0) {
                      ctx.beginPath();
                      for (const area of localAreas) {
                        addVisionShapeToPath(
                          ctx,
                          area.arcType,
                          area,
                          area.posicionX,
                          area.posicionY,
                          grid,
                          CELL_PX,
                        );
                      }
                      ctx.globalAlpha = 0.25;
                      ctx.fillStyle = "#000";
                      ctx.fill();
                      ctx.globalAlpha = 1;
                    }
                  }

                  // Active vision zones: fully reveal, use live drag position when dragging
                  ctx.fillStyle = "rgba(0,0,0,1)";
                  for (const vc of nieblaEstado.visionConfigs) {
                    if (!vc.revelaArea) continue;
                    const live =
                      draggingTokenRef.current?.posicionId === vc.posicionId
                        ? draggingTokenRef.current
                        : null;
                    const posX =
                      live?.posicionX ??
                      positions.find((p) => p.id === vc.posicionId)
                        ?.posicionX ??
                      null;
                    const posY =
                      live?.posicionY ??
                      positions.find((p) => p.id === vc.posicionId)
                        ?.posicionY ??
                      null;
                    if (posX === null || posY === null) continue;
                    // Always reveal the token body so it's never swallowed by fog
                    const tcx = grid.rectX + (posX + 0.5) * CELL_PX;
                    const tcy = grid.rectY + (posY + 0.5) * CELL_PX;
                    ctx.beginPath();
                    ctx.arc(tcx, tcy, CELL_PX / 2 + 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Directional vision shape extends from the token's outer edge
                    drawVisionShape(
                      ctx,
                      vc.arcType,
                      vc,
                      posX,
                      posY,
                      grid,
                      CELL_PX,
                    );
                  }

                  ctx.restore();
                }}
              />
            </Layer>
          )}
        </Stage>
      ) : null}

      {/* Token context menu */}
      {contextMenu && (
        <TokenContextMenu
          posicionId={contextMenu.posicionId}
          x={contextMenu.x}
          y={contextMenu.y}
          fogActiva={nieblaEstado.activa}
          isDM={username === (pestaña?.dmUsername ?? "")}
          currentCapa={
            (positions.find((p) => p.id === contextMenu.posicionId)?.capa ??
              "fichas") as "fichas" | "mapa" | "dm"
          }
          visionConfig={
            nieblaEstado.visionConfigs.find(
              (vc) => vc.posicionId === contextMenu.posicionId,
            ) ?? null
          }
          onCambiarCapa={(posicionId, capa) =>
            cambiarCapaToken(posicionId, capa)
          }
          onToggleRevela={(posicionId, revela) => {
            const existing = nieblaEstado.visionConfigs.find(
              (vc) => vc.posicionId === posicionId,
            );
            const updated: VisionConfig = existing
              ? { ...existing, revelaArea: revela }
              : {
                  posicionId,
                  revelaArea: revela,
                  arcType: "semicircle",
                  radius: 6,
                  apertura: 360,
                  rotation: 0,
                  angle: 45,
                  length: 8,
                  width: 4,
                  height: 6,
                };
            configurarVisionToken(updated);
          }}
          onOpenVisionArc={(posicionId) => setVisionArcTarget(posicionId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Vision arc modal */}
      {visionArcTarget !== null &&
        (() => {
          const existingVc = nieblaEstado.visionConfigs.find(
            (vc) => vc.posicionId === visionArcTarget,
          );
          const initialVc: VisionConfig = existingVc ?? {
            posicionId: visionArcTarget,
            revelaArea: true,
            arcType: "semicircle",
            radius: 6,
            apertura: 360,
            rotation: 0,
            angle: 45,
            length: 8,
            width: 4,
            height: 6,
          };
          return (
            <VisionArcModal
              posicionId={visionArcTarget}
              initial={initialVc}
              rotation={
                rotationDragRef.current?.posicionId === visionArcTarget
                  ? liveRotationRef.current
                  : (existingVc?.rotation ?? 0)
              }
              onSave={(config) => configurarVisionToken(config)}
              onClose={() => setVisionArcTarget(null)}
            />
          );
        })()}
    </div>
  );
}
