/* eslint-disable react-refresh/only-export-components */
import type Konva from "konva";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Eraser, Pencil } from "lucide-react";
import { Ellipse, Line, Rect } from "react-konva";
import type {
  DrawingCreatePayload,
  DrawingItem,
  DrawingLayer,
  DrawingPoint,
  DrawingType,
} from "./hooks/useWebSocketDrawings";

export type PencilShape = DrawingType;

interface UseCampaignPencilToolArgs {
  enabled: boolean;
  stageRef: RefObject<Konva.Stage | null>;
  selectedLayer: DrawingLayer;
  pestanaId: number | null;
  drawings: DrawingItem[];
  onCompleteDrawing: (drawing: DrawingCreatePayload) => void;
  onEraseDrawing: (drawingId: number) => void;
}

interface CampaignPencilShapeSelectorProps {
  visible: boolean;
  selectedShape: PencilShape;
  onSelectShape: (shape: PencilShape) => void;
}

interface CampaignPencilOptionsModalProps {
  visible: boolean;
  color: string;
  onColorChange: (color: string) => void;
  fillEnabled: boolean;
  onFillToggle: (enabled: boolean) => void;
}

interface CampaignPencilOverlayProps {
  drawings: DrawingItem[];
  selectedLayer: DrawingLayer;
  previewDrawing: DrawingCreatePayload | null;
}

const SHAPE_OPTIONS: PencilShape[] = [
  "pencil",
  "rectangle",
  "ellipse",
  "triangle",
  "eraser",
];

const STROKE_WIDTH = 3;
const ERASER_HIT_RADIUS = 10;
// Auto-flush: cada N ms el trazo activo se guarda y empieza un segmento nuevo,
// evitando payloads enormes que el broker WebSocket rechaza silenciosamente.
const PENCIL_FLUSH_MS = 3000;

function toKonvaPoints(points: DrawingPoint[]): number[] {
  return points.flatMap((point) => [point.x, point.y]);
}

function getBounds(points: DrawingPoint[]) {
  const start = points[0];
  const end = points[points.length - 1] ?? start;
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const width = Math.max(Math.abs(end.x - start.x), 1);
  const height = Math.max(Math.abs(end.y - start.y), 1);
  return { minX, minY, width, height };
}

function renderDrawingShape(
  drawing: DrawingCreatePayload | DrawingItem,
  key: string,
) {
  if (drawing.puntos.length < 2) {
    return null;
  }

  const fillColor =
    drawing.relleno && drawing.tipo !== "pencil" ? drawing.color : undefined;

  if (drawing.tipo === "pencil") {
    return (
      <Line
        key={key}
        points={toKonvaPoints(drawing.puntos)}
        stroke={drawing.color}
        strokeWidth={STROKE_WIDTH}
        lineCap="round"
        lineJoin="round"
        tension={0.15}
      />
    );
  }

  if (drawing.tipo === "rectangle") {
    const bounds = getBounds(drawing.puntos);
    return (
      <Rect
        key={key}
        x={bounds.minX}
        y={bounds.minY}
        width={bounds.width}
        height={bounds.height}
        stroke={drawing.color}
        strokeWidth={STROKE_WIDTH}
        fill={fillColor}
      />
    );
  }

  if (drawing.tipo === "ellipse") {
    const bounds = getBounds(drawing.puntos);
    return (
      <Ellipse
        key={key}
        x={bounds.minX + bounds.width / 2}
        y={bounds.minY + bounds.height / 2}
        radiusX={bounds.width / 2}
        radiusY={bounds.height / 2}
        stroke={drawing.color}
        strokeWidth={STROKE_WIDTH}
        fill={fillColor}
      />
    );
  }

  const bounds = getBounds(drawing.puntos);
  const trianglePoints = [
    bounds.minX + bounds.width / 2,
    bounds.minY,
    bounds.minX + bounds.width,
    bounds.minY + bounds.height,
    bounds.minX,
    bounds.minY + bounds.height,
  ];

  return (
    <Line
      key={key}
      points={trianglePoints}
      closed
      stroke={drawing.color}
      strokeWidth={STROKE_WIDTH}
      lineCap="round"
      lineJoin="round"
      fill={fillColor}
    />
  );
}

function getWorldPointer(stage: Konva.Stage): DrawingPoint | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }

  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const world = transform.point(pointer);

  return {
    x: Math.round(world.x),
    y: Math.round(world.y),
  };
}

function distancePointToSegment(
  point: DrawingPoint,
  a: DrawingPoint,
  b: DrawingPoint,
): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    return Math.hypot(apx, apy);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const closestX = a.x + abx * t;
  const closestY = a.y + aby * t;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

function isPointInPolygon(
  point: DrawingPoint,
  vertices: DrawingPoint[],
): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function intersectsDrawing(
  point: DrawingPoint,
  drawing: DrawingItem,
  tolerance = ERASER_HIT_RADIUS,
): boolean {
  if (drawing.puntos.length < 2) {
    return false;
  }

  if (drawing.tipo === "pencil") {
    for (let index = 1; index < drawing.puntos.length; index += 1) {
      const a = drawing.puntos[index - 1];
      const b = drawing.puntos[index];
      if (distancePointToSegment(point, a, b) <= tolerance) {
        return true;
      }
    }
    return false;
  }

  const bounds = getBounds(drawing.puntos);
  const maxX = bounds.minX + bounds.width;
  const maxY = bounds.minY + bounds.height;

  if (drawing.tipo === "rectangle") {
    if (
      drawing.relleno &&
      point.x >= bounds.minX &&
      point.x <= maxX &&
      point.y >= bounds.minY &&
      point.y <= maxY
    ) {
      return true;
    }

    const edges: Array<[DrawingPoint, DrawingPoint]> = [
      [
        { x: bounds.minX, y: bounds.minY },
        { x: maxX, y: bounds.minY },
      ],
      [
        { x: maxX, y: bounds.minY },
        { x: maxX, y: maxY },
      ],
      [
        { x: maxX, y: maxY },
        { x: bounds.minX, y: maxY },
      ],
      [
        { x: bounds.minX, y: maxY },
        { x: bounds.minX, y: bounds.minY },
      ],
    ];
    return edges.some(
      ([a, b]) => distancePointToSegment(point, a, b) <= tolerance,
    );
  }

  if (drawing.tipo === "ellipse") {
    const cx = bounds.minX + bounds.width / 2;
    const cy = bounds.minY + bounds.height / 2;
    const rx = Math.max(bounds.width / 2, 1);
    const ry = Math.max(bounds.height / 2, 1);
    const normalized =
      (point.x - cx) ** 2 / rx ** 2 + (point.y - cy) ** 2 / ry ** 2;
    if (drawing.relleno && normalized <= 1) {
      return true;
    }
    return Math.abs(normalized - 1) <= 0.2;
  }

  const triangle = [
    { x: bounds.minX + bounds.width / 2, y: bounds.minY },
    { x: maxX, y: maxY },
    { x: bounds.minX, y: maxY },
  ];

  if (drawing.relleno && isPointInPolygon(point, triangle)) {
    return true;
  }

  const triangleEdges: Array<[DrawingPoint, DrawingPoint]> = [
    [triangle[0], triangle[1]],
    [triangle[1], triangle[2]],
    [triangle[2], triangle[0]],
  ];
  return triangleEdges.some(
    ([a, b]) => distancePointToSegment(point, a, b) <= tolerance,
  );
}

function SelectorIcon({ shape }: { shape: PencilShape }) {
  const svgStyle = { width: 24, height: 24, display: "block" };

  switch (shape) {
    case "pencil":
      return <Pencil size={24} strokeWidth={1.5} />;
    case "rectangle":
      return (
        <svg viewBox="0 0 32 32" style={svgStyle} fill="none">
          <rect
            x="4"
            y="8"
            width="24"
            height="16"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        </svg>
      );
    case "ellipse":
      return (
        <svg viewBox="0 0 32 32" style={svgStyle} fill="none">
          <ellipse
            cx="16"
            cy="16"
            rx="12"
            ry="8"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        </svg>
      );
    case "triangle":
      return (
        <svg
          viewBox="0 0 32 32"
          style={svgStyle}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            points="16,4 28,24 4,24"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
      );
    case "eraser":
      return <Eraser size={22} strokeWidth={1.8} />;
    default:
      return null;
  }
}

export function CampaignPencilShapeSelector({
  visible,
  selectedShape,
  onSelectShape,
}: CampaignPencilShapeSelectorProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 66,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 11,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px",
        background: "rgba(0,0,0,0.58)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      {SHAPE_OPTIONS.map((shape) => {
        const isActive = selectedShape === shape;
        return (
          <button
            key={shape}
            type="button"
            title={shape}
            onClick={() => onSelectShape(shape)}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: isActive
                ? "1px solid rgba(251, 191, 36, 0.95)"
                : "1px solid rgba(255,255,255,0.08)",
              background: isActive
                ? "rgba(217, 119, 6, 0.2)"
                : "rgba(255,255,255,0.04)",
              color: isActive ? "#fef3c7" : "rgba(255,255,255,0.78)",
              cursor: "pointer",
            }}
          >
            <SelectorIcon shape={shape} />
          </button>
        );
      })}
    </div>
  );
}

export function CampaignPencilOverlay({
  drawings,
  selectedLayer,
  previewDrawing,
}: CampaignPencilOverlayProps) {
  const visibleDrawings = drawings.filter(
    (drawing) => drawing.capa === selectedLayer,
  );

  return (
    <>
      {visibleDrawings.map((drawing) =>
        renderDrawingShape(drawing, `drawing-${drawing.id}`),
      )}
      {previewDrawing && previewDrawing.capa === selectedLayer
        ? renderDrawingShape(previewDrawing, "drawing-preview")
        : null}
    </>
  );
}

export function CampaignPencilOptionsModal({
  visible,
  color,
  onColorChange,
  fillEnabled,
  onFillToggle,
}: CampaignPencilOptionsModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 250,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        background: "rgba(15, 23, 42, 0.9)",
        borderRadius: 12,
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
          }}
        >
          Color
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          style={{
            width: 48,
            height: 40,
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            cursor: "pointer",
            background: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
          }}
        >
          Relleno
        </label>
        <input
          type="checkbox"
          checked={fillEnabled}
          onChange={(e) => onFillToggle(e.target.checked)}
          style={{
            width: 20,
            height: 20,
            cursor: "pointer",
            accentColor: "#fbbf24",
          }}
        />
      </div>
    </div>
  );
}

export function useCampaignPencilTool({
  enabled,
  stageRef,
  selectedLayer,
  pestanaId,
  drawings,
  onCompleteDrawing,
  onEraseDrawing,
}: UseCampaignPencilToolArgs) {
  const [selectedShape, setSelectedShape] = useState<PencilShape>("pencil");
  const [strokeColor, setStrokeColor] = useState<string>("#ffffff");
  const [fillEnabled, setFillEnabled] = useState<boolean>(false);
  const [showSelector, setShowSelector] = useState(false);
  const [activeDrawing, setActiveDrawing] =
    useState<DrawingCreatePayload | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const deletedDuringDragRef = useRef<Set<number>>(new Set());

  // Refs para el auto-flush (evitan stale-closures en el interval)
  const activeDrawingRef = useRef<DrawingCreatePayload | null>(null);
  const onCompleteDrawingRef = useRef(onCompleteDrawing);
  const autoFlushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    activeDrawingRef.current = activeDrawing;
  }, [activeDrawing]);

  useEffect(() => {
    onCompleteDrawingRef.current = onCompleteDrawing;
  }, [onCompleteDrawing]);

  const stopAutoFlush = useCallback(() => {
    if (autoFlushIntervalRef.current !== null) {
      clearInterval(autoFlushIntervalRef.current);
      autoFlushIntervalRef.current = null;
    }
  }, []);

  const startAutoFlush = useCallback(() => {
    stopAutoFlush();
    autoFlushIntervalRef.current = setInterval(() => {
      const current = activeDrawingRef.current;
      if (!current || current.tipo !== "pencil" || current.puntos.length < 2)
        return;
      // Guardar el segmento actual
      onCompleteDrawingRef.current(current);
      // Iniciar nuevo segmento desde el último punto
      const lastPoint = current.puntos[current.puntos.length - 1];
      setActiveDrawing({ ...current, puntos: [lastPoint, lastPoint] });
    }, PENCIL_FLUSH_MS);
  }, [stopAutoFlush]);

  useEffect(() => {
    if (!enabled) {
      setShowSelector(false);
      stopAutoFlush();
    } else {
      setShowSelector(true);
    }
    return () => {
      stopAutoFlush();
    };
  }, [enabled, stopAutoFlush]);

  const eraseAtPointer = useCallback(
    (pointer: DrawingPoint) => {
      for (const drawing of drawings) {
        if (drawing.capa !== selectedLayer) {
          continue;
        }

        if (deletedDuringDragRef.current.has(drawing.id)) {
          continue;
        }

        if (!intersectsDrawing(pointer, drawing)) {
          continue;
        }

        deletedDuringDragRef.current.add(drawing.id);
        onEraseDrawing(drawing.id);
        break;
      }
    },
    [drawings, selectedLayer, onEraseDrawing],
  );

  const handleMouseDown = useCallback(() => {
    if (!enabled) {
      return false;
    }

    if (!pestanaId) {
      return false;
    }

    const stage = stageRef.current;
    if (!stage) {
      return false;
    }

    const startPoint = getWorldPointer(stage);
    if (!startPoint) {
      return false;
    }

    if (selectedShape === "eraser") {
      setIsErasing(true);
      deletedDuringDragRef.current.clear();
      eraseAtPointer(startPoint);
      return true;
    }

    setActiveDrawing({
      pestanaId,
      capa: selectedLayer,
      tipo: selectedShape,
      color: strokeColor,
      relleno: fillEnabled,
      puntos: [startPoint, startPoint],
    });

    // Activar auto-flush solo para trazos de lápiz libre
    if (selectedShape === "pencil") {
      startAutoFlush();
    }

    return true;
  }, [
    enabled,
    pestanaId,
    stageRef,
    selectedLayer,
    selectedShape,
    strokeColor,
    fillEnabled,
    eraseAtPointer,
    startAutoFlush,
  ]);

  const handleMouseMove = useCallback(() => {
    if (!enabled) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const currentPoint = getWorldPointer(stage);
    if (!currentPoint) {
      return;
    }

    if (selectedShape === "eraser" && isErasing) {
      eraseAtPointer(currentPoint);
      return;
    }

    if (!activeDrawing) {
      return;
    }

    setActiveDrawing((previous) => {
      if (!previous) {
        return previous;
      }

      if (previous.tipo === "pencil") {
        return {
          ...previous,
          puntos: [...previous.puntos, currentPoint],
        };
      }

      return {
        ...previous,
        puntos: [previous.puntos[0], currentPoint],
      };
    });
  }, [
    enabled,
    activeDrawing,
    stageRef,
    selectedShape,
    isErasing,
    eraseAtPointer,
  ]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (selectedShape === "eraser") {
      setIsErasing(false);
      deletedDuringDragRef.current.clear();
      return;
    }

    // Detener el auto-flush antes de completar el trazo final
    stopAutoFlush();

    if (!activeDrawing) {
      return;
    }

    if (activeDrawing.puntos.length >= 2) {
      onCompleteDrawing(activeDrawing);
    }

    setActiveDrawing(null);
  }, [enabled, activeDrawing, onCompleteDrawing, selectedShape, stopAutoFlush]);

  return {
    selectedShape,
    setSelectedShape,
    strokeColor,
    setStrokeColor,
    fillEnabled,
    setFillEnabled,
    previewDrawing: activeDrawing,
    showSelector,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
