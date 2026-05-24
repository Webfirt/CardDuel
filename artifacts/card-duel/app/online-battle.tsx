import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert, Animated, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTypeColor } from "@/constants/cardData";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { useMultiplayer, type OnlineBattleCard } from "@/hooks/useMultiplayer";

export default function OnlineBattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { player, collection, earnRewards, updatePlayer } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const mp = useMultiplayer();

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const oppShakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for "Your Turn" indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    if (mp.isMyTurn) loop.start();
    else { loop.stop(); pulseAnim.setValue(1); }
    return () => loop.stop();
  }, [mp.isMyTurn]);

  // Connect to server on mount
  useEffect(() => {
    if (!player) return;
    const cards = collection.slice(0, 3).length >= 1
      ? collection.slice(0, 3)
      : collection.slice(0, 1);
    mp.connect(player.id, player.username, player.level, cards);
    return () => mp.disconnect();
  }, []);

  // Handle game over
  useEffect(() => {
    if (mp.status !== "ended") return;

    const didWin = mp.winner === mp.mySlot;

    if (mp.endReason === "disconnect") {
      // handled by UI
      return;
    }

    if (didWin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      earnRewards(200, 80);
      updatePlayer({ wins: (player?.wins ?? 0) + 1 });
    } else if (mp.winner !== null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      updatePlayer({ losses: (player?.losses ?? 0) + 1 });
    }
  }, [mp.status]);

  function shake(who: "me" | "opp") {
    const anim = who === "me" ? shakeAnim : oppShakeAnim;
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function handleAbility(abilityIdx: number) {
    if (!mp.isMyTurn || mp.status !== "in_battle") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Determine who takes damage for shake
    shake("opp");
    mp.playMove(abilityIdx);
  }

  // Track previous game state to trigger shakes
  const prevLogRef = useRef<string[]>([]);
  useEffect(() => {
    if (!mp.gameState) return;
    const newLogs = mp.gameState.log;
    if (newLogs !== prevLogRef.current && newLogs.length > 0) {
      prevLogRef.current = newLogs;
      if (!mp.isMyTurn) shake("me");
    }
  }, [mp.gameState?.log]);

  function hpPct(card: OnlineBattleCard) {
    return Math.max(0, card.currentHp / card.maxHp);
  }
  function hpColor(pct: number) {
    if (pct > 0.5) return "#22C55E";
    if (pct > 0.25) return "#EAB308";
    return "#EF4444";
  }

  function renderCard(card: OnlineBattleCard, isActive: boolean, side: "me" | "opp") {
    const pct = hpPct(card);
    const typeColor = getTypeColor(card.type as any);
    const xShake = side === "me" ? shakeAnim : oppShakeAnim;
    return (
      <Animated.View style={[styles.battleCard, { transform: [{ translateX: xShake }] }]}>
        <LinearGradient
          colors={[typeColor + "AA", typeColor + "33", "#111827"]}
          style={[
            styles.battleCardGrad,
            {
              borderColor: isActive ? typeColor : colors.border,
              borderWidth: isActive ? 2 : 1,
            },
          ]}
        >
          <Text style={[styles.cardName, { color: "#FFFFFF" }]}>{card.name}</Text>
          <Text style={{ fontSize: 28, marginVertical: 4 }}>
            {card.currentHp <= 0 ? "💀" : "⚔️"}
          </Text>
          <View style={[styles.hpBarBg, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.hpBarFill,
                { width: `${pct * 100}%` as any, backgroundColor: hpColor(pct) },
              ]}
            />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 11, marginTop: 2 }}>
            {card.currentHp}/{card.maxHp} HP
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  // ── Connecting / Queuing screen ──────────────────────────────────────────────
  if (mp.status === "idle" || mp.status === "connecting" || mp.status === "connected") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={["#0A0E1A", "#111827"]}
          style={[styles.loadScreen, { paddingTop: topPad + 20 }]}
        >
          <TouchableOpacity onPress={() => { mp.disconnect(); router.back(); }} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24 }}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Connecting…</Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
              Reaching the battle server
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (mp.status === "queued") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={["#0A0E1A", "#111827"]}
          style={[styles.loadScreen, { paddingTop: topPad + 20 }]}
        >
          <TouchableOpacity
            onPress={() => { mp.leaveQueue(); mp.disconnect(); router.back(); }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24 }}>
            <View style={[styles.queuePulse, { borderColor: colors.gold + "66" }]}>
              <View style={[styles.queueInner, { backgroundColor: colors.gold + "22" }]}>
                <Feather name="search" size={36} color={colors.gold} />
              </View>
            </View>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>
              Finding Opponent…
            </Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
              {mp.queuePosition === 1
                ? "You're #1 in queue — waiting for another player"
                : `Queue position: ${mp.queuePosition}`}
            </Text>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => { mp.leaveQueue(); mp.disconnect(); router.back(); }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ── Error / Disconnected ────────────────────────────────────────────────────
  if (mp.status === "error" || mp.status === "disconnected") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={["#7F1D1D", "#0A0E1A"]}
          style={[styles.loadScreen, { paddingTop: topPad + 20 }]}
        >
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
            <Feather name="wifi-off" size={48} color="#EF4444" />
            <Text style={[styles.statusTitle, { color: "#EF4444" }]}>Connection Error</Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
              {mp.error ?? "Lost connection to the server"}
            </Text>
            <TouchableOpacity
              style={[styles.exitBtn, { backgroundColor: "#EF4444" }]}
              onPress={() => { mp.disconnect(); router.back(); }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" as const }}>
                Back to Arena
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ── Game Over ───────────────────────────────────────────────────────────────
  if (mp.status === "ended") {
    const didWin = mp.winner === mp.mySlot;
    const isDraw = mp.winner === null;
    const label = isDraw ? "Draw" : didWin ? "Victory!" : "Defeated!";
    const color = isDraw ? colors.gold : didWin ? "#22C55E" : "#EF4444";
    const bgColors: [string, string] = isDraw
      ? ["#44403C", "#0A0E1A"]
      : didWin
      ? ["#14532D", "#0A0E1A"]
      : ["#7F1D1D", "#0A0E1A"];

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={bgColors} style={[styles.endScreen, { paddingTop: topPad + 20 }]}>
          <Text style={[styles.endTitle, { color }]}>{label}</Text>
          <Text style={{ fontSize: 64, marginVertical: 16 }}>
            {isDraw ? "🤝" : didWin ? "🏆" : "💀"}
          </Text>
          {mp.endReason === "disconnect" && (
            <View style={[styles.reasonBox, { backgroundColor: "#EF444422" }]}>
              <Text style={{ color: "#EF4444", fontSize: 14 }}>Opponent disconnected</Text>
            </View>
          )}
          {mp.endReason === "surrender" && (
            <View style={[styles.reasonBox, { backgroundColor: "#FFD70022" }]}>
              <Text style={{ color: colors.gold, fontSize: 14 }}>
                {didWin ? "Opponent surrendered" : "You surrendered"}
              </Text>
            </View>
          )}
          {didWin && mp.endReason !== "disconnect" && (
            <View style={[styles.reasonBox, { backgroundColor: "#FFD70022" }]}>
              <Text style={[styles.rewardText, { color: colors.gold }]}>+200 Gold · +80 XP</Text>
            </View>
          )}
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
            vs {mp.opponentName} · Lv.{mp.opponentLevel}
          </Text>
          <TouchableOpacity
            style={[styles.exitBtn, { backgroundColor: color }]}
            onPress={() => { mp.disconnect(); router.back(); }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const }}>
              Back to Arena
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // ── In Battle ────────────────────────────────────────────────────────────────
  if (mp.status !== "in_battle" || !mp.gameState) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </View>
    );
  }

  const gs = mp.gameState;
  const myState = mp.mySlot === "p1" ? gs.p1 : gs.p2;
  const oppState = mp.mySlot === "p1" ? gs.p2 : gs.p1;
  const myActive = myState.cards[myState.activeIdx];
  const oppActive = oppState.cards[oppState.activeIdx];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Opponent side */}
      <LinearGradient
        colors={["#1A0A0A", "#111827"]}
        style={[styles.side, { paddingTop: topPad + 4 }]}
      >
        <View style={styles.sideHeader}>
          <View>
            <Text style={[styles.playerLabel, { color: "#EF4444" }]}>{mp.opponentName}</Text>
            <Text style={[styles.levelBadge, { color: colors.mutedForeground }]}>
              Lv.{mp.opponentLevel}
            </Text>
          </View>
          <View style={styles.benchRow}>
            {oppState.cards.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.benchDot,
                  {
                    backgroundColor:
                      c.currentHp > 0 ? getTypeColor(c.type as any) : colors.border,
                    opacity: i === oppState.activeIdx ? 1 : 0.5,
                    width: i === oppState.activeIdx ? 14 : 10,
                    height: i === oppState.activeIdx ? 14 : 10,
                    borderRadius: 7,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        {oppActive && renderCard(oppActive, true, "opp")}
      </LinearGradient>

      {/* Center — log + turn indicator */}
      <View style={[styles.logArea, { backgroundColor: colors.card + "CC" }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <Text style={[styles.logLine, { color: colors.mutedForeground }]}>
            {gs.log[0] ?? "Battle in progress…"}
          </Text>
        </ScrollView>
        <Animated.View style={{ transform: [{ scale: mp.isMyTurn ? pulseAnim : 1 }] }}>
          <View
            style={[
              styles.turnPill,
              { backgroundColor: mp.isMyTurn ? colors.gold + "33" : "#EF444433" },
            ]}
          >
            <Text
              style={[
                styles.turnText,
                { color: mp.isMyTurn ? colors.gold : "#EF4444" },
              ]}
            >
              {mp.isMyTurn ? "Your Turn" : "Opponent's Turn"}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Player side */}
      <LinearGradient colors={["#111827", "#0A1A0A"]} style={styles.side}>
        {myActive && renderCard(myActive, true, "me")}
        <View style={styles.sideHeader}>
          <View style={styles.benchRow}>
            {myState.cards.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.benchDot,
                  {
                    backgroundColor:
                      c.currentHp > 0 ? getTypeColor(c.type as any) : colors.border,
                    opacity: i === myState.activeIdx ? 1 : 0.5,
                    width: i === myState.activeIdx ? 14 : 10,
                    height: i === myState.activeIdx ? 14 : 10,
                    borderRadius: 7,
                  },
                ]}
              />
            ))}
          </View>
          <View>
            <Text style={[styles.playerLabel, { color: "#22C55E" }]}>
              {player?.username ?? "You"}
            </Text>
            <Text style={[styles.levelBadge, { color: colors.mutedForeground, textAlign: "right" }]}>
              Lv.{player?.level ?? 1}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Ability buttons */}
      <View
        style={[
          styles.abilitiesArea,
          { backgroundColor: colors.background, paddingBottom: topPad > 20 ? 20 : 12 },
        ]}
      >
        <View style={styles.abilityRow}>
          {myActive?.abilities.map((ab, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.abilityBtn,
                {
                  backgroundColor: mp.isMyTurn
                    ? getTypeColor(myActive.type as any) + "33"
                    : colors.secondary,
                  borderColor: mp.isMyTurn
                    ? getTypeColor(myActive.type as any)
                    : colors.border,
                  opacity: mp.isMyTurn ? 1 : 0.45,
                },
              ]}
              onPress={() => handleAbility(i)}
              disabled={!mp.isMyTurn}
            >
              <Text style={[styles.abilityName, { color: colors.foreground }]}>{ab.name}</Text>
              <Text style={[styles.abilityDmg, { color: "#F87171" }]}>{ab.damage} dmg</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.surrenderBtn, { borderColor: "#EF444444" }]}
          onPress={() =>
            Alert.alert("Surrender?", "You will lose the match.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Surrender",
                style: "destructive",
                onPress: () => mp.surrender(),
              },
            ])
          }
        >
          <Text style={{ color: "#EF444488", fontSize: 12 }}>Surrender</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadScreen: { flex: 1 },
  backBtn: { position: "absolute", top: 16, left: 16, padding: 8, zIndex: 10 },
  queuePulse: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 3,
    alignItems: "center", justifyContent: "center",
  },
  queueInner: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center",
  },
  statusTitle: { fontSize: 24, fontWeight: "700" as const, textAlign: "center" },
  statusSub: { fontSize: 14, textAlign: "center", maxWidth: 280 },
  cancelBtn: {
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20, borderWidth: 1,
  },
  side: { flex: 1, padding: 16, alignItems: "center", justifyContent: "center" },
  sideHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", width: "100%", marginVertical: 6,
  },
  playerLabel: { fontSize: 14, fontWeight: "700" as const },
  levelBadge: { fontSize: 11, marginTop: 1 },
  benchRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  benchDot: { borderRadius: 7 },
  battleCard: { width: 186 },
  battleCardGrad: { borderRadius: 14, padding: 12, alignItems: "center" },
  cardName: { fontSize: 13, fontWeight: "700" as const, textAlign: "center" },
  hpBarBg: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 4 },
  hpBarFill: { height: "100%", borderRadius: 4 },
  logArea: {
    paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  logLine: { fontSize: 12, paddingRight: 8 },
  turnPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  turnText: { fontSize: 11, fontWeight: "700" as const },
  abilitiesArea: { padding: 12 },
  abilityRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  abilityBtn: { flex: 1, padding: 12, borderRadius: 14, alignItems: "center", borderWidth: 1.5 },
  abilityName: { fontSize: 12, fontWeight: "700" as const, textAlign: "center" },
  abilityDmg: { fontSize: 11, marginTop: 2 },
  surrenderBtn: {
    alignSelf: "center", paddingHorizontal: 20, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  endScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  endTitle: { fontSize: 40, fontWeight: "900" as const },
  reasonBox: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 16, marginVertical: 8,
  },
  rewardText: { fontSize: 18, fontWeight: "700" as const },
  exitBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20, marginTop: 8 },
});
