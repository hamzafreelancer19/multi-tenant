import React, { useCallback, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSchools, updateSchool, uploadSchoolLogo } from "../api";
import { useAuth } from "../auth/AuthContext";
import { rootNavigate } from "../navigation/rootNav";
import { Badge, ErrorText, Field, LoadingBlock, PrimaryButton, Screen } from "../components/ui";
import { radius } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { apiError, asList, formatDate, mediaUrl } from "../utils";
import { getDefaultTenantDomain } from "../config";

function schoolInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState({ name: "", landing_contact_email: "", landing_contact_phone: "" });
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [localLogo, setLocalLogo] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await getSchools();
      const schools = asList(res.data);
      const mine =
        schools.find((s) => s.id === Number(user?.school) || s.id === Number(user?.school_id)) ||
        schools[0];
      setSchool(mine || null);
      setLocalLogo(null);
      setForm({
        name: mine?.name || "",
        landing_contact_email: mine?.landing_contact_email || "",
        landing_contact_phone: mine?.landing_contact_phone || "",
      });
      const stored = await AsyncStorage.getItem("schoolDomain");
      setDomain(stored || mine?.domain || getDefaultTenantDomain());
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load school settings."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      load();
    }, [user?.school, user?.school_id])
  );

  const save = async () => {
    if (!school) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await updateSchool(school.id, form);
      setMsg("School profile saved.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save settings."));
    } finally {
      setSaving(false);
    }
  };

  const pickLogo = async () => {
    if (!school?.id) return;
    setError("");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo permission is required to upload a logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLocalLogo(asset.uri);
    setUploadingLogo(true);
    setMsg("");
    try {
      const res = await uploadSchoolLogo(school.id, asset);
      if (res.data) setSchool(res.data);
      setMsg("School logo updated. Superadmin Schools list will show it too.");
      await load();
    } catch (err) {
      setLocalLogo(null);
      setError(apiError(err, "Logo upload failed. Use PNG/JPG under 2MB."));
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  const displayName = form.name || school?.name || user?.school_name || "Your school";
  const logoUrl = localLogo || mediaUrl(school?.logo_url || school?.logo);
  const planLabel =
    school?.plan_type && school.plan_type !== "None" ? school.plan_type : "No plan";
  const planStatus = school?.plan_status || "Inactive";

  return (
    <Screen onRefresh={load}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Text style={styles.kicker}>School</Text>
      <Text style={styles.pageTitle}>School profile</Text>
      <Text style={styles.pageSub}>Update how your school appears across Classora.</Text>

      <View style={styles.heroCard}>
        <Pressable onPress={pickLogo} disabled={uploadingLogo} style={styles.avatarWrap}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{schoolInitials(displayName)}</Text>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name={uploadingLogo ? "hourglass-outline" : "camera"} size={12} color="#fff" />
          </View>
        </Pressable>
        <View style={styles.heroMeta}>
          <Text style={styles.heroName} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={styles.heroDomain} numberOfLines={1}>
            {domain || "Domain not set"}
          </Text>
          <View style={styles.badgeRow}>
            <Badge status={planStatus} label={planLabel} />
            <Badge status={planStatus} label={planStatus} />
          </View>
          <Pressable onPress={pickLogo} disabled={uploadingLogo} style={styles.logoLink}>
            <Text style={styles.logoLinkText}>
              {uploadingLogo ? "Uploading logo…" : logoUrl ? "Change school logo" : "Add school logo"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.stat, styles.statOrange]}>
          <Ionicons name="diamond-outline" size={16} color={colors.primary} />
          <Text style={styles.statLabel}>Plan</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {planLabel}
          </Text>
        </View>
        <View style={[styles.stat, styles.statNavy]}>
          <Ionicons name="calendar-outline" size={16} color={colors.muted} />
          <Text style={styles.statLabel}>Expires</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {formatDate(school?.plan_expiry_date)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => rootNavigate("Subscription")}
        style={({ pressed }) => [styles.linkCard, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.linkIcon}>
          <Ionicons name="card-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Manage subscription</Text>
          <Text style={styles.linkSub}>Plans, billing & upgrade requests</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <ErrorText>{error}</ErrorText>
      {!!msg && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.successText}>{msg}</Text>
        </View>
      )}

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Ionicons name="school-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Profile details</Text>
        </View>
        <Field
          label="School name"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Sunrise Public School"
        />
        <Field
          label="Contact email"
          value={form.landing_contact_email}
          onChangeText={(v) => setForm({ ...form, landing_contact_email: v })}
          placeholder="office@school.com"
          keyboardType="email-address"
        />
        <Field
          label="Contact phone"
          value={form.landing_contact_phone}
          onChangeText={(v) => setForm({ ...form, landing_contact_phone: v })}
          placeholder="03xx…"
          keyboardType="phone-pad"
        />
        <PrimaryButton
          title={saving ? "Saving…" : "Save changes"}
          onPress={save}
          disabled={saving || !school}
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Ionicons name="globe-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Tenant domain</Text>
        </View>
        <View style={styles.domainBox}>
          <Text style={styles.domainLabel}>Connected as</Text>
          <Text style={styles.domainValue}>{domain || "Not set yet"}</Text>
          <Text style={styles.domainHint}>
            Domain is set automatically when you sign in. Platform admins can switch tenants from
            Schools.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function makeStyles(colors, isDark) {
  return StyleSheet.create({
    glowTop: {
      position: "absolute",
      top: -60,
      right: -30,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: "rgba(241,90,36,0.14)",
    },
    glowBottom: {
      position: "absolute",
      bottom: 80,
      left: -50,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: isDark ? "rgba(23,48,73,0.7)" : "rgba(241,90,36,0.06)",
    },
    kicker: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    pageSub: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 6,
      marginBottom: 18,
      lineHeight: 20,
    },
    heroCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 16,
      marginBottom: 12,
    },
    avatarWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: "rgba(241,90,36,0.16)",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImg: { width: 72, height: 72, borderRadius: 20 },
    avatarText: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 22,
    },
    avatarBadge: {
      position: "absolute",
      right: 4,
      bottom: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    logoLink: { marginTop: 6, alignSelf: "flex-start" },
    logoLinkText: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
    },
    heroMeta: { flex: 1, gap: 4 },
    heroName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    heroDomain: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    statRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    stat: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
      gap: 4,
    },
    statOrange: { borderColor: "rgba(241,90,36,0.28)" },
    statNavy: {},
    statLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
    },
    statValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    linkCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.bg2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      marginBottom: 14,
    },
    linkIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(241,90,36,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    linkTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 14,
    },
    linkSub: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    successBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(52,211,153,0.12)",
      borderColor: "rgba(52,211,153,0.3)",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    successText: {
      color: colors.success,
      fontWeight: "700",
      fontSize: 13,
      flex: 1,
    },
    sectionCard: {
      backgroundColor: colors.bg2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 16,
      marginBottom: 14,
    },
    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
    },
    sectionTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 15,
    },
    domainBox: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
    },
    domainLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    domainValue: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "800",
      marginTop: 4,
    },
    domainHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
    },
  });
}
