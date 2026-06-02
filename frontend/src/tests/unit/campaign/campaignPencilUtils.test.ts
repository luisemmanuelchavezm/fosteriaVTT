import { describe, expect, it } from "vitest";
import {
  toKonvaPoints,
  getBounds,
  intersectsDrawing,
  STROKE_WIDTH,
  ERASER_HIT_RADIUS,
  PENCIL_FLUSH_MS,
} from "../../../screens/campaign/campaignPencilUtils";
import type { DrawingItem } from "../../../screens/campaign/hooks/useWebSocketDrawings";

describe("campaignPencilUtils - constants", () => {
  it("STROKE_WIDTH es 3", () => expect(STROKE_WIDTH).toBe(3));
  it("ERASER_HIT_RADIUS es 10", () => expect(ERASER_HIT_RADIUS).toBe(10));
  it("PENCIL_FLUSH_MS es 3000", () => expect(PENCIL_FLUSH_MS).toBe(3000));
});

describe("toKonvaPoints", () => {
  it("convierte puntos a array plano [x, y, x, y, ...]", () => {
    const points = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];
    expect(toKonvaPoints(points)).toEqual([1, 2, 3, 4]);
  });

  it("retorna array vacío para puntos vacíos", () => {
    expect(toKonvaPoints([])).toEqual([]);
  });
});

describe("getBounds", () => {
  it("calcula bounds correctamente", () => {
    const points = [
      { x: 10, y: 20 },
      { x: 50, y: 80 },
    ];
    const bounds = getBounds(points);
    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(20);
    expect(bounds.width).toBe(40);
    expect(bounds.height).toBe(60);
  });

  it("maneja un solo punto (start = end)", () => {
    const points = [{ x: 5, y: 5 }];
    const bounds = getBounds(points);
    expect(bounds.minX).toBe(5);
    expect(bounds.width).toBeGreaterThanOrEqual(1);
    expect(bounds.height).toBeGreaterThanOrEqual(1);
  });

  it("ordena correctamente cuando end < start", () => {
    const points = [
      { x: 50, y: 80 },
      { x: 10, y: 20 },
    ];
    const bounds = getBounds(points);
    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(20);
  });
});

function makeDrawing(
  tipo: DrawingItem["tipo"],
  puntos: { x: number; y: number }[],
  relleno = false,
): DrawingItem {
  return {
    id: "d1",
    tipo,
    puntos,
    color: "#fff",
    grosor: 3,
    relleno,
  } as DrawingItem;
}

describe("intersectsDrawing", () => {
  it("retorna false si hay menos de 2 puntos", () => {
    const drawing = makeDrawing("pencil", [{ x: 5, y: 5 }]);
    expect(intersectsDrawing({ x: 5, y: 5 }, drawing)).toBe(false);
  });

  it("detecta intersección con línea pencil", () => {
    const drawing = makeDrawing("pencil", [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(intersectsDrawing({ x: 50, y: 0 }, drawing)).toBe(true);
  });

  it("no detecta intersección lejana con pencil", () => {
    const drawing = makeDrawing("pencil", [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(intersectsDrawing({ x: 50, y: 50 }, drawing)).toBe(false);
  });

  it("detecta intersección con borde de rectángulo", () => {
    const drawing = makeDrawing("rectangle", [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(intersectsDrawing({ x: 50, y: 0 }, drawing, 5)).toBe(true);
  });

  it("detecta intersección con rectángulo relleno", () => {
    const drawing = makeDrawing(
      "rectangle",
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      true,
    );
    expect(intersectsDrawing({ x: 50, y: 50 }, drawing)).toBe(true);
  });

  it("no detecta intersección fuera del rectángulo", () => {
    const drawing = makeDrawing("rectangle", [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(intersectsDrawing({ x: 200, y: 200 }, drawing, 3)).toBe(false);
  });

  it("detecta intersección con elipse en el borde", () => {
    // Point at the right edge of the ellipse (100,50): normalized = (50/50)² + 0 = 1
    const drawing = makeDrawing("ellipse", [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(intersectsDrawing({ x: 100, y: 50 }, drawing)).toBe(true);
  });

  it("detecta intersección con elipse rellena en el interior", () => {
    const drawing = makeDrawing(
      "ellipse",
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      true,
    );
    expect(intersectsDrawing({ x: 50, y: 50 }, drawing)).toBe(true);
  });
});
