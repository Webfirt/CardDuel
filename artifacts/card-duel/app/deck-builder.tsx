import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert, FlatList, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRarityColor, getTypeColor } from "@/constants/cardData";
import type { Deck, OwnedCard } from "@/constants/gameTypes";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { CardItem } from "@/components/CardItem";

const MAX_DECK_SIZE = 20;
const MAX_COPIES = 2;

export default function DeckBuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, decks, updateDeck, createDeck } = useGame();
  const [activeDeckId, setActiveDeckId] = useState<string>(decks.find(d => d.isActive)?.id ?? decks[0]?.id ?? "");
  const [view, setView] = useState<"deck" | "collection">("deck");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const btmPad = Platform.OS === "web" ? 34 : 16;

  const activeDeck = decks.find(d => d.id === activeDeckId);

  const cardCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    if (activeDeck) {
      for (const id of activeDeck.cardIds) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [activeDeck]);

  const deckCards: OwnedCard[] = useMemo(() => {
    return Object.entries(cardCounts).map(([id, count]) => {
      const c = collection.find(x => x.id === id);
      if (!c) return null;
      return { ...c, quantity: count };
    }).filter(Boolean) as OwnedCard[];
  }, [cardCounts, collection]);

  function addCard(card: OwnedCard) {
    if (!activeDeck) return;
    const count = cardCounts[card.id] ?? 0;
    if (activeDeck.cardIds.length >= MAX_DECK_SIZE) {
      Alert.alert("Deck full", `Max ${MAX_DECK_SIZE} cards per deck.`); return;
    }
    if (count >= MAX_COPIES) {
      Alert.alert("Max copies", `Max ${MAX_COPIES} copies of any card.`); return;
    }
    Haptics.selectionAsync();
    const updated: Deck = { ...activeDeck, cardIds: [...activeDeck.cardIds, card.id] };
    updateDeck(updated);
  }

  function removeCard(cardId: string) {
    if (!activeDeck) return;
    Haptics.selectionAsync();
    const idx = activeDeck.cardIds.lastIndexOf(cardId);
    if (idx === -1) return;
    const newIds = [...activeDeck.cardIds];
    newIds.splice(idx, 1);
    const updated: Deck = { ...activeDeck, cardIds: newIds };
    updateDeck(updated);
  }

  function setDeckActive(deckId: string) {
    for (const d of decks) {
      updateDeck({ ...d, isActive: d.id === deckId });
    }
    setActiveDeckId(deckId);
  }

  async function handleNewDeck() {
    Alert.prompt?.("New Deck", "Enter deck name", async (name) => {
      if (!name?.trim()) return;
      const d = await createDeck(name.trim());
      setActiveDeckId(d.id);
    });
    // Fallback for non-iOS
    if (!Alert.prompt) {
      const d = await createDeck(`Deck ${decks.length + 1}`);
      setActiveDeckId(d.id);
    }
  }

  const deckCount = activeDeck?.cardIds.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#0A0E1A", "#111827"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Deck Builder</Text>
          <TouchableOpacity onPress={handleNewDeck} style={[styles.newBtn, { borderColor: colors.border }]}>
            <Feather name="plus" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Deck selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deckScroll}>
          {decks.map(d => (
            <TouchableOpacity
              key={d.id}
              onPress={() => { setActiveDeckId(d.id); setDeckActive(d.id); }}
              style={[
                styles.deckChip,
                {
                  backgroundColor: d.id === activeDeckId ? colors.primary : colors.card,
                  borderColor: d.isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.deckChipText, { color: d.id === activeDeckId ? "#0A0E1A" : colors.foreground }]}>
                {d.name}
              </Text>
              {d.isActive && (
                <View style={[styles.activeDot, { backgroundColor: d.id === activeDeckId ? "#0A0E1A" : "#22C55E" }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {deckCount} / {MAX_DECK_SIZE} cards
          </Text>
          <View style={[styles.progressBg, { backgroundColor: colors.secondary }]}>
            <View style={[
              styles.progressFill,
              {
                width: `${Math.min(deckCount / MAX_DECK_SIZE * 100, 100)}%` as any,
                backgroundColor: deckCount >= 10 ? colors.gold : colors.primary,
              },
            ]} />
          </View>
        </View>

        {/* View toggle */}
        <View style={[styles.viewToggle, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: view === "deck" ? colors.secondary : "transparent" }]}
            onPress={() => setView("deck")}
          >
            <Feather name="layers" size={14} color={view === "deck" ? colors.foreground : colors.mutedForeground} />
            <Text style={[styles.viewBtnText, { color: view === "deck" ? colors.foreground : colors.mutedForeground }]}>Deck</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: view === "collection" ? colors.secondary : "transparent" }]}
            onPress={() => setView("collection")}
          >
            <Feather name="grid" size={14} color={view === "collection" ? colors.foreground : colors.mutedForeground} />
            <Text style={[styles.viewBtnText, { color: view === "collection" ? colors.foreground : colors.mutedForeground }]}>Collection</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {view === "deck" ? (
        deckCards.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="layers" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Deck is empty</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>Switch to Collection to add cards</Text>
          </View>
        ) : (
          <FlatList
            data={deckCards}
            numColumns={3}
            keyExtractor={c => c.id + c.quantity}
            contentContainerStyle={{ padding: 12, paddingBottom: btmPad + 60 }}
            renderItem={({ item }) => (
              <View>
                <CardItem card={item} size="medium" showQuantity />
                <View style={styles.removeRow}>
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: "#EF444422", borderColor: "#EF444466" }]}
                    onPress={() => removeCard(item.id)}
                  >
                    <Feather name="minus" size={12} color="#EF4444" />
                  </TouchableOpacity>
                  <View style={[styles.addSmBtn, { backgroundColor: getTypeColor(item.type) + "33", borderColor: getTypeColor(item.type) + "66" }]}>
                    <Text style={[styles.countText, { color: colors.foreground }]}>{cardCounts[item.id] ?? 0}/{MAX_COPIES}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addSmBtn2, { backgroundColor: "#22C55E22", borderColor: "#22C55E66" }]}
                    onPress={() => addCard(item)}
                  >
                    <Feather name="plus" size={12} color="#22C55E" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      ) : (
        <FlatList
          data={collection}
          numColumns={3}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 12, paddingBottom: btmPad + 60 }}
          renderItem={({ item }) => {
            const inDeck = cardCounts[item.id] ?? 0;
            const atMax = inDeck >= MAX_COPIES || deckCount >= MAX_DECK_SIZE;
            return (
              <View>
                <CardItem
                  card={item}
                  size="medium"
                  showQuantity
                  isSelected={inDeck > 0}
                  onPress={() => addCard(item)}
                  disabled={atMax}
                />
                {inDeck > 0 && (
                  <View style={[styles.inDeckBadge, { backgroundColor: colors.gold }]}>
                    <Text style={{ fontSize: 9, fontWeight: "700" as const, color: "#0A0E1A" }}>In deck: {inDeck}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700" as const },
  newBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  deckScroll: { marginBottom: 12 },
  deckChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1.5,
  },
  deckChipText: { fontSize: 13, fontWeight: "600" as const },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  progressLabel: { fontSize: 12, width: 90 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  viewToggle: { flexDirection: "row", borderRadius: 12, padding: 4 },
  viewBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 9 },
  viewBtnText: { fontSize: 13, fontWeight: "600" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 18, fontWeight: "600" as const },
  emptyHint: { fontSize: 13 },
  removeRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 4 },
  removeBtn: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addSmBtn: { paddingHorizontal: 8, height: 24, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addSmBtn2: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  countText: { fontSize: 9, fontWeight: "700" as const },
  inDeckBadge: {
    position: "absolute", top: 4, left: 4,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
});
