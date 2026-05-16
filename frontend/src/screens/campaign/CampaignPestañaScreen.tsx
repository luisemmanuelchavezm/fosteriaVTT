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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Layer, Image as KonvaImage, Line, Rect, Stage } from "react-konva";
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
import IniciativaBar from "./components/IniciativaBar";
import Baul from "./components/Baul";
import { PosicionFicha } from "./components/PosicionFicha";
import QuickActionBar from "./components/QuickActionBar";
import DndCharacterSheetScreen from "../personaje/dndcharactersheet/DndCharacterSheetScreen";
import {
  useCampaignRealtime,
  type IniciativaEstado,
} from "./hooks/useCampaignRealtime";

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
}

interface CharacterDropPayload {
  id: number;
  nombre: string;
  retrato?: string;
}

const CHARACTER_DRAG_MIME = "application/x-fosteria-character";

const CELL_PX = 70;
type LayerSelection = "fichas" | "mapa" | "dm";
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

  const handlePosicionCreated = useCallback(
    (posicion: Omit<CampaignPositionResponse, "capa"> & { capa: string }) => {
      setPositions((current) => {
        const next = current.filter((item) => item.id !== posicion.id);
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

  const realtime = useCampaignRealtime({
    campaignId: campaignIdNumber,
    pestanaId: pestaña?.id ?? null,
    onPosicionCreated: handlePosicionCreated,
    onMapLayerChanged: handleMapLayerChanged,
    onCharacterUpdated: handleCharacterUpdated,
    onIniciativaChanged: handleIniciativaChanged,
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
  } = realtime;

  const drawingsSocket = {
    drawings,
    sendDrawing,
    deleteDrawing,
  };

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
    [crearPosicionPorWebSocket, grid, pestaña?.id, selectedLayer],
  );

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-stone-400"
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

      <CharacterTokenPanel
        positions={positions}
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
      />

      <QuickActionBar
        selectedPosition={
          selectedPositionId != null
            ? (positions.find((p) => p.id === selectedPositionId) ?? null)
            : null
        }
        onClose={() => setSelectedPositionId(null)}
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

      {selectedTool !== "chest" ? (
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
          <SidebarBtn
            title="Niebla de guerra"
            isActive={selectedTool === "fog"}
            onClick={() => handleToolSelection("fog")}
          >
            <Cloud size={18} />
          </SidebarBtn>
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
      ) : (
        <Baul
          campaignId={campaignId}
          onClose={() => handleToolSelection("move")}
          onMapSelect={handleMapSelect}
        />
      )}

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
          draggable={selectedTool === "move"}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
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

            {positions.map((position) => (
              <PosicionFicha
                key={position.id}
                position={position}
                grid={grid}
                isSelected={selectedPositionId === position.id}
                onDragEnd={(x, y) => {
                  moverPosicionPorWebSocket(position.id, x, y);
                }}
                onTokenClick={(id) =>
                  setSelectedPositionId((prev) => (prev === id ? null : id))
                }
              />
            ))}

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
        </Stage>
      ) : null}
    </div>
  );
}
