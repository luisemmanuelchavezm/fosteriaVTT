import { useCallback, useEffect, useRef, useState } from "react";
import type { CampaignPositionResponse } from "../types";
import type {
  ExploredArea,
  NieblaEstado,
  VisionConfig,
} from "./useCampaignRealtime";
import type Konva from "konva";

export interface ContextMenu {
  posicionId: number;
  x: number;
  y: number;
}

interface UseFogOfWarInteractionParams {
  positions: CampaignPositionResponse[];
  configurarVisionToken: (config: VisionConfig) => void;
  agregarAreasExploradasBatch: (areas: ExploredArea[]) => void;
}

export function useFogOfWarInteraction({
  positions,
  configurarVisionToken,
  agregarAreasExploradasBatch,
}: UseFogOfWarInteractionParams) {
  const [nieblaEstado, setNieblaEstado] = useState<NieblaEstado>({
    activa: false,
    zonasExploradas: false,
    vistaJugador: false,
    visionConfigs: [],
    exploredAreas: [],
  });
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [visionArcTarget, setVisionArcTarget] = useState<number | null>(null);

  // Ref que siempre tiene el valor actualizado de nieblaEstado (evita closures stale)
  const nieblaEstadoRef = useRef(nieblaEstado);
  useEffect(() => {
    nieblaEstadoRef.current = nieblaEstado;
  }, [nieblaEstado]);

  // Ref que siempre tiene el valor actualizado de positions
  const positionsRef = useRef(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  // Rotación en vivo (no causa re-render, solo para VisionArcModal)
  const liveRotationRef = useRef(0);

  // Token que se está arrastrando actualmente
  const draggingTokenRef = useRef<{
    posicionId: number;
    posicionX: number;
    posicionY: number;
  } | null>(null);

  // Referencia a la capa de niebla de Konva
  const fogLayerRef = useRef<Konva.Layer>(null);

  // Casillas exploradas localmente durante el drag actual
  const localPathRef = useRef<ExploredArea[]>([]);

  // Áreas enviadas al servidor pero aún no confirmadas (se muestran localmente)
  const pendingAreasRef = useRef<ExploredArea[]>([]);

  // IDs confirmados por el servidor para evitar reenvíos
  const confirmedAreaIdsRef = useRef<Set<string>>(new Set());

  // Última celda entera sobre la que pasó el token durante el drag
  const lastDragCellRef = useRef<{
    x: number;
    y: number;
    posicionId: number;
  } | null>(null);

  // Estado del drag de rotación (botón derecho + movimiento)
  const rotationDragRef = useRef<{
    posicionId: number;
    tokenCenterClientX: number;
    tokenCenterClientY: number;
    startClientX: number;
    startClientY: number;
    hasMoved: boolean;
  } | null>(null);

  // Caché offscreen del canvas de áreas exploradas del servidor
  const exploredBitmapRef = useRef<{
    canvas: HTMLCanvasElement;
    key: string;
  } | null>(null);

  // Áreas exploradas acumuladas durante un drag de rotación
  const localRotationAreasRef = useRef<ExploredArea[]>([]);

  // Último ángulo cuantizado registrado (evita duplicados)
  const lastRotationQuantizedRef = useRef<number | null>(null);

  // ── Callback para recibir el estado de niebla del servidor ────────────────
  const handleNieblaChanged = useCallback((estado: NieblaEstado) => {
    setNieblaEstado(estado);
    const ids = new Set(estado.exploredAreas.map((a) => a.id));
    confirmedAreaIdsRef.current = ids;
    if (pendingAreasRef.current.length > 0) {
      pendingAreasRef.current = pendingAreasRef.current.filter(
        (a) => !ids.has(a.id),
      );
    }
  }, []);

  // ── Drag de rotación (clic derecho + arrastre del ratón) ──────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = rotationDragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (!drag.hasMoved && (Math.abs(dx) >= 5 || Math.abs(dy) >= 5)) {
        drag.hasMoved = true;
      }
      if (drag.hasMoved) {
        const angleDeg =
          (Math.atan2(
            e.clientY - drag.tokenCenterClientY,
            e.clientX - drag.tokenCenterClientX,
          ) *
            180) /
          Math.PI;
        const normalized = (angleDeg + 360) % 360;
        liveRotationRef.current = normalized;
        setNieblaEstado((prev) => ({
          ...prev,
          visionConfigs: prev.visionConfigs.map((vc) =>
            vc.posicionId === drag.posicionId
              ? { ...vc, rotation: normalized }
              : vc,
          ),
        }));

        // Acumular áreas exploradas cada 15° de rotación
        const niebla = nieblaEstadoRef.current;
        if (niebla.activa && niebla.zonasExploradas) {
          const vc = niebla.visionConfigs.find(
            (v) => v.posicionId === drag.posicionId,
          );
          if (vc?.revelaArea) {
            const quantized = Math.round(normalized / 15) * 15;
            if (quantized !== lastRotationQuantizedRef.current) {
              lastRotationQuantizedRef.current = quantized;
              const tokenPos = positionsRef.current.find(
                (p) => p.id === drag.posicionId,
              );
              if (tokenPos) {
                const tokenSize = Math.max(
                  1,
                  tokenPos.largo ?? 1,
                  tokenPos.ancho ?? 1,
                );
                localRotationAreasRef.current.push({
                  id: `${drag.posicionId}-rot-${quantized}`,
                  posicionX: tokenPos.posicionX,
                  posicionY: tokenPos.posicionY,
                  arcType: vc.arcType,
                  radius: vc.radius,
                  apertura: vc.apertura,
                  rotation: quantized,
                  angle: vc.angle,
                  length: vc.length,
                  width: vc.width,
                  height: vc.height,
                  tokenSize,
                });
              }
            }
          }
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const drag = rotationDragRef.current;
      if (!drag) return;
      rotationDragRef.current = null;
      if (drag.hasMoved) {
        // Persistir la rotación final vía WebSocket
        setNieblaEstado((prev) => {
          const vc = prev.visionConfigs.find(
            (v) => v.posicionId === drag.posicionId,
          );
          if (vc) configurarVisionToken(vc);
          return prev;
        });
        // Enviar todas las áreas exploradas del barrido en un solo batch
        agregarAreasExploradasBatch(localRotationAreasRef.current);
        localRotationAreasRef.current = [];
        lastRotationQuantizedRef.current = null;
      } else {
        // Sin movimiento → tratar como clic derecho → abrir menú contextual
        setContextMenu({
          posicionId: drag.posicionId,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [configurarVisionToken, agregarAreasExploradasBatch]);

  return {
    // Estado
    nieblaEstado,
    setNieblaEstado,
    contextMenu,
    setContextMenu,
    visionArcTarget,
    setVisionArcTarget,
    liveRotationRef,
    // Referencias para uso en el Stage
    draggingTokenRef,
    fogLayerRef,
    localPathRef,
    pendingAreasRef,
    confirmedAreaIdsRef,
    lastDragCellRef,
    rotationDragRef,
    exploredBitmapRef,
    // Callback para el hook de realtime
    handleNieblaChanged,
  };
}
