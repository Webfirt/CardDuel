import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import type { Card } from "@/constants/gameTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnlineBattleCard {
  id: string;
  name: string;
  type: string;
  currentHp: number;
  maxHp: number;
  abilities: { name: string; damage: number }[];
}

export interface OnlineSlotState {
  cards: OnlineBattleCard[];
  activeIdx: number;
}

export interface OnlineGameState {
  p1: OnlineSlotState;
  p2: OnlineSlotState;
  turn: "p1" | "p2";
  log: string[];
  turnNumber: number;
}

export type MultiplayerStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "queued"
  | "in_battle"
  | "ended"
  | "error"
  | "disconnected";

export interface MultiplayerState {
  status: MultiplayerStatus;
  mySlot: "p1" | "p2" | null;
  opponentName: string;
  opponentLevel: number;
  gameState: OnlineGameState | null;
  winner: "p1" | "p2" | null;
  endReason: "ko" | "surrender" | "disconnect" | "timeout" | null;
  error: string | null;
  queuePosition: number;
}

// ─── WebSocket URL ────────────────────────────────────────────────────────────

function getWsUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/api/ws`;
  }
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `wss://${domain}/api/ws`;
  return "ws://localhost:8080/api/ws";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMultiplayer() {
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<MultiplayerState>({
    status: "idle",
    mySlot: null,
    opponentName: "",
    opponentLevel: 1,
    gameState: null,
    winner: null,
    endReason: null,
    error: null,
    queuePosition: 0,
  });

  function patch(update: Partial<MultiplayerState>) {
    setState(prev => ({ ...prev, ...update }));
  }

  const disconnect = useCallback(() => {
    if (pingRef.current) clearInterval(pingRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    patch({ status: "idle", gameState: null, mySlot: null });
  }, []);

  const connect = useCallback((
    playerId: string,
    username: string,
    level: number,
    cards: Card[],
  ) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    patch({ status: "connecting", error: null });

    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      patch({ status: "connected" });

      // Keep-alive ping every 25s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 25_000);

      // Immediately join queue
      ws.send(JSON.stringify({
        type: "JOIN_QUEUE",
        playerId,
        username,
        level,
        cards,
      }));
    };

    ws.onmessage = (event) => {
      let msg: { type: string; [k: string]: unknown };
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case "CONNECTED":
          break;

        case "QUEUE_JOINED":
          patch({ status: "queued", queuePosition: Number(msg.position ?? 1) });
          break;

        case "QUEUE_LEFT":
          patch({ status: "connected" });
          break;

        case "MATCH_FOUND":
          patch({
            status: "in_battle",
            mySlot: msg.mySlot as "p1" | "p2",
            opponentName: String(msg.opponentName ?? "Opponent"),
            opponentLevel: Number(msg.opponentLevel ?? 1),
            gameState: msg.gameState as OnlineGameState,
          });
          break;

        case "GAME_STATE_UPDATE":
          patch({ gameState: msg.gameState as OnlineGameState });
          break;

        case "GAME_OVER":
          patch({
            status: "ended",
            winner: msg.winner as "p1" | "p2" | null,
            endReason: msg.reason as MultiplayerState["endReason"],
          });
          if (pingRef.current) clearInterval(pingRef.current);
          break;

        case "OPPONENT_DISCONNECTED":
          patch({ error: "Opponent disconnected" });
          break;

        case "QUEUE_TIMEOUT":
          patch({ status: "error", error: "Queue timed out. Please try again." });
          break;

        case "ERROR":
          patch({ error: String(msg.message ?? "Unknown error") });
          break;

        case "PONG":
          break;
      }
    };

    ws.onerror = () => {
      patch({ status: "error", error: "Connection failed. Check your network." });
    };

    ws.onclose = () => {
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current = null;
      setState(prev => {
        if (prev.status === "in_battle") {
          return { ...prev, status: "ended", endReason: "disconnect", winner: null };
        }
        if (prev.status !== "ended" && prev.status !== "idle") {
          return { ...prev, status: "disconnected" };
        }
        return prev;
      });
    };
  }, []);

  const leaveQueue = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "LEAVE_QUEUE" }));
    patch({ status: "connected" });
  }, []);

  const playMove = useCallback((abilityIdx: number) => {
    wsRef.current?.send(JSON.stringify({ type: "PLAY_MOVE", abilityIdx }));
  }, []);

  const surrender = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "SURRENDER" }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const isMyTurn =
    state.status === "in_battle" &&
    state.gameState?.turn === state.mySlot;

  return {
    ...state,
    isMyTurn,
    connect,
    disconnect,
    leaveQueue,
    playMove,
    surrender,
  };
}
