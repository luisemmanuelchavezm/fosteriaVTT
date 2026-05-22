import type Konva from "konva";
import { useEffect, useState } from "react";
import { Circle, Group, Image as KonvaImage } from "react-konva";

const CELL_PX = 70;

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
}

interface PosicionFichaProps {
  position: CampaignPositionResponse;
  grid: Grid;
  isSelected?: boolean;
  isInteractable?: boolean;
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
}

export function PosicionFicha({
  position,
  grid,
  isSelected,
  isInteractable = true,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTokenClick,
  onRightMouseDown,
}: PosicionFichaProps) {
  const [portraitImage, setPortraitImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [localX, setLocalX] = useState(position.posicionX);
  const [localY, setLocalY] = useState(position.posicionY);

  useEffect(() => {
    setLocalX(position.posicionX);
    setLocalY(position.posicionY);
  }, [position.posicionX, position.posicionY]);

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

  const x = grid.rectX + localX * CELL_PX;
  const y = grid.rectY + localY * CELL_PX;
  const radius = CELL_PX / 2 - 4;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const relativeX = e.target.x() - grid.rectX;
    const relativeY = e.target.y() - grid.rectY;

    const gridX = Math.max(0, Math.round(relativeX / CELL_PX));
    const gridY = Math.max(0, Math.round(relativeY / CELL_PX));

    e.target.x(grid.rectX + gridX * CELL_PX);
    e.target.y(grid.rectY + gridY * CELL_PX);

    setLocalX(gridX);
    setLocalY(gridY);
    onDragEnd?.(gridX, gridY);
  };

  return (
    <Group
      x={x}
      y={y}
      draggable={isInteractable}
      onDragStart={isInteractable ? () => onDragStart?.() : undefined}
      onDragMove={
        isInteractable
          ? (e) => {
              const relX = e.target.x() - grid.rectX;
              const relY = e.target.y() - grid.rectY;
              onDragMove?.(position.id, relX / CELL_PX, relY / CELL_PX);
            }
          : undefined
      }
      onDragEnd={isInteractable ? handleDragEnd : undefined}
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

              const tokenCenterStageX = x + CELL_PX / 2;
              const tokenCenterStageY = y + CELL_PX / 2;

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
      <Group
        clipFunc={(context) => {
          context.beginPath();
          context.arc(CELL_PX / 2, CELL_PX / 2, radius, 0, Math.PI * 2, false);
          context.closePath();
        }}
      >
        {portraitImage ? (
          <KonvaImage image={portraitImage} width={CELL_PX} height={CELL_PX} />
        ) : (
          <Circle
            x={CELL_PX / 2}
            y={CELL_PX / 2}
            radius={radius}
            fill="#6b7280"
          />
        )}
      </Group>

      {/* DM layer: dark semi-transparent overlay on top of portrait */}
      {position.capa === "dm" && (
        <Circle
          x={CELL_PX / 2}
          y={CELL_PX / 2}
          radius={radius}
          fill="rgba(0,0,0,0.55)"
        />
      )}

      {/* Base border ring */}
      <Circle
        x={CELL_PX / 2}
        y={CELL_PX / 2}
        radius={radius}
        stroke={position.capa === "mapa" ? "#f87171" : "#f5e6b3"}
        strokeWidth={position.capa === "mapa" ? 4 : 3}
        shadowColor={position.capa === "mapa" ? "#f87171" : "black"}
        shadowBlur={position.capa === "mapa" ? 12 : 10}
        shadowOpacity={position.capa === "mapa" ? 0.8 : 0.35}
      />

      {/* Mapa layer: extra outer glow ring */}
      {position.capa === "mapa" && (
        <Circle
          x={CELL_PX / 2}
          y={CELL_PX / 2}
          radius={radius + 5}
          stroke="#f87171"
          strokeWidth={2}
          shadowColor="#f87171"
          shadowBlur={10}
          shadowOpacity={0.6}
          opacity={0.6}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <Circle
          x={CELL_PX / 2}
          y={CELL_PX / 2}
          radius={radius + (position.capa === "mapa" ? 9 : 5)}
          stroke="#60a5fa"
          strokeWidth={3}
          shadowColor="#60a5fa"
          shadowBlur={14}
          shadowOpacity={0.9}
        />
      )}
    </Group>
  );
}
