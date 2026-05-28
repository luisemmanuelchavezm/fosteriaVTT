import { describe, expect, it, vi } from "vitest";
import {
  isInVisionShapeGrid,
  isTokenVisibleToPlayer,
  addVisionShapeToPath,
  drawVisionShape,
} from "../../../screens/campaign/utils/fogGeometry";
import type { VisionConfig } from "../../../screens/campaign/hooks/useCampaignRealtime";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeVisionConfig = (overrides?: Partial<VisionConfig>): VisionConfig => ({
  posicionId: 1,
  revelaArea: true,
  arcType: "semicircle",
  radius: 6,
  apertura: 360,
  rotation: 0,
  angle: 45,
  length: 8,
  width: 4,
  height: 6,
  ...overrides,
});

const makePosition = (
  overrides?: Partial<CampaignPositionResponse>,
): CampaignPositionResponse => ({
  id: 1,
  pestanaId: 1,
  capa: "fichas",
  personajeId: 1,
  personajeNombre: "Hero",
  posicionX: 0,
  posicionY: 0,
  largo: 1,
  ancho: 1,
  tipo: "personaje",
  ...overrides,
});

// Mock useCampaignRealtime to avoid circular imports
vi.mock("../../../screens/campaign/hooks/useCampaignRealtime", () => ({}));

// ── isInVisionShapeGrid ───────────────────────────────────────────────────────

describe("isInVisionShapeGrid - semicircle", () => {
  it("punto dentro del radio de semicírculo (360°) es visible", () => {
    const vc = makeVisionConfig({
      arcType: "semicircle",
      radius: 6,
      apertura: 360,
      rotation: 0,
    });
    // dx=3, dy=0 → dist=3 ≤ 6+0.5+0 = 6.5
    expect(isInVisionShapeGrid(3, 0, 3, 0.5, vc)).toBe(true);
  });

  it("punto fuera del radio de semicírculo no es visible", () => {
    const vc = makeVisionConfig({
      arcType: "semicircle",
      radius: 3,
      apertura: 360,
      rotation: 0,
    });
    // dist = 10 > 3+0.5+0
    expect(isInVisionShapeGrid(10, 0, 10, 0.5, vc)).toBe(false);
  });

  it("punto fuera del ángulo del semicírculo no es visible", () => {
    // apertura=90° → sólo visible en ±45° del rotation=0 (este)
    const vc = makeVisionConfig({
      arcType: "semicircle",
      radius: 6,
      apertura: 90,
      rotation: 0,
    });
    // Punto al norte (dy=-3, dx=0) está a 90° del eje este → fuera del ángulo de 45°
    const dx = 0;
    const dy = -3;
    const dist = 3;
    expect(isInVisionShapeGrid(dx, dy, dist, 0.5, vc)).toBe(false);
  });
});

describe("isInVisionShapeGrid - cone", () => {
  it("punto dentro del cono es visible", () => {
    const vc = makeVisionConfig({
      arcType: "cone",
      length: 8,
      angle: 90,
      rotation: 0,
    });
    // Punto al este dentro del cono (angle=90°, ±45° del eje 0°)
    expect(isInVisionShapeGrid(4, 0, 4, 0.5, vc)).toBe(true);
  });

  it("punto fuera del largo del cono no es visible", () => {
    const vc = makeVisionConfig({
      arcType: "cone",
      length: 5,
      angle: 90,
      rotation: 0,
    });
    expect(isInVisionShapeGrid(10, 0, 10, 0.5, vc)).toBe(false);
  });

  it("punto fuera del ángulo del cono no es visible", () => {
    const vc = makeVisionConfig({
      arcType: "cone",
      length: 8,
      angle: 30,
      rotation: 0,
    });
    // dy=-4 está a casi 90° del eje → fuera del ángulo de 15°
    expect(isInVisionShapeGrid(0, -4, 4, 0.5, vc)).toBe(false);
  });
});

describe("isInVisionShapeGrid - rectangle", () => {
  it("punto dentro del rectángulo es visible", () => {
    const vc = makeVisionConfig({
      arcType: "rectangle",
      width: 4,
      height: 6,
      rotation: 0,
    });
    // Sin rotación: ancho = ±(2+0.5+0) = 2.5, alto = 0...(6+0.5+0)=6.5
    // Punto (1, 3) debería estar dentro
    expect(isInVisionShapeGrid(1, 3, 3.2, 0.5, vc)).toBe(true);
  });

  it("punto fuera del ancho del rectángulo no es visible", () => {
    const vc = makeVisionConfig({
      arcType: "rectangle",
      width: 4,
      height: 6,
      rotation: 0,
    });
    // x=5 > ancho de 2.5
    expect(isInVisionShapeGrid(5, 3, 5.8, 0.5, vc)).toBe(false);
  });
});

describe("isInVisionShapeGrid - default (tipo desconocido)", () => {
  it("usa radio de semicírculo por defecto", () => {
    const vc = makeVisionConfig({ arcType: "unknown_type", radius: 5 });
    expect(isInVisionShapeGrid(3, 0, 3, 0.5, vc)).toBe(true);
    expect(isInVisionShapeGrid(10, 0, 10, 0.5, vc)).toBe(false);
  });
});

// ── isTokenVisibleToPlayer ────────────────────────────────────────────────────

describe("isTokenVisibleToPlayer", () => {
  it("retorna false si no hay configs de visión", () => {
    const target = makePosition({ id: 2, posicionX: 5, posicionY: 5 });
    expect(isTokenVisibleToPlayer(target, [], [], null)).toBe(false);
  });

  it("retorna false si revelaArea=false en todas las configs", () => {
    const source = makePosition({ id: 1, posicionX: 0, posicionY: 0 });
    const target = makePosition({ id: 2, posicionX: 2, posicionY: 0 });
    const vc = makeVisionConfig({ posicionId: 1, revelaArea: false });
    expect(isTokenVisibleToPlayer(target, [vc], [source], null)).toBe(false);
  });

  it("retorna false si no se encuentra la posición fuente", () => {
    const target = makePosition({ id: 2, posicionX: 5, posicionY: 5 });
    const vc = makeVisionConfig({ posicionId: 99 }); // ID que no existe
    const positions = [makePosition({ id: 1, posicionX: 0, posicionY: 0 })];
    expect(isTokenVisibleToPlayer(target, [vc], positions, null)).toBe(false);
  });

  it("retorna true si el token está dentro del footprint de la fuente", () => {
    const source = makePosition({
      id: 1,
      posicionX: 0,
      posicionY: 0,
      largo: 1,
      ancho: 1,
    });
    const target = makePosition({
      id: 2,
      posicionX: 0,
      posicionY: 0,
      largo: 1,
      ancho: 1,
    });
    const vc = makeVisionConfig({
      posicionId: 1,
      arcType: "semicircle",
      radius: 6,
      apertura: 360,
    });
    // target está en el mismo lugar que source → dentro del footprint
    expect(isTokenVisibleToPlayer(target, [vc], [source, target], null)).toBe(
      true,
    );
  });

  it("usa coordenadas del token arrastrado cuando draggingToken coincide", () => {
    const source = makePosition({ id: 1, posicionX: 100, posicionY: 100 });
    const target = makePosition({ id: 2, posicionX: 2, posicionY: 0 });
    const vc = makeVisionConfig({
      posicionId: 1,
      arcType: "semicircle",
      radius: 10,
      apertura: 360,
    });

    // Arrastrar el source a (1, 0) pone la fuente cerca del target
    const dragging = { posicionId: 1, posicionX: 1, posicionY: 0 };
    expect(
      isTokenVisibleToPlayer(target, [vc], [source, target], dragging),
    ).toBe(true);
  });
});

// ── addVisionShapeToPath ──────────────────────────────────────────────────────

function makeMockCtx() {
  return {
    moveTo: vi.fn(),
    arc: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const grid = { rectX: 0, rectY: 0 };

describe("addVisionShapeToPath", () => {
  it("dibuja semicírculo llamando a arc y closePath", () => {
    const ctx = makeMockCtx();
    const shape = {
      radius: 6,
      apertura: 180,
      rotation: 0,
      angle: 45,
      length: 8,
      width: 4,
      height: 6,
    };
    addVisionShapeToPath(ctx, "semicircle", shape, 0, 0, grid, 50);
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("dibuja cono llamando a arc y closePath", () => {
    const ctx = makeMockCtx();
    const shape = {
      radius: 6,
      apertura: 90,
      rotation: 0,
      angle: 45,
      length: 8,
      width: 4,
      height: 6,
    };
    addVisionShapeToPath(ctx, "cone", shape, 0, 0, grid, 50);
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("dibuja rectángulo llamando a moveTo y lineTo", () => {
    const ctx = makeMockCtx();
    const shape = {
      radius: 0,
      apertura: 0,
      rotation: 0,
      angle: 45,
      length: 8,
      width: 4,
      height: 6,
    };
    addVisionShapeToPath(ctx, "rectangle", shape, 0, 0, grid, 50);
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalledTimes(3);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("no dibuja nada para arcType desconocido", () => {
    const ctx = makeMockCtx();
    const shape = {
      radius: 6,
      apertura: 90,
      rotation: 0,
      angle: 45,
      length: 8,
      width: 4,
      height: 6,
    };
    addVisionShapeToPath(ctx, "unknown", shape, 0, 0, grid, 50);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.lineTo).not.toHaveBeenCalled();
  });
});

describe("drawVisionShape", () => {
  it("llama a beginPath y fill", () => {
    const ctx = makeMockCtx();
    const shape = {
      radius: 6,
      apertura: 360,
      rotation: 0,
      angle: 45,
      length: 8,
      width: 4,
      height: 6,
    };
    drawVisionShape(ctx, "semicircle", shape, 0, 0, grid, 50);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});
