import type Konva from "konva";
import { useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

export interface GridGeometry {
  rectW: number;
  rectH: number;
  rectX: number;
  rectY: number;
}

export interface RulerMeasurement {
  start: GridCellPoint;
  end: GridCellPoint;
}

export interface RulerOverlayData {
  label: string;
  labelX: number;
  labelY: number;
  squareCenterX: number;
  squareCenterY: number;
  squareSize: number;
  squareRotationDeg: number;
  radiusPx: number;
  conePoints: number[];
}

export type RulerShape = "recta" | "cuadrado" | "circular" | "conica";

interface GridCellPoint {
  col: number;
  row: number;
  x: number;
  y: number;
}

interface UseCampaignRulerToolArgs {
  enabled: boolean;
  stageRef: RefObject<Konva.Stage | null>;
  grid: GridGeometry;
  cellPx: number;
  unitDistance: number;
  metric: string;
}

const CONE_ANGLE_DEGREES = 90;

function getCellFromStagePointer(
  stage: Konva.Stage,
  grid: GridGeometry,
  cellPx: number,
): GridCellPoint | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }

  const invertedTransform = stage.getAbsoluteTransform().copy();
  invertedTransform.invert();
  const worldPoint = invertedTransform.point(pointer);

  const localX = worldPoint.x - grid.rectX;
  const localY = worldPoint.y - grid.rectY;

  if (
    localX < 0 ||
    localY < 0 ||
    localX >= grid.rectW ||
    localY >= grid.rectH
  ) {
    return null;
  }

  const col = Math.floor(localX / cellPx);
  const row = Math.floor(localY / cellPx);

  return {
    col,
    row,
    x: grid.rectX + col * cellPx + cellPx / 2,
    y: grid.rectY + row * cellPx + cellPx / 2,
  };
}

function buildOverlayData(
  measurement: RulerMeasurement | null,
  unitDistance: number,
  metric: string,
): RulerOverlayData | null {
  if (!measurement) {
    return null;
  }

  const deltaCols = Math.abs(measurement.end.col - measurement.start.col);
  const deltaRows = Math.abs(measurement.end.row - measurement.start.row);
  const traversedCells = Math.max(deltaCols, deltaRows);
  const totalDistance = traversedCells * unitDistance;
  const label = `${totalDistance} ${metric}`;
  const lineMidX = (measurement.start.x + measurement.end.x) / 2;
  const lineMidY = (measurement.start.y + measurement.end.y) / 2;
  const deltaX = measurement.end.x - measurement.start.x;
  const deltaY = measurement.end.y - measurement.start.y;
  const radiusPx = Math.hypot(deltaX, deltaY);
  const squareSize = Math.max(radiusPx * 2, 1);
  const squareRotationDeg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  const directionAngle = Math.atan2(deltaY, deltaX);
  const halfConeAngle = (CONE_ANGLE_DEGREES * Math.PI) / 360;
  const baseHalf = radiusPx * Math.tan(halfConeAngle);
  const perpX = -Math.sin(directionAngle);
  const perpY = Math.cos(directionAngle);
  const coneLeftX = measurement.end.x + perpX * baseHalf;
  const coneLeftY = measurement.end.y + perpY * baseHalf;
  const coneRightX = measurement.end.x - perpX * baseHalf;
  const coneRightY = measurement.end.y - perpY * baseHalf;

  return {
    label,
    labelX: lineMidX,
    labelY: lineMidY + 18,
    squareCenterX: measurement.start.x,
    squareCenterY: measurement.start.y,
    squareSize,
    squareRotationDeg,
    radiusPx,
    conePoints: [
      measurement.start.x,
      measurement.start.y,
      coneLeftX,
      coneLeftY,
      coneRightX,
      coneRightY,
    ],
  };
}

export function useCampaignRulerTool({
  enabled,
  stageRef,
  grid,
  cellPx,
  unitDistance,
  metric,
}: UseCampaignRulerToolArgs) {
  const [selectedShape, setSelectedShape] = useState<RulerShape>("recta");
  const [measurement, setMeasurement] = useState<RulerMeasurement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsDragging(false);
    }
  }, [enabled]);

  const handleMouseDown = () => {
    if (!enabled) {
      return false;
    }

    const stage = stageRef.current;
    if (!stage) {
      return false;
    }

    const cell = getCellFromStagePointer(stage, grid, cellPx);
    if (!cell) {
      return false;
    }

    setMeasurement({ start: cell, end: cell });
    setIsDragging(true);
    return true;
  };

  const handleMouseMove = () => {
    if (!enabled || !isDragging) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const cell = getCellFromStagePointer(stage, grid, cellPx);
    if (!cell) {
      return;
    }

    setMeasurement((currentMeasurement) => {
      if (!currentMeasurement) {
        return currentMeasurement;
      }

      return {
        start: currentMeasurement.start,
        end: cell,
      };
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const overlay = useMemo(
    () => buildOverlayData(measurement, unitDistance, metric),
    [measurement, metric, unitDistance],
  );

  return {
    selectedShape,
    setSelectedShape,
    measurement,
    overlay,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
