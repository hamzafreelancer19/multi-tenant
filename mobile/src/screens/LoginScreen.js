import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPlatformStatus } from "../api";
import { useAuth } from "../auth/AuthContext";
import { ErrorText, PrimaryButton } from "../components/ui";
import { radius } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { apiError } from "../utils";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [lastSchool, setLastSchool] = useState("");
  const [allowSignup, setAllowSignup] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const passwordRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
    AsyncStorage.getItem("schoolName").then((name) => {
      if (name) setLastSchool(name);
    });
    getPlatformStatus()
      .then((res) => {
        setAllowSignup(res.data?.allow_signup !== false);
      })
      .catch(() => {});
  }, [fade, rise]);

  const onSubmit = async () => {
    if (username.trim().length < 3) return setError("Enter your username or email.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    setError("");
    try {
      await login({ username: username.trim(), password });
    } catch (err) {
      setError(apiError(err, "Login failed. Check your username and password."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                accessibilityLabel="Classora"
              />
              <View>
                <Text style={styles.brand}>CLASSORA</Text>
                <Text style={styles.brandTag}>School management</Text>
              </View>
            </View>
            <Text style={styles.title}>Welcome back</Text>

            {!!lastSchool && (
              <View style={styles.schoolChip}>
                <Ionicons name="school-outline" size={16} color={colors.primary} />
                <Text style={styles.schoolChipText}>Last school: {lastSchool}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={onSubmit}
                  style={[styles.input, { paddingRight: 44 }]}
                />
                <Pressable onPress={() => setShowPw((v) => !v)} style={styles.eye} hitSlop={10}>
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>

              <ErrorText>{error}</ErrorText>
              <PrimaryButton
                title={busy ? "Signing in…" : "Sign in"}
                onPress={onSubmit}
                disabled={busy}
              />
            </View>

            {allowSignup ? (
              <Pressable
                onPress={() => navigation?.navigate("Signup")}
                style={styles.footerLink}
              >
                <Text style={styles.footerMuted}>New school? </Text>
                <Text style={styles.footerAction}>Register here</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40 },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
    },
    logo: {
      width: 56,
      height: 56,
      borderRadius: 14,
    },
    brand: {
      color: colors.primary,
      fontWeight: "900",
      letterSpacing: 4,
      fontSize: 14,
    },
    brandTag: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: "800",
      marginTop: 4,
      marginBottom: 22,
      letterSpacing: -0.5,
    },
    schoolChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      backgroundColor: "rgba(241,90,36,0.12)",
      borderColor: "rgba(241,90,36,0.28)",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 18,
    },
    schoolChipText: { color: colors.primary2, fontWeight: "700", fontSize: 13 },
    form: {
      backgroundColor: colors.bg2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 18,
    },
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      marginBottom: 14,
    },
    inputIcon: { marginLeft: 12 },
    input: {
      flex: 1,
      color: colors.text,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      fontSize: 13,
    },
    eye: { position: "absolute", right: 12, padding: 4 },
    footerLink: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: 20,
    },
    footerMuted: { color: colors.muted, fontSize: 14 },
    footerAction: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  });
}
