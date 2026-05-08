import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, Sparkles, Loader2 } from "lucide-react";
import api from "../api/axios";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "👋 Assalam-o-Alaikum! Main Classora AI Assistant hoon. Main aapke school ka data analyze kar sakta hoon aur management mein aapki help kar sakta hoon.\n\nMujhse school stats, fees, ya asatza ke baare mein kuch bhi poochein!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat/", { message: userMsg });
      const aiReply = res.data.reply || "Done.";
      setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: aiReply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: "❌ Server se connect nahi ho paya. Please check karein ke backend chal raha hai." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #a855f7, #ec4899)",
          color: "white",
          border: "none",
          boxShadow: "0 8px 32px rgba(168, 85, 247, 0.4)",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          animation: "pulse-glow 2s infinite"
        }}
      >
        <Sparkles size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 380,
          height: 550,
          background: "#ffffff", // Solid white background
          backgroundColor: "#ffffff",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(168, 85, 247, 0.1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100000, // Very high z-index
          overflow: "hidden",
          animation: "slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.25)", padding: 8, borderRadius: "12px" }}>
                <Bot size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Classora AI</h3>
                <div style={{ fontSize: "0.7rem", opacity: 0.9, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} /> Online Assistant
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", cursor: "pointer", padding: 6, borderRadius: "50%" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: "24px 20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "#f9fafb" // Solid light grey background for chat area
          }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                flexDirection: m.sender === "user" ? "row-reverse" : "row",
                maxWidth: "90%"
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "10px",
                  background: m.sender === "user" ? "#9333ea" : "linear-gradient(135deg, #a855f7, #ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                }}>
                  {m.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{
                  background: m.sender === "user" ? "#9333ea" : "#ffffff",
                  color: m.sender === "user" ? "white" : "#1f2937",
                  padding: "12px 16px",
                  borderRadius: 18,
                  borderTopRightRadius: m.sender === "user" ? 4 : 18,
                  borderTopLeftRadius: m.sender === "ai" ? 4 : 18,
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                  border: m.sender === "ai" ? "1px solid #e5e7eb" : "none",
                  whiteSpace: "pre-wrap"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <Loader2 size={14} className="spin" /> AI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: 12,
            background: "var(--bg-paper)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to add a student..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                background: "var(--bg-base)",
                color: "var(--text)",
                outline: "none"
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? "var(--primary)" : "var(--bg-hover)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s"
              }}
            >
              <Send size={18} style={{ marginLeft: 2 }} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(168, 85, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
