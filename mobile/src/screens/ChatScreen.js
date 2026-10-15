import React, { useCallback, useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getChatContacts, getChatMessages, getChatThreads, sendChatMessage, startChat } from "../api";
import { Card, EmptyState, ErrorText, Hero, LoadingBlock, Screen, SearchBar } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { apiError, asList } from "../utils";
import { colors } from "../theme";

function pretty(row) {
  return row?.name || row?.username || "User";
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");

  const loadList = async () => {
    try {
      const [t, c] = await Promise.all([getChatThreads(), getChatContacts().catch(() => ({ data: [] }))]);
      setThreads(asList(t.data));
      setContacts(asList(c.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load chat."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadList(); }, []));

  const openThread = async (threadId, other) => {
    setActive({ threadId, other });
    const res = await getChatMessages(threadId);
    setMessages(asList(res.data));
  };

  const openContact = async (person) => {
    const existing = threads.find((t) => Number(t.other?.id) === Number(person.id));
    if (existing) return openThread(existing.id, existing.other);
    const res = await startChat(person.id);
    await loadList();
    await openThread(res.data.id, res.data.other || person);
  };

  useEffect(() => {
    if (!active?.threadId) return undefined;
    const id = setInterval(async () => {
      try {
        const res = await getChatMessages(active.threadId);
        setMessages(asList(res.data));
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(id);
  }, [active?.threadId]);

  const send = async () => {
    if (!body.trim() || !active?.threadId) return;
    const text = body.trim();
    setBody("");
    await sendChatMessage(active.threadId, text);
    const res = await getChatMessages(active.threadId);
    setMessages(asList(res.data));
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  if (active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable onPress={() => setActive(null)} style={{ padding: 16 }}>
            <Text style={{ color: colors.accent, fontWeight: "700" }}>‹ Chats</Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 4 }}>{pretty(active.other)}</Text>
          </Pressable>
          <FlatList
            data={messages}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const mine = Number(item.sender) === Number(user?.id) || item.from_me;
              return (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={{ color: colors.text }}>{item.body || item.text}</Text>
                </View>
              );
            }}
          />
          <View style={styles.composer}>
            <TextInput value={body} onChangeText={setBody} placeholder="Message" placeholderTextColor={colors.muted} style={styles.input} />
            <Pressable onPress={send} style={styles.send}><Text style={{ color: "#fff", fontWeight: "800" }}>Send</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const filteredT = threads.filter((t) => pretty(t.other).toLowerCase().includes(q.toLowerCase()));
  const filteredC = contacts.filter((c) => pretty(c).toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen onRefresh={loadList}>
      <Hero kicker="Inbox" title="Chat" subtitle="Message admin, teachers, and parents." />
      <SearchBar value={q} onChangeText={setQ} placeholder="Search people" />
      <ErrorText>{error}</ErrorText>
      {filteredT.length ? filteredT.map((t) => (
        <Card key={t.id} onPress={() => openThread(t.id, t.other)}>
          <Hero kicker={t.other?.role} title={pretty(t.other)} subtitle={t.last_message || "No messages yet"} />
        </Card>
      )) : <EmptyState title="No threads yet" text="Start a chat from People below." />}
      <Hero kicker="Directory" title="People" />
      {filteredC.map((c) => (
        <Card key={c.id} onPress={() => openContact(c)}>
          <Hero kicker={c.role || c.role_tag} title={pretty(c)} subtitle={c.subtitle || c.phone} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 14, marginBottom: 8 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.card },
  composer: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderColor: colors.border },
  input: { flex: 1, backgroundColor: colors.card, color: colors.text, borderRadius: 12, paddingHorizontal: 12 },
  send: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
});
