import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Image, Platform, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CARD_DATABASE, getCardById } from "@/constants/cardData";
import type { Card } from "@/constants/gameTypes";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { player, decks, collection } = useGame();
  const [finding, setFinding] = useState(false);

  const activeDeck = decks.find(d => d.isActive);
  const deckCardCount = activeDeck?.cardIds.length ?? 0;

  const canBattle = collection.length >= 3;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleQuickBattle() {
    if (!canBattle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFinding(true);
    await new Promise(r => setTimeout(r, 1500));
    setFinding(false);
    router.push("/battle-screen");
  }

  const STATS = [
    { label: "Wins", value: player?.wins ?? 0, color: "#22C55E" },
    { label: "Losses", value: player?.losses ?? 0, color: "#EF4444" },
    { label: "Win Rate", value: player ? (player.wins + player.losses > 0 ? `${Math.round(player.wins / (player.wins + player.losses) * 100)}%` : "—") : "—", color: colors.gold },
    { label: "Rank", value: `#${player?.rank ?? "—"}`, color: "#7C3AED" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0A0A", "#0A0E1A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Battle Arena</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Challenge opponents worldwide
        </Text>
      </LinearGradient>

      {/* Battle banner */}
      <View style={styles.bannerWrap}>
        <Image
          source={require("@/assets/images/battle_banner.png")}
          style={styles.banner}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "#0A0E1A"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerText}>QUICK BATTLE</Text>
          <TouchableOpacity
            style={[
              styles.battleBtn,
              { backgroundColor: canBattle ? colors.gold : colors.secondary },
            ]}
            onPress={handleQuickBattle}
            disabled={!canBattle || finding}
          >
            {finding ? (
              <ActivityIndicator color="#0A0E1A" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#0A0E1A" />
                <Text style={styles.battleBtnText}>Battle Now</Text>
              </>
            )}
          </TouchableOpacity>
          {!canBattle && (
            <Text style={[styles.noticeText, { color: "#EF4444" }]}>
              Add cards to your collection first
            </Text>
          )}
          {finding && (
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Finding opponent...
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { marginHorizontal: 16 }]}>
        {STATS.map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Deck info */}
      <View style={[styles.deckSection, { backgroundColor: colors.card, marginHorizontal: 16, borderColor: colors.border }]}>
        <View style={styles.deckRow}>
          <View style={[styles.deckIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="layers" size={20} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.deckName, { color: colors.foreground }]}>
              {activeDeck?.name ?? "No Active Deck"}
            </Text>
            <Text style={[styles.deckCount, { color: colors.mutedForeground }]}>
              {deckCardCount} / 20 cards
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/deck-builder")}
          >
            <Feather name="edit-3" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {deckCardCount < 3 && (
          <View style={[styles.warningBanner, { backgroundColor: "#EF444422" }]}>
            <Feather name="alert-triangle" size={14} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 12, marginLeft: 6 }}>
              Need at least 3 cards to battle
            </Text>
          </View>
        )}
      </View>

      {/* Online Match */}
      <TouchableOpacity
        style={[styles.onlineCard, { backgroundColor: colors.card, marginHorizontal: 16, borderColor: canBattle ? "#7C3AED66" : colors.border }]}
        onPress={() => {
          if (!canBattle) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/online-battle");
        }}
        disabled={!canBattle}
        activeOpacity={0.8}
      >
        <View style={[styles.onlineIcon, { backgroundColor: "#7C3AED22" }]}>
          <Feather name="globe" size={20} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.csTitle, { color: colors.foreground }]}>Online Match</Text>
          <Text style={[styles.csSub, { color: colors.mutedForeground }]}>Real-time 1v1 against another player</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: "#7C3AED22" }]}>
          <View style={styles.liveDot} />
          <Text style={{ color: "#7C3AED", fontSize: 11, fontWeight: "700" as const }}>LIVE</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: "700" as const },
  subtitle: { fontSize: 14, marginTop: 2 },
  bannerWrap: { height: 200, marginHorizontal: 16, marginTop: 8, borderRadius: 16, overflow: "hidden" },
  banner: { width: "100%", height: "100%" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "flex-end", padding: 20, gap: 10 },
  bannerText: { color: "#FFFFFF", fontSize: 28, fontWeight: "900" as const, letterSpacing: 3 },
  battleBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30,
  },
  battleBtnText: { color: "#0A0E1A", fontSize: 16, fontWeight: "700" as const },
  noticeText: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 12 },
  statCard: {
    flex: 1, alignItems: "center", padding: 12,
    borderRadius: 12, borderWidth: 1,
  },
  statValue: { fontSize: 18, fontWeight: "700" as const },
  statLabel: { fontSize: 11, marginTop: 2 },
  deckSection: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  deckRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  deckIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  deckName: { fontSize: 15, fontWeight: "600" as const },
  deckCount: { fontSize: 12, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  warningBanner: { flexDirection: "row", alignItems: "center", marginTop: 12, padding: 10, borderRadius: 8 },
  comingSoon: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  csTitle: { fontSize: 14, fontWeight: "600" as const },
  csSub: { fontSize: 12 },
  soonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  onlineCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 16, borderWidth: 1.5,
  },
  onlineIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7C3AED" },
});
