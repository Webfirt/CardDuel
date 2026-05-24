import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CARD_DATABASE, STARTER_CARD_IDS, generatePack, getCardById } from "@/constants/cardData";
import type { Card, Deck, Friend, LeaderboardEntry, OwnedCard, Player, TradeOffer } from "@/constants/gameTypes";

const AVATAR_COLORS = ["#FF6B35", "#3B82F6", "#22C55E", "#EAB308", "#7C3AED", "#9CA3AF", "#EF4444", "#06B6D4"];

const MOCK_LEADERBOARD_NAMES = [
  ["DarkMaster99", 45, 342], ["CardShark", 38, 287], ["LegendSlayer", 55, 401],
  ["VoidWalker", 29, 198], ["FireKing", 41, 315], ["IceQueen", 36, 267],
  ["ThunderGod", 50, 388], ["ShadowHunter", 33, 231], ["MetalForge", 47, 356],
  ["NatureGuard", 27, 175], ["StormBreaker", 43, 328], ["DawnRider", 31, 210],
  ["AbyssLord", 60, 490], ["CrystalMage", 22, 143], ["BlazePaw", 39, 295],
  ["TideCaller", 34, 249], ["BoltRacer", 28, 182], ["VineWraith", 52, 410],
  ["IronFist", 44, 337], ["GloomReaper", 37, 278],
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function createInitialPlayer(): Player {
  return {
    id: generateId(),
    username: "Trainer" + Math.floor(Math.random() * 9999),
    level: 1,
    xp: 0,
    gold: 500,
    gems: 50,
    premiumPass: false,
    wins: 0,
    losses: 0,
    rank: 15,
    consecutiveLogins: 0,
  };
}

function buildInitialCollection(): OwnedCard[] {
  const counts: Record<string, number> = {};
  for (const id of STARTER_CARD_IDS) {
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.entries(counts).map(([id, quantity]) => {
    const card = getCardById(id)!;
    return { ...card, quantity, isNew: true };
  });
}

function buildInitialDeck(): Deck {
  return {
    id: generateId(),
    name: "Starter Deck",
    cardIds: STARTER_CARD_IDS.slice(0, 10),
    isActive: true,
  };
}

function buildLeaderboard(player: Player): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = MOCK_LEADERBOARD_NAMES.map(([name, level, wins], i) => ({
    rank: i + 1,
    playerId: `mock_${i}`,
    username: name as string,
    wins: wins as number,
    level: level as number,
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));
  // Insert player at their rank
  const playerEntry: LeaderboardEntry = {
    rank: 15,
    playerId: player.id,
    username: player.username,
    wins: player.wins,
    level: player.level,
    avatarColor: "#FFD700",
    isCurrentPlayer: true,
  };
  entries.splice(14, 0, playerEntry);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

function generateFriends(): Friend[] {
  const names = ["BlazePaw", "TideCaller", "BoltRacer", "VineWraith", "ShadowStep"];
  return names.map((name, i) => ({
    id: `friend_${i}`,
    username: name,
    level: 10 + i * 5,
    isOnline: i % 2 === 0,
    wins: 50 + i * 30,
    avatarColor: AVATAR_COLORS[i],
  }));
}

interface GameContextType {
  player: Player | null;
  collection: OwnedCard[];
  decks: Deck[];
  friends: Friend[];
  tradeOffers: TradeOffer[];
  leaderboard: LeaderboardEntry[];
  dailyRewardReady: boolean;
  isLoaded: boolean;
  updatePlayer: (updates: Partial<Player>) => Promise<void>;
  addCardsToCollection: (cards: Card[]) => Promise<void>;
  updateDeck: (deck: Deck) => Promise<void>;
  createDeck: (name: string) => Promise<Deck>;
  spendGold: (amount: number) => Promise<boolean>;
  spendGems: (amount: number) => Promise<boolean>;
  earnRewards: (gold: number, xp: number) => Promise<void>;
  claimDailyReward: () => Promise<{ gold: number; gems: number; packs: number }>;
  addFriend: (username: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  sendTradeOffer: (toFriendId: string, offeredIds: string[], requestedIds: string[]) => Promise<void>;
  respondToTrade: (tradeId: string, accept: boolean) => Promise<void>;
  buyPremiumPass: () => Promise<boolean>;
  markCardsAsSeen: () => Promise<void>;
  refreshLeaderboard: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [collection, setCollection] = useState<OwnedCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyRewardReady, setDailyRewardReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadGameData();
  }, []);

  async function loadGameData() {
    try {
      const [
        rawPlayer, rawCollection, rawDecks, rawFriends, rawTrades,
      ] = await Promise.all([
        AsyncStorage.getItem("cardduel_player"),
        AsyncStorage.getItem("cardduel_collection"),
        AsyncStorage.getItem("cardduel_decks"),
        AsyncStorage.getItem("cardduel_friends"),
        AsyncStorage.getItem("cardduel_trades"),
      ]);

      let p: Player;
      if (rawPlayer) {
        p = JSON.parse(rawPlayer);
      } else {
        p = createInitialPlayer();
        await AsyncStorage.setItem("cardduel_player", JSON.stringify(p));
      }

      let col: OwnedCard[];
      if (rawCollection) {
        col = JSON.parse(rawCollection);
      } else {
        col = buildInitialCollection();
        await AsyncStorage.setItem("cardduel_collection", JSON.stringify(col));
      }

      let dk: Deck[];
      if (rawDecks) {
        dk = JSON.parse(rawDecks);
      } else {
        dk = [buildInitialDeck()];
        await AsyncStorage.setItem("cardduel_decks", JSON.stringify(dk));
      }

      let fr: Friend[];
      if (rawFriends) {
        fr = JSON.parse(rawFriends);
      } else {
        fr = generateFriends();
        await AsyncStorage.setItem("cardduel_friends", JSON.stringify(fr));
      }

      const trades: TradeOffer[] = rawTrades ? JSON.parse(rawTrades) : [];

      // Check daily reward
      const today = new Date().toDateString();
      const ready = p.lastLoginDate !== today;
      if (ready) {
        const daysSince = p.lastLoginDate
          ? Math.round((new Date().getTime() - new Date(p.lastLoginDate).getTime()) / 86400000)
          : 1;
        const consecutive = daysSince === 1 ? p.consecutiveLogins + 1 : 1;
        p = { ...p, consecutiveLogins: consecutive, lastLoginDate: today };
        await AsyncStorage.setItem("cardduel_player", JSON.stringify(p));
      }

      setPlayer(p);
      setCollection(col);
      setDecks(dk);
      setFriends(fr);
      setTradeOffers(trades);
      setLeaderboard(buildLeaderboard(p));
      setDailyRewardReady(ready);
    } catch (e) {
      // fallback to initial state
      const p = createInitialPlayer();
      setPlayer(p);
      setCollection(buildInitialCollection());
      setDecks([buildInitialDeck()]);
      setFriends(generateFriends());
      setLeaderboard(buildLeaderboard(p));
    } finally {
      setIsLoaded(true);
    }
  }

  const updatePlayer = useCallback(async (updates: Partial<Player>) => {
    setPlayer(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("cardduel_player", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addCardsToCollection = useCallback(async (cards: Card[]) => {
    setCollection(prev => {
      const next = [...prev];
      for (const card of cards) {
        const existing = next.find(c => c.id === card.id);
        if (existing) {
          existing.quantity += 1;
          existing.isNew = true;
        } else {
          next.push({ ...card, quantity: 1, isNew: true });
        }
      }
      AsyncStorage.setItem("cardduel_collection", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateDeck = useCallback(async (deck: Deck) => {
    setDecks(prev => {
      const next = prev.map(d => d.id === deck.id ? deck : d);
      AsyncStorage.setItem("cardduel_decks", JSON.stringify(next));
      return next;
    });
  }, []);

  const createDeck = useCallback(async (name: string): Promise<Deck> => {
    const deck: Deck = { id: generateId(), name, cardIds: [], isActive: false };
    setDecks(prev => {
      const next = [...prev, deck];
      AsyncStorage.setItem("cardduel_decks", JSON.stringify(next));
      return next;
    });
    return deck;
  }, []);

  const spendGold = useCallback(async (amount: number): Promise<boolean> => {
    if (!player || player.gold < amount) return false;
    await updatePlayer({ gold: player.gold - amount });
    return true;
  }, [player, updatePlayer]);

  const spendGems = useCallback(async (amount: number): Promise<boolean> => {
    if (!player || player.gems < amount) return false;
    await updatePlayer({ gems: player.gems - amount });
    return true;
  }, [player, updatePlayer]);

  const earnRewards = useCallback(async (gold: number, xp: number) => {
    if (!player) return;
    const multiplier = player.premiumPass ? 2 : 1;
    const earnedGold = gold * multiplier;
    const newXp = player.xp + xp;
    const xpNeeded = player.level * 100;
    const levelUp = newXp >= xpNeeded;
    const updated: Partial<Player> = {
      gold: player.gold + earnedGold,
      xp: levelUp ? newXp - xpNeeded : newXp,
      level: levelUp ? player.level + 1 : player.level,
    };
    await updatePlayer(updated);
    setLeaderboard(buildLeaderboard({ ...player, ...updated }));
  }, [player, updatePlayer]);

  const claimDailyReward = useCallback(async () => {
    if (!player) return { gold: 0, gems: 0, packs: 0 };
    const day = ((player.consecutiveLogins - 1) % 7) + 1;
    const rewards = [
      { gold: 100, gems: 0, packs: 0 },
      { gold: 150, gems: 0, packs: 0 },
      { gold: 200, gems: 5, packs: 1 },
      { gold: 250, gems: 0, packs: 0 },
      { gold: 300, gems: 10, packs: 1 },
      { gold: 350, gems: 0, packs: 0 },
      { gold: 500, gems: 20, packs: 3 },
    ];
    const reward = rewards[day - 1] ?? rewards[0];
    const goldBonus = player.premiumPass ? reward.gold * 2 : reward.gold;
    const gemsBonus = player.premiumPass ? reward.gems + 5 : reward.gems;
    await updatePlayer({ gold: player.gold + goldBonus, gems: player.gems + gemsBonus });
    if (reward.packs > 0) {
      const packCards: Card[] = [];
      for (let i = 0; i < reward.packs; i++) {
        packCards.push(...generatePack("basic"));
      }
      await addCardsToCollection(packCards);
    }
    setDailyRewardReady(false);
    return { gold: goldBonus, gems: gemsBonus, packs: reward.packs };
  }, [player, updatePlayer, addCardsToCollection]);

  const addFriend = useCallback(async (username: string) => {
    const newFriend: Friend = {
      id: generateId(),
      username,
      level: Math.floor(Math.random() * 30) + 1,
      isOnline: Math.random() > 0.5,
      wins: Math.floor(Math.random() * 200),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };
    setFriends(prev => {
      const next = [...prev, newFriend];
      AsyncStorage.setItem("cardduel_friends", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    setFriends(prev => {
      const next = prev.filter(f => f.id !== friendId);
      AsyncStorage.setItem("cardduel_friends", JSON.stringify(next));
      return next;
    });
  }, []);

  const sendTradeOffer = useCallback(async (toFriendId: string, offeredIds: string[], requestedIds: string[]) => {
    if (!player) return;
    const friend = friends.find(f => f.id === toFriendId);
    if (!friend) return;
    const offer: TradeOffer = {
      id: generateId(),
      fromPlayerId: player.id,
      fromUsername: player.username,
      toPlayerId: toFriendId,
      offeredCardIds: offeredIds,
      requestedCardIds: requestedIds,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTradeOffers(prev => {
      const next = [...prev, offer];
      AsyncStorage.setItem("cardduel_trades", JSON.stringify(next));
      return next;
    });
    // Auto-resolve after 3 seconds
    setTimeout(() => {
      const accepted = Math.random() > 0.4;
      setTradeOffers(prev => {
        const next = prev.map(t => t.id === offer.id ? { ...t, status: accepted ? "accepted" : "declined" as const } : t);
        AsyncStorage.setItem("cardduel_trades", JSON.stringify(next));
        return next;
      });
    }, 3000);
  }, [player, friends]);

  const respondToTrade = useCallback(async (tradeId: string, accept: boolean) => {
    setTradeOffers(prev => {
      const next = prev.map(t => t.id === tradeId ? { ...t, status: accept ? "accepted" : "declined" as const } : t);
      AsyncStorage.setItem("cardduel_trades", JSON.stringify(next));
      return next;
    });
  }, []);

  const buyPremiumPass = useCallback(async (): Promise<boolean> => {
    if (!player || player.gems < 300) return false;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    await updatePlayer({
      gems: player.gems - 300,
      premiumPass: true,
      premiumPassExpiry: expiry.toISOString(),
    });
    // Give legendary card for buying pass
    const legendary = CARD_DATABASE.filter(c => c.rarity === "legendary");
    if (legendary.length > 0) {
      await addCardsToCollection([legendary[Math.floor(Math.random() * legendary.length)]]);
    }
    return true;
  }, [player, updatePlayer, addCardsToCollection]);

  const markCardsAsSeen = useCallback(async () => {
    setCollection(prev => {
      const next = prev.map(c => ({ ...c, isNew: false }));
      AsyncStorage.setItem("cardduel_collection", JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshLeaderboard = useCallback(() => {
    if (player) setLeaderboard(buildLeaderboard(player));
  }, [player]);

  return (
    <GameContext.Provider value={{
      player, collection, decks, friends, tradeOffers, leaderboard,
      dailyRewardReady, isLoaded,
      updatePlayer, addCardsToCollection, updateDeck, createDeck,
      spendGold, spendGems, earnRewards, claimDailyReward,
      addFriend, removeFriend, sendTradeOffer, respondToTrade,
      buyPremiumPass, markCardsAsSeen, refreshLeaderboard,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
