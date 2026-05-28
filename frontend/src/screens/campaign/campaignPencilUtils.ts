import type Konva from "konva";
import type {
  DrawingItem,
  DrawingPoint,
  DrawingType,
} from "./hooks/useWebSocketDrawings";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type PencilShape = DrawingType;

// ─── Constantes ─────────────────────────────────────────────────────────────

export const STROKE_WIDTH = 3;
export const ERASER_HIT_RADIUS = 10;
export const PENCIL_FLUSH_MS = 3000;

// ─── Geometría básica ────────────────────────────────────────────────────────

export function toKonvaPoints(points: DrawingPoint[]): number[] {
  return points.flatMap((point) => [point.x, point.y]);
}

export function getBounds(points: DrawingPoint[]) {
  const start = points[0];
  const end = points[points.length - 1] ?? start;
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const width = Math.max(Math.abs(end.x - start.x), 1);
  const height = Math.max(Math.abs(end.y - start.y), 1);
  return { minX, minY, width, height };
}

export function getWorldPointer(stage: Konva.Stage): DrawingPoint | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;

  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const world = transform.point(pointer);

  return { x: Math.round(world.x), y: Math.round(world.y) };
}

// ─── Hit-testing (usado por el borrador) ─────────────────────────────────────

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
  if (abLenSq === 0) return Math.hypot(apx, apy);

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  return Math.hypot(point.x - (a.x + abx * t), point.y - (a.y + aby * t));
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
    if (intersect) inside = !inside;
  }
  return inside;
}

export function intersectsDrawing(
  point: DrawingPoint,
  drawing: DrawingItem,
  tolerance = ERASER_HIT_RADIUS,
): boolean {
  if (drawing.puntos.length < 2) return false;

  if (drawing.tipo === "pencil") {
    for (let i = 1; i < drawing.puntos.length; i++) {
      if (
        distancePointToSegment(
          point,
          drawing.puntos[i - 1],
          drawing.puntos[i],
        ) <= tolerance
      )
        return true;
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
    )
      return true;
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
    if (drawing.relleno && normalized <= 1) return true;
    return Math.abs(normalized - 1) <= 0.2;
  }

  // triangle
  const triangle = [
    { x: bounds.minX + bounds.width / 2, y: bounds.minY },
    { x: maxX, y: maxY },
    { x: bounds.minX, y: maxY },
  ];
  if (drawing.relleno && isPointInPolygon(point, triangle)) return true;
  const edges: Array<[DrawingPoint, DrawingPoint]> = [
    [triangle[0], triangle[1]],
    [triangle[1], triangle[2]],
    [triangle[2], triangle[0]],
  ];
  return edges.some(
    ([a, b]) => distancePointToSegment(point, a, b) <= tolerance,
  );
}
