import { IncomingMessage, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "./lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ability {
  name: string;
  damage: number;
}

interface BattleCard {
  id: string;
  name: string;
  type: string;
  currentHp: number;
  maxHp: number;
  abilities: Ability[];
}

interface SlotState {
  cards: BattleCard[];
  activeIdx: number;
}

interface GameState {
  p1: SlotState;
  p2: SlotState;
  turn: "p1" | "p2";
  log: string[];
  turnNumber: number;
}

interface QueuedPlayer {
  ws: WebSocket;
  playerId: string;
  username: string;
  level: number;
  cards: BattleCard[];
  enqueuedAt: number;
}

interface RoomPlayer extends QueuedPlayer {
  slot: "p1" | "p2";
  roomId: string;
}

interface GameRoom {
  id: string;
  p1: RoomPlayer;
  p2: RoomPlayer;
  state: GameState;
  createdAt: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

const queue: QueuedPlayer[] = [];
const rooms = new Map<string, GameRoom>();
const playerRoom = new Map<WebSocket, string>(); // ws → roomId

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function send(ws: WebSocket, type: string, payload: unknown = {}) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function broadcast(room: GameRoom, type: string, payload: unknown = {}) {
  send(room.p1.ws, type, payload);
  send(room.p2.ws, type, payload);
}

function sanitizeCards(raw: unknown[]): BattleCard[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 3).map((c: any) => ({
    id: String(c.id ?? genId()),
    name: String(c.name ?? "Unknown"),
    type: String(c.type ?? "colorless"),
    currentHp: Number(c.hp ?? c.currentHp ?? 60),
    maxHp: Number(c.maxHp ?? c.hp ?? 60),
    abilities: Array.isArray(c.abilities)
      ? c.abilities.slice(0, 2).map((a: any) => ({
          name: String(a.name ?? "Attack"),
          damage: Math.min(Math.max(Number(a.damage ?? 20), 5), 150),
        }))
      : [{ name: "Attack", damage: 20 }],
  }));
}

function buildGameState(p1Cards: BattleCard[], p2Cards: BattleCard[]): GameState {
  return {
    p1: { cards: p1Cards, activeIdx: 0 },
    p2: { cards: p2Cards, activeIdx: 0 },
    turn: "p1",
    log: ["Battle started! P1 goes first."],
    turnNumber: 1,
  };
}

function nextAlive(cards: BattleCard[], skip: number): number {
  const idx = cards.findIndex((c, i) => i !== skip && c.currentHp > 0);
  return idx;
}

function allDefeated(cards: BattleCard[]): boolean {
  return cards.every(c => c.currentHp <= 0);
}

// ─── Matchmaking ─────────────────────────────────────────────────────────────

function tryMatch() {
  if (queue.length < 2) return;

  const a = queue.shift()!;
  const b = queue.shift()!;

  const roomId = genId();

  const p1: RoomPlayer = { ...a, slot: "p1", roomId };
  const p2: RoomPlayer = { ...b, slot: "p2", roomId };

  const state = buildGameState(a.cards, b.cards);

  const room: GameRoom = { id: roomId, p1, p2, state, createdAt: Date.now() };
  rooms.set(roomId, room);
  playerRoom.set(a.ws, roomId);
  playerRoom.set(b.ws, roomId);

  logger.info({ roomId, p1: a.username, p2: b.username }, "Match created");

  send(a.ws, "MATCH_FOUND", {
    roomId,
    mySlot: "p1",
    opponentName: b.username,
    opponentLevel: b.level,
    gameState: state,
  });
  send(b.ws, "MATCH_FOUND", {
    roomId,
    mySlot: "p2",
    opponentName: a.username,
    opponentLevel: a.level,
    gameState: state,
  });
}

// ─── Move Processing ──────────────────────────────────────────────────────────

function processMove(
  room: GameRoom,
  attackerSlot: "p1" | "p2",
  abilityIdx: number,
): { gameOver: boolean; winner: "p1" | "p2" | null } {
  const gs = room.state;

  if (gs.turn !== attackerSlot) {
    return { gameOver: false, winner: null };
  }

  const defenderSlot: "p1" | "p2" = attackerSlot === "p1" ? "p2" : "p1";
  const attacker = gs[attackerSlot];
  const defender = gs[defenderSlot];

  const activeAttacker = attacker.cards[attacker.activeIdx];
  const activeDefender = defender.cards[defender.activeIdx];

  if (!activeAttacker || !activeDefender) return { gameOver: false, winner: null };

  const ability = activeAttacker.abilities[abilityIdx] ?? activeAttacker.abilities[0];
  if (!ability) return { gameOver: false, winner: null };

  // Apply damage
  const dmg = ability.damage;
  activeDefender.currentHp = Math.max(0, activeDefender.currentHp - dmg);

  gs.log.unshift(
    `${activeAttacker.name} used ${ability.name}! (${dmg} dmg → ${activeDefender.name})`
  );

  // Check KO
  if (activeDefender.currentHp <= 0) {
    gs.log.unshift(`${activeDefender.name} was knocked out!`);

    if (allDefeated(defender.cards)) {
      gs.log.unshift(`${attackerSlot.toUpperCase()} wins the battle!`);
      return { gameOver: true, winner: attackerSlot };
    }

    // Advance to next alive card
    const next = nextAlive(defender.cards, defender.activeIdx);
    if (next !== -1) {
      defender.activeIdx = next;
      gs.log.unshift(`${defenderSlot.toUpperCase()} sends out ${defender.cards[next].name}!`);
    }
  }

  // Switch turn
  gs.turn = defenderSlot;
  gs.turnNumber++;
  gs.log = gs.log.slice(0, 20); // keep log bounded

  return { gameOver: false, winner: null };
}

// ─── Disconnect Handling ─────────────────────────────────────────────────────

function handleDisconnect(ws: WebSocket) {
  // Remove from queue
  const qIdx = queue.findIndex(p => p.ws === ws);
  if (qIdx !== -1) {
    queue.splice(qIdx, 1);
    return;
  }

  // Remove from room
  const roomId = playerRoom.get(ws);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const opponent = room.p1.ws === ws ? room.p2.ws : room.p1.ws;
  send(opponent, "OPPONENT_DISCONNECTED", {});
  send(opponent, "GAME_OVER", { winner: room.p1.ws === ws ? "p2" : "p1", reason: "disconnect" });

  playerRoom.delete(room.p1.ws);
  playerRoom.delete(room.p2.ws);
  rooms.delete(roomId);

  logger.info({ roomId }, "Room closed due to disconnect");
}

// ─── Message Handler ──────────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, raw: string) {
  let msg: { type: string; [k: string]: unknown };
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  switch (msg.type) {
    case "JOIN_QUEUE": {
      // Don't double-queue
      if (queue.some(p => p.ws === ws) || playerRoom.has(ws)) {
        send(ws, "ERROR", { message: "Already in queue or in game" });
        return;
      }

      const cards = sanitizeCards((msg.cards as unknown[]) ?? []);
      if (cards.length < 1) {
        send(ws, "ERROR", { message: "No valid cards provided" });
        return;
      }

      const player: QueuedPlayer = {
        ws,
        playerId: String(msg.playerId ?? genId()),
        username: String(msg.username ?? "Player"),
        level: Number(msg.level ?? 1),
        cards,
        enqueuedAt: Date.now(),
      };

      queue.push(player);
      send(ws, "QUEUE_JOINED", { position: queue.length });
      logger.info({ username: player.username, queueSize: queue.length }, "Player joined queue");

      tryMatch();
      break;
    }

    case "LEAVE_QUEUE": {
      const idx = queue.findIndex(p => p.ws === ws);
      if (idx !== -1) {
        queue.splice(idx, 1);
        send(ws, "QUEUE_LEFT", {});
      }
      break;
    }

    case "PLAY_MOVE": {
      const roomId = playerRoom.get(ws);
      if (!roomId) { send(ws, "ERROR", { message: "Not in a game" }); return; }

      const room = rooms.get(roomId);
      if (!room) return;

      const slot: "p1" | "p2" = room.p1.ws === ws ? "p1" : "p2";
      const abilityIdx = Number(msg.abilityIdx ?? 0);

      const { gameOver, winner } = processMove(room, slot, abilityIdx);

      broadcast(room, "GAME_STATE_UPDATE", { gameState: room.state });

      if (gameOver && winner) {
        broadcast(room, "GAME_OVER", { winner, reason: "ko" });
        playerRoom.delete(room.p1.ws);
        playerRoom.delete(room.p2.ws);
        rooms.delete(roomId);
        logger.info({ roomId, winner }, "Game over");
      }
      break;
    }

    case "SURRENDER": {
      const roomId = playerRoom.get(ws);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const winner: "p1" | "p2" = room.p1.ws === ws ? "p2" : "p1";
      broadcast(room, "GAME_OVER", { winner, reason: "surrender" });

      playerRoom.delete(room.p1.ws);
      playerRoom.delete(room.p2.ws);
      rooms.delete(roomId);
      break;
    }

    case "PING": {
      send(ws, "PONG", {});
      break;
    }
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupMultiplayer(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const url = req.url ?? "";
    if (url === "/api/ws" || url.startsWith("/api/ws?")) {
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("WebSocket client connected");

    ws.on("message", (data) => {
      handleMessage(ws, data.toString());
    });

    ws.on("close", () => {
      handleDisconnect(ws);
    });

    ws.on("error", (err) => {
      logger.error({ err }, "WebSocket error");
      handleDisconnect(ws);
    });

    // Send welcome ping
    send(ws, "CONNECTED", { message: "CardDuel multiplayer ready" });
  });

  // Clean up stale rooms every 5 min
  setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      if (now - room.createdAt > 30 * 60 * 1000) {
        broadcast(room, "GAME_OVER", { winner: null, reason: "timeout" });
        playerRoom.delete(room.p1.ws);
        playerRoom.delete(room.p2.ws);
        rooms.delete(id);
      }
    }
    // Clean stale queue entries
    const stale = queue.filter(p => now - p.enqueuedAt > 5 * 60 * 1000);
    stale.forEach(p => {
      const idx = queue.indexOf(p);
      if (idx !== -1) queue.splice(idx, 1);
      send(p.ws, "QUEUE_TIMEOUT", {});
    });
  }, 60_000);

  logger.info("Multiplayer WebSocket server attached at /api/ws");
}
