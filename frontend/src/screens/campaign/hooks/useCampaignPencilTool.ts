import type Konva from "konva";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type {
  DrawingCreatePayload,
  DrawingItem,
  DrawingLayer,
  DrawingPoint,
} from "./useWebSocketDrawings";
import {
  type PencilShape,
  PENCIL_FLUSH_MS,
  getWorldPointer,
  intersectsDrawing,
} from "../campaignPencilUtils";

interface UseCampaignPencilToolArgs {
  enabled: boolean;
  stageRef: RefObject<Konva.Stage | null>;
  selectedLayer: DrawingLayer;
  pestanaId: number | null;
  drawings: DrawingItem[];
  onCompleteDrawing: (drawing: DrawingCreatePayload) => void;
  onEraseDrawing: (drawingId: number) => void;
}

export function useCampaignPencilTool({
  enabled,
  stageRef,
  selectedLayer,
  pestanaId,
  drawings,
  onCompleteDrawing,
  onEraseDrawing,
}: UseCampaignPencilToolArgs) {
  const [selectedShape, setSelectedShape] = useState<PencilShape>("pencil");
  const [strokeColor, setStrokeColor] = useState<string>("#ffffff");
  const [fillEnabled, setFillEnabled] = useState<boolean>(false);
  const [showSelector, setShowSelector] = useState(false);
  const [activeDrawing, setActiveDrawing] =
    useState<DrawingCreatePayload | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const deletedDuringDragRef = useRef<Set<number>>(new Set());

  // Refs para el auto-flush (evitan stale-closures en el interval)
  const activeDrawingRef = useRef<DrawingCreatePayload | null>(null);
  const onCompleteDrawingRef = useRef(onCompleteDrawing);
  const autoFlushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    activeDrawingRef.current = activeDrawing;
  }, [activeDrawing]);

  useEffect(() => {
    onCompleteDrawingRef.current = onCompleteDrawing;
  }, [onCompleteDrawing]);

  const stopAutoFlush = useCallback(() => {
    if (autoFlushIntervalRef.current !== null) {
      clearInterval(autoFlushIntervalRef.current);
      autoFlushIntervalRef.current = null;
    }
  }, []);

  const startAutoFlush = useCallback(() => {
    stopAutoFlush();
    autoFlushIntervalRef.current = setInterval(() => {
      const current = activeDrawingRef.current;
      if (!current || current.tipo !== "pencil" || current.puntos.length < 2)
        return;
      // Guardar el segmento actual
      onCompleteDrawingRef.current(current);
      // Iniciar nuevo segmento desde el último punto
      const lastPoint = current.puntos[current.puntos.length - 1];
      setActiveDrawing({ ...current, puntos: [lastPoint, lastPoint] });
    }, PENCIL_FLUSH_MS);
  }, [stopAutoFlush]);

  useEffect(() => {
    if (!enabled) {
      setShowSelector(false);
      stopAutoFlush();
    } else {
      setShowSelector(true);
    }
    return () => {
      stopAutoFlush();
    };
  }, [enabled, stopAutoFlush]);

  const eraseAtPointer = useCallback(
    (pointer: DrawingPoint) => {
      for (const drawing of drawings) {
        if (drawing.capa !== selectedLayer) continue;
        if (deletedDuringDragRef.current.has(drawing.id)) continue;
        if (!intersectsDrawing(pointer, drawing)) continue;
        deletedDuringDragRef.current.add(drawing.id);
        onEraseDrawing(drawing.id);
        break;
      }
    },
    [drawings, selectedLayer, onEraseDrawing],
  );

  const handleMouseDown = useCallback(() => {
    if (!enabled || !pestanaId) return false;

    const stage = stageRef.current;
    if (!stage) return false;

    const startPoint = getWorldPointer(stage);
    if (!startPoint) return false;

    if (selectedShape === "eraser") {
      setIsErasing(true);
      deletedDuringDragRef.current.clear();
      eraseAtPointer(startPoint);
      return true;
    }

    setActiveDrawing({
      pestanaId,
      capa: selectedLayer,
      tipo: selectedShape,
      color: strokeColor,
      relleno: fillEnabled,
      puntos: [startPoint, startPoint],
    });

    // Activar auto-flush solo para trazos de lápiz libre
    if (selectedShape === "pencil") startAutoFlush();

    return true;
  }, [
    enabled,
    pestanaId,
    stageRef,
    selectedLayer,
    selectedShape,
    strokeColor,
    fillEnabled,
    eraseAtPointer,
    startAutoFlush,
  ]);

  const handleMouseMove = useCallback(() => {
    if (!enabled) return;

    const stage = stageRef.current;
    if (!stage) return;

    const currentPoint = getWorldPointer(stage);
    if (!currentPoint) return;

    if (selectedShape === "eraser" && isErasing) {
      eraseAtPointer(currentPoint);
      return;
    }

    if (!activeDrawing) return;

    setActiveDrawing((previous) => {
      if (!previous) return previous;

      if (previous.tipo === "pencil") {
        return { ...previous, puntos: [...previous.puntos, currentPoint] };
      }

      return { ...previous, puntos: [previous.puntos[0], currentPoint] };
    });
  }, [
    enabled,
    activeDrawing,
    stageRef,
    selectedShape,
    isErasing,
    eraseAtPointer,
  ]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    if (selectedShape === "eraser") {
      setIsErasing(false);
      deletedDuringDragRef.current.clear();
      return;
    }

    // Detener el auto-flush antes de completar el trazo final
    stopAutoFlush();

    if (!activeDrawing) return;

    if (activeDrawing.puntos.length >= 2) {
      onCompleteDrawing(activeDrawing);
    }

    setActiveDrawing(null);
  }, [enabled, activeDrawing, onCompleteDrawing, selectedShape, stopAutoFlush]);

  return {
    selectedShape,
    setSelectedShape,
    strokeColor,
    setStrokeColor,
    fillEnabled,
    setFillEnabled,
    previewDrawing: activeDrawing,
    showSelector,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
