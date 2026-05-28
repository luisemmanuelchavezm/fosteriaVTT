import { Client, type IMessage } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildWebSocketUrl } from "../lib/api";

interface WebSocketPosicionEvent {
  accion: string;
  posicionId: number;
  posicion: PosicionData;
}

interface PosicionData {
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

interface MapLayerPayload {
  pestanaId: number;
  mapaId: number;
  mapaUrl?: string | null;
}

interface UseWebSocketPositionsOptions {
  campaignId: number | null | undefined;
  onPosicionCreated?: (posicion: PosicionData) => void;
  onPosicionMoved?: (posicion: PosicionData) => void;
  onMapLayerChanged?: (payload: MapLayerPayload) => void;
}

const RECONNECT_DELAY_MS = 3000;

export function useWebSocketPositions({
  campaignId,
  onPosicionCreated,
  onPosicionMoved,
  onMapLayerChanged,
}: UseWebSocketPositionsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  const crearPosicionPorWebSocket = useCallback(
    (data: {
      pestanaId: number;
      capa: string;
      personajeId: number;
      posicionX: number;
      posicionY: number;
    }) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignId) {
        console.warn("WebSocket no conectado");
        return;
      }

      try {
        client.publish({
          destination: `/app/campanas/${campaignId}/posiciones/crear`,
          body: JSON.stringify(data),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending position creation:", error);
      }
    },
    [campaignId],
  );

  const moverPosicionPorWebSocket = useCallback(
    (posicionId: number, posicionX: number, posicionY: number) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignId) {
        console.warn("WebSocket no conectado");
        return;
      }

      try {
        client.publish({
          destination: `/app/campanas/${campaignId}/posiciones/mover`,
          body: JSON.stringify({
            posicionId,
            posicionX,
            posicionY,
          }),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending position movement:", error);
      }
    },
    [campaignId],
  );

  const asignarMapaPorWebSocket = useCallback(
    (data: { pestanaId: number; mapaId: number }) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignId) {
        console.warn("WebSocket no conectado");
        return;
      }

      try {
        client.publish({
          destination: `/app/campanas/${campaignId}/capas/mapa/asignar`,
          body: JSON.stringify(data),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending map layer change:", error);
      }
    },
    [campaignId],
  );

  useEffect(() => {
    if (!Number.isFinite(campaignId) || !campaignId || campaignId <= 0) {
      setIsConnected(false);
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

      client.subscribe(
        `/topic/campanas/${campaignId}/posiciones`,
        (message: IMessage) => {
          try {
            const event: WebSocketPosicionEvent = JSON.parse(message.body);
            if (event.accion === "CREATED") {
              onPosicionCreated?.(event.posicion);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        },
      );

      client.subscribe(
        `/topic/campanas/${campaignId}/capas/mapa`,
        (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body) as MapLayerPayload;
            onMapLayerChanged?.(payload);
          } catch (error) {
            console.error("Error parsing map layer WebSocket message:", error);
          }
        },
      );
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
    void client.activate();

    return () => {
      isDisposed = true;
      if (stompClientRef.current?.connected) {
        void stompClientRef.current.deactivate();
      }
    };
  }, [campaignId, onMapLayerChanged, onPosicionCreated, onPosicionMoved]);

  return {
    crearPosicionPorWebSocket,
    moverPosicionPorWebSocket,
    asignarMapaPorWebSocket,
    isConnected,
  };
}
