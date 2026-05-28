import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Rect } from "react-konva";

interface CampaignPositionResponse {
  id: number;
  pestanaId: number;
  capa: string;
  personajeId: number;
  personajeNombre: string;
  retrato?: string;
  posicionX: number;
  posicionY: number;
  largo: number;
  ancho: number;
}

interface Grid {
  rectX: number;
  rectY: number;
  cellPx: number;
  cellPxY: number;
}

interface PosicionFichaProps {
  position: CampaignPositionResponse;
  grid: Grid;
  isSelected?: boolean;
  isInteractable?: boolean;
  /** When true the corner resize handle is visible and draggable */
  isResizingMode?: boolean;
  onDragStart?: () => void;
  onDragMove?: (positionId: number, gridX: number, gridY: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  onTokenClick?: (positionId: number) => void;
  onRightMouseDown?: (
    positionId: number,
    tokenCenterClientX: number,
    tokenCenterClientY: number,
    startClientX: number,
    startClientY: number,
  ) => void;
  /** Called when resize drag ends with the new square size (largo == ancho) */
  onResizeEnd?: (positionId: number, newSize: number) => void;
}

export function PosicionFicha({
  position,
  grid,
  isSelected,
  isInteractable = true,
  isResizingMode = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTokenClick,
  onRightMouseDown,
  onResizeEnd,
}: PosicionFichaProps) {
  const { cellPx, cellPxY } = grid;

  const [portraitImage, setPortraitImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [localX, setLocalX] = useState(position.posicionX);
  const [localY, setLocalY] = useState(position.posicionY);
  // Committed size (updated optimistically on drag-end)
  const [localSize, setLocalSize] = useState(Math.max(1, position.largo ?? 1));
  // Preview size shown while the corner handle is being dragged
  const [previewSize, setPreviewSize] = useState<number | null>(null);

  const handleRef = useRef<Konva.Circle>(null);

  useEffect(() => {
    setLocalX(position.posicionX);
    setLocalY(position.posicionY);
  }, [position.posicionX, position.posicionY]);

  useEffect(() => {
    // Use the max dimension (they should be equal, but guard just in case)
    setLocalSize(
      Math.max(1, Math.max(position.largo ?? 1, position.ancho ?? 1)),
    );
  }, [position.largo, position.ancho]);

  useEffect(() => {
    if (!position.retrato) {
      setPortraitImage(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = position.retrato;
    image.onload = () => setPortraitImage(image);
    image.onerror = () => setPortraitImage(null);
  }, [position.retrato]);

  // Display size during drag preview, otherwise committed size
  const displaySize = previewSize ?? localSize;
  const tokenW = displaySize * cellPx;
  const tokenH = displaySize * cellPxY;
  const tokenSize = Math.min(tokenW, tokenH);
  const radius = tokenSize / 2 - 4;

  // Group anchored at the top-left of the token's grid area
  const groupX = grid.rectX + localX * cellPx;
  const groupY = grid.rectY + localY * cellPxY;

  // Token circle center in Group-local coordinates
  const circleCX = tokenW / 2;
  const circleCY = tokenH / 2;

  // Token center in stage coords (for right-click menu)
  const tokenCenterStageX = groupX + tokenW / 2;
  const tokenCenterStageY = groupY + tokenH / 2;

  // ── Handle drag (token movement) ────────────────────────────────────────────
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const relX = e.target.x() - grid.rectX;
    const relY = e.target.y() - grid.rectY;
    const gridX = Math.max(0, Math.round(relX / cellPx));
    const gridY = Math.max(0, Math.round(relY / cellPxY));
    e.target.x(grid.rectX + gridX * cellPx);
    e.target.y(grid.rectY + gridY * cellPxY);
    setLocalX(gridX);
    setLocalY(gridY);
    onDragEnd?.(gridX, gridY);
  };

  // ── Handle resize (corner handle) ───────────────────────────────────────────
  /** Compute new square size from handle's current local position */
  const sizeFromHandle = (hx: number, hy: number): number =>
    Math.max(1, Math.round(Math.max(hx / cellPx, hy / cellPxY)));

  const handleResizeDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newSize = sizeFromHandle(
      Math.max(cellPx, e.target.x()),
      Math.max(cellPxY, e.target.y()),
    );
    setPreviewSize(newSize);
  };

  const handleResizeDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newSize = sizeFromHandle(
      Math.max(cellPx, e.target.x()),
      Math.max(cellPxY, e.target.y()),
    );
    // Snap handle to grid corner
    e.target.x(newSize * cellPx);
    e.target.y(newSize * cellPxY);
    setLocalSize(newSize);
    setPreviewSize(null);
    onResizeEnd?.(position.id, newSize);
  };

  // Handle is shown only when resize mode is active for this token
  const showHandle = isResizingMode && isInteractable && !!onResizeEnd;

  return (
    <Group
      x={groupX}
      y={groupY}
      draggable={isInteractable && !isResizingMode}
      onDragStart={
        isInteractable && !isResizingMode ? () => onDragStart?.() : undefined
      }
      onDragMove={
        isInteractable && !isResizingMode
          ? (e) => {
              const relX = e.target.x() - grid.rectX;
              const relY = e.target.y() - grid.rectY;
              onDragMove?.(position.id, relX / cellPx, relY / cellPxY);
            }
          : undefined
      }
      onDragEnd={isInteractable && !isResizingMode ? handleDragEnd : undefined}
      onClick={
        isInteractable
          ? (e) => {
              if (e.evt.button !== 0) return;
              e.cancelBubble = true;
              onTokenClick?.(position.id);
            }
          : undefined
      }
      onMouseDown={
        isInteractable
          ? (e) => {
              if (e.evt.button !== 2) return;
              e.evt.preventDefault();
              e.cancelBubble = true;

              const stage = e.target.getStage();
              if (!stage || !onRightMouseDown) return;

              const containerRect = stage.container().getBoundingClientRect();
              const scale = stage.scaleX();
              const stagePos = stage.position();

              const tokenCenterClientX =
                containerRect.left + stagePos.x + tokenCenterStageX * scale;
              const tokenCenterClientY =
                containerRect.top + stagePos.y + tokenCenterStageY * scale;

              onRightMouseDown(
                position.id,
                tokenCenterClientX,
                tokenCenterClientY,
                e.evt.clientX,
                e.evt.clientY,
              );
            }
          : undefined
      }
    >
      {/* ── Token image clipped to circle ── */}
      <Group
        clipFunc={(context) => {
          context.beginPath();
          context.arc(circleCX, circleCY, radius, 0, Math.PI * 2, false);
          context.closePath();
        }}
      >
        {portraitImage ? (
          <KonvaImage
            image={portraitImage}
            x={circleCX - tokenSize / 2}
            y={circleCY - tokenSize / 2}
            width={tokenSize}
            height={tokenSize}
          />
        ) : (
          <Circle x={circleCX} y={circleCY} radius={radius} fill="#6b7280" />
        )}
      </Group>

      {/* ── DM layer overlay ── */}
      {position.capa === "dm" && (
        <Circle
          x={circleCX}
          y={circleCY}
          radius={radius}
          fill="rgba(0,0,0,0.55)"
        />
      )}

      {/* ── Border ring ── */}
      <Circle
        x={circleCX}
        y={circleCY}
        radius={radius}
        stroke={position.capa === "mapa" ? "#f87171" : "#f5e6b3"}
        strokeWidth={position.capa === "mapa" ? 4 : 3}
        shadowColor={position.capa === "mapa" ? "#f87171" : "black"}
        shadowBlur={position.capa === "mapa" ? 12 : 10}
        shadowOpacity={position.capa === "mapa" ? 0.8 : 0.35}
      />

      {/* ── Mapa extra glow ring ── */}
      {position.capa === "mapa" && (
        <Circle
          x={circleCX}
          y={circleCY}
          radius={radius + 5}
          stroke="#f87171"
          strokeWidth={2}
          shadowColor="#f87171"
          shadowBlur={10}
          shadowOpacity={0.6}
          opacity={0.6}
        />
      )}

      {/* ── Selection ring ── */}
      {isSelected && (
        <Circle
          x={circleCX}
          y={circleCY}
          radius={radius + (position.capa === "mapa" ? 9 : 5)}
          stroke="#60a5fa"
          strokeWidth={3}
          shadowColor="#60a5fa"
          shadowBlur={14}
          shadowOpacity={0.9}
        />
      )}

      {/* ── Resize mode: grid-area outline + handle ── */}
      {showHandle && (
        <>
          {/* Dashed preview outline around the full grid area */}
          <Rect
            x={0}
            y={0}
            width={localSize * cellPx}
            height={localSize * cellPxY}
            stroke="#60a5fa"
            strokeWidth={1.5}
            dash={[6, 4]}
            opacity={0.6}
            listening={false}
          />

          {/* Corner handle at bottom-right of grid area */}
          <Circle
            ref={handleRef}
            x={localSize * cellPx}
            y={localSize * cellPxY}
            radius={8}
            fill="#1e3a8a"
            stroke="#93c5fd"
            strokeWidth={2}
            shadowColor="#60a5fa"
            shadowBlur={10}
            shadowOpacity={0.8}
            draggable
            onMouseDown={(e) => {
              e.cancelBubble = true;
            }}
            onDragStart={(e) => {
              e.cancelBubble = true;
            }}
            onDragMove={handleResizeDragMove}
            onDragEnd={handleResizeDragEnd}
          />
        </>
      )}

      {/* ── Resize preview: ghost outline while dragging ── */}
      {showHandle && previewSize !== null && previewSize !== localSize && (
        <Rect
          x={0}
          y={0}
          width={previewSize * cellPx}
          height={previewSize * cellPxY}
          stroke="#93c5fd"
          strokeWidth={2}
          dash={[4, 3]}
          opacity={0.8}
          listening={false}
        />
      )}
    </Group>
  );
}
