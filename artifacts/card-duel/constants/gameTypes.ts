export type CardType = "fire" | "water" | "grass" | "electric" | "dark" | "metal" | "colorless";
export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Ability {
  name: string;
  damage: number;
  cost: number;
  description: string;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  description: string;
  abilities: Ability[];
  packId: string;
}

export interface OwnedCard extends Card {
  quantity: number;
  isNew: boolean;
}

export interface Player {
  id: string;
  username: string;
  level: number;
  xp: number;
  gold: number;
  gems: number;
  premiumPass: boolean;
  premiumPassExpiry?: string;
  wins: number;
  losses: number;
  rank: number;
  lastLoginDate?: string;
  consecutiveLogins: number;
}

export interface Friend {
  id: string;
  username: string;
  level: number;
  isOnline: boolean;
  wins: number;
  avatarColor: string;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  fromUsername: string;
  toPlayerId: string;
  offeredCardIds: string[];
  requestedCardIds: string[];
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  cardIds: string[];
  isActive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  wins: number;
  level: number;
  avatarColor: string;
  isCurrentPlayer?: boolean;
}

export interface BattleCard extends Card {
  currentHp: number;
  ownerId: "player" | "opponent";
}

export interface BattleState {
  playerCards: BattleCard[];
  opponentCards: BattleCard[];
  playerActiveIdx: number;
  opponentActiveIdx: number;
  turn: "player" | "opponent";
  phase: "selecting" | "battling" | "ended";
  winner: "player" | "opponent" | null;
  log: string[];
  isAnimating: boolean;
  goldEarned: number;
  xpEarned: number;
}
