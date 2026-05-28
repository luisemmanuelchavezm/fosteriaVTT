import { Eraser, Pencil } from "lucide-react";
import { Ellipse, Line, Rect } from "react-konva";
import type {
  DrawingCreatePayload,
  DrawingItem,
  DrawingLayer,
} from "./hooks/useWebSocketDrawings";
import {
  type PencilShape,
  STROKE_WIDTH,
  getBounds,
  toKonvaPoints,
} from "./campaignPencilUtils";

// ─── Interfaces de props ─────────────────────────────────────────────────────

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

// ─── Internos ────────────────────────────────────────────────────────────────

const SHAPE_OPTIONS: PencilShape[] = [
  "pencil",
  "rectangle",
  "ellipse",
  "triangle",
  "eraser",
];

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

function renderDrawingShape(
  drawing: DrawingCreatePayload | DrawingItem,
  key: string,
) {
  if (drawing.puntos.length < 2) return null;

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

  // triangle
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

// ─── Componentes exportados ──────────────────────────────────────────────────

export function CampaignPencilShapeSelector({
  visible,
  selectedShape,
  onSelectShape,
}: CampaignPencilShapeSelectorProps) {
  if (!visible) return null;

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
  const visibleDrawings = drawings.filter((d) => d.capa === selectedLayer);

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
  if (!visible) return null;

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
