import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTypeColor, getRarityColor, getRarityStars } from "@/constants/cardData";
import type { Card, OwnedCard } from "@/constants/gameTypes";
import { useColors } from "@/hooks/useColors";

const TYPE_ICONS: Record<string, string> = {
  fire: "🔥", water: "💧", grass: "🌿", electric: "⚡", dark: "🌑", metal: "⚙", colorless: "★",
};

interface CardItemProps {
  card: Card | OwnedCard;
  onPress?: () => void;
  size?: "small" | "medium" | "large";
  isSelected?: boolean;
  disabled?: boolean;
  showQuantity?: boolean;
}

export function CardItem({ card, onPress, size = "medium", isSelected, disabled, showQuantity }: CardItemProps) {
  const colors = useColors();
  const typeColor = getTypeColor(card.type);
  const rarityColor = getRarityColor(card.rarity);
  const stars = getRarityStars(card.rarity);

  const dim = size === "small" ? 90 : size === "large" ? 160 : 120;
  const fontSize = size === "small" ? 8 : size === "large" ? 13 : 10;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.container, { width: dim, opacity: disabled ? 0.5 : 1 }]}
    >
      <LinearGradient
        colors={[typeColor + "CC", typeColor + "44", "#0A0E1A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          { width: dim, height: dim * 1.4, borderRadius: 10, borderColor: isSelected ? rarityColor : typeColor + "88", borderWidth: isSelected ? 2.5 : 1.5 },
        ]}
      >
        {/* Rarity glow for rare+ */}
        {["rare", "epic", "legendary"].includes(card.rarity) && (
          <View style={[styles.glowOverlay, { backgroundColor: rarityColor + "22" }]} />
        )}

        {/* Top: type icon + hp */}
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={{ fontSize: 8 }}>{TYPE_ICONS[card.type]}</Text>
          </View>
          {size !== "small" && (
            <Text style={[styles.hp, { color: "#FFFFFF", fontSize: fontSize - 1 }]}>
              {card.hp} HP
            </Text>
          )}
        </View>

        {/* Art area */}
        <View style={[styles.artArea, { backgroundColor: typeColor + "33" }]}>
          <Text style={{ fontSize: size === "small" ? 24 : 36 }}>{TYPE_ICONS[card.type]}</Text>
        </View>

        {/* Card name */}
        <Text style={[styles.name, { fontSize, color: "#FFFFFF" }]} numberOfLines={1}>
          {card.name}
        </Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {Array.from({ length: stars }).map((_, i) => (
            <Text key={i} style={{ fontSize: 7, color: rarityColor }}>★</Text>
          ))}
        </View>

        {/* Attack */}
        {size !== "small" && (
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: "#F87171" }]}>ATK {card.attack}</Text>
            <Text style={[styles.statText, { color: "#60A5FA" }]}>DEF {card.defense}</Text>
          </View>
        )}

        {/* Quantity badge */}
        {"quantity" in card && showQuantity && (card as OwnedCard).quantity > 1 && (
          <View style={[styles.quantityBadge, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 9, fontWeight: "700" as const, color: "#0A0E1A" }}>
              x{(card as OwnedCard).quantity}
            </Text>
          </View>
        )}

        {/* New badge */}
        {"isNew" in card && (card as OwnedCard).isNew && (
          <View style={styles.newBadge}>
            <Text style={{ fontSize: 8, fontWeight: "700" as const, color: "#FFFFFF" }}>NEW</Text>
          </View>
        )}

        {/* Selected overlay */}
        {isSelected && (
          <View style={[styles.selectedOverlay, { borderColor: rarityColor, borderRadius: 10 }]} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { margin: 4 },
  card: { overflow: "hidden", justifyContent: "space-between", padding: 6 },
  glowOverlay: { ...StyleSheet.absoluteFillObject },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  hp: { fontWeight: "700" as const },
  artArea: { flex: 1, marginVertical: 4, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "700" as const, textAlign: "center", marginTop: 2 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 1 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  statText: { fontSize: 8, fontWeight: "600" as const },
  quantityBadge: {
    position: "absolute", bottom: 4, right: 4,
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6,
  },
  newBadge: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "#EF4444", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    backgroundColor: "transparent",
  },
});
