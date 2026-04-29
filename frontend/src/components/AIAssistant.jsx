import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, Sparkles, Loader2 } from "lucide-react";
import api from "../api/axios";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "👋 Assalam-o-Alaikum! Main aapka AI School Assistant hoon.\n\nMain yeh sab kuch kar sakta hoon:\n• Students add karna\n• Fee jama karna\n• School stats dekhna\n• Unpaid fees check karna\n\n'help' likh kar poori list dekh saktay hain!" }
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
          width: 350,
          height: 500,
          background: "var(--bg-paper)",
          borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9999,
          overflow: "hidden",
          animation: "slide-up 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: 6, borderRadius: "50%" }}>
                <Bot size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>AI Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: 16,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "var(--bg-base)"
          }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                flexDirection: m.sender === "user" ? "row-reverse" : "row",
                maxWidth: "85%"
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: m.sender === "user" ? "var(--primary)" : "linear-gradient(135deg, #a855f7, #ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0
                }}>
                  {m.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{
                  background: m.sender === "user" ? "var(--primary)" : "var(--bg-paper)",
                  color: m.sender === "user" ? "white" : "var(--text)",
                  padding: "10px 14px",
                  borderRadius: 14,
                  borderTopRightRadius: m.sender === "user" ? 4 : 14,
                  borderTopLeftRadius: m.sender === "ai" ? 4 : 14,
                  fontSize: "0.9rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: m.sender === "ai" ? "1px solid var(--border)" : "none",
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
