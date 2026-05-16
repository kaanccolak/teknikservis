"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export function TopBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data: Announcement[]) => setAnnouncements(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    const unread = announcements.filter((a) => !a.isRead);
    if (unread.length > 0) {
      await Promise.all(
        unread.map((a) =>
          fetch("/api/announcements/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ announcementId: a.id }),
          }),
        ),
      );
      setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
    }
  }

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6">
      <p className="text-sm text-slate-500">
        Hoş geldiniz — bugünkü işlemlerinizi buradan takip edebilirsiniz.
      </p>

      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => void handleOpen()}
          style={{
            position: "relative",
            background: unreadCount > 0 ? "#111827" : "none",
            border: unreadCount > 0 ? "none" : "1px solid #e5e7eb",
            cursor: "pointer",
            padding: unreadCount > 0 ? "8px 16px" : "8px 12px",
            borderRadius: "20px",
            color: unreadCount > 0 ? "white" : "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 ? (
            <span>{unreadCount} yeni bildirim</span>
          ) : (
            <span>Bildirimler</span>
          )}
          {unreadCount > 0 && (
            <span
              style={{
                background: "#ef4444",
                color: "white",
                fontSize: "11px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "10px",
                marginLeft: "2px",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 10px)",
              width: "380px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={16} color="#111827" />
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Bildirimler
                </p>
              </div>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "12px",
                    background: "#111827",
                    color: "white",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} okunmamış
                </span>
              )}
            </div>

            {/* Liste */}
            <div style={{ maxHeight: "440px", overflowY: "auto" }}>
              {announcements.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <Bell
                    size={32}
                    color="#d1d5db"
                    style={{ margin: "0 auto 12px" }}
                  />
                  <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
                    Henüz bildirim yok
                  </p>
                </div>
              ) : (
                announcements.map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "16px 20px",
                      borderBottom:
                        i < announcements.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      background: a.isRead ? "white" : "#fffbeb",
                      transition: "background 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: a.isRead ? "#f3f4f6" : "#fef3c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "16px",
                        }}
                      >
                        {a.isRead ? "📌" : "🔔"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#111827",
                              margin: 0,
                            }}
                          >
                            {a.title}
                          </p>
                          {!a.isRead && (
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: "#f59e0b",
                                flexShrink: 0,
                                display: "inline-block",
                              }}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#4b5563",
                            margin: "0 0 8px 0",
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {a.content}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af",
                            margin: 0,
                          }}
                        >
                          {new Date(a.createdAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
