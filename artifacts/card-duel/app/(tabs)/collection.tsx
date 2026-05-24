import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardItem } from "@/components/CardItem";
import { getTypeColor } from "@/constants/cardData";
import type { CardType } from "@/constants/gameTypes";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | CardType;
type SortKey = "name" | "rarity" | "attack";

const RARITY_ORDER: Record<string, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
const TYPES: Array<{ key: FilterType; label: string }> = [
  { key: "all", label: "All" },
  { key: "fire", label: "Fire" },
  { key: "water", label: "Water" },
  { key: "grass", label: "Grass" },
  { key: "electric", label: "Electric" },
  { key: "dark", label: "Dark" },
  { key: "metal", label: "Metal" },
  { key: "colorless", label: "??" },
];

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, decks, markCardsAsSeen } = useGame();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortKey>("rarity");
  const [search, setSearch] = useState("");

  useEffect(() => {
    markCardsAsSeen();
  }, []);

  const activeDeck = decks.find(d => d.isActive);
  const deckCount = activeDeck?.cardIds.length ?? 0;
  const newCount = collection.filter(c => c.isNew).length;

  const filtered = useMemo(() => {
    let result = [...collection];
    if (filter !== "all") result = result.filter(c => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      if (sort === "rarity") return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
      if (sort === "attack") return b.attack - a.attack;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [collection, filter, sort, search]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const btmPad = Platform.OS === "web" ? 34 + 84 : 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0A2E", "#0A0E1A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Collection</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {collection.length} cards{newCount > 0 ? ` · ${newCount} new` : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.deckBtn, { backgroundColor: colors.secondary, borderColor: colors.gold + "66" }]}
            onPress={() => router.push("/deck-builder")}
          >
            <Feather name="layers" size={14} color={colors.gold} />
            <Text style={[styles.deckBtnText, { color: colors.gold }]}>{deckCount}/20</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search cards..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setFilter(t.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === t.key
                    ? (t.key === "all" ? colors.primary : getTypeColor(t.key))
                    : colors.card,
                  borderColor: filter === t.key ? "transparent" : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterChipText, {
                color: filter === t.key ? (t.key === "all" ? "#0A0E1A" : "#FFF") : colors.mutedForeground,
              }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort row */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>{filtered.length} cards</Text>
          <View style={styles.sortButtons}>
            {(["rarity", "attack", "name"] as SortKey[]).map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setSort(s)}
                style={[styles.sortBtn, { backgroundColor: sort === s ? colors.secondary : "transparent" }]}
              >
                <Text style={[styles.sortBtnText, { color: sort === s ? colors.foreground : colors.mutedForeground }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="layers" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No cards found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={3}
          keyExtractor={item => item.id + item.quantity}
          contentContainerStyle={{ padding: 12, paddingBottom: btmPad }}
          renderItem={({ item }) => (
            <CardItem card={item} size="medium" showQuantity />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "700" as const },
  headerSub: { fontSize: 13, marginTop: 2 },
  deckBtn: {
    flexDirection: "row", gap: 6, alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  deckBtnText: { fontSize: 13, fontWeight: "600" as const },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    marginRight: 8, borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: "600" as const },
  sortRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8 },
  sortLabel: { fontSize: 12 },
  sortButtons: { flexDirection: "row", gap: 4 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sortBtnText: { fontSize: 11, fontWeight: "600" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16 },
});
