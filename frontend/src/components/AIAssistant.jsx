import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, Sparkles, Loader2, BarChart3, Bell, Package, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "👋 Assalam-o-Alaikum! Main Classora AI Assistant hoon. Main aapke school ka data analyze kar sakta hoon aur management mein aapki help kar sakta hoon.\n\nMujhse school stats, fees, inventory ya notices ke baare mein kuch bhi poochein!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    { label: "School Stats", icon: <BarChart3 size={14} />, prompt: "Show me school stats" },
    { label: "Post Notice", icon: <Bell size={14} />, prompt: "Add a notice: Tomorrow is a holiday for Iqbal Day." },
    { label: "Inventory", icon: <Package size={14} />, prompt: "What is the current inventory status?" },
    { label: "Fee Status", icon: <Wallet size={14} />, prompt: "Check fee status for Hamza" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const userMsg = customMsg || input.trim();
    if (!userMsg) return;

    setInput("");
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat/", { message: userMsg });
      const { reply, action } = res.data;
      
      setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: reply || "Done." }]);

      // Handle UI Actions
      if (action) {
        if (action.action === "navigate" && action.path) {
          setTimeout(() => {
            navigate(action.path);
          }, 1000);
        } else if (action.action === "theme" && action.color) {
          document.documentElement.style.setProperty("--accent", action.color);
          document.documentElement.style.setProperty("--purple", action.color + "dd"); // Slightly different for gradient
        }
      }
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
        className="ai-fab"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
          color: "white",
          border: "none",
          boxShadow: "0 10px 40px rgba(99, 102, 241, 0.4)",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
      >
        <Sparkles size={30} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window" style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 400,
          height: 600,
          background: "#ffffff",
          borderRadius: 28,
          boxShadow: "0 25px 70px rgba(0,0,0,0.3), 0 0 0 1px rgba(168, 85, 247, 0.1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100000,
          overflow: "hidden",
          animation: "slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ 
                background: "rgba(255,255,255,0.2)", 
                padding: 10, 
                borderRadius: "16px",
                backdropFilter: "blur(10px)"
              }}>
                <Bot size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Classora AI</h3>
                <div style={{ fontSize: "0.75rem", opacity: 0.9, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} /> 
                  Online & Ready to Help
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", cursor: "pointer", padding: 8, borderRadius: "50%", transition: "all 0.2s" }}
              onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.25)"}
              onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.15)"}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-messages-container" style={{
            flex: 1,
            padding: "24px 20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            background: "#f8fafc"
          }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 12,
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                flexDirection: m.sender === "user" ? "row-reverse" : "row",
                maxWidth: "85%"
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "12px",
                  background: m.sender === "user" ? "#4f46e5" : "linear-gradient(135deg, #6366f1, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
                }}>
                  {m.sender === "user" ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div style={{
                  background: m.sender === "user" ? "#4f46e5" : "#ffffff",
                  color: m.sender === "user" ? "white" : "#334155",
                  padding: "14px 18px",
                  borderRadius: 20,
                  borderBottomRightRadius: m.sender === "user" ? 4 : 20,
                  borderBottomLeftRadius: m.sender === "ai" ? 4 : 20,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  boxShadow: m.sender === "ai" ? "0 4px 20px rgba(0,0,0,0.04)" : "0 4px 15px rgba(79, 70, 229, 0.15)",
                  border: m.sender === "ai" ? "1px solid #f1f5f9" : "none",
                  whiteSpace: "pre-wrap"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#64748b", fontSize: "0.9rem", marginLeft: 44 }}>
                <Loader2 size={16} className="spin" /> 
                <span style={{ fontWeight: 500 }}>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {!loading && (
            <div style={{
              display: "flex",
              gap: 8,
              padding: "0 20px 12px",
              overflowX: "auto",
              background: "#f8fafc"
            }} className="no-scrollbar">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(null, s.prompt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: "14px",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: "16px 20px 24px",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 10,
            alignItems: "center"
          }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  outline: "none",
                  fontSize: "0.95rem",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#a855f7"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? "linear-gradient(135deg, #6366f1, #a855f7)" : "#f1f5f9",
                color: input.trim() && !loading ? "white" : "#cbd5e1",
                border: "none",
                borderRadius: "16px",
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                transition: "all 0.3s",
                boxShadow: input.trim() && !loading ? "0 4px 15px rgba(99, 102, 241, 0.3)" : "none"
              }}
            >
              <Send size={22} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .ai-fab:hover {
          transform: scale(1.05) rotate(5deg);
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pulse-dot {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
