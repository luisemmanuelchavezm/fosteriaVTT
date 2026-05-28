import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl, buildWebSocketUrl } from "../../../lib/api";

export type DrawingLayer = "fichas" | "mapa" | "dm";
export type DrawingType =
  | "pencil"
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "eraser";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingItem {
  id: number;
  pestanaId: number;
  capa: DrawingLayer;
  tipo: DrawingType;
  color: string;
  relleno: boolean;
  largo: number | null;
  ancho: number | null;
  puntos: DrawingPoint[];
  actualizadoEn: string;
}

export interface DrawingCreatePayload {
  pestanaId: number;
  capa: DrawingLayer;
  tipo: Exclude<DrawingType, "eraser">;
  color: string;
  relleno: boolean;
  puntos: DrawingPoint[];
}

export interface DrawingDeletePayload {
  pestanaId: number;
  capa: DrawingLayer;
  dibujoId: number;
}

interface DrawingEventPayload {
  accion?: string;
  dibujoId?: number;
  dibujo?: unknown;
}

interface UseWebSocketDrawingsOptions {
  campaignId: number;
  pestanaId: number | null;
}

const RECONNECT_DELAY_MS = 3000;

function normalizeDrawing(raw: unknown): DrawingItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Partial<DrawingItem>;
  if (
    typeof item.id !== "number" ||
    typeof item.pestanaId !== "number" ||
    typeof item.capa !== "string" ||
    typeof item.tipo !== "string" ||
    typeof item.color !== "string" ||
    typeof item.relleno !== "boolean" ||
    !Array.isArray(item.puntos)
  ) {
    return null;
  }

  const normalizedPoints = item.puntos
    .map((point) => {
      const parsed = point as Partial<DrawingPoint>;
      if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
        return null;
      }
      return { x: parsed.x, y: parsed.y };
    })
    .filter((point): point is DrawingPoint => point !== null);

  if (normalizedPoints.length < 2) {
    return null;
  }

  return {
    id: item.id,
    pestanaId: item.pestanaId,
    capa: item.capa as DrawingLayer,
    tipo: item.tipo as DrawingType,
    color: item.color,
    relleno: item.relleno,
    largo: typeof item.largo === "number" ? item.largo : null,
    ancho: typeof item.ancho === "number" ? item.ancho : null,
    puntos: normalizedPoints,
    actualizadoEn:
      typeof item.actualizadoEn === "string" ? item.actualizadoEn : "",
  };
}

export function useWebSocketDrawings({
  campaignId,
  pestanaId,
}: UseWebSocketDrawingsOptions) {
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  const addOrReplaceDrawing = useCallback((drawing: DrawingItem) => {
    setDrawings((previous) => {
      const withoutCurrent = previous.filter((item) => item.id !== drawing.id);
      return [...withoutCurrent, drawing].sort(
        (left, right) => left.id - right.id,
      );
    });
  }, []);

  const fetchInitialDrawings = useCallback(async () => {
    if (!Number.isFinite(campaignId) || campaignId <= 0 || !pestanaId) {
      setDrawings([]);
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setDrawings([]);
      return;
    }

    const response = await fetch(
      buildApiUrl(`/api/campanas/${campaignId}/dibujos?pestanaId=${pestanaId}`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("No se pudieron cargar los dibujos de la pestaña.");
    }

    const payload = (await response.json()) as unknown[];
    const parsed = payload
      .map(normalizeDrawing)
      .filter((item): item is DrawingItem => item !== null);

    setDrawings(parsed.sort((left, right) => left.id - right.id));
  }, [campaignId, pestanaId]);

  const handleDrawingFrame = useCallback(
    (frame: IMessage) => {
      try {
        const raw = JSON.parse(frame.body) as DrawingEventPayload | unknown;
        const maybeEvent = raw as DrawingEventPayload;
        const action =
          typeof maybeEvent.accion === "string"
            ? maybeEvent.accion.toUpperCase()
            : "";

        if (action === "DELETED" && typeof maybeEvent.dibujoId === "number") {
          setDrawings((previous) =>
            previous.filter((item) => item.id !== maybeEvent.dibujoId),
          );
          return;
        }

        const parsedFromEvent = normalizeDrawing(maybeEvent.dibujo ?? raw);
        if (!parsedFromEvent) {
          return;
        }

        if (pestanaId && parsedFromEvent.pestanaId !== pestanaId) {
          return;
        }

        addOrReplaceDrawing(parsedFromEvent);
      } catch {
        // Ignorar frames corruptos para no romper la sesión
      }
    },
    [addOrReplaceDrawing, pestanaId],
  );

  useEffect(() => {
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      setDrawings([]);
      return;
    }

    void fetchInitialDrawings();
  }, [campaignId, pestanaId, fetchInitialDrawings]);

  useEffect(() => {
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setIsConnected(false);
      return;
    }

    let isDisposed = false;

    const client = new Client({
      brokerURL: buildWebSocketUrl("/ws"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        campaignId: String(campaignId),
      },
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      if (isDisposed) {
        return;
      }

      setIsConnected(true);
      subscriptionsRef.current = [
        client.subscribe(
          `/topic/campanas/${campaignId}/dibujos`,
          handleDrawingFrame,
        ),
      ];
    };

    client.onWebSocketClose = () => {
      if (!isDisposed) {
        setIsConnected(false);
      }
    };

    client.onWebSocketError = () => {
      if (!isDisposed) {
        setIsConnected(false);
      }
    };

    client.onStompError = () => {
      if (!isDisposed) {
        setIsConnected(false);
      }
    };

    stompClientRef.current = client;
    client.activate();

    return () => {
      isDisposed = true;
      setIsConnected(false);

      for (const subscription of subscriptionsRef.current) {
        subscription.unsubscribe();
      }
      subscriptionsRef.current = [];

      const stompClient = stompClientRef.current;
      stompClientRef.current = null;
      if (stompClient) {
        void stompClient.deactivate();
      }
    };
  }, [campaignId, handleDrawingFrame]);

  const sendDrawing = useCallback(
    (payload: DrawingCreatePayload) => {
      const stompClient = stompClientRef.current;
      if (!stompClient?.connected) {
        throw new Error("No hay conexión WebSocket para enviar el dibujo.");
      }

      stompClient.publish({
        destination: `/app/campanas/${campaignId}/dibujos/crear`,
        body: JSON.stringify(payload),
      });
    },
    [campaignId],
  );

  const deleteDrawing = useCallback(
    (payload: DrawingDeletePayload) => {
      const stompClient = stompClientRef.current;
      if (!stompClient?.connected) {
        throw new Error("No hay conexión WebSocket para borrar el dibujo.");
      }

      stompClient.publish({
        destination: `/app/campanas/${campaignId}/dibujos/borrar`,
        body: JSON.stringify(payload),
      });
    },
    [campaignId],
  );

  return {
    drawings,
    isConnected,
    sendDrawing,
    deleteDrawing,
  };
}
