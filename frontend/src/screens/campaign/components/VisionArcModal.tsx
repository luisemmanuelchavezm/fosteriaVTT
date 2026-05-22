import { useEffect, useRef, useState } from "react";
import type { VisionArcType, VisionConfig } from "../hooks/useCampaignRealtime";

interface VisionArcModalProps {
  posicionId: number;
  initial: VisionConfig;
  rotation: number;
  onSave: (config: VisionConfig) => void;
  onClose: () => void;
}

function SemicircleIcon({
  size = 22,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d="M3 11 A8 8 0 0 1 19 11 Z"
        fill={active ? "#f59e0b" : "#60a5fa"}
        opacity={active ? 1 : 0.85}
      />
      <line
        x1="3"
        y1="11"
        x2="19"
        y2="11"
        stroke={active ? "#f59e0b" : "#60a5fa"}
        strokeWidth="1.2"
        opacity="0.5"
      />
    </svg>
  );
}

function ConeIcon({
  size = 22,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d="M11 3 L19 19 L3 19 Z"
        fill={active ? "#f59e0b" : "#60a5fa"}
        opacity={active ? 1 : 0.85}
      />
    </svg>
  );
}

function RectangleIcon({
  size = 22,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect
        x="3"
        y="8"
        width="16"
        height="11"
        fill={active ? "#f59e0b" : "#60a5fa"}
        opacity={active ? 1 : 0.85}
        rx="1"
      />
    </svg>
  );
}

function ShapeIcon({
  arcType,
  size = 22,
  active = false,
}: {
  arcType: VisionArcType;
  size?: number;
  active?: boolean;
}) {
  if (arcType === "semicircle")
    return <SemicircleIcon size={size} active={active} />;
  if (arcType === "cone") return <ConeIcon size={size} active={active} />;
  return <RectangleIcon size={size} active={active} />;
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px] text-white/60">
        <span>{label}</span>
        <span className="font-semibold text-sky-300">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-400"
      />
    </div>
  );
}

const SHAPE_ORDER: VisionArcType[] = ["semicircle", "cone", "rectangle"];

export default function VisionArcModal({
  posicionId,
  initial,
  rotation,
  onSave,
  onClose,
}: VisionArcModalProps) {
  const [local, setLocal] = useState<VisionConfig>({ ...initial, rotation });
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Keep rotation in sync when it changes from drag
  useEffect(() => {
    setLocal((prev) => {
      const next = { ...prev, rotation };
      onSave({ ...next, posicionId });
      return next;
    });
  }, [rotation, posicionId, onSave]);

  const patch = (p: Partial<VisionConfig>) => {
    setLocal((prev) => {
      const next = { ...prev, ...p };
      onSave({ ...next, posicionId });
      return next;
    });
  };

  // Close-on-outside-click saves all changes
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = window.setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed left-[88px] top-4 z-[200] flex items-start gap-1.5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Shape button + picker row */}
      <div className="flex items-center gap-1 rounded-xl border border-sky-400/30 bg-[#0d1b2e]/90 p-1.5 backdrop-blur-sm shadow-xl shadow-sky-900/30">
        <button
          type="button"
          title="Cambiar forma"
          onClick={() => setPickerOpen((v) => !v)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            pickerOpen
              ? "bg-sky-500/20 text-sky-300"
              : "text-sky-400/70 hover:bg-sky-500/10 hover:text-sky-300"
          }`}
        >
          <ShapeIcon arcType={local.arcType} size={20} active={pickerOpen} />
        </button>

        {pickerOpen &&
          SHAPE_ORDER.filter((s) => s !== local.arcType).map((shape) => (
            <button
              key={shape}
              type="button"
              title={
                shape === "semicircle"
                  ? "Semicírculo"
                  : shape === "cone"
                    ? "Cono"
                    : "Rectángulo"
              }
              onClick={() => {
                patch({ arcType: shape });
                setPickerOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sky-400/60 hover:bg-sky-500/10 hover:text-sky-300 transition-colors"
            >
              <ShapeIcon arcType={shape} size={20} />
            </button>
          ))}
      </div>

      {/* Parameters panel */}
      <div className="w-[200px] rounded-xl border border-sky-400/30 bg-[#0d1b2e]/90 p-3 backdrop-blur-sm shadow-xl shadow-sky-900/30 space-y-3">
        {local.arcType === "semicircle" && (
          <>
            <Slider
              label="Radio"
              value={local.radius}
              min={1}
              max={20}
              unit=" cas."
              onChange={(v) => patch({ radius: v })}
            />
            <Slider
              label="Abertura"
              value={local.apertura}
              min={10}
              max={360}
              step={5}
              unit="°"
              onChange={(v) => patch({ apertura: v })}
            />
          </>
        )}

        {local.arcType === "cone" && (
          <>
            <Slider
              label="Apertura"
              value={local.angle}
              min={5}
              max={180}
              step={5}
              unit="°"
              onChange={(v) => patch({ angle: v })}
            />
            <Slider
              label="Distancia"
              value={local.length}
              min={1}
              max={20}
              unit=" cas."
              onChange={(v) => patch({ length: v })}
            />
          </>
        )}

        {local.arcType === "rectangle" && (
          <>
            <Slider
              label="Ancho"
              value={local.width}
              min={1}
              max={20}
              unit=" cas."
              onChange={(v) => patch({ width: v })}
            />
            <Slider
              label="Largo"
              value={local.height}
              min={1}
              max={20}
              unit=" cas."
              onChange={(v) => patch({ height: v })}
            />
          </>
        )}

        {/* Rotation read-only — controlled by right-click drag */}
        <div className="flex items-center justify-between text-[11px] text-sky-300/50">
          <span>Rotación</span>
          <span className="font-semibold">{Math.round(local.rotation)}°</span>
        </div>
      </div>
    </div>
  );
}
