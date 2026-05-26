import type { VisionConfig } from "../hooks/useCampaignRealtime";
import type { CampaignPositionResponse, VisionShape } from "../types";

// No save/restore/translate/rotate — all coords computed directly (fast in tight loops)
// halfSize: half of the token's size in grid cells (0.5 for 1×1, 1.5 for 3×3, etc.)
// Vision center is placed at the token center, and all radii/distances are extended by halfSize
// so that the stated vision distance is measured from the token's outer edge, not its center.
export function addVisionShapeToPath(
  ctx: CanvasRenderingContext2D,
  arcType: string,
  shape: VisionShape,
  posicionX: number,
  posicionY: number,
  grid: { rectX: number; rectY: number },
  cellPx: number,
  halfSize: number = 0.5,
) {
  const cx = grid.rectX + (posicionX + halfSize) * cellPx;
  const cy = grid.rectY + (posicionY + halfSize) * cellPx;
  const rot = (shape.rotation * Math.PI) / 180;

  if (arcType === "semicircle") {
    const halfAp = ((shape.apertura / 2) * Math.PI) / 180;
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      (shape.radius + halfSize) * cellPx,
      rot - halfAp,
      rot + halfAp,
    );
    ctx.closePath();
  } else if (arcType === "cone") {
    const halfA = ((shape.angle / 2) * Math.PI) / 180;
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      (shape.length + halfSize) * cellPx,
      rot - halfA,
      rot + halfA,
    );
    ctx.closePath();
  } else if (arcType === "rectangle") {
    const hw = (shape.width / 2 + halfSize) * cellPx;
    const h = (shape.height + halfSize) * cellPx;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    // Rotate corners around (cx, cy) without modifying ctx transform
    ctx.moveTo(cx - hw * cosR, cy - hw * sinR);
    ctx.lineTo(cx + hw * cosR, cy + hw * sinR);
    ctx.lineTo(cx + hw * cosR - h * sinR, cy + hw * sinR + h * cosR);
    ctx.lineTo(cx - hw * cosR - h * sinR, cy - hw * sinR + h * cosR);
    ctx.closePath();
  }
}

export function drawVisionShape(
  ctx: CanvasRenderingContext2D,
  arcType: string,
  shape: VisionShape,
  posicionX: number,
  posicionY: number,
  grid: { rectX: number; rectY: number },
  cellPx: number,
  halfSize: number = 0.5,
) {
  ctx.beginPath();
  addVisionShapeToPath(
    ctx,
    arcType,
    shape,
    posicionX,
    posicionY,
    grid,
    cellPx,
    halfSize,
  );
  ctx.fill();
}

// ── Token visibility helpers (grid-coord geometry, used for fog-of-war player view) ──

/** Returns true if a point (dx, dy relative to vision-source center, dist = its magnitude)
 *  lies inside the given VisionConfig shape.  All values in grid-cell units.
 *  `margin` is added to every radius/dimension to extend for the target token's body. */
export function isInVisionShapeGrid(
  dx: number,
  dy: number,
  dist: number,
  sourceHalfSize: number,
  vc: VisionConfig,
  margin: number = 0,
): boolean {
  if (vc.arcType === "semicircle") {
    const radius = vc.radius + sourceHalfSize + margin;
    if (dist > radius) return false;
    const ang = Math.atan2(dy, dx);
    const rot = (vc.rotation * Math.PI) / 180;
    const halfAp = ((vc.apertura / 2) * Math.PI) / 180;
    let diff = ang - rot;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return Math.abs(diff) <= halfAp;
  } else if (vc.arcType === "cone") {
    const radius = vc.length + sourceHalfSize + margin;
    if (dist > radius) return false;
    const ang = Math.atan2(dy, dx);
    const rot = (vc.rotation * Math.PI) / 180;
    const halfA = ((vc.angle / 2) * Math.PI) / 180;
    let diff = ang - rot;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return Math.abs(diff) <= halfA;
  } else if (vc.arcType === "rectangle") {
    const hw = vc.width / 2 + sourceHalfSize + margin;
    const h = vc.height + sourceHalfSize + margin;
    const rot = (vc.rotation * Math.PI) / 180;
    const cosR = Math.cos(-rot);
    const sinR = Math.sin(-rot);
    const localX = dx * cosR - dy * sinR;
    const localY = dx * sinR + dy * cosR;
    return Math.abs(localX) <= hw && localY >= -margin && localY <= h;
  } else {
    // Default: full-circle radius
    return dist <= (vc.radius ?? 0) + sourceHalfSize + margin;
  }
}

/** Returns true if `position` falls inside any active vision field (revelaArea=true).
 *  `draggingToken` supplies live coordinates while a token is being dragged. */
export function isTokenVisibleToPlayer(
  position: CampaignPositionResponse,
  visionConfigs: VisionConfig[],
  allPositions: CampaignPositionResponse[],
  draggingToken: {
    posicionId: number;
    posicionX: number;
    posicionY: number;
  } | null,
): boolean {
  const targetHalfSize =
    Math.max(1, position.largo ?? 1, position.ancho ?? 1) / 2;
  const targetCX = position.posicionX + targetHalfSize;
  const targetCY = position.posicionY + targetHalfSize;

  for (const vc of visionConfigs) {
    if (!vc.revelaArea) continue;
    const sourcePos = allPositions.find((p) => p.id === vc.posicionId);
    if (!sourcePos) continue;

    const sourceLive =
      draggingToken?.posicionId === vc.posicionId ? draggingToken : null;
    const sourcePosX = sourceLive?.posicionX ?? sourcePos.posicionX;
    const sourcePosY = sourceLive?.posicionY ?? sourcePos.posicionY;
    const vcHalfSize =
      Math.max(1, sourcePos.largo ?? 1, sourcePos.ancho ?? 1) / 2;

    const dx = targetCX - (sourcePosX + vcHalfSize);
    const dy = targetCY - (sourcePosY + vcHalfSize);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Visible if inside the vision-source token's own body footprint
    if (dist <= vcHalfSize * Math.SQRT2 + targetHalfSize) return true;
    // Or inside the directional shape (margin = targetHalfSize for overlap check)
    if (isInVisionShapeGrid(dx, dy, dist, vcHalfSize, vc, targetHalfSize))
      return true;
  }
  return false;
}
