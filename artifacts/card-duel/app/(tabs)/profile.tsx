import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

type ProfileTab = "stats" | "leaderboard";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { player, collection, decks, leaderboard, updatePlayer, buyPremiumPass } = useGame();
  const [tab, setTab] = useState<ProfileTab>("stats");
  const [editModal, setEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState(player?.username ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const btmPad = Platform.OS === "web" ? 34 + 84 : 84;

  const winRate = player && (player.wins + player.losses) > 0
    ? Math.round(player.wins / (player.wins + player.losses) * 100)
    : 0;

  const xpNeeded = (player?.level ?? 1) * 100;
  const xpProgress = Math.min((player?.xp ?? 0) / xpNeeded, 1);

  async function handleSaveUsername() {
    if (!newUsername.trim()) return;
    await updatePlayer({ username: newUsername.trim() });
    setEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleBuyPremium() {
    Alert.alert("Premium Pass", "Get 2x gold, 3 daily packs, and an exclusive legendary card for 300 Gems?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Buy (300 Gems)", onPress: async () => {
          const ok = await buyPremiumPass();
          if (!ok) Alert.alert("Not enough gems", "You need 300 gems.");
          else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Premium Activated!", "Welcome to Premium. Enjoy your perks!");
          }
        }
      },
    ]);
  }

  const STATS = [
    { label: "Total Cards", value: collection.length, icon: "layers" as const, color: "#7C3AED" },
    { label: "Decks Built", value: decks.length, icon: "grid" as const, color: "#3B82F6" },
    { label: "Wins", value: player?.wins ?? 0, icon: "award" as const, color: "#22C55E" },
    { label: "Losses", value: player?.losses ?? 0, icon: "x-circle" as const, color: "#EF4444" },
    { label: "Win Rate", value: `${winRate}%`, icon: "percent" as const, color: colors.gold },
    { label: "Rank", value: `#${player?.rank ?? "—"}`, icon: "trending-up" as const, color: "#FF6B35" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0A1A2E", "#0A0E1A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        {/* Avatar & name */}
        <View style={styles.profileRow}>
          <LinearGradient
            colors={[colors.gold + "88", colors.gold + "44"]}
            style={styles.bigAvatar}
          >
            <Text style={styles.bigAvatarText}>
              {(player?.username ?? "?")[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={styles.usernameRow}>
              <Text style={[styles.username, { color: colors.foreground }]}>
                {player?.username ?? "Trainer"}
              </Text>
              <TouchableOpacity onPress={() => { setNewUsername(player?.username ?? ""); setEditModal(true); }}>
                <Feather name="edit-3" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.levelBadge, { backgroundColor: colors.gold + "33" }]}>
                <Text style={[styles.levelText, { color: colors.gold }]}>Lv.{player?.level}</Text>
              </View>
              {player?.premiumPass && (
                <View style={[styles.premBadge, { backgroundColor: "#7C3AED33" }]}>
                  <Text style={[styles.premText, { color: "#A78BFA" }]}>PREMIUM</Text>
                </View>
              )}
            </View>
            {/* XP bar */}
            <View style={[styles.xpBarBg, { backgroundColor: colors.secondary }]}>
              <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any, backgroundColor: colors.gold }]} />
            </View>
            <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
              {player?.xp ?? 0} / {xpNeeded} XP
            </Text>
          </View>
        </View>

        {/* Currency */}
        <View style={styles.currencyRow}>
          <View style={[styles.currBadge, { backgroundColor: colors.card }]}>
            <Text style={{ fontSize: 14 }}>🪙</Text>
            <Text style={[styles.currText, { color: colors.gold }]}>{player?.gold ?? 0}</Text>
          </View>
          <View style={[styles.currBadge, { backgroundColor: colors.card }]}>
            <Text style={{ fontSize: 14 }}>💎</Text>
            <Text style={[styles.currText, { color: "#A78BFA" }]}>{player?.gems ?? 0}</Text>
          </View>
          {!player?.premiumPass && (
            <TouchableOpacity
              style={[styles.premBtn, { backgroundColor: "#4C1D95" }]}
              onPress={handleBuyPremium}
            >
              <Text style={{ color: colors.gold, fontSize: 12, fontWeight: "700" as const }}>👑 Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab */}
        <View style={[styles.tabRow, { backgroundColor: colors.card }]}>
          {(["stats", "leaderboard"] as ProfileTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, { backgroundColor: tab === t ? colors.secondary : "transparent" }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {tab === "stats" ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: btmPad }}>
          <View style={styles.statsGrid}>
            {STATS.map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={s.icon} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Premium info */}
          {player?.premiumPass && (
            <LinearGradient
              colors={["#4C1D95", "#1E0333"]}
              style={styles.premiumCard}
            >
              <Text style={{ fontSize: 28 }}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.premiumTitle, { color: colors.gold }]}>Premium Active</Text>
                <Text style={[styles.premiumSub, { color: "#C4B5FD" }]}>
                  Expires: {player.premiumPassExpiry ? new Date(player.premiumPassExpiry).toLocaleDateString() : "N/A"}
                </Text>
              </View>
            </LinearGradient>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={item => item.playerId}
          contentContainerStyle={{ padding: 16, paddingBottom: btmPad }}
          renderItem={({ item }) => (
            <View style={[
              styles.lbRow,
              {
                backgroundColor: item.isCurrentPlayer ? colors.gold + "22" : colors.card,
                borderColor: item.isCurrentPlayer ? colors.gold + "66" : colors.border,
              },
            ]}>
              <Text style={[
                styles.lbRank,
                {
                  color: item.rank === 1 ? colors.gold : item.rank === 2 ? colors.silver : item.rank === 3 ? colors.bronze : colors.mutedForeground,
                  fontWeight: item.rank <= 3 ? "700" as const : "400" as const,
                },
              ]}>
                {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : `#${item.rank}`}
              </Text>
              <View style={[styles.lbAvatar, { backgroundColor: item.avatarColor }]}>
                <Text style={styles.lbAvatarText}>{item.username[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lbName, { color: colors.foreground, fontWeight: item.isCurrentPlayer ? "700" as const : "400" as const }]}>
                  {item.username}{item.isCurrentPlayer ? " (You)" : ""}
                </Text>
                <Text style={[styles.lbMeta, { color: colors.mutedForeground }]}>Lv.{item.level}</Text>
              </View>
              <Text style={[styles.lbWins, { color: "#22C55E" }]}>{item.wins}W</Text>
            </View>
          )}
        />
      )}

      {/* Edit username modal */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.editOverlay}>
          <View style={[styles.editModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.editTitle, { color: colors.foreground }]}>Change Username</Text>
            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              style={[styles.editInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
              maxLength={20}
              autoFocus
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: colors.border }]}
                onPress={() => setEditModal(false)}
              >
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveUsername}
              >
                <Text style={{ color: "#0A0E1A", fontWeight: "700" as const }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  profileRow: { flexDirection: "row", gap: 16, alignItems: "flex-start", marginBottom: 14 },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  bigAvatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" as const },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  username: { fontSize: 22, fontWeight: "700" as const },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 6, marginBottom: 8 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 12, fontWeight: "700" as const },
  premBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  premText: { fontSize: 12, fontWeight: "700" as const },
  xpBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 3 },
  xpText: { fontSize: 11, marginTop: 3 },
  currencyRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  currBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  currText: { fontSize: 14, fontWeight: "700" as const },
  premBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600" as const },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47%", padding: 16, borderRadius: 14, alignItems: "center", gap: 6, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: "700" as const },
  statLabel: { fontSize: 12 },
  premiumCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16 },
  premiumTitle: { fontSize: 15, fontWeight: "700" as const },
  premiumSub: { fontSize: 12, marginTop: 2 },
  lbRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1,
  },
  lbRank: { width: 36, fontSize: 16, textAlign: "center" },
  lbAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  lbAvatarText: { color: "#FFF", fontSize: 16, fontWeight: "700" as const },
  lbName: { fontSize: 14 },
  lbMeta: { fontSize: 11, marginTop: 1 },
  lbWins: { fontSize: 14, fontWeight: "700" as const },
  editOverlay: { flex: 1, backgroundColor: "#000000AA", alignItems: "center", justifyContent: "center" },
  editModal: { width: 300, borderRadius: 20, padding: 24, borderWidth: 1 },
  editTitle: { fontSize: 18, fontWeight: "700" as const, marginBottom: 16 },
  editInput: { borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, marginBottom: 16 },
  editBtns: { flexDirection: "row", gap: 10 },
  editBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },
});
