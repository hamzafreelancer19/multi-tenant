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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPlatformStatus, signupUser } from "../api";
import { ErrorText, PrimaryButton } from "../components/ui";
import { radius } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { apiError } from "../utils";

export default function SignupScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [schoolName, setSchoolName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
    getPlatformStatus()
      .then((res) => {
        setAllowSignup(res.data?.allow_signup !== false);
      })
      .catch(() => {});
  }, [fade, rise]);

  const onSubmit = async () => {
    if (!allowSignup) {
      return setError("New school signups are currently closed.");
    }
    const school = schoolName.trim();
    const user = username.trim();
    const mail = email.trim().toLowerCase();
    if (school.length < 2) return setError("Enter your school name.");
    if (user.length < 3) return setError("Username must be at least 3 characters.");
    if (!mail.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await signupUser({
        school_name: school,
        username: user,
        email: mail,
        password,
      });
      setSuccess(
        res.data?.message ||
          "Registration successful! Your school is pending approval."
      );
    } catch (err) {
      setError(apiError(err, "Could not register school. Try again."));
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
            <Pressable onPress={() => navigation.goBack()} style={styles.backRow} hitSlop={10}>
              <Ionicons name="arrow-back" size={20} color={colors.muted} />
              <Text style={styles.backText}>Back to sign in</Text>
            </Pressable>

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
            <Text style={styles.title}>Register school</Text>

            {!allowSignup ? (
              <View style={styles.closedBox}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.warn} />
                <Text style={styles.closedText}>
                  New school signups are closed right now. Please contact platform support.
                </Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={styles.successText}>{success}</Text>
                <PrimaryButton
                  title="Go to sign in"
                  onPress={() => navigation.navigate("Login")}
                  tone="navy"
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>School name</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="school-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    value={schoolName}
                    onChangeText={setSchoolName}
                    placeholder="e.g. Green Valley School"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    style={styles.input}
                    editable={allowSignup && !busy}
                  />
                </View>

                <Text style={styles.label}>Admin username</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    ref={usernameRef}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Choose a username"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    style={styles.input}
                    editable={allowSignup && !busy}
                  />
                </View>

                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@school.com"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    style={styles.input}
                    editable={allowSignup && !busy}
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    style={[styles.input, { paddingRight: 44 }]}
                    editable={allowSignup && !busy}
                  />
                  <Pressable onPress={() => setShowPw((v) => !v)} style={styles.eye} hitSlop={10}>
                    <Ionicons
                      name={showPw ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>

                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmRef}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    style={styles.input}
                    editable={allowSignup && !busy}
                  />
                </View>

                <ErrorText>{error}</ErrorText>
                <PrimaryButton
                  title={busy ? "Registering…" : "Register school"}
                  onPress={onSubmit}
                  disabled={busy || !allowSignup}
                />
              </View>
            )}

            {!success ? (
              <Pressable onPress={() => navigation.navigate("Login")} style={styles.footerLink}>
                <Text style={styles.footerMuted}>Already have an account? </Text>
                <Text style={styles.footerAction}>Sign in</Text>
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
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 18,
      alignSelf: "flex-start",
    },
    backText: { color: colors.muted, fontWeight: "700", fontSize: 14 },
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
      fontSize: 32,
      fontWeight: "800",
      marginTop: 4,
      marginBottom: 22,
      letterSpacing: -0.5,
    },
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
    closedBox: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      backgroundColor: "rgba(251,191,36,0.12)",
      borderColor: "rgba(251,191,36,0.35)",
      borderWidth: 1,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 16,
    },
    closedText: { flex: 1, color: colors.text, lineHeight: 20, fontSize: 14 },
    successBox: {
      backgroundColor: colors.bg2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 18,
      gap: 12,
    },
    successText: { color: colors.text, lineHeight: 22, fontSize: 15, fontWeight: "600" },
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
