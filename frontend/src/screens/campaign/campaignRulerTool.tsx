import {
  Circle as KonvaCircle,
  Line,
  Rect,
  Text as KonvaText,
} from "react-konva";
import type {
  RulerMeasurement,
  RulerOverlayData,
  RulerShape,
} from "./hooks/useCampaignRulerTool";

const SHAPE_OPTIONS: RulerShape[] = ["recta", "cuadrado", "circular", "conica"];

function SelectorIcon({ shape }: { shape: RulerShape }) {
  const svgStyle = { width: 24, height: 24, display: "block" };

  switch (shape) {
    case "recta":
      return (
        <svg
          viewBox="0 0 32 32"
          style={svgStyle}
          fill="none"
          strokeLinecap="round"
        >
          <line
            x1="4"
            y1="16"
            x2="28"
            y2="16"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
      );
    case "cuadrado":
      return (
        <svg viewBox="0 0 32 32" style={svgStyle} fill="none">
          <rect
            x="6"
            y="6"
            width="20"
            height="20"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
      );
    case "circular":
      return (
        <svg viewBox="0 0 32 32" style={svgStyle} fill="none">
          <circle
            cx="16"
            cy="16"
            r="11"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
      );
    case "conica":
      return (
        <svg
          viewBox="0 0 32 32"
          style={svgStyle}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            points="16,4 28,26 4,26"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      );
    default:
      return null;
  }
}

const OVERLAY_FILL = "rgba(245, 158, 11, 0.18)";
const OVERLAY_STROKE = "#f59e0b";
const LABEL_BG = "rgba(15, 23, 42, 0.88)";
const LABEL_TEXT = "#fef3c7";

function renderLabel(label: string, centerX: number, y: number) {
  const width = label.length * 8 + 20;

  return (
    <>
      <Rect
        x={centerX - width / 2}
        y={y}
        width={width}
        height={28}
        fill={LABEL_BG}
        stroke={OVERLAY_STROKE}
        strokeWidth={1}
        cornerRadius={999}
      />
      <KonvaText
        x={centerX - width / 2}
        y={y + 7}
        width={width}
        align="center"
        text={label}
        fill={LABEL_TEXT}
        fontSize={14}
        fontStyle="bold"
      />
    </>
  );
}

interface CampaignRulerShapeSelectorProps {
  visible: boolean;
  selectedShape: RulerShape;
  onSelectShape: (shape: RulerShape) => void;
}

interface CampaignRulerOverlayProps {
  visible: boolean;
  selectedShape: RulerShape;
  measurement: RulerMeasurement | null;
  overlay: RulerOverlayData | null;
}

export function CampaignRulerShapeSelector({
  visible,
  selectedShape,
  onSelectShape,
}: CampaignRulerShapeSelectorProps) {
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
        borderRadius: 12,
        background: "rgba(0,0,0,0.58)",
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

export function CampaignRulerOverlay({
  visible,
  selectedShape,
  measurement,
  overlay,
}: CampaignRulerOverlayProps) {
  if (!visible || !measurement || !overlay) {
    return null;
  }

  return (
    <>
      {selectedShape === "recta" ? (
        <Line
          points={[
            measurement.start.x,
            measurement.start.y,
            measurement.end.x,
            measurement.end.y,
          ]}
          stroke={OVERLAY_STROKE}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}

      {selectedShape === "cuadrado" ? (
        <Rect
          x={overlay.squareCenterX}
          y={overlay.squareCenterY}
          width={Math.max(overlay.squareSize, 1)}
          height={Math.max(overlay.squareSize, 1)}
          offsetX={Math.max(overlay.squareSize, 1) / 2}
          offsetY={Math.max(overlay.squareSize, 1) / 2}
          rotation={overlay.squareRotationDeg}
          fill={OVERLAY_FILL}
          stroke={OVERLAY_STROKE}
          strokeWidth={3}
        />
      ) : null}

      {selectedShape === "circular" ? (
        <KonvaCircle
          x={measurement.start.x}
          y={measurement.start.y}
          radius={Math.max(overlay.radiusPx, 1)}
          fill={OVERLAY_FILL}
          stroke={OVERLAY_STROKE}
          strokeWidth={3}
        />
      ) : null}

      {selectedShape === "conica" ? (
        <Line
          points={overlay.conePoints}
          closed
          fill={OVERLAY_FILL}
          stroke={OVERLAY_STROKE}
          strokeWidth={3}
          lineJoin="round"
        />
      ) : null}

      {selectedShape !== "cuadrado" ? (
        <Line
          points={[
            measurement.start.x,
            measurement.start.y,
            measurement.end.x,
            measurement.end.y,
          ]}
          stroke={OVERLAY_STROKE}
          strokeWidth={selectedShape === "recta" ? 0 : 2}
          dash={selectedShape === "recta" ? [] : [8, 6]}
          opacity={selectedShape === "recta" ? 0 : 0.95}
        />
      ) : null}

      <KonvaCircle
        x={measurement.start.x}
        y={measurement.start.y}
        radius={7}
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth={2}
      />
      <KonvaCircle
        x={measurement.end.x}
        y={measurement.end.y}
        radius={7}
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth={2}
      />

      {renderLabel(overlay.label, overlay.labelX, overlay.labelY)}
    </>
  );
}
