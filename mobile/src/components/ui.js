import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { badgeTone } from "../utils";

export function Screen({ children, onRefresh, refreshing, title, subtitle, right, kicker }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        {title ? <Hero kicker={kicker} title={title} subtitle={subtitle} right={right} /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Hero({ kicker, title, subtitle, right }) {
  return (
    <View style={styles.hero}>
      <View style={{ flex: 1 }}>
        {!!kicker && <Text style={styles.kicker}>{kicker}</Text>}
        <Text style={styles.h1}>{title}</Text>
        {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function StatRow({ items }) {
  return (
    <View style={styles.stats}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={item.onPress} style={[styles.stat, item.tone === "navy" && styles.statNavy, item.tone === "green" && styles.statGreen, item.tone === "gold" && styles.statGold]}>
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text style={styles.statValue}>{item.value}</Text>
          {!!item.desc && <Text style={styles.statDesc}>{item.desc}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

export function Card({ children, onPress, style }) {
  const Inner = (
    <View style={[styles.card, style]}>{children}</View>
  );
  if (onPress) return <Pressable onPress={onPress}>{Inner}</Pressable>;
  return Inner;
}

export function Badge({ status, label, text, tone }) {
  const shown = text || label || status || "—";
  const mapped = tone === "ok" ? "on" : tone === "bad" ? "off" : tone === "orange" ? "warn" : tone === "muted" ? "off" : tone || badgeTone(status || label || text);
  return (
    <View style={[styles.badge, mapped === "on" && styles.badgeOn, mapped === "warn" && styles.badgeWarn, mapped === "off" && styles.badgeOff]}>
      <Text style={styles.badgeText}>{shown}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, tone = "primary" }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        tone === "navy" && { backgroundColor: colors.navy2 },
        tone === "danger" && { backgroundColor: colors.red },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

export function SearchBar({ value, onChangeText, placeholder = "Search" }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      style={styles.search}
    />
  );
}

export function EmptyState({ title, text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title || "Nothing here yet"}</Text>
      <Text style={styles.emptyText}>{text || "Pull to refresh, or add a record."}</Text>
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function LoadingBlock() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, secure, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value == null ? "" : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { height: 90, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export function ChipSelect({ label, value, options, onChange }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(options || []).map((opt) => {
          const v = typeof opt === "object" ? opt.value : opt;
          const l = typeof opt === "object" ? opt.label : opt;
          const on = String(value) === String(v);
          return (
            <Pressable key={String(v)} onPress={() => onChange(v)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{l}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function FormModal({ visible, title, children, onClose, onSave, saving, error, hideSave }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}><Text style={styles.link}>Close</Text></Pressable>
          </View>
          <ScrollView>{children}</ScrollView>
          <ErrorText>{error}</ErrorText>
          {!hideSave && <PrimaryButton title={saving ? "Saving…" : "Save"} onPress={onSave} disabled={saving} />}
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmModal({ visible, title, text, onClose, onConfirm, confirmTitle = "Confirm" }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={[styles.sub, { marginVertical: 12 }]}>{text}</Text>
          <PrimaryButton title={confirmTitle} onPress={onConfirm} />
          <Pressable onPress={onClose} style={{ marginTop: 12, alignItems: "center" }}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function MenuRow({ title, subtitle, onPress, onLongPress, right }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.menuRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.statDesc}>{subtitle}</Text>}
      </View>
      {right}
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

export const Row = MenuRow;
export const Title = Hero;
export const Empty = EmptyState;
export const Loading = LoadingBlock;
export const SearchField = SearchBar;

export function Stat({ label, value, hint, tone }) {
  return (
    <View style={[styles.stat, { width: "48%" }, tone === "navy" && styles.statNavy, tone === "green" && styles.statGreen]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!hint && <Text style={styles.statDesc}>{hint}</Text>}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Could not load</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {onRetry ? <PrimaryButton title="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

export function GhostButton({ title, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={styles.chipText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: { flexDirection: "row", gap: 12, marginBottom: 16, alignItems: "flex-start" },
  kicker: { color: colors.primary, fontWeight: "800", letterSpacing: 1, fontSize: 11, textTransform: "uppercase" },
  h1: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 4 },
  sub: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  stat: { backgroundColor: colors.card, borderRadius: 16, padding: 14, width: "48%", borderWidth: 1, borderColor: colors.border },
  statNavy: { backgroundColor: colors.navy2 },
  statGreen: { borderColor: "rgba(34,197,94,0.3)" },
  statGold: { borderColor: "rgba(232,184,109,0.35)" },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 6 },
  statDesc: { color: colors.muted, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOn: { backgroundColor: "rgba(34,197,94,0.15)" },
  badgeWarn: { backgroundColor: "rgba(232,184,109,0.18)" },
  badgeOff: { backgroundColor: "rgba(248,113,113,0.15)" },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  btnText: { color: colors.white, fontWeight: "800" },
  search: { backgroundColor: colors.card2, color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  empty: { alignItems: "center", padding: 28 },
  emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  emptyText: { color: colors.muted, marginTop: 6, textAlign: "center" },
  error: { color: colors.red, marginVertical: 8 },
  loading: { padding: 40, alignItems: "center" },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: colors.navy, color: colors.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  chip: { backgroundColor: colors.navy, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: "700" },
  chipTextOn: { color: colors.white },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.navy2, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "88%" },
  modalHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  link: { color: colors.accent, fontWeight: "700" },
  menuRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  menuTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  chev: { color: colors.muted, fontSize: 24, marginLeft: 8 },
});
