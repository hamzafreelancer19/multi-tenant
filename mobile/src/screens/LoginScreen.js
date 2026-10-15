import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { Field, PrimaryButton, ErrorText } from "../components/ui";
import { getApiBaseUrl, getDefaultTenantDomain } from "../config";
import { colors } from "../theme";
import { apiError } from "../utils";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schoolDomain, setSchoolDomain] = useState(getDefaultTenantDomain());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("schoolDomain").then((stored) => {
      if (stored) setSchoolDomain(stored);
    });
  }, []);

  const onSubmit = async () => {
    if (username.trim().length < 3) return setError("Enter your username or email.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    setError("");
    try {
      await login({ username: username.trim(), password, schoolDomain });
    } catch (err) {
      setError(apiError(err, "Login failed. Check username, password, API URL, and tenant domain."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <Text style={styles.brand}>CLASSORA</Text>
          <Text style={styles.title}>Sign in to your school</Text>
          <Text style={styles.hint}>Same Django API as the website. Use your Classora username and password.</Text>
          <Field label="Username / Email" value={username} onChangeText={setUsername} />
          <Field label="Password" value={password} onChangeText={setPassword} secure={!showPw} />
          <Pressable onPress={() => setShowPw((v) => !v)}>
            <Text style={styles.link}>{showPw ? "Hide password" : "Show password"}</Text>
          </Pressable>
          <Field
            label="School domain (X-Tenant-Domain)"
            value={schoolDomain}
            onChangeText={setSchoolDomain}
            placeholder="localhost or your-school.example.com"
          />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={busy ? "Signing in…" : "Sign in"} onPress={onSubmit} disabled={busy} />
          <Text style={styles.meta}>API: {getApiBaseUrl()}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: 22, justifyContent: "center" },
  brand: { color: colors.primary, fontWeight: "900", letterSpacing: 3, fontSize: 13 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 8, marginBottom: 8 },
  hint: { color: colors.muted, marginBottom: 22, lineHeight: 20 },
  link: { color: colors.accent, marginBottom: 12, fontWeight: "700" },
  meta: { color: colors.muted, marginTop: 18, fontSize: 12 },
});
