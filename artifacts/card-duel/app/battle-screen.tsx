import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Animated, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CARD_DATABASE, getTypeColor } from "@/constants/cardData";
import type { BattleCard } from "@/constants/gameTypes";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

function randomId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeBattleCard(card: (typeof CARD_DATABASE)[0], owner: "player" | "opponent"): BattleCard {
  return { ...card, currentHp: card.hp, ownerId: owner };
}

const OPPONENT_NAMES = ["DarkMaster", "CardShark", "BlazePaw", "VoidWalker", "ThunderGod"];

export default function BattleGameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, earnRewards, updatePlayer, player } = useGame();

  const [playerCards, setPlayerCards] = useState<BattleCard[]>([]);
  const [oppCards, setOppCards] = useState<BattleCard[]>([]);
  const [pActiveIdx, setPActiveIdx] = useState(0);
  const [oActiveIdx, setOActiveIdx] = useState(0);
  const [turn, setTurn] = useState<"player" | "opponent">("player");
  const [phase, setPhase] = useState<"setup" | "battling" | "ended">("setup");
  const [winner, setWinner] = useState<"player" | "opponent" | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [oppName] = useState(OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)]);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const oppShakeAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    initBattle();
  }, []);

  function initBattle() {
    // Pick 3 player cards from collection (random)
    const owned = collection.length >= 3 ? collection : CARD_DATABASE.slice(0, 3);
    const pPicks = shuffled(owned).slice(0, 3).map(c => makeBattleCard(c, "player"));
    // Opponent: random from DB
    const oPicks = shuffled(CARD_DATABASE).slice(0, 3).map(c => makeBattleCard(c, "opponent"));
    setPlayerCards(pPicks);
    setOppCards(oPicks);
    setLog([`Battle start! You vs ${oppName}`]);
    setPhase("battling");
  }

  const pActive = playerCards[pActiveIdx];
  const oActive = oppCards[oActiveIdx];

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev.slice(0, 19)]);
  }, []);

  function shake(who: "player" | "opponent") {
    const anim = who === "player" ? shakeAnim : oppShakeAnim;
    Animated.sequence([
      Animated.timing(anim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function checkKO(cards: BattleCard[], activeIdx: number): { cards: BattleCard[], nextIdx: number, allKO: boolean } {
    let next = activeIdx;
    if (cards[activeIdx].currentHp <= 0) {
      const nextAlive = cards.findIndex((c, i) => i !== activeIdx && c.currentHp > 0);
      if (nextAlive === -1) return { cards, nextIdx: activeIdx, allKO: true };
      next = nextAlive;
    }
    return { cards, nextIdx: next, allKO: false };
  }

  async function endBattle(w: "player" | "opponent") {
    setWinner(w);
    setPhase("ended");
    if (w === "player") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await earnRewards(150, 50);
      await updatePlayer({ wins: (player?.wins ?? 0) + 1 });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await updatePlayer({ losses: (player?.losses ?? 0) + 1 });
    }
  }

  async function handlePlayerAttack(abilityIdx: number) {
    if (!pActive || !oActive || isAnimating || turn !== "player" || phase !== "battling") return;
    const ability = pActive.abilities[abilityIdx];
    if (!ability) return;

    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shake("opponent");
    addLog(`${pActive.name} used ${ability.name}! (${ability.damage} dmg)`);

    // Damage opponent
    const newOppCards = oppCards.map((c, i) => {
      if (i !== oActiveIdx) return c;
      return { ...c, currentHp: Math.max(0, c.currentHp - ability.damage) };
    });
    setOppCards(newOppCards);

    // Check KO
    const { nextIdx: nextO, allKO: oppAllKO } = checkKO(newOppCards, oActiveIdx);
    if (newOppCards[oActiveIdx].currentHp <= 0) {
      addLog(`${oActive.name} was knocked out!`);
    }
    if (oppAllKO) {
      await endBattle("player");
      setIsAnimating(false);
      return;
    }
    setOActiveIdx(nextO);

    // Opponent turn
    setTurn("opponent");
    await new Promise(r => setTimeout(r, 900));

    const currentOActive = newOppCards[nextO];
    if (!currentOActive) { setIsAnimating(false); return; }

    const oppAbility = currentOActive.abilities[Math.floor(Math.random() * currentOActive.abilities.length)];
    shake("player");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addLog(`${currentOActive.name} used ${oppAbility.name}! (${oppAbility.damage} dmg)`);

    const newPCards = playerCards.map((c, i) => {
      if (i !== pActiveIdx) return c;
      return { ...c, currentHp: Math.max(0, c.currentHp - oppAbility.damage) };
    });
    setPlayerCards(newPCards);

    const { nextIdx: nextP, allKO: playerAllKO } = checkKO(newPCards, pActiveIdx);
    if (newPCards[pActiveIdx].currentHp <= 0) {
      addLog(`Your ${pActive.name} was knocked out!`);
    }
    if (playerAllKO) {
      await endBattle("opponent");
      setIsAnimating(false);
      return;
    }
    setPActiveIdx(nextP);
    setTurn("player");
    setIsAnimating(false);
  }

  function hpPercent(card: BattleCard) {
    return Math.max(0, card.currentHp / card.maxHp);
  }

  function hpColor(pct: number) {
    if (pct > 0.5) return "#22C55E";
    if (pct > 0.25) return "#EAB308";
    return "#EF4444";
  }

  function renderCard(card: BattleCard, isActive: boolean, owner: "player" | "opponent") {
    const pct = hpPercent(card);
    const typeColor = getTypeColor(card.type);
    const shakeX = owner === "player" ? shakeAnim : oppShakeAnim;
    return (
      <Animated.View style={[styles.battleCard, { transform: [{ translateX: shakeX }] }]}>
        <LinearGradient
          colors={[typeColor + "AA", typeColor + "33", "#111827"]}
          style={[styles.battleCardGrad, { borderColor: isActive ? typeColor : colors.border, borderWidth: isActive ? 2 : 1 }]}
        >
          <Text style={[styles.cardName, { color: "#FFFFFF" }]}>{card.name}</Text>
          <Text style={{ fontSize: 28, marginVertical: 4 }}>{card.currentHp <= 0 ? "💀" : "⚔️"}</Text>
          <View style={[styles.hpBarBg, { backgroundColor: colors.secondary }]}>
            <View style={[styles.hpBarFill, { width: `${pct * 100}%` as any, backgroundColor: hpColor(pct) }]} />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 11, marginTop: 2 }}>
            {card.currentHp}/{card.maxHp} HP
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (phase === "setup") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.foreground, fontSize: 18 }}>Setting up battle...</Text>
        </View>
      </View>
    );
  }

  if (phase === "ended") {
    const won = winner === "player";
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={won ? ["#14532D", "#0A0E1A"] : ["#7F1D1D", "#0A0E1A"]}
          style={[styles.endScreen, { paddingTop: topPad + 20 }]}
        >
          <Text style={[styles.endTitle, { color: won ? "#22C55E" : "#EF4444" }]}>
            {won ? "Victory!" : "Defeated!"}
          </Text>
          <Text style={{ fontSize: 64, marginVertical: 16 }}>{won ? "🏆" : "💀"}</Text>
          {won && (
            <View style={styles.rewardBox}>
              <Text style={[styles.rewardText, { color: colors.gold }]}>+150 Gold · +50 XP</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.exitBtn, { backgroundColor: won ? "#22C55E" : "#EF4444" }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const }}>Back to Arena</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Opponent side */}
      <LinearGradient
        colors={["#1A0A0A", "#111827"]}
        style={[styles.side, { paddingTop: topPad }]}
      >
        <View style={styles.sideHeader}>
          <Text style={[styles.playerLabel, { color: "#EF4444" }]}>{oppName}</Text>
          <View style={styles.benchRow}>
            {oppCards.map((c, i) => (
              <View key={i} style={[
                styles.benchDot,
                { backgroundColor: c.currentHp > 0 ? getTypeColor(c.type) : colors.border, opacity: i === oActiveIdx ? 1 : 0.5 },
              ]} />
            ))}
          </View>
        </View>
        {oActive && renderCard(oActive, true, "opponent")}
      </LinearGradient>

      {/* Center log */}
      <View style={[styles.logArea, { backgroundColor: colors.card + "AA" }]}>
        <Text style={[styles.logLine, { color: colors.mutedForeground }]} numberOfLines={2}>
          {log[0] ?? "Battle in progress..."}
        </Text>
        <Text style={[styles.turnIndicator, { color: turn === "player" ? colors.gold : "#EF4444" }]}>
          {turn === "player" ? "Your Turn" : "Opponent's Turn"}
        </Text>
      </View>

      {/* Player side */}
      <LinearGradient
        colors={["#111827", "#0A1A0A"]}
        style={styles.side}
      >
        {pActive && renderCard(pActive, true, "player")}
        <View style={styles.sideHeader}>
          <View style={styles.benchRow}>
            {playerCards.map((c, i) => (
              <View key={i} style={[
                styles.benchDot,
                { backgroundColor: c.currentHp > 0 ? getTypeColor(c.type) : colors.border, opacity: i === pActiveIdx ? 1 : 0.5 },
              ]} />
            ))}
          </View>
          <Text style={[styles.playerLabel, { color: "#22C55E" }]}>You</Text>
        </View>
      </LinearGradient>

      {/* Ability buttons */}
      <View style={[styles.abilitiesArea, { backgroundColor: colors.background, paddingBottom: topPad > 20 ? 20 : 12 }]}>
        <View style={styles.abilityRow}>
          {pActive?.abilities.map((ab, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.abilityBtn,
                {
                  backgroundColor: turn === "player" && !isAnimating ? getTypeColor(pActive.type) + "33" : colors.secondary,
                  borderColor: turn === "player" && !isAnimating ? getTypeColor(pActive.type) : colors.border,
                  opacity: turn === "player" && !isAnimating ? 1 : 0.5,
                },
              ]}
              onPress={() => handlePlayerAttack(i)}
              disabled={turn !== "player" || isAnimating}
            >
              <Text style={[styles.abilityName, { color: colors.foreground }]}>{ab.name}</Text>
              <Text style={[styles.abilityDmg, { color: "#F87171" }]}>{ab.damage} dmg</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.surrenderBtn, { borderColor: "#EF444444" }]}
          onPress={() => Alert.alert("Surrender?", "", [
            { text: "Cancel", style: "cancel" },
            { text: "Surrender", style: "destructive", onPress: () => endBattle("opponent") },
          ])}
        >
          <Text style={{ color: "#EF444488", fontSize: 12 }}>Surrender</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  side: { flex: 1, padding: 16, alignItems: "center", justifyContent: "center" },
  sideHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginVertical: 6 },
  playerLabel: { fontSize: 14, fontWeight: "700" as const },
  benchRow: { flexDirection: "row", gap: 6 },
  benchDot: { width: 12, height: 12, borderRadius: 6 },
  battleCard: { width: 180 },
  battleCardGrad: { borderRadius: 14, padding: 12, alignItems: "center" },
  cardName: { fontSize: 13, fontWeight: "700" as const, textAlign: "center" },
  hpBarBg: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 4 },
  hpBarFill: { height: "100%", borderRadius: 4 },
  logArea: {
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  logLine: { fontSize: 12, flex: 1 },
  turnIndicator: { fontSize: 12, fontWeight: "700" as const, marginLeft: 12 },
  abilitiesArea: { padding: 12 },
  abilityRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  abilityBtn: { flex: 1, padding: 12, borderRadius: 14, alignItems: "center", borderWidth: 1.5 },
  abilityName: { fontSize: 12, fontWeight: "700" as const, textAlign: "center" },
  abilityDmg: { fontSize: 11, marginTop: 2 },
  surrenderBtn: { alignSelf: "center", paddingHorizontal: 20, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  endScreen: { flex: 1, alignItems: "center", justifyContent: "center" },
  endTitle: { fontSize: 40, fontWeight: "900" as const },
  rewardBox: { backgroundColor: "#FFD70022", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 16, marginBottom: 24 },
  rewardText: { fontSize: 18, fontWeight: "700" as const },
  exitBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20 },
});
