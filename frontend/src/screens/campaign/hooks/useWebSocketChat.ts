import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl, buildWebSocketUrl } from "../../../lib/api";

interface WebSocketChatMessage {
  id: number;
  username: string;
  mensaje: string;
  enviadoEn: string;
}

interface PlayersList {
  players: Array<{
    username: string;
    dm: boolean;
  }>;
}

type PlayersApiResponse = PlayersList | PlayersList["players"];

interface UseWebSocketChatOptions {
  campaignId: number;
  username: string;
  onNewMessage?: (message: WebSocketChatMessage) => void;
  onPlayersUpdate?: (players: PlayersList) => void;
  onError?: (error: string) => void;
}

const RECONNECT_DELAY_MS = 3000;

function buildAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const useWebSocketChat = ({
  campaignId,
  username,
  onNewMessage,
  onPlayersUpdate,
  onError,
}: UseWebSocketChatOptions) => {
  void username;

  const [isConnected, setIsConnected] = useState(false);
  const onNewMessageRef = useRef(onNewMessage);
  const onPlayersUpdateRef = useRef(onPlayersUpdate);
  const onErrorRef = useRef(onError);
  const seenMessageIdsRef = useRef<Set<number>>(new Set());
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onPlayersUpdateRef.current = onPlayersUpdate;
    onErrorRef.current = onError;
  }, [onNewMessage, onPlayersUpdate, onError]);

  const emitMessages = useCallback((messages: WebSocketChatMessage[]) => {
    const sorted = [...messages].sort((left, right) => left.id - right.id);
    for (const message of sorted) {
      if (seenMessageIdsRef.current.has(message.id)) {
        continue;
      }

      seenMessageIdsRef.current.add(message.id);
      onNewMessageRef.current?.(message);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      throw new Error("No hay sesión activa para cargar el chat.");
    }

    const response = await fetch(
      buildApiUrl(`/api/campanas/${campaignId}/chat`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("No se pudieron cargar los mensajes del chat.");
    }

    const messages = (await response.json()) as WebSocketChatMessage[];
    emitMessages(messages);
  }, [campaignId, emitMessages]);

  const fetchPlayers = useCallback(async () => {
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      throw new Error("No hay sesión activa para cargar jugadores.");
    }

    const response = await fetch(
      buildApiUrl(`/api/campanas/${campaignId}/jugadores`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("No se pudo cargar la lista de jugadores.");
    }

    const payload = (await response.json()) as PlayersApiResponse;
    const normalizedPlayers = Array.isArray(payload)
      ? payload
      : payload.players;

    onPlayersUpdateRef.current?.({
      players: normalizedPlayers,
    });
  }, [campaignId]);

  const parseAndEmitPlayers = useCallback((rawPayload: unknown) => {
    if (rawPayload == null) {
      return;
    }

    const payload = rawPayload as PlayersApiResponse;
    const players = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.players)
        ? payload.players
        : [];

    onPlayersUpdateRef.current?.({ players });
  }, []);

  const handleChatFrame = useCallback(
    (frame: IMessage) => {
      try {
        const parsedPayload = JSON.parse(frame.body) as
          | WebSocketChatMessage
          | WebSocketChatMessage[];
        const messages = Array.isArray(parsedPayload)
          ? parsedPayload
          : [parsedPayload];
        emitMessages(messages);
      } catch {
        onErrorRef.current?.(
          "No se pudo parsear un mensaje del chat en tiempo real.",
        );
      }
    },
    [emitMessages],
  );

  const handlePlayersFrame = useCallback(
    (frame: IMessage) => {
      try {
        const parsedPayload = JSON.parse(frame.body) as PlayersApiResponse;
        parseAndEmitPlayers(parsedPayload);
      } catch {
        onErrorRef.current?.(
          "No se pudo parsear la actualización de jugadores.",
        );
      }
    },
    [parseAndEmitPlayers],
  );

  useEffect(() => {
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      return;
    }

    seenMessageIdsRef.current = new Set<number>();
    let isDisposed = false;

    const initializeData = async () => {
      try {
        await Promise.all([fetchMessages(), fetchPlayers()]);
      } catch (error) {
        if (!isDisposed) {
          onErrorRef.current?.((error as Error).message);
        }
      }
    };

    void initializeData();

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      onErrorRef.current?.(
        "No hay sesión activa para conectar el chat en tiempo real.",
      );
      return () => {
        isDisposed = true;
        setIsConnected(false);
      };
    }

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
        client.subscribe(`/topic/campanas/${campaignId}/chat`, handleChatFrame),
        client.subscribe(
          `/topic/campanas/${campaignId}/jugadores`,
          handlePlayersFrame,
        ),
      ];

      void initializeData();
    };

    client.onWebSocketClose = () => {
      if (!isDisposed) {
        setIsConnected(false);
      }
    };

    client.onWebSocketError = () => {
      if (!isDisposed) {
        onErrorRef.current?.("Se perdió la conexión WebSocket.");
      }
    };

    client.onStompError = (frame) => {
      if (!isDisposed) {
        onErrorRef.current?.(
          frame.headers["message"] ?? "Error del broker WebSocket.",
        );
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
  }, [
    campaignId,
    fetchMessages,
    fetchPlayers,
    handleChatFrame,
    handlePlayersFrame,
  ]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed) {
        return;
      }

      if (!Number.isFinite(campaignId) || campaignId <= 0) {
        throw new Error("La campaña no es válida.");
      }

      const token = localStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("No hay sesión activa para enviar mensajes.");
      }

      const stompClient = stompClientRef.current;
      if (stompClient?.connected) {
        stompClient.publish({
          destination: `/app/campanas/${campaignId}/chat/enviar`,
          body: JSON.stringify({ mensaje: trimmed }),
        });
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/campanas/${campaignId}/chat`),
        {
          method: "POST",
          headers: buildAuthHeaders(token),
          body: JSON.stringify({ mensaje: trimmed }),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo enviar el mensaje.");
      }

      const createdMessage = (await response.json()) as WebSocketChatMessage;
      emitMessages([createdMessage]);
      await fetchPlayers();
    },
    [campaignId, emitMessages, fetchPlayers],
  );

  return {
    isConnected,
    sendMessage,
  };
};
