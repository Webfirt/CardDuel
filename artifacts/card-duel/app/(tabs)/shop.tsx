import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert, Modal, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PACK_DEFINITIONS, generatePack } from "@/constants/cardData";
import type { Card } from "@/constants/gameTypes";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { CardItem } from "@/components/CardItem";

const GOLD_BUNDLES = [
  { id: "g1", amount: 500, gems: 0, price: "Daily Free", isFree: true, icon: "🪙" },
  { id: "g2", amount: 1000, gems: 100, price: "100 Gems", isFree: false, gemCost: 100, icon: "💰" },
  { id: "g3", amount: 5000, gems: 499, price: "499 Gems", isFree: false, gemCost: 499, icon: "💎" },
];

const PACK_ORDER: (keyof typeof PACK_DEFINITIONS)[] = [
  "basic", "fire_pack", "water_pack", "elec_pack", "grass_pack", "dark_pack", "metal_pack", "epic_pack", "legendary_pack"
];

const TYPE_EMOJIS: Record<string, string> = {
  fire: "🔥", water: "💧", grass: "🌿", electric: "⚡", dark: "🌑", metal: "⚙", colorless: "★",
};

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { player, spendGold, spendGems, addCardsToCollection, earnRewards, buyPremiumPass } = useGame();
  const [openedPack, setOpenedPack] = useState<Card[] | null>(null);
  const [freeClaimed, setFreeClaimed] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const btmPad = Platform.OS === "web" ? 34 + 84 : 84;

  async function handleBuyPack(packKey: keyof typeof PACK_DEFINITIONS) {
    const pack = PACK_DEFINITIONS[packKey];
    if (pack.cost === 0) return;
    const ok = await spendGold(pack.cost);
    if (!ok) {
      Alert.alert("Not enough gold", "Visit the gold bundles to get more gold.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cards = generatePack(packKey, pack.cardCount);
    await addCardsToCollection(cards);
    setOpenedPack(cards);
  }

  async function handleFreeGold() {
    if (freeClaimed) { Alert.alert("Already claimed today"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await earnRewards(500, 0);
    setFreeClaimed(true);
  }

  async function handleGemBundle(gemCost: number, goldAmount: number) {
    const ok = await spendGems(gemCost);
    if (!ok) { Alert.alert("Not enough gems", "Purchase gems to continue."); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await earnRewards(goldAmount, 0);
  }

  const packTypeColors: Record<string, string[]> = {
    basic: ["#374151", "#1F2937"], fire_pack: ["#7C2D12", "#431407"],
    water_pack: ["#1E3A5F", "#0C2340"], elec_pack: ["#713F12", "#3D2000"],
    grass_pack: ["#14532D", "#052E16"], dark_pack: ["#3B0764", "#1E0333"],
    metal_pack: ["#374151", "#1F2937"], epic_pack: ["#4C1D95", "#2E1065"],
    legendary_pack: ["#713F12", "#431407"],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0F1A0A", "#0A0E1A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Shop</Text>
          <View style={styles.currencyRow}>
            <View style={[styles.currencyBadge, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
              <Text style={{ color: colors.gold, fontSize: 14 }}>🪙</Text>
              <Text style={[styles.currencyText, { color: colors.gold }]}>{player?.gold ?? 0}</Text>
            </View>
            <View style={[styles.currencyBadge, { backgroundColor: colors.card, borderColor: "#7C3AED55" }]}>
              <Text style={{ fontSize: 14 }}>💎</Text>
              <Text style={[styles.currencyText, { color: "#A78BFA" }]}>{player?.gems ?? 0}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: btmPad }} showsVerticalScrollIndicator={false}>
        {/* Premium Pass */}
        {!player?.premiumPass && (
          <LinearGradient
            colors={["#4C1D95", "#1E0333"]}
            style={styles.premiumCard}
          >
            <View style={styles.premiumContent}>
              <Text style={{ fontSize: 24 }}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.premiumTitle, { color: colors.gold }]}>Monthly Premium Pass</Text>
                <Text style={[styles.premiumSub, { color: "#C4B5FD" }]}>
                  2x gold · 3 daily packs · Exclusive legendary card
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.premiumBtn, { backgroundColor: colors.gold }]}
                onPress={async () => {
                  const ok = await buyPremiumPass();
                  if (!ok) Alert.alert("Not enough gems", "You need 300 gems.");
                  else Alert.alert("Premium Activated!", "Enjoy your perks!");
                }}
              >
                <Text style={{ color: "#0A0E1A", fontSize: 12, fontWeight: "700" as const }}>300💎</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* Card Packs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Card Packs</Text>
          <View style={styles.packsGrid}>
            {PACK_ORDER.map(key => {
              const pack = PACK_DEFINITIONS[key];
              const gradColors = packTypeColors[key] ?? ["#374151", "#1F2937"];
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleBuyPack(key)}
                  activeOpacity={0.8}
                  style={styles.packWrapper}
                >
                  <LinearGradient
                    colors={gradColors as [string, string]}
                    style={[styles.packCard, { borderColor: colors.border }]}
                  >
                    <Text style={styles.packEmoji}>
                      {key === "basic" ? "🃏" : key === "epic_pack" ? "✨" : key === "legendary_pack" ? "⭐" : TYPE_EMOJIS[key.replace("_pack", "")] ?? "🃏"}
                    </Text>
                    <Text style={[styles.packName, { color: colors.foreground }]}>{pack.name}</Text>
                    <Text style={[styles.packCount, { color: colors.mutedForeground }]}>{pack.cardCount} cards</Text>
                    <View style={[styles.packPrice, { backgroundColor: colors.gold + "33" }]}>
                      <Text style={[styles.packPriceText, { color: colors.gold }]}>
                        {pack.cost === 0 ? "FREE" : `${pack.cost}🪙`}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Gold Bundles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gold Bundles</Text>
          {GOLD_BUNDLES.map(bundle => (
            <TouchableOpacity
              key={bundle.id}
              style={[styles.goldBundle, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}
              onPress={() => {
                if (bundle.isFree) handleFreeGold();
                else if (bundle.gemCost) handleGemBundle(bundle.gemCost, bundle.amount);
              }}
            >
              <Text style={{ fontSize: 28 }}>{bundle.icon}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.bundleAmount, { color: colors.gold }]}>+{bundle.amount} Gold</Text>
                {bundle.isFree && (
                  <Text style={{ color: "#22C55E", fontSize: 12 }}>Watch ad · Once per day</Text>
                )}
              </View>
              <View style={[
                styles.bundlePrice,
                { backgroundColor: bundle.isFree ? (freeClaimed ? colors.secondary : "#22C55E22") : "#7C3AED22",
                  borderColor: bundle.isFree ? (freeClaimed ? colors.border : "#22C55E") : "#7C3AED" },
              ]}>
                <Text style={{
                  color: bundle.isFree ? (freeClaimed ? colors.mutedForeground : "#22C55E") : "#A78BFA",
                  fontSize: 12, fontWeight: "700" as const,
                }}>
                  {bundle.isFree ? (freeClaimed ? "Claimed" : "FREE") : bundle.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Pack Opening Modal */}
      <Modal visible={!!openedPack} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={["#1E1040", "#0A0E1A"]} style={[styles.openModal, { borderColor: colors.gold + "44" }]}>
            <Text style={[styles.openTitle, { color: colors.gold }]}>New Cards!</Text>
            <View style={styles.openedCards}>
              {openedPack?.map((c, i) => (
                <CardItem key={i} card={c} size="small" />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.closePackBtn, { backgroundColor: colors.gold }]}
              onPress={() => setOpenedPack(null)}
            >
              <Text style={{ color: "#0A0E1A", fontWeight: "700" as const, fontSize: 15 }}>Collect All</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700" as const },
  currencyRow: { flexDirection: "row", gap: 8 },
  currencyBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  currencyText: { fontSize: 14, fontWeight: "700" as const },
  premiumCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 16, overflow: "hidden" },
  premiumContent: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  premiumTitle: { fontSize: 15, fontWeight: "700" as const },
  premiumSub: { fontSize: 12, marginTop: 2 },
  premiumBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, marginBottom: 14 },
  packsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  packWrapper: { width: "47%" },
  packCard: { borderRadius: 14, padding: 16, alignItems: "center", gap: 6, borderWidth: 1 },
  packEmoji: { fontSize: 36 },
  packName: { fontSize: 13, fontWeight: "700" as const, textAlign: "center" },
  packCount: { fontSize: 11 },
  packPrice: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  packPriceText: { fontSize: 13, fontWeight: "700" as const },
  goldBundle: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1,
  },
  bundleAmount: { fontSize: 16, fontWeight: "700" as const },
  bundlePrice: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: "#000000CC", justifyContent: "flex-end" },
  openModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderBottomWidth: 0 },
  openTitle: { fontSize: 26, fontWeight: "700" as const, textAlign: "center", marginBottom: 20 },
  openedCards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  closePackBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 16 },
});
