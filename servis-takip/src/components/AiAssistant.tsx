"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
};

const SUGGESTIONS = [
  "Cihaz türü nasıl eklerim?",
  "WhatsApp nasıl bağlarım?",
  "Stok nasıl eklerim?",
  "Teslim fişi nasıl çıkarırım?",
];

export default function AiAssistant() {
  const pathname = usePathname();
  const sadeceDashboard = pathname === "/";
  const gosterimClass = sadeceDashboard ? "flex" : "hidden lg:flex";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "model",
          parts: [{ text: "Merhaba! 👋 TamirTakip hakkında aklınıza takılan her şeyi sorabilirsiniz." }],
        },
      ]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", parts: [{ text: userText }] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        setError(data.error ?? "Bir hata oluştu");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: [{ text: data.text! }] },
      ]);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat balonu butonu */}
      <div
        className={gosterimClass}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9998,
        }}
      >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          height: "46px",
          borderRadius: "23px",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: open ? "0 16px" : "0 16px",
          boxShadow: "0 4px 16px rgba(79,70,229,0.45)",
          zIndex: 9998,
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
        title="AI Asistan"
      >
        {open ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Kapat</span>
          </>
        ) : (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l4.94-1.37A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 10h8M8 14h5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              Yardım & Destek
            </span>
          </>
        )}
      </button>
      </div>

      {/* Chat penceresi */}
      {open ? (
        <div
          className={gosterimClass}
          style={{
            position: "fixed",
            bottom: "88px",
            right: "24px",
            width: "340px",
            maxWidth: "calc(100vw - 48px)",
            height: "480px",
            maxHeight: "calc(100vh - 120px)",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9997,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              🤖
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                TamirTakip Asistanı
              </p>
              <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>
                TamirTakip Destek Asistanı
              </p>
            </div>
          </div>

          {/* Mesajlar */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "8px 12px",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 2px 12px"
                        : "12px 12px 12px 2px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                        : "#f3f4f6",
                    color: msg.role === "user" ? "white" : "#1f2937",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}

            {/* Öneri butonları — sadece ilk mesajdan sonra */}
            {messages.length === 1 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "20px",
                      border: "1px solid #e5e7eb",
                      background: "white",
                      color: "#4f46e5",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f3f4f6",
                    borderRadius: "12px 12px 12px 2px",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#9ca3af",
                        animation: "bounce 1.2s infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            ) : null}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #f3f4f6",
              display: "flex",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && void send()
              }
              placeholder="Soru sorun..."
              disabled={loading}
              style={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "7px 14px",
                fontSize: "13px",
                outline: "none",
                background: loading ? "#f9fafb" : "white",
              }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background:
                  loading || !input.trim()
                    ? "#e5e7eb"
                    : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white",
                border: "none",
                cursor:
                  loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
