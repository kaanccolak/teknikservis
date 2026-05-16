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
    // Açılınca okunmamışları okundu yap
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
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "8px",
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid white",
              }}
            />
          )}
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "340px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Bildirimler
              </p>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    background: "#ef4444",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  {unreadCount} yeni
                </span>
              )}
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {announcements.length === 0 ? (
                <p
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  Henüz bildirim yok
                </p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #f9fafb",
                      background: a.isRead ? "white" : "#fefce8",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      {!a.isRead && (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#f59e0b",
                            flexShrink: 0,
                            marginTop: "5px",
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#111827",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {a.title}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: "0 0 6px 0",
                            lineHeight: "1.5",
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
