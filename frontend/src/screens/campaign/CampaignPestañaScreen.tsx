import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import CampaignSidebar from "./components/CampaignSidebar";
import CharacterSheetModal from "./components/CharacterSheetModal";
import TokenContextMenu from "./components/TokenContextMenu";
import VisionArcModal from "./components/VisionArcModal";
import {
  useCampaignRealtime,
  type IniciativaEstado,
  type VisionConfig,
} from "./hooks/useCampaignRealtime";
import { useWebSocketChat } from "./hooks/useWebSocketChat";
import { usePestañaLoader } from "./hooks/usePestañaLoader";
import { useCampaignGridConfig } from "./hooks/useCampaignGridConfig";
import { useCampaignInvite } from "./hooks/useCampaignInvite";
import { useFogOfWarInteraction } from "./hooks/useFogOfWarInteraction";
import type {
  CampaignChatMessage,
  CampaignPestañaScreenProps,
  CampaignPestañaResponse,
  CampaignPositionResponse,
  CharacterDropPayload,
  LayerSelection,
  ToolSelection,
} from "./types";
import { CHARACTER_DRAG_MIME, CHARACTER_REMOTE_UPDATED_EVENT } from "./types";
import {
  addVisionShapeToPath,
  drawVisionShape,
  isTokenVisibleToPlayer,
} from "./utils/fogGeometry";

export default function CampaignPestañaScreen({
  campaignId,
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onBack,
}: CampaignPestañaScreenProps) {
  // ── Pestaña loader ────────────────────────────────────────────────────────
  const {
    pestaña,
    setPestaña,
    loadError,
    isLoading,
    setMapLayerImageUrl,
    mapLayerImage,
    stageSize,
    campaignIdNumber,
    pestañaIdRef,
    pestañaRef,
    grid,
  } = usePestañaLoader(campaignId);

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [selectedLayer, setSelectedLayer] = useState<LayerSelection>("fichas");
  const [selectedTool, setSelectedTool] = useState<ToolSelection>("move");
  const [positions, setPositions] = useState<CampaignPositionResponse[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null,
  );
  const [resizingPositionId, setResizingPositionId] = useState<number | null>(
    null,
  );
  const [modalCharacterId, setModalCharacterId] = useState<number | null>(null);
  const [iniciativaEstado, setIniciativaEstado] = useState<IniciativaEstado>({
    activa: false,
    entradas: [],
  });
  const [isFogDropdownOpen, setIsFogDropdownOpen] = useState(false);
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);
  const [isRulerSelectorOpen, setIsRulerSelectorOpen] = useState(false);
  const [isPencilSelectorOpen, setIsPencilSelectorOpen] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const [chatMessages, setChatMessages] = useState<CampaignChatMessage[]>([]);

  // ── Niebla de guerra ──────────────────────────────────────────────────────
  const fog = useFogOfWarInteraction({
    positions,
    configurarVisionToken: (...args) => realtime.configurarVisionToken(...args),
    agregarAreasExploradasBatch: (...args) =>
      realtime.agregarAreasExploradasBatch(...args),
  });

  // ── WebSocket chat ────────────────────────────────────────────────────────
  const { sendMessage: sendChatMessage } = useWebSocketChat({
    campaignId: campaignIdNumber,
    username,
    onNewMessage: (msg) => setChatMessages((prev) => [...prev, msg]),
    onPlayersUpdate: () => {},
    onError: () => {},
  });

  // ── Callbacks de realtime ─────────────────────────────────────────────────
  const handlePosicionCreated = useCallback(
    (posicion: Omit<CampaignPositionResponse, "capa"> & { capa: string }) => {
      setPositions((current) => {
        const next = current.filter((item) => item.id !== posicion.id);
        if (posicion.pestanaId !== pestañaIdRef.current) return next;
        return [...next, posicion as CampaignPositionResponse].sort(
          (l, r) => l.id - r.id,
        );
      });
    },
    [pestañaIdRef],
  );

  const handleMapLayerChanged = useCallback(
    (payload: { pestanaId: number; mapaUrl?: string | null }) => {
      if (!pestaña?.id || payload.pestanaId !== pestaña.id) return;
      setMapLayerImageUrl(payload.mapaUrl ?? null);
    },
    [pestaña?.id, setMapLayerImageUrl],
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

  const handleConfigPestanaChanged = useCallback(
    (config: {
      pestanaId: number;
      nCuadriculasX: number;
      nCuadriculasY: number;
      distanciaCasilla: number;
      sistemaMetrico: string;
    }) => {
      setPestaña((prev) => {
        if (!prev || prev.id !== config.pestanaId) return prev;
        return {
          ...prev,
          nCuadriculasX: config.nCuadriculasX,
          nCuadriculasY: config.nCuadriculasY,
          distanciaCasilla: config.distanciaCasilla,
          sistemaMetrico: config.sistemaMetrico,
        };
      });
    },
    [setPestaña],
  );

  const handlePosicionDeleted = useCallback((posicionId: number) => {
    setPositions((prev) => prev.filter((p) => p.id !== posicionId));
  }, []);

  // Ref para broadcastPestanaConfig — permite usarlo en saveAutoGrid antes de la
  // inicialización del hook de realtime (evita dependencia circular de orden)
  const broadcastPestanaConfigRef = useRef<
    | ((config: {
        pestanaId: number;
        nCuadriculasX: number;
        nCuadriculasY: number;
        distanciaCasilla: number;
        sistemaMetrico: string;
      }) => void)
    | null
  >(null);

  const saveAutoGrid = useCallback(
    async (autoX: number, autoY: number) => {
      const currentPestaña = pestañaRef.current;
      if (!currentPestaña?.id) return;
      const token = localStorage.getItem("jwtToken");
      if (!token) return;
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/campanas/${campaignId}/pestana/${currentPestaña.id}/configuracion`,
          ),
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nCuadriculasX: autoX,
              nCuadriculasY: autoY,
              distanciaCasilla: currentPestaña.distanciaCasilla,
              sistemaMetrico: currentPestaña.sistemaMetrico,
            }),
          },
        );
        if (!res.ok) return;
        const updated = (await res.json()) as CampaignPestañaResponse;
        setPestaña(updated);
        broadcastPestanaConfigRef.current?.({
          pestanaId: currentPestaña.id,
          nCuadriculasX: autoX,
          nCuadriculasY: autoY,
          distanciaCasilla: currentPestaña.distanciaCasilla,
          sistemaMetrico: currentPestaña.sistemaMetrico,
        });
      } catch {
        // ignorar
      }
    },
    [campaignId, pestañaRef, setPestaña],
  );

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
    onPosicionDeleted: handlePosicionDeleted,
    onMapLayerChanged: handleMapLayerChanged,
    onCharacterUpdated: handleCharacterUpdated,
    onIniciativaChanged: handleIniciativaChanged,
    onNieblaChanged: fog.handleNieblaChanged,
    onCambioPestañaForzado: handleCambioPestañaForzado,
    onConfigPestanaChanged: handleConfigPestanaChanged,
  });

  const {
    crearPosicionPorWebSocket,
    moverPosicionPorWebSocket,
    eliminarPosicionPorWebSocket,
    asignarMapaPorWebSocket,
    drawings,
    sendDrawing,
    deleteDrawing,
    activarIniciativa,
    tirarIniciativa,
    reordenarIniciativa,
    configurarNiebla,
    configurarVisionToken,
    agregarAreasExploradasBatch,
    cambiarCapaToken,
    forzarCambioPestana,
    broadcastPestanaConfig,
  } = realtime;

  broadcastPestanaConfigRef.current = broadcastPestanaConfig;

  // ── Configuración de cuadrícula ───────────────────────────────────────────
  const {
    settingsMode,
    setSettingsMode,
    gridConfigForm,
    setGridConfigForm,
    isSavingGridConfig,
    settingsDropdownRef,
    handleSaveGridConfig,
    handleAutoGrid,
  } = useCampaignGridConfig({
    campaignId,
    pestañaId: pestaña?.id ?? null,
    pestaña,
    mapLayerImage,
    onPestañaUpdated: setPestaña,
    onAfterSave: (updated) => {
      broadcastPestanaConfigRef.current?.({
        pestanaId: updated.id,
        nCuadriculasX: updated.nCuadriculasX,
        nCuadriculasY: updated.nCuadriculasY,
        distanciaCasilla: updated.distanciaCasilla,
        sistemaMetrico: updated.sistemaMetrico,
      });
    },
  });

  // ── Invitación ────────────────────────────────────────────────────────────
  const {
    isInviteOpen,
    setIsInviteOpen,
    inviteCopied,
    inviteRef,
    inviteLink,
    handleCopyInvite,
  } = useCampaignInvite(campaignId);

  const drawingsSocket = useMemo(
    () => ({ drawings, sendDrawing, deleteDrawing }),
    [drawings, sendDrawing, deleteDrawing],
  );

  // ── Selección de mapa ─────────────────────────────────────────────────────
  const handleMapSelect = useCallback(
    async ({ mapaId, mapaUrl }: { mapaId: number; mapaUrl: string }) => {
      if (!pestaña?.id || !campaignIdNumber) return;
      try {
        asignarMapaPorWebSocket({ pestanaId: pestaña.id, mapaId });
        setMapLayerImageUrl(mapaUrl);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = mapaUrl;
        img.onload = () => {
          const { naturalWidth: imgW, naturalHeight: imgH } = img;
          if (imgW <= 0 || imgH <= 0) return;
          const ratio = imgW / imgH;
          let autoX: number;
          let autoY: number;
          if (ratio >= 1) {
            autoX = 20;
            autoY = Math.max(10, Math.min(100, Math.round(20 / ratio)));
          } else {
            autoY = 20;
            autoX = Math.max(10, Math.min(100, Math.round(20 * ratio)));
          }
          void saveAutoGrid(autoX, autoY);
        };
      } catch (error) {
        console.error(error);
      }
    },
    [
      asignarMapaPorWebSocket,
      campaignIdNumber,
      pestaña?.id,
      saveAutoGrid,
      setMapLayerImageUrl,
    ],
  );

  // ── Carga de posiciones ───────────────────────────────────────────────────
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
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok)
      throw new Error("No se pudieron cargar las fichas de la pestaña.");
    const payload = (await response.json()) as CampaignPositionResponse[];
    setPositions(payload ?? []);
  }, [campaignIdNumber, pestaña?.id]);

  useEffect(() => {
    void loadPositions().catch(() => setPositions([]));
  }, [loadPositions]);

  // ── Cambio de pestaña ─────────────────────────────────────────────────────
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
        fog.setNieblaEstado({
          activa: false,
          zonasExploradas: false,
          vistaJugador: false,
          visionConfigs: [],
          exploredAreas: [],
        });
        setPestaña(data);
        setMapLayerImageUrl(data.mapaCapaUrl ?? null);
      } catch {
        // ignorar
      } finally {
        setIsTabSwitcherOpen(false);
      }
    },
    [campaignId, fog, setPestaña, setMapLayerImageUrl],
  );

  cambioPestañaImplRef.current = (
    pestanaId: number,
    jugadores: string[] | null,
  ) => {
    if (jugadores === null || jugadores.includes(username)) {
      void switchPestaña(pestanaId);
    }
  };

  // ── Cambio de tamaño de token ─────────────────────────────────────────────
  const handleCambiarTamano = useCallback(
    async (posicionId: number, largo: number, ancho: number) => {
      const token = localStorage.getItem("jwtToken");
      if (!token || !campaignIdNumber) return;
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/campanas/${campaignIdNumber}/posiciones/${posicionId}/tamano`,
          ),
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ largo, ancho }),
          },
        );
        if (!res.ok) return;
        const updated = (await res.json()) as CampaignPositionResponse;
        setPositions((prev) =>
          prev.map((p) =>
            p.id === updated.id
              ? { ...p, largo: updated.largo, ancho: updated.ancho }
              : p,
          ),
        );
      } catch {
        // ignorar
      }
    },
    [campaignIdNumber],
  );

  // ── Herramientas de dibujo ────────────────────────────────────────────────
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
        console.error("No hay conexión en tiempo real para enviar el dibujo.");
      }
    },
    [drawingsSocket],
  );

  const handlePencilEraseDrawing = useCallback(
    (drawingId: number) => {
      if (!pestaña?.id) return;
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
    cellPx: grid.cellPx,
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

  // ── Handlers del Stage ────────────────────────────────────────────────────
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.08;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
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
    if (rulerStarted) setIsRulerSelectorOpen(false);
    const pencilStarted = pencilTool.handleMouseDown();
    if (pencilStarted) setIsPencilSelectorOpen(false);
  };

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes(CHARACTER_DRAG_MIME)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [],
  );

  // ── Drop de personaje en el tablero ───────────────────────────────────────
  const handleCharacterDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes(CHARACTER_DRAG_MIME)) return;
      event.preventDefault();
      const stage = stageRef.current;
      const token = localStorage.getItem("jwtToken");
      if (!stage || !token || !pestaña?.id || !campaignIdNumber) return;

      const rawPayload = event.dataTransfer.getData(CHARACTER_DRAG_MIME);
      if (!rawPayload) return;

      let payload: CharacterDropPayload;
      try {
        payload = JSON.parse(rawPayload) as CharacterDropPayload;
      } catch {
        return;
      }
      if (!payload.id) return;

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
      )
        return;

      const posicionX = Math.floor(relativeX / grid.cellPx);
      const posicionY = Math.floor(relativeY / grid.cellPxY);
      if (
        posicionX < 0 ||
        posicionY < 0 ||
        posicionX >= grid.cols ||
        posicionY >= grid.rows
      )
        return;

      const tipo = (payload.tipo ?? "").toLowerCase();
      const needsInstance =
        tipo === "enemigo" ||
        tipo === "pnj" ||
        payload.source === "marketplace";

      let personajeId = payload.id;
      if (needsInstance) {
        const baseName = payload.nombre ?? "";
        const baseNameEscaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const baseNameRegex = new RegExp(`^${baseNameEscaped}( \\d+)?$`);
        const sameNameCount = positions.filter(
          (p) =>
            p.pestanaId === pestaña.id && baseNameRegex.test(p.personajeNombre),
        ).length;
        const instanceName =
          sameNameCount === 0 ? baseName : `${baseName} ${sameNameCount + 1}`;

        const instanciarRes = await fetch(
          buildApiUrl(`/api/personajes/${payload.id}/instanciar`),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre: instanceName }),
          },
        );
        if (!instanciarRes.ok) {
          console.error("No se pudo crear la instancia del personaje");
          return;
        }
        const instance = (await instanciarRes.json()) as { id: number };
        personajeId = instance.id;
      }

      crearPosicionPorWebSocket({
        pestanaId: pestaña.id,
        capa: selectedLayer,
        personajeId,
        posicionX,
        posicionY,
      });
    },
    [
      campaignIdNumber,
      crearPosicionPorWebSocket,
      grid,
      pestaña?.id,
      positions,
      selectedLayer,
    ],
  );

  const isDM = username === (pestaña?.dmUsername ?? "");

  // ── Cámara y selección de tokens ──────────────────────────────────────────
  const panToToken = useCallback(
    (position: CampaignPositionResponse) => {
      const stage = stageRef.current;
      if (!stage) return;
      const scale = stage.scaleX();
      const tokenLargo = Math.max(1, position.largo ?? 1);
      const tokenAncho = Math.max(1, position.ancho ?? 1);
      const cx =
        Math.max(0, Math.min(position.posicionX, grid.cols - tokenLargo)) +
        tokenLargo / 2;
      const cy =
        Math.max(0, Math.min(position.posicionY, grid.rows - tokenAncho)) +
        tokenAncho / 2;
      const tokenPixelX = grid.rectX + cx * grid.cellPx;
      const tokenPixelY = grid.rectY + cy * grid.cellPxY;
      stage.position({
        x: stageSize.width / 2 - tokenPixelX * scale,
        y: stageSize.height / 2 - tokenPixelY * scale,
      });
      stage.batchDraw();
    },
    [grid, stageSize],
  );

  const handleTokenFocus = useCallback(
    (posicionId: number) => {
      const position = positions.find((p) => p.id === posicionId);
      setSelectedPositionId(posicionId);
      setResizingPositionId(null);
      if (position) panToToken(position);
    },
    [positions, panToToken],
  );

  const handleTokenRightClickFromUI = useCallback(
    (posicionId: number, x: number, y: number) => {
      fog.setContextMenu({ posicionId, x, y });
    },
    [fog],
  );

  const handleIniciativaTokenClick = useCallback(
    (personajeId: number) => {
      const position = positions.find((p) => p.personajeId === personajeId);
      if (!position) return;
      handleTokenFocus(position.id);
    },
    [positions, handleTokenFocus],
  );

  const handleIniciativaTokenRightClick = useCallback(
    (personajeId: number, x: number, y: number) => {
      const position = positions.find((p) => p.personajeId === personajeId);
      if (!position) return;
      fog.setContextMenu({ posicionId: position.id, x, y });
    },
    [positions, fog],
  );

  // ── Render ────────────────────────────────────────────────────────────────
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

      {iniciativaEstado.activa && (
        <IniciativaBar
          isDM={isDM}
          entradas={
            isDM
              ? iniciativaEstado.entradas
              : iniciativaEstado.entradas.filter((entrada) => {
                  const pos = positions.find(
                    (p) => p.personajeId === entrada.personajeId,
                  );
                  return !pos || (pos.tipo ?? "personaje") !== "enemigo";
                })
          }
          onReordenar={reordenarIniciativa}
          onTokenClick={handleIniciativaTokenClick}
          onTokenRightClick={handleIniciativaTokenRightClick}
        />
      )}

      {isTabSwitcherOpen && (
        <PestañaSwitcherPanel
          campaignId={campaignId}
          currentPestañaId={pestaña?.id ?? null}
          isDM={isDM}
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
      )}

      <CharacterTokenPanel
        positions={positions}
        isDM={isDM}
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
        onBack={onBack}
        onExit={onGoHome}
        onTokenSelect={handleTokenFocus}
        onTokenRightClick={handleTokenRightClickFromUI}
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

      {/* Modal de hoja de personaje */}
      {modalCharacterId !== null && (
        <CharacterSheetModal
          characterId={modalCharacterId}
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
          onGoHome={onGoHome}
          onGoCampaigns={onGoCampaigns}
          onClose={() => setModalCharacterId(null)}
        />
      )}

      {/* Baúl o barra lateral */}
      {selectedTool === "chest" ? (
        <Baul
          campaignId={campaignId}
          isDM={isDM}
          onClose={() => handleToolSelection("move")}
          onMapSelect={handleMapSelect}
          onCharacterClick={(id) => {
            handleToolSelection("move");
            setModalCharacterId(id);
          }}
        />
      ) : !isTabSwitcherOpen ? (
        <CampaignSidebar
          isDM={isDM}
          settingsMode={settingsMode}
          onSettingsModeChange={setSettingsMode}
          gridConfigForm={gridConfigForm}
          onGridConfigFormChange={setGridConfigForm}
          isSavingGridConfig={isSavingGridConfig}
          settingsDropdownRef={settingsDropdownRef}
          onSaveGridConfig={() => void handleSaveGridConfig()}
          onAutoGrid={handleAutoGrid}
          mapLayerImage={mapLayerImage}
          inviteRef={inviteRef}
          isInviteOpen={isInviteOpen}
          onInviteOpenChange={setIsInviteOpen}
          inviteCopied={inviteCopied}
          inviteLink={inviteLink}
          onCopyInvite={handleCopyInvite}
          selectedTool={selectedTool}
          onToolSelect={handleToolSelection}
          selectedLayer={selectedLayer}
          onLayerSelect={setSelectedLayer}
          nieblaEstado={fog.nieblaEstado}
          onNieblaChange={(patch) => {
            const next = { ...fog.nieblaEstado, ...patch };
            fog.setNieblaEstado(next);
            configurarNiebla(patch);
          }}
          isFogDropdownOpen={isFogDropdownOpen}
          onFogDropdownOpenChange={setIsFogDropdownOpen}
          iniciativaEstado={iniciativaEstado}
          onActivarIniciativa={activarIniciativa}
        />
      ) : null}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
          Cargando pestaña...
        </div>
      )}

      {!isLoading && loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg border border-red-300/40 bg-red-900/50 px-3.5 py-2 text-sm text-red-300">
            {loadError}
          </p>
        </div>
      )}

      {/* Stage de Konva */}
      {!isLoading && !loadError && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={
            selectedTool !== "pencil" &&
            selectedTool !== "ruler" &&
            fog.visionArcTarget === null
          }
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
            {mapLayerImage && (
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
            )}
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
                return isDM || p.capa !== "dm";
              })
              .map((position) => {
                if (fog.nieblaEstado.activa && !isDM) {
                  const isBeingDragged =
                    fog.draggingTokenRef.current?.posicionId === position.id;
                  if (
                    !isBeingDragged &&
                    !isTokenVisibleToPlayer(
                      position,
                      fog.nieblaEstado.visionConfigs,
                      positions,
                      fog.draggingTokenRef.current,
                    )
                  ) {
                    return null;
                  }
                }

                const isEnemigo = (position.tipo ?? "personaje") === "enemigo";
                const isInteractable =
                  position.capa === "dm"
                    ? isDM
                    : position.capa === "mapa"
                      ? isDM && selectedLayer === "mapa"
                      : true;

                const tokenLargo = Math.max(1, position.largo ?? 1);
                const tokenAncho = Math.max(1, position.ancho ?? 1);
                const clampedX = Math.max(
                  0,
                  Math.min(position.posicionX, grid.cols - tokenLargo),
                );
                const clampedY = Math.max(
                  0,
                  Math.min(position.posicionY, grid.rows - tokenAncho),
                );
                const displayPos =
                  clampedX !== position.posicionX ||
                  clampedY !== position.posicionY
                    ? { ...position, posicionX: clampedX, posicionY: clampedY }
                    : position;

                return (
                  <PosicionFicha
                    key={position.id}
                    position={displayPos}
                    grid={grid}
                    isInteractable={isInteractable}
                    isSelected={selectedPositionId === position.id}
                    onDragStart={() => {
                      fog.localPathRef.current = [];
                      fog.lastDragCellRef.current = {
                        x: Math.round(displayPos.posicionX * 2) / 2,
                        y: Math.round(displayPos.posicionY * 2) / 2,
                        posicionId: position.id,
                      };
                      fog.draggingTokenRef.current = {
                        posicionId: position.id,
                        posicionX: displayPos.posicionX,
                        posicionY: displayPos.posicionY,
                      };
                    }}
                    onDragMove={(id, gx, gy) => {
                      fog.draggingTokenRef.current = {
                        posicionId: id,
                        posicionX: gx,
                        posicionY: gy,
                      };
                      fog.fogLayerRef.current?.batchDraw();

                      if (fog.nieblaEstado.zonasExploradas) {
                        const vc = fog.nieblaEstado.visionConfigs.find(
                          (v) => v.posicionId === id,
                        );
                        if (vc?.revelaArea) {
                          const hx = Math.round(gx * 2) / 2;
                          const hy = Math.round(gy * 2) / 2;
                          const last = fog.lastDragCellRef.current;
                          if (last && (last.x !== hx || last.y !== hy)) {
                            const areaId = `${id}-${Math.round(hx * 2)}-${Math.round(hy * 2)}`;
                            const alreadySeen =
                              fog.confirmedAreaIdsRef.current.has(areaId) ||
                              fog.pendingAreasRef.current.some(
                                (a) => a.id === areaId,
                              ) ||
                              fog.localPathRef.current.some(
                                (a) => a.id === areaId,
                              );
                            if (!alreadySeen) {
                              const tokenSize = Math.max(
                                1,
                                position.largo ?? 1,
                                position.ancho ?? 1,
                              );
                              fog.localPathRef.current = [
                                ...fog.localPathRef.current,
                                {
                                  id: areaId,
                                  posicionX: hx,
                                  posicionY: hy,
                                  arcType: vc.arcType,
                                  radius: vc.radius,
                                  apertura: vc.apertura,
                                  rotation: vc.rotation,
                                  angle: vc.angle,
                                  length: vc.length,
                                  width: vc.width,
                                  height: vc.height,
                                  tokenSize,
                                },
                              ];
                            }
                            fog.lastDragCellRef.current = {
                              x: hx,
                              y: hy,
                              posicionId: id,
                            };
                          }
                        }
                      }
                    }}
                    onDragEnd={(x, y) => {
                      fog.draggingTokenRef.current = null;
                      setPositions((prev) =>
                        prev.map((p) =>
                          p.id === position.id
                            ? { ...p, posicionX: x, posicionY: y }
                            : p,
                        ),
                      );
                      if (fog.nieblaEstado.zonasExploradas) {
                        const vc = fog.nieblaEstado.visionConfigs.find(
                          (v) => v.posicionId === position.id,
                        );
                        if (vc?.revelaArea) {
                          const hx = Math.round(x * 2) / 2;
                          const hy = Math.round(y * 2) / 2;
                          const finalId = `${position.id}-${Math.round(hx * 2)}-${Math.round(hy * 2)}`;
                          if (
                            !fog.confirmedAreaIdsRef.current.has(finalId) &&
                            !fog.pendingAreasRef.current.some(
                              (a) => a.id === finalId,
                            ) &&
                            !fog.localPathRef.current.some(
                              (a) => a.id === finalId,
                            )
                          ) {
                            fog.localPathRef.current = [
                              ...fog.localPathRef.current,
                              {
                                id: finalId,
                                posicionX: hx,
                                posicionY: hy,
                                arcType: vc.arcType,
                                radius: vc.radius,
                                apertura: vc.apertura,
                                rotation: vc.rotation,
                                angle: vc.angle,
                                length: vc.length,
                                width: vc.width,
                                height: vc.height,
                                tokenSize: Math.max(
                                  1,
                                  position.largo ?? 1,
                                  position.ancho ?? 1,
                                ),
                              },
                            ];
                          }
                        }
                      }
                      const MAX_CHUNK = 80;
                      const batchToSend = fog.localPathRef.current;
                      fog.pendingAreasRef.current = [
                        ...fog.pendingAreasRef.current,
                        ...batchToSend,
                      ];
                      fog.localPathRef.current = [];
                      fog.lastDragCellRef.current = null;

                      const newAreas = batchToSend.filter(
                        (a) => !fog.confirmedAreaIdsRef.current.has(a.id),
                      );
                      if (newAreas.length > 0) {
                        if (newAreas.length <= MAX_CHUNK) {
                          agregarAreasExploradasBatch(newAreas);
                        } else {
                          for (
                            let ci = 0;
                            ci < newAreas.length;
                            ci += MAX_CHUNK
                          ) {
                            const chunk = newAreas.slice(ci, ci + MAX_CHUNK);
                            const delay = Math.floor(ci / MAX_CHUNK) * 200;
                            if (delay === 0) {
                              agregarAreasExploradasBatch(chunk);
                            } else {
                              setTimeout(
                                () => agregarAreasExploradasBatch(chunk),
                                delay,
                              );
                            }
                          }
                        }
                      }
                      moverPosicionPorWebSocket(position.id, x, y);
                    }}
                    isResizingMode={resizingPositionId === position.id}
                    onTokenClick={
                      !isDM && isEnemigo
                        ? undefined
                        : (id) => {
                            setSelectedPositionId((prev) =>
                              prev === id ? null : id,
                            );
                            setResizingPositionId(null);
                          }
                    }
                    onRightMouseDown={
                      !isDM && isEnemigo
                        ? undefined
                        : (id, tcx, tcy, sx, sy) => {
                            fog.rotationDragRef.current = {
                              posicionId: id,
                              tokenCenterClientX: tcx,
                              tokenCenterClientY: tcy,
                              startClientX: sx,
                              startClientY: sy,
                              hasMoved: false,
                            };
                          }
                    }
                    onResizeEnd={(posicionId, newSize) => {
                      void handleCambiarTamano(posicionId, newSize, newSize);
                      setResizingPositionId(null);
                    }}
                  />
                );
              })}
          </Layer>

          {/* Capa de niebla de guerra */}
          {fog.nieblaEstado.activa && (
            <Layer ref={fog.fogLayerRef} listening={false}>
              <Shape
                perfectDrawEnabled={false}
                sceneFunc={(konvaCtx) => {
                  const ctx = (
                    konvaCtx as unknown as {
                      _context: CanvasRenderingContext2D;
                    }
                  )._context;
                  ctx.save();
                  const isDmView = isDM && !fog.nieblaEstado.vistaJugador;
                  ctx.globalCompositeOperation = "source-over";
                  ctx.fillStyle = isDmView
                    ? "rgba(0,0,0,0.75)"
                    : "rgba(0,0,0,1)";
                  ctx.fillRect(grid.rectX, grid.rectY, grid.rectW, grid.rectH);
                  ctx.globalCompositeOperation = "destination-out";

                  if (fog.nieblaEstado.zonasExploradas) {
                    const serverAreas = fog.nieblaEstado.exploredAreas ?? [];
                    const localAreas = [
                      ...fog.localPathRef.current,
                      ...fog.pendingAreasRef.current,
                    ];

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

                      if (fog.exploredBitmapRef.current?.key !== cacheKey) {
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
                            grid.cellPx,
                            (area.tokenSize ?? 1) / 2,
                          );
                        }
                        offCtx.fillStyle = "#000";
                        offCtx.fill();
                        fog.exploredBitmapRef.current = {
                          canvas: off,
                          key: cacheKey,
                        };
                      }

                      const savedTransform = ctx.getTransform();
                      ctx.setTransform(1, 0, 0, 1, 0, 0);
                      ctx.globalAlpha = 0.25;
                      ctx.drawImage(fog.exploredBitmapRef.current.canvas, 0, 0);
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
                          grid.cellPx,
                          (area.tokenSize ?? 1) / 2,
                        );
                      }
                      ctx.globalAlpha = 0.25;
                      ctx.fillStyle = "#000";
                      ctx.fill();
                      ctx.globalAlpha = 1;
                    }
                  }

                  ctx.fillStyle = "rgba(0,0,0,1)";
                  for (const vc of fog.nieblaEstado.visionConfigs) {
                    if (!vc.revelaArea) continue;
                    const live =
                      fog.draggingTokenRef.current?.posicionId === vc.posicionId
                        ? fog.draggingTokenRef.current
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
                    const tokenPos = positions.find(
                      (p) => p.id === vc.posicionId,
                    );
                    const tokenSize = Math.max(
                      1,
                      tokenPos?.largo ?? 1,
                      tokenPos?.ancho ?? 1,
                    );
                    const halfSize = tokenSize / 2;
                    const tcx = grid.rectX + (posX + halfSize) * grid.cellPx;
                    const tcy = grid.rectY + (posY + halfSize) * grid.cellPxY;
                    ctx.beginPath();
                    ctx.arc(
                      tcx,
                      tcy,
                      halfSize *
                        Math.min(grid.cellPx, grid.cellPxY) *
                        Math.SQRT2 +
                        2,
                      0,
                      Math.PI * 2,
                    );
                    ctx.fill();
                    drawVisionShape(
                      ctx,
                      vc.arcType,
                      vc,
                      posX,
                      posY,
                      grid,
                      grid.cellPx,
                      halfSize,
                    );
                  }
                  ctx.restore();
                }}
              />
            </Layer>
          )}

          {/* Capa de herramientas: regla + lápiz */}
          <Layer listening={false}>
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
      )}

      {/* Menú contextual de token */}
      {fog.contextMenu && (
        <TokenContextMenu
          posicionId={fog.contextMenu.posicionId}
          x={fog.contextMenu.x}
          y={fog.contextMenu.y}
          fogActiva={fog.nieblaEstado.activa}
          isDM={isDM}
          currentCapa={
            (positions.find((p) => p.id === fog.contextMenu!.posicionId)
              ?.capa ?? "fichas") as "fichas" | "mapa" | "dm"
          }
          visionConfig={
            fog.nieblaEstado.visionConfigs.find(
              (vc) => vc.posicionId === fog.contextMenu!.posicionId,
            ) ?? null
          }
          onStartResize={(posicionId) => {
            setResizingPositionId(posicionId);
            setSelectedPositionId(posicionId);
          }}
          onCambiarCapa={(posicionId, capa) =>
            cambiarCapaToken(posicionId, capa)
          }
          onToggleRevela={(posicionId, revela) => {
            const existing = fog.nieblaEstado.visionConfigs.find(
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
          onOpenVisionArc={(posicionId) => fog.setVisionArcTarget(posicionId)}
          onEliminar={(posicionId) => {
            eliminarPosicionPorWebSocket(posicionId);
            fog.setContextMenu(null);
          }}
          onClose={() => fog.setContextMenu(null)}
        />
      )}

      {/* Modal de arco de visión */}
      {fog.visionArcTarget !== null &&
        (() => {
          const existingVc = fog.nieblaEstado.visionConfigs.find(
            (vc) => vc.posicionId === fog.visionArcTarget,
          );
          const initialVc: VisionConfig = existingVc ?? {
            posicionId: fog.visionArcTarget,
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
              posicionId={fog.visionArcTarget}
              initial={initialVc}
              rotation={
                fog.rotationDragRef.current?.posicionId === fog.visionArcTarget
                  ? fog.liveRotationRef.current
                  : (existingVc?.rotation ?? 0)
              }
              onSave={(config) => configurarVisionToken(config)}
              onClose={() => fog.setVisionArcTarget(null)}
            />
          );
        })()}
    </div>
  );
}
