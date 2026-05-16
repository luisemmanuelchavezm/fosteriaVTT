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
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onTokenClick?: (positionId: number) => void;
}

export function PosicionFicha({
  position,
  grid,
  isSelected,
  onDragStart,
  onDragEnd,
  onTokenClick,
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

  const handleDragStart = () => {
    onDragStart?.();
  };

  const handleDragEnd = (e: {
    target: { x: () => number; y: () => number };
  }) => {
    // Convertir coordenadas de escena a coordenadas de grid
    const relativeX = e.target.x() - grid.rectX;
    const relativeY = e.target.y() - grid.rectY;

    const gridX = Math.floor(relativeX / CELL_PX);
    const gridY = Math.floor(relativeY / CELL_PX);

    setLocalX(gridX);
    setLocalY(gridY);
    onDragEnd?.(gridX, gridY);
  };

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.cancelBubble = true;
        onTokenClick?.(position.id);
      }}
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
      <Circle
        x={CELL_PX / 2}
        y={CELL_PX / 2}
        radius={radius}
        stroke="#f5e6b3"
        strokeWidth={3}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.35}
      />
      {isSelected && (
        <Circle
          x={CELL_PX / 2}
          y={CELL_PX / 2}
          radius={radius + 5}
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
