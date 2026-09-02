import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, FileText, ImagePlus, MessageCircle, Paperclip, Search, Send, Smile, X } from "lucide-react";
import { getUser } from "../store/authStore";
import {
  getChatContacts,
  getChatMessages,
  getChatThreads,
  sendChatMessage,
  startChat,
  uploadChatFile,
} from "../api/chatApi";
import "./Chat.css";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
  "🤗", "🤩", "😇", "😅", "😢", "😭", "😡", "👍",
  "👎", "👏", "🙏", "🔥", "❤️", "🧡", "💛", "💚",
  "✅", "❌", "⭐", "🎉", "🎂", "📚", "✏️", "🏫",
];

function timeLabel(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function matchesQuery(row, q, qDigits) {
  if (!q) return true;
  const blob = [row.name, row.role, row.subtitle, row.username, row.phone, row.child_name, row.last_message]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (blob.includes(q)) return true;
  if (qDigits && digits(row.phone).includes(qDigits)) return true;
  return false;
}

function listTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function Ticks({ seen }) {
  return (
    <CheckCheck
      size={14}
      strokeWidth={seen ? 2.6 : 2}
      className={`chat-ticks${seen ? " is-seen" : ""}`}
      title={seen ? "Seen" : "Sent"}
    />
  );
}

function messageSeen(row, otherReadAt) {
  if (row?.seen) return true;
  if (!otherReadAt || !row?.created_at) return false;
  const readAt = new Date(otherReadAt).getTime();
  const sentAt = new Date(row.created_at).getTime();
  return !Number.isNaN(readAt) && !Number.isNaN(sentAt) && sentAt <= readAt;
}

function prettyName(row) {
  const name = (row?.name || "").trim();
  if (name && !name.includes("@")) return name;
  const username = (row?.username || name || "").trim();
  if (username.includes("@")) {
    return username.split("@")[0].replace(/[._]/g, " ").replace(/\d+$/, "").trim() || username;
  }
  return name || username || "User";
}

function RoleTag({ label }) {
  if (!label) return null;
  const key = String(label).toLowerCase().replace(/\s+/g, "-");
  return <span className={`chat-role-tag is-${key}`}>{label}</span>;
}

function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

function toChatRow(thread) {
  const id = Number(thread.other?.id);
  return {
    key: `t-${thread.id}`,
    userId: id,
    threadId: thread.id,
    name: prettyName(thread.other),
    role: thread.other?.role || "",
    roleTag: thread.other?.role_tag || "",
    phone: thread.other?.phone || "",
    username: thread.other?.username || "",
    avatar: thread.other?.avatar || "",
    online: Boolean(thread.other?.online),
    subtitle: thread.last_message || thread.other?.role || "",
    unread: thread.unread || 0,
    seen: thread.seen || 0,
    incoming: thread.incoming || 0,
    last_message: thread.last_message || "",
    last_at: thread.last_at || "",
    last_from_me: Boolean(thread.last_from_me),
    last_seen: Boolean(thread.last_seen),
    kind: "chat",
  };
}

function toPeopleRow(person, threadId) {
  return {
    key: `c-${person.id}`,
    userId: Number(person.id),
    threadId: threadId || null,
    name: prettyName(person),
    role: person.role,
    roleTag: person.role_tag || "",
    phone: person.phone || "",
    username: person.username || "",
    child_name: person.child_name || "",
    avatar: person.avatar || "",
    online: Boolean(person.online),
    subtitle: [person.subtitle, person.phone].filter(Boolean).join(" · "),
    unread: 0,
    last_message: "",
    kind: "people",
  };
}

function ChatAvatar({ name, src, online }) {
  return (
    <span className={`chat-avatar ${online ? "is-online" : "is-offline"}`}>
      {src ? <img src={src} alt="" /> : initial(name)}
      <i title={online ? "Online" : "Offline"} />
    </span>
  );
}

export default function Chat() {
  const me = getUser();
  const myId = Number(me?.id);
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [pending, setPending] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attach, setAttach] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const lastIdRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiWrapRef = useRef(null);

  const loadThreads = () => {
    getChatThreads()
      .then((res) => setThreads(Array.isArray(res.data) ? res.data : []))
      .catch(() => setThreads([]));
  };

  const loadContacts = () => {
    getChatContacts()
      .then((res) => setContacts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setContacts([]));
  };

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (search.trim().length < 2 && digits(search).length < 3) return undefined;
    loadContacts();
    return undefined;
  }, [search]);

  useEffect(() => {
    lastIdRef.current = messages[messages.length - 1]?.id || null;
  }, [messages]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      lastIdRef.current = null;
      setAttach(null);
      setShowEmoji(false);
      return undefined;
    }
    let alive = true;
    const pull = (after) => {
      getChatMessages(activeId, after)
        .then((res) => {
          if (!alive) return;
          const rows = Array.isArray(res.data) ? res.data : [];
          if (after) {
            if (rows.length) setMessages((prev) => [...prev, ...rows]);
          } else {
            setMessages(rows);
          }
          loadThreads();
        })
        .catch(() => {});
    };
    pull();
    const t = setInterval(() => pull(lastIdRef.current), 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (!showEmoji) return undefined;
    const onPointer = (e) => {
      if (emojiWrapRef.current && !emojiWrapRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [showEmoji]);

  const threadByUser = useMemo(() => {
    const map = new Map();
    threads.forEach((row) => {
      if (row.other?.id) map.set(Number(row.other.id), row);
    });
    return map;
  }, [threads]);

  const chats = useMemo(
    () => threads.filter((row) => row.last_message).map(toChatRow),
    [threads]
  );

  const q = search.trim().toLowerCase();
  const qDigits = digits(search);
  const searching = q.length >= 2 || qDigits.length >= 3;

  const chatRows = useMemo(
    () => (searching ? chats.filter((row) => matchesQuery(row, q, qDigits)) : chats),
    [chats, searching, q, qDigits]
  );

  const peopleRows = useMemo(() => {
    if (!searching) return [];
    const inChats = new Set(chats.map((row) => row.userId));
    return contacts
      .filter((person) => !inChats.has(Number(person.id)))
      .map((person) => toPeopleRow(person, threadByUser.get(Number(person.id))?.id || null))
      .filter((row) => matchesQuery(row, q, qDigits));
  }, [searching, contacts, chats, threadByUser, q, qDigits]);

  const active = threads.find((row) => row.id === activeId);
  const otherReadAt = active?.other_read_at;
  useEffect(() => {
    if (!otherReadAt) return;
    const t = new Date(otherReadAt).getTime();
    if (Number.isNaN(t)) return;
    setMessages((prev) =>
      prev.map((row) => (new Date(row.created_at).getTime() <= t ? { ...row, seen: true } : row))
    );
  }, [otherReadAt]);
  const headerName = prettyName(active?.other || pending) || "Chat";
  const headerOnline = active ? Boolean(active.other?.online) : Boolean(pending?.online);
  const headerAvatar = active?.other?.avatar || pending?.avatar || "";
  const headerMeta = headerOnline ? "Online" : "Offline";

  const openChat = async (row) => {
    setPending(row);
    if (row.threadId) {
      setActiveId(row.threadId);
      return;
    }
    const existing = threadByUser.get(Number(row.userId));
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    setOpening(true);
    try {
      const res = await startChat(row.userId);
      setActiveId(res.data.id);
      loadThreads();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.user_id?.[0] || data?.detail || "Could not open chat.";
      alert(typeof msg === "string" ? msg : "Could not open chat.");
      setPending(null);
    } finally {
      setOpening(false);
    }
  };

  const pickFile = async (file) => {
    if (!file || !activeId) return;
    setUploading(true);
    try {
      const res = await uploadChatFile(file);
      setAttach({
        url: res.data.url,
        name: res.data.name || file.name,
        type: res.data.type || (file.type?.startsWith("image/") ? "image" : "file"),
      });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.file?.[0] || data?.detail || "Could not upload file.";
      alert(typeof msg === "string" ? msg : "Could not upload file.");
    } finally {
      setUploading(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if ((!body && !attach) || !activeId) return;
    setSending(true);
    try {
      const res = await sendChatMessage(activeId, {
        body,
        attachment_url: attach?.url || "",
        attachment_name: attach?.name || "",
        attachment_type: attach?.type || "",
      });
      setMessages((prev) => [...prev, res.data]);
      setDraft("");
      setAttach(null);
      setShowEmoji(false);
      loadThreads();
    } catch {
      alert("Could not send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chat-page ${activeId ? "is-open" : ""}`}>
      <aside className="chat-side">
        <div className="chat-side-head">
          <h1>Chat</h1>
          <div className="chat-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search to start a chat"
            />
          </div>
        </div>
        <div className="chat-list">
          {chatRows.length > 0 && searching ? <p className="chat-section">Chats</p> : null}
          {chatRows.map((row) => (
            <button
              key={row.key}
              type="button"
              className={`chat-row ${row.threadId && row.threadId === activeId ? "is-on" : ""} ${row.unread ? "has-unread" : ""}`}
              onClick={() => openChat(row)}
              disabled={opening}
              title={
                row.incoming
                  ? `${row.incoming} received · ${row.seen} seen · ${row.unread} unseen`
                  : undefined
              }
            >
              <ChatAvatar name={row.name} src={row.avatar} online={row.online} />
              <span className="chat-row-text">
                <span className="chat-row-name">
                  <b>{row.name}</b>
                  <RoleTag label={row.roleTag} />
                </span>
                <small>
                  {row.last_from_me ? <Ticks seen={row.last_seen} /> : null}
                  {row.last_message || (row.online ? "Online" : "Offline")}
                </small>
              </span>
              <span className="chat-row-end">
                <time className={row.unread ? "is-new" : ""}>{listTime(row.last_at)}</time>
                {row.unread > 0 ? (
                  <span className="chat-unread" title={`${row.unread} unseen`}>
                    {row.unread}
                  </span>
                ) : row.incoming > 0 ? (
                  <span className="chat-seen-note">{row.seen} seen</span>
                ) : null}
              </span>
            </button>
          ))}
          {peopleRows.length > 0 ? <p className="chat-section">People</p> : null}
          {peopleRows.map((row) => (
            <button
              key={row.key}
              type="button"
              className={`chat-row ${row.threadId && row.threadId === activeId ? "is-on" : ""} ${row.online ? "is-live" : ""}`}
              onClick={() => openChat(row)}
              disabled={opening}
            >
              <ChatAvatar name={row.name} src={row.avatar} online={row.online} />
              <span className="chat-row-text">
                <span className="chat-row-name">
                  <b>{row.name}</b>
                  <RoleTag label={row.roleTag} />
                </span>
                <small>{row.online ? "Online" : (row.subtitle || row.phone || "Tap to chat")}</small>
              </span>
            </button>
          ))}
          {!chatRows.length && !peopleRows.length && (
            <p className="chat-empty-note">
              {searching
                ? "No one found. Try a full name or phone number."
                : "No chats yet. Search a name or number to start."}
            </p>
          )}
        </div>
      </aside>

      <section className="chat-main">
        {activeId ? (
          <>
            <header className="chat-main-head">
              <button type="button" className="chat-back" onClick={() => { setActiveId(null); setPending(null); }}>
                <ArrowLeft size={18} />
              </button>
              <ChatAvatar name={headerName} src={headerAvatar} online={headerOnline} />
              <div>
                <h2>
                  {headerName}
                  <RoleTag label={active?.other?.role_tag || pending?.roleTag} />
                </h2>
                <small className={headerOnline ? "is-live" : ""}>{headerMeta}</small>
              </div>
            </header>
            <div className="chat-messages">
              {messages.map((row, i) => {
                const mine = Number(row.sender_id) === myId;
                const stacked = i > 0 && Number(messages[i - 1].sender_id) === Number(row.sender_id);
                return (
                  <div key={row.id} className={`chat-line ${mine ? "is-mine" : ""} ${stacked ? "is-stack" : ""}`}>
                    <article className={`chat-bubble ${mine ? "is-mine" : ""} ${row.attachment_url ? "has-media" : ""}`}>
                      {row.attachment_type === "image" && row.attachment_url ? (
                        <a href={row.attachment_url} target="_blank" rel="noreferrer">
                          <img src={row.attachment_url} alt="" className="chat-photo" />
                        </a>
                      ) : null}
                      {row.attachment_type === "file" && row.attachment_url ? (
                        <a className="chat-file" href={row.attachment_url} target="_blank" rel="noreferrer">
                          <FileText size={16} />
                          <span>{row.attachment_name || "File"}</span>
                        </a>
                      ) : null}
                      {row.body ? <p>{row.body}</p> : null}
                      <time>
                        {timeLabel(row.created_at)}
                        {mine ? <Ticks seen={messageSeen(row, otherReadAt)} /> : null}
                      </time>
                    </article>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form className="chat-compose" onSubmit={send}>
              {showEmoji ? (
                <div className="chat-emoji-panel" ref={emojiWrapRef}>
                  {EMOJIS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setDraft((prev) => (prev + emo).slice(0, 4000))}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              ) : null}
              {attach ? (
                <div className="chat-attach-preview">
                  {attach.type === "image" ? <img src={attach.url} alt="" /> : <FileText size={16} />}
                  <span>{attach.name}</span>
                  <button type="button" onClick={() => setAttach(null)} title="Remove">
                    <X size={14} />
                  </button>
                </div>
              ) : null}
              <div className="chat-compose-bar">
                <button
                  type="button"
                  className="chat-icon-btn"
                  title="Emoji"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setShowEmoji((open) => !open)}
                >
                  <Smile size={18} />
                </button>
                <button
                  type="button"
                  className="chat-icon-btn"
                  title="Photo"
                  disabled={uploading}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus size={18} />
                </button>
                <button
                  type="button"
                  className="chat-icon-btn"
                  title="File"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={18} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,image/*"
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={uploading ? "Uploading..." : "Type a message"}
                  maxLength={4000}
                  disabled={uploading}
                />
                <button
                  type="submit"
                  className="chat-compose-send"
                  disabled={sending || uploading || (!draft.trim() && !attach)}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <MessageCircle size={36} />
            <p>Search a name or number to start a chat.</p>
          </div>
        )}
      </section>
    </div>
  );
}
