import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export function DailyRewardModal() {
  const colors = useColors();
  const { player, dailyRewardReady, claimDailyReward } = useGame();
  const [visible, setVisible] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<{ gold: number; gems: number; packs: number } | null>(null);

  if (!dailyRewardReady || !player) return null;

  const day = ((player.consecutiveLogins - 1) % 7) + 1;
  const DAYS = [
    { gold: 100, gems: 0, packs: 0, label: "Day 1" },
    { gold: 150, gems: 0, packs: 0, label: "Day 2" },
    { gold: 200, gems: 5, packs: 1, label: "Day 3" },
    { gold: 250, gems: 0, packs: 0, label: "Day 4" },
    { gold: 300, gems: 10, packs: 1, label: "Day 5" },
    { gold: 350, gems: 0, packs: 0, label: "Day 6" },
    { gold: 500, gems: 20, packs: 3, label: "Day 7" },
  ];

  async function handleClaim() {
    setClaiming(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const r = await claimDailyReward();
    setResult(r);
    setClaiming(false);
  }

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#1E1040", "#0A0E1A"]}
          style={[styles.modal, { borderColor: colors.gold + "66" }]}
        >
          <Text style={[styles.title, { color: colors.gold }]}>Daily Reward</Text>
          <Text style={[styles.streak, { color: colors.mutedForeground }]}>
            {player.consecutiveLogins} day streak
          </Text>

          {/* Day grid */}
          <View style={styles.daysGrid}>
            {DAYS.map((d, i) => {
              const dayNum = i + 1;
              const isPast = dayNum < day;
              const isCurrent = dayNum === day;
              return (
                <View
                  key={i}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isPast ? colors.secondary : isCurrent ? colors.gold + "33" : colors.card,
                      borderColor: isCurrent ? colors.gold : colors.border,
                      borderWidth: isCurrent ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 9, color: colors.mutedForeground, marginBottom: 2 }}>{d.label}</Text>
                  <Text style={{ fontSize: 14, color: isPast ? colors.mutedForeground : colors.gold }}>
                    {isPast ? "✓" : "🪙"}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.foreground }}>{d.gold}g</Text>
                  {d.packs > 0 && <Text style={{ fontSize: 8, color: "#60A5FA" }}>+{d.packs}📦</Text>}
                </View>
              );
            })}
          </View>

          {!result ? (
            <TouchableOpacity
              style={[styles.claimBtn, { backgroundColor: colors.gold }]}
              onPress={handleClaim}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color="#0A0E1A" />
              ) : (
                <Text style={[styles.claimText, { color: "#0A0E1A" }]}>Claim Reward</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.resultBox}>
              <Text style={[styles.resultTitle, { color: colors.gold }]}>Claimed!</Text>
              <Text style={[styles.resultDetail, { color: colors.foreground }]}>+{result.gold} Gold</Text>
              {result.gems > 0 && <Text style={[styles.resultDetail, { color: "#A78BFA" }]}>+{result.gems} Gems</Text>}
              {result.packs > 0 && <Text style={[styles.resultDetail, { color: "#60A5FA" }]}>+{result.packs} Pack{result.packs > 1 ? "s" : ""}</Text>}
              <TouchableOpacity
                style={[styles.closeBtn, { borderColor: colors.border }]}
                onPress={() => setVisible(false)}
              >
                <Text style={{ color: colors.mutedForeground }}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#00000099", alignItems: "center", justifyContent: "center" },
  modal: { width: 320, borderRadius: 20, padding: 24, borderWidth: 1, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700" as const, marginBottom: 4 },
  streak: { fontSize: 13, marginBottom: 20 },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 24 },
  dayCell: { width: 76, height: 70, borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 4 },
  claimBtn: { width: "100%", height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  claimText: { fontSize: 16, fontWeight: "700" as const },
  resultBox: { alignItems: "center", gap: 6 },
  resultTitle: { fontSize: 22, fontWeight: "700" as const },
  resultDetail: { fontSize: 16, fontWeight: "600" as const },
  closeBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
});
