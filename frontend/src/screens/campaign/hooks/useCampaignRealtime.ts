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

interface CharacterUpdatePayload {
  personajeId?: number;
  accion?: string;
}

export interface IniciativaEntrada {
  personajeId: number;
  nombre: string;
  retrato?: string | null;
  tirada: number;
  bonificacion: number;
  total: number;
}

export interface IniciativaEstado {
  activa: boolean;
  entradas: IniciativaEntrada[];
}

export type VisionArcType = "cone" | "semicircle" | "rectangle";

export interface VisionConfig {
  posicionId: number;
  revelaArea: boolean;
  arcType: VisionArcType;
  radius: number;
  apertura: number;
  rotation: number;
  angle: number;
  length: number;
  width: number;
  height: number;
}

export interface ExploredArea {
  id: string;
  posicionX: number;
  posicionY: number;
  arcType: VisionArcType;
  radius: number;
  apertura: number;
  rotation: number;
  angle: number;
  length: number;
  width: number;
  height: number;
  tokenSize?: number;
}

export interface NieblaEstado {
  pestanaId?: number | null;
  activa: boolean;
  zonasExploradas: boolean;
  vistaJugador: boolean;
  visionConfigs: VisionConfig[];
  exploredAreas: ExploredArea[];
}

interface CambioPestañaPayload {
  pestanaId: number;
  jugadores: string[] | null;
}

export interface PestanaConfigPayload {
  pestanaId: number;
  nCuadriculasX: number;
  nCuadriculasY: number;
  distanciaCasilla: number;
  sistemaMetrico: string;
}

interface UseCampaignRealtimeOptions {
  campaignId: number | null | undefined;
  pestanaId: number | null;
  onPosicionCreated?: (posicion: PosicionData) => void;
  onPosicionDeleted?: (posicionId: number) => void;
  onMapLayerChanged?: (payload: MapLayerPayload) => void;
  onCharacterUpdated?: (characterId: number) => void;
  onIniciativaChanged?: (estado: IniciativaEstado) => void;
  onNieblaChanged?: (estado: NieblaEstado) => void;
  onCambioPestañaForzado?: (
    pestanaId: number,
    jugadores: string[] | null,
  ) => void;
  onConfigPestanaChanged?: (config: PestanaConfigPayload) => void;
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

export function useCampaignRealtime({
  campaignId,
  pestanaId,
  onPosicionCreated,
  onPosicionDeleted,
  onMapLayerChanged,
  onCharacterUpdated,
  onIniciativaChanged,
  onNieblaChanged,
  onCambioPestañaForzado,
  onConfigPestanaChanged,
}: UseCampaignRealtimeOptions) {
  const campaignIdValue = Number(campaignId ?? 0);
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  // Ref para que los closures del WebSocket siempre lean el pestanaId actual
  const pestanaIdRef = useRef<number | null>(pestanaId);
  useEffect(() => {
    pestanaIdRef.current = pestanaId;
  }, [pestanaId]);

  const addOrReplaceDrawing = useCallback((drawing: DrawingItem) => {
    setDrawings((previous) => {
      const withoutCurrent = previous.filter((item) => item.id !== drawing.id);
      return [...withoutCurrent, drawing].sort(
        (left, right) => left.id - right.id,
      );
    });
  }, []);

  const fetchInitialDrawings = useCallback(async () => {
    if (
      !Number.isFinite(campaignIdValue) ||
      campaignIdValue <= 0 ||
      !pestanaId
    ) {
      setDrawings([]);
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setDrawings([]);
      return;
    }

    const response = await fetch(
      buildApiUrl(
        `/api/campanas/${campaignIdValue}/dibujos?pestanaId=${pestanaId}`,
      ),
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
  }, [campaignIdValue, pestanaId]);

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
    if (!Number.isFinite(campaignIdValue) || campaignIdValue <= 0) {
      setDrawings([]);
      return;
    }

    void fetchInitialDrawings();
  }, [campaignIdValue, pestanaId, fetchInitialDrawings]);

  useEffect(() => {
    if (!Number.isFinite(campaignIdValue) || campaignIdValue <= 0) {
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
        campaignId: String(campaignIdValue),
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
          `/topic/campanas/${campaignIdValue}/posiciones`,
          (message: IMessage) => {
            try {
              const event: WebSocketPosicionEvent = JSON.parse(message.body);
              if (event.accion === "CREATED") {
                onPosicionCreated?.(event.posicion);
              } else if (event.accion === "DELETED") {
                onPosicionDeleted?.(event.posicionId);
              }
            } catch (error) {
              console.error(
                "Error parsing WebSocket positions message:",
                error,
              );
            }
          },
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/capas/mapa`,
          (message: IMessage) => {
            try {
              const payload = JSON.parse(message.body) as MapLayerPayload;
              onMapLayerChanged?.(payload);
            } catch (error) {
              console.error(
                "Error parsing map layer WebSocket message:",
                error,
              );
            }
          },
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/dibujos`,
          handleDrawingFrame,
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/personajes`,
          (message: IMessage) => {
            try {
              const payload = JSON.parse(
                message.body,
              ) as CharacterUpdatePayload;
              if (typeof payload.personajeId === "number") {
                onCharacterUpdated?.(payload.personajeId);
              }
            } catch (error) {
              console.error(
                "Error parsing character WebSocket message:",
                error,
              );
            }
          },
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/iniciativa`,
          (message: IMessage) => {
            try {
              const estado = JSON.parse(message.body) as IniciativaEstado;
              onIniciativaChanged?.(estado);
            } catch (error) {
              console.error(
                "Error parsing initiative WebSocket message:",
                error,
              );
            }
          },
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/niebla`,
          (message: IMessage) => {
            try {
              const estado = JSON.parse(message.body) as NieblaEstado;
              // Usar ref para obtener el pestanaId actual (evita closure stale)
              const currentPestanaId = pestanaIdRef.current;
              // Solo aplicar si el mensaje es para la pestaña actual
              if (
                estado.pestanaId != null &&
                currentPestanaId != null &&
                estado.pestanaId !== currentPestanaId
              ) {
                return;
              }
              onNieblaChanged?.(estado);
            } catch (error) {
              console.error("Error parsing niebla WebSocket message:", error);
            }
          },
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/pestana/cambio`,
          (message: IMessage) => {
            try {
              const payload = JSON.parse(message.body) as CambioPestañaPayload;
              onCambioPestañaForzado?.(payload.pestanaId, payload.jugadores);
            } catch (error) {
              console.error(
                "Error parsing cambio pestaña WebSocket message:",
                error,
              );
            }
          },
        ),
        client.subscribe(
          `/topic/campanas/${campaignIdValue}/pestana/config`,
          (message: IMessage) => {
            try {
              const config = JSON.parse(message.body) as PestanaConfigPayload;
              onConfigPestanaChanged?.(config);
            } catch (error) {
              console.error(
                "Error parsing pestaña config WebSocket message:",
                error,
              );
            }
          },
        ),
      ];

      // Solicitar el estado actual de niebla al conectarse (si ya se conoce la pestaña)
      if (pestanaId != null) {
        client.publish({
          destination: `/app/campanas/${campaignIdValue}/niebla/solicitar`,
          body: JSON.stringify({ pestanaId }),
          headers: { "content-type": "application/json" },
        });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pestanaId omitido intencionalmente: este efecto gestiona el ciclo de vida del WebSocket y no debe reconectarse al cambiar de pestaña; los cambios de pestaña los maneja el useEffect siguiente
  }, [
    campaignIdValue,
    handleDrawingFrame,
    onCambioPestañaForzado,
    onCharacterUpdated,
    onConfigPestanaChanged,
    onIniciativaChanged,
    onMapLayerChanged,
    onNieblaChanged,
    onPosicionCreated,
    onPosicionDeleted,
  ]);

  // Cuando cambia la pestaña activa, solicitar el estado de niebla de la nueva pestaña.
  // El WebSocket ya está conectado (no se reconecta), así que enviamos el solicitar manualmente.
  useEffect(() => {
    if (!pestanaId || !campaignIdValue) return;
    const client = stompClientRef.current;
    if (!client?.connected) return;
    client.publish({
      destination: `/app/campanas/${campaignIdValue}/niebla/solicitar`,
      body: JSON.stringify({ pestanaId }),
      headers: { "content-type": "application/json" },
    });
  }, [pestanaId, campaignIdValue]);

  const crearPosicionPorWebSocket = useCallback(
    (data: {
      pestanaId: number;
      capa: string;
      personajeId: number;
      posicionX: number;
      posicionY: number;
    }) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) {
        console.warn("WebSocket no conectado");
        return;
      }

      try {
        client.publish({
          destination: `/app/campanas/${campaignIdValue}/posiciones/crear`,
          body: JSON.stringify(data),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending position creation:", error);
      }
    },
    [campaignIdValue],
  );

  const moverPosicionPorWebSocket = useCallback(
    (posicionId: number, posicionX: number, posicionY: number) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) {
        console.warn("WebSocket no conectado");
        return;
      }

      try {
        client.publish({
          destination: `/app/campanas/${campaignIdValue}/posiciones/mover`,
          body: JSON.stringify({ posicionId, posicionX, posicionY }),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending position movement:", error);
      }
    },
    [campaignIdValue],
  );

  const asignarMapaPorWebSocket = useCallback(
    (data: { pestanaId: number; mapaId: number }) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) {
        console.warn("WebSocket no conectado");
        return;
      }

      try {
        client.publish({
          destination: `/app/campanas/${campaignIdValue}/capas/mapa/asignar`,
          body: JSON.stringify(data),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending map layer change:", error);
      }
    },
    [campaignIdValue],
  );

  const sendDrawing = useCallback(
    (payload: DrawingCreatePayload) => {
      const stompClient = stompClientRef.current;
      if (!stompClient?.connected) {
        throw new Error("No hay conexión WebSocket para enviar el dibujo.");
      }

      stompClient.publish({
        destination: `/app/campanas/${campaignIdValue}/dibujos/crear`,
        body: JSON.stringify(payload),
      });
    },
    [campaignIdValue],
  );

  const deleteDrawing = useCallback(
    (payload: DrawingDeletePayload) => {
      const stompClient = stompClientRef.current;
      if (!stompClient?.connected) {
        throw new Error("No hay conexión WebSocket para borrar el dibujo.");
      }

      stompClient.publish({
        destination: `/app/campanas/${campaignIdValue}/dibujos/borrar`,
        body: JSON.stringify(payload),
      });
    },
    [campaignIdValue],
  );

  const activarIniciativa = useCallback(
    (activa: boolean) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/iniciativa/activar`,
        body: JSON.stringify({ activa }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue],
  );

  const tirarIniciativa = useCallback(
    (
      personajeId: number,
      nombre: string,
      retrato: string | undefined | null,
      tirada: number,
      bonificacion: number,
    ) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/iniciativa/tirar`,
        body: JSON.stringify({
          personajeId,
          nombre,
          retrato: retrato ?? null,
          tirada,
          bonificacion,
        }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue],
  );

  const reordenarIniciativa = useCallback(
    (orden: number[]) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/iniciativa/reordenar`,
        body: JSON.stringify({ orden }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue],
  );

  const configurarNiebla = useCallback(
    (settings: {
      activa?: boolean;
      zonasExploradas?: boolean;
      vistaJugador?: boolean;
    }) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue || !pestanaId) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/niebla/configurar`,
        body: JSON.stringify({ ...settings, pestanaId }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue, pestanaId],
  );

  const configurarVisionToken = useCallback(
    (config: VisionConfig) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue || !pestanaId) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/niebla/vision`,
        body: JSON.stringify({ ...config, pestanaId }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue, pestanaId],
  );

  const agregarAreaExplorada = useCallback(
    (area: ExploredArea) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue || !pestanaId) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/niebla/explorar`,
        body: JSON.stringify({ ...area, pestanaId }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue, pestanaId],
  );

  /**
   * Versión batch: envía todas las áreas en UN solo mensaje para evitar la
   * race condition que ocurre al enviarlas de forma individual y simultánea.
   * Usar siempre que se vayan a enviar múltiples áreas a la vez (fin de drag,
   * fin de rotación).
   */
  const agregarAreasExploradasBatch = useCallback(
    (areas: ExploredArea[]) => {
      if (!areas.length) return;
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue || !pestanaId) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/niebla/explorar/batch`,
        body: JSON.stringify({ pestanaId, areas }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue, pestanaId],
  );

  const forzarCambioPestana = useCallback(
    (pestanaId: number, jugadores: string[] | null) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/pestana/cambio`,
        body: JSON.stringify({ pestanaId, jugadores }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue],
  );

  const eliminarPosicionPorWebSocket = useCallback(
    (posicionId: number) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) {
        console.warn("WebSocket no conectado");
        return;
      }
      try {
        client.publish({
          destination: `/app/campanas/${campaignIdValue}/posiciones/eliminar`,
          body: JSON.stringify({ posicionId }),
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending position deletion:", error);
      }
    },
    [campaignIdValue],
  );

  const cambiarCapaToken = useCallback(
    (posicionId: number, capa: string) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/posiciones/cambiarCapa`,
        body: JSON.stringify({ posicionId, capa }),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue],
  );

  const broadcastPestanaConfig = useCallback(
    (config: PestanaConfigPayload) => {
      const client = stompClientRef.current;
      if (!client?.connected || !campaignIdValue) return;
      client.publish({
        destination: `/app/campanas/${campaignIdValue}/pestana/config`,
        body: JSON.stringify(config),
        headers: { "content-type": "application/json" },
      });
    },
    [campaignIdValue],
  );

  return {
    drawings,
    isConnected,
    crearPosicionPorWebSocket,
    moverPosicionPorWebSocket,
    eliminarPosicionPorWebSocket,
    asignarMapaPorWebSocket,
    sendDrawing,
    deleteDrawing,
    activarIniciativa,
    tirarIniciativa,
    reordenarIniciativa,
    configurarNiebla,
    configurarVisionToken,
    agregarAreaExplorada,
    agregarAreasExploradasBatch,
    cambiarCapaToken,
    forzarCambioPestana,
    broadcastPestanaConfig,
  };
}
