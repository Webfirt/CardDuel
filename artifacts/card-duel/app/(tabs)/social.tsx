import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCardById } from "@/constants/cardData";
import type { Friend, OwnedCard, TradeOffer } from "@/constants/gameTypes";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { CardItem } from "@/components/CardItem";

type SocialTab = "friends" | "trades";

export default function SocialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { player, friends, tradeOffers, collection, addFriend, removeFriend, sendTradeOffer, respondToTrade } = useGame();
  const [tab, setTab] = useState<SocialTab>("friends");
  const [addInput, setAddInput] = useState("");
  const [tradeModal, setTradeModal] = useState<Friend | null>(null);
  const [myOffer, setMyOffer] = useState<string[]>([]);
  const [theirRequest, setTheirRequest] = useState<string[]>([]);
  const [selectStep, setSelectStep] = useState<"mine" | "theirs">("mine");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const btmPad = Platform.OS === "web" ? 34 + 84 : 84;

  const pendingTrades = tradeOffers.filter(t => t.status === "pending");
  const resolvedTrades = tradeOffers.filter(t => t.status !== "pending");

  async function handleAddFriend() {
    const name = addInput.trim();
    if (!name) return;
    if (friends.some(f => f.username.toLowerCase() === name.toLowerCase())) {
      Alert.alert("Already friends!"); return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addFriend(name);
    setAddInput("");
  }

  async function handleSendTrade() {
    if (!tradeModal || myOffer.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sendTradeOffer(tradeModal.id, myOffer, theirRequest);
    setTradeModal(null);
    setMyOffer([]);
    setTheirRequest([]);
  }

  function toggleCard(cardId: string, step: "mine" | "theirs") {
    Haptics.selectionAsync();
    if (step === "mine") {
      setMyOffer(prev => prev.includes(cardId) ? prev.filter(x => x !== cardId) : [...prev, cardId]);
    } else {
      setTheirRequest(prev => prev.includes(cardId) ? prev.filter(x => x !== cardId) : [...prev, cardId]);
    }
  }

  function getStatusColor(status: TradeOffer["status"]) {
    if (status === "accepted") return "#22C55E";
    if (status === "declined") return "#EF4444";
    if (status === "cancelled") return colors.mutedForeground;
    return "#EAB308";
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0A1A1A", "#0A0E1A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Social</Text>
        <View style={[styles.tabRow, { backgroundColor: colors.card }]}>
          {(["friends", "trades"] as SocialTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, { backgroundColor: tab === t ? colors.secondary : "transparent" }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                {t === "friends" ? `Friends (${friends.length})` : `Trades${pendingTrades.length > 0 ? ` (${pendingTrades.length})` : ""}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {tab === "friends" ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: btmPad }}>
          {/* Add friend */}
          <View style={[styles.addFriend, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={addInput}
              onChangeText={setAddInput}
              placeholder="Enter username to add..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.addInput, { color: colors.foreground }]}
              onSubmitEditing={handleAddFriend}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddFriend}
            >
              <Feather name="user-plus" size={16} color="#0A0E1A" />
            </TouchableOpacity>
          </View>

          {/* Friends list */}
          {friends.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="users" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No friends yet</Text>
            </View>
          ) : (
            friends.map(friend => (
              <View key={friend.id} style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.avatar, { backgroundColor: friend.avatarColor }]}>
                  <Text style={styles.avatarText}>{friend.username[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.friendNameRow}>
                    <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.username}</Text>
                    <View style={[styles.onlineDot, { backgroundColor: friend.isOnline ? "#22C55E" : colors.border }]} />
                  </View>
                  <Text style={[styles.friendMeta, { color: colors.mutedForeground }]}>
                    Lv.{friend.level} · {friend.wins} wins
                  </Text>
                </View>
                <View style={styles.friendActions}>
                  <TouchableOpacity
                    style={[styles.tradeBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => { setTradeModal(friend); setSelectStep("mine"); }}
                  >
                    <Feather name="refresh-cw" size={14} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Remove friend?", friend.username, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: () => removeFriend(friend.id) },
                      ]);
                    }}
                  >
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: btmPad }}>
          {tradeOffers.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="refresh-cw" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No trades yet</Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                Go to Friends to initiate a trade
              </Text>
            </View>
          ) : (
            tradeOffers.map(trade => (
              <View key={trade.id} style={[styles.tradeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.tradeHeader}>
                  <Text style={[styles.tradePeer, { color: colors.foreground }]}>
                    Trade with {trade.fromPlayerId === player?.id ? trade.toPlayerId : trade.fromUsername}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trade.status) + "22" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(trade.status) }]}>
                      {trade.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.tradeCards}>
                  <View style={styles.tradeCol}>
                    <Text style={[styles.tradeColLabel, { color: colors.mutedForeground }]}>Offering</Text>
                    <View style={styles.cardRow}>
                      {trade.offeredCardIds.slice(0, 3).map(id => {
                        const c = getCardById(id);
                        return c ? <CardItem key={id} card={c} size="small" /> : null;
                      })}
                    </View>
                  </View>
                  <Feather name="arrow-right" size={20} color={colors.mutedForeground} style={{ alignSelf: "center", marginTop: 20 }} />
                  <View style={styles.tradeCol}>
                    <Text style={[styles.tradeColLabel, { color: colors.mutedForeground }]}>Requesting</Text>
                    <View style={styles.cardRow}>
                      {trade.requestedCardIds.slice(0, 3).map(id => {
                        const c = getCardById(id);
                        return c ? <CardItem key={id} card={c} size="small" /> : null;
                      })}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Trade modal */}
      <Modal visible={!!tradeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#111827", "#0A0E1A"]}
            style={[styles.tradeModal, { borderColor: colors.border }]}
          >
            <View style={styles.tradeModalHeader}>
              <Text style={[styles.tradeModalTitle, { color: colors.foreground }]}>
                Trade with {tradeModal?.username}
              </Text>
              <TouchableOpacity onPress={() => { setTradeModal(null); setMyOffer([]); setTheirRequest([]); }}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={[styles.stepTabs, { backgroundColor: colors.secondary }]}>
              <TouchableOpacity
                style={[styles.stepTab, { backgroundColor: selectStep === "mine" ? colors.primary : "transparent" }]}
                onPress={() => setSelectStep("mine")}
              >
                <Text style={[styles.stepTabText, { color: selectStep === "mine" ? "#0A0E1A" : colors.mutedForeground }]}>
                  Your offer ({myOffer.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepTab, { backgroundColor: selectStep === "theirs" ? colors.primary : "transparent" }]}
                onPress={() => setSelectStep("theirs")}
              >
                <Text style={[styles.stepTabText, { color: selectStep === "theirs" ? "#0A0E1A" : colors.mutedForeground }]}>
                  You want ({theirRequest.length})
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={collection}
              numColumns={4}
              keyExtractor={c => c.id}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => (
                <CardItem
                  card={item}
                  size="small"
                  isSelected={selectStep === "mine" ? myOffer.includes(item.id) : theirRequest.includes(item.id)}
                  onPress={() => toggleCard(item.id, selectStep)}
                />
              )}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: myOffer.length > 0 ? colors.primary : colors.secondary }]}
              onPress={handleSendTrade}
              disabled={myOffer.length === 0}
            >
              <Text style={[styles.sendBtnText, { color: myOffer.length > 0 ? "#0A0E1A" : colors.mutedForeground }]}>
                Send Trade Offer
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "700" as const, marginBottom: 14 },
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabBtnText: { fontSize: 13, fontWeight: "600" as const },
  addFriend: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 14, marginBottom: 16, borderWidth: 1,
  },
  addInput: { flex: 1, fontSize: 14 },
  addBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  friendCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" as const },
  friendNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  friendName: { fontSize: 15, fontWeight: "600" as const },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  friendMeta: { fontSize: 12, marginTop: 2 },
  friendActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  tradeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: "600" as const },
  emptyHint: { fontSize: 13 },
  tradeCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  tradeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  tradePeer: { fontSize: 14, fontWeight: "600" as const },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" as const },
  tradeCards: { flexDirection: "row", alignItems: "center", gap: 8 },
  tradeCol: { flex: 1 },
  tradeColLabel: { fontSize: 11, marginBottom: 6 },
  cardRow: { flexDirection: "row" },
  modalOverlay: { flex: 1, backgroundColor: "#000000BB", justifyContent: "flex-end" },
  tradeModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderBottomWidth: 0 },
  tradeModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  tradeModalTitle: { fontSize: 18, fontWeight: "700" as const },
  stepTabs: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 14 },
  stepTab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  stepTabText: { fontSize: 12, fontWeight: "600" as const },
  sendBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 14 },
  sendBtnText: { fontSize: 15, fontWeight: "700" as const },
});
