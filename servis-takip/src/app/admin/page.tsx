"use client";

import { useEffect, useState } from "react";

type AdminStatsResponse = {
  shops: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
    waEnabled: boolean;
    waPhoneNumberId: string | null;
    waConnected: boolean;
    userId: string | null;
    googleContactsConnected: boolean;
    personelGirisModu: boolean;
    secondHandCount: number;
    _count: { orders: number; secondHandDevices: number };
    orders: Array<{ id: string }>;
    recentOrders: Array<{ id: string }>;
    lastOrder: Array<{ createdAt: string }>;
  }>;
  totalOrders: number;
  todayOrders: number;
  activeShops: number;
  newShopsThisMonth: number;
  error?: string;
};

export default function AdminPage() {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<
    {
      id: string;
      title: string;
      content: string;
      createdAt: string;
      _count: { reads: number };
    }[]
  >([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [sending, setSending] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const d = (await fetch("/api/admin/stats").then((r) =>
          r.json(),
        )) as AdminStatsResponse;
        setData(d);
        const ann = await fetch("/api/admin/announcements").then((r) =>
          r.json(),
        );
        if (Array.isArray(ann)) setAnnouncements(ann);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(shopId: string, shopName: string) {
    if (
      !confirm(
        `"${shopName}" dükkanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      )
    )
      return;
    await fetch(`/api/admin/shops/${shopId}`, { method: "DELETE" });
    window.location.reload();
  }

  async function handleSendAnnouncement() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setAnnouncementMsg("Bildirim gönderildi!");
        const ann = await fetch("/api/admin/announcements").then((r) =>
          r.json(),
        );
        if (Array.isArray(ann)) setAnnouncements(ann);
        setTimeout(() => setAnnouncementMsg(""), 3000);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm("Bu bildirimi silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Bildirim silinemedi, lütfen tekrar deneyin.");
    }
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <p style={{ color: "#6b7280" }}>Yükleniyor...</p>
      </div>
    );

  if (!data || data.error)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <p style={{ color: "#dc2626" }}>Yetkisiz erişim</p>
      </div>
    );

  const { shops, totalOrders, todayOrders, activeShops, newShopsThisMonth } =
    data;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#111827",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: "16px", fontWeight: 800 }}>
              T
            </span>
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>
            TamirTakip Admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href="/"
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Uygulamaya Dön
          </a>
          <button
            onClick={async () => {
              const { createClient } = await import("@/lib/supabase/client");
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: "Toplam Dükkan",
              value: shops.length,
              color: "#4f46e5",
              icon: "🏪",
            },
            {
              label: "Aktif (7 gün)",
              value: activeShops,
              color: "#16a34a",
              icon: "✅",
            },
            {
              label: "Bu Ay Yeni",
              value: newShopsThisMonth,
              color: "#f59e0b",
              icon: "🆕",
            },
            {
              label: "Toplam Kayıt",
              value: totalOrders,
              color: "#0891b2",
              icon: "📋",
            },
            {
              label: "Bugün Kayıt",
              value: todayOrders,
              color: "#7c3aed",
              icon: "📅",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    {card.label}
                  </p>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      color: card.color,
                    }}
                  >
                    {card.value}
                  </p>
                </div>
                <span style={{ fontSize: "24px" }}>{card.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bildirim Gönder */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "16px",
            }}
          >
            📢 Tüm Dükkanlara Bildirim Gönder
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Başlık"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <textarea
              placeholder="İçerik"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => void handleSendAnnouncement()}
              disabled={sending || !newTitle.trim() || !newContent.trim()}
              style={{
                padding: "10px 20px",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {sending ? "Gönderiliyor..." : "Gönder"}
            </button>
            {announcementMsg ? (
              <span style={{ fontSize: "13px", color: "#16a34a" }}>
                {announcementMsg}
              </span>
            ) : null}
          </div>

          {announcements.length > 0 ? (
            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid #f3f4f6",
                paddingTop: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                Gönderilen Bildirimler
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#111827",
                          margin: "0 0 2px 0",
                        }}
                      >
                        {a.title}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          margin: "0 0 4px 0",
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
                        {new Date(a.createdAt).toLocaleDateString("tr-TR")} ·{" "}
                        {a._count.reads} dükkan okudu
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteAnnouncement(a.id)}
                      style={{
                        padding: "4px 10px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fca5a5",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                        flexShrink: 0,
                        marginLeft: "12px",
                      }}
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
              Kayıtlı Dükkanlar
            </h2>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {shops.length} toplam
            </span>
          </div>
          <div>
            {shops.map((shop) => (
              <div
                key={shop.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f3f4f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: "4px",
                    }}
                  >
                    {shop.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {shop.email ? (
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        ✉️ {shop.email}
                      </span>
                    ) : null}
                    {shop.phone ? (
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        📞 {shop.phone}
                      </span>
                    ) : null}
                    {shop.address ? (
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        📍 {shop.address}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                    Kayıt:{" "}
                    {new Date(shop.createdAt).toLocaleDateString("tr-TR")} ·
                    Servis: {shop._count.orders} · İkinci El:{" "}
                    {shop.secondHandCount} · Bu ay: {shop.orders.length}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginTop: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 7px",
                        borderRadius: "20px",
                        background: shop.lastOrder?.[0]
                          ? new Date(shop.lastOrder[0].createdAt) >=
                            new Date(Date.now() - 24 * 60 * 60 * 1000)
                            ? "#dcfce7"
                            : new Date(shop.lastOrder[0].createdAt) >=
                                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              ? "#fef9c3"
                              : "#f3f4f6"
                          : "#f3f4f6",
                        color: shop.lastOrder?.[0]
                          ? new Date(shop.lastOrder[0].createdAt) >=
                            new Date(Date.now() - 24 * 60 * 60 * 1000)
                            ? "#16a34a"
                            : new Date(shop.lastOrder[0].createdAt) >=
                                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              ? "#854d0e"
                              : "#6b7280"
                          : "#6b7280",
                      }}
                    >
                      {shop.lastOrder?.[0]
                        ? `Son kayıt: ${new Date(shop.lastOrder[0].createdAt).toLocaleDateString("tr-TR")}`
                        : "Henüz kayıt yok"}
                    </span>

                    {shop.recentOrders.length > 0 ? (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 7px",
                          borderRadius: "20px",
                          background: "#eff6ff",
                          color: "#2563eb",
                        }}
                      >
                        Bu hafta: {shop.recentOrders.length} kayıt
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 7px",
                          borderRadius: "20px",
                          background: "#f3f4f6",
                          color: "#9ca3af",
                        }}
                      >
                        Bu hafta kayıt yok
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 7px",
                        borderRadius: "20px",
                        background: shop.googleContactsConnected
                          ? "#f0fdf4"
                          : "#f3f4f6",
                        color: shop.googleContactsConnected
                          ? "#16a34a"
                          : "#9ca3af",
                      }}
                    >
                      {shop.googleContactsConnected
                        ? "📇 Google Bağlı"
                        : "📇 Google Yok"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      background:
                        new Date(shop.updatedAt) >=
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ? "#dcfce7"
                          : "#f3f4f6",
                      color:
                        new Date(shop.updatedAt) >=
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ? "#16a34a"
                          : "#6b7280",
                    }}
                  >
                    {new Date(shop.updatedAt) >=
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ? "Aktif"
                      : "Pasif"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: shop.waConnected ? "#16a34a" : "#9ca3af",
                    }}
                  >
                    {shop.waConnected
                      ? "✅ WA Bağlı"
                      : "❌ WA Bağlı Değil"}
                  </span>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: shop.personelGirisModu
                        ? "#dbeafe"
                        : "#f3f4f6",
                      color: shop.personelGirisModu ? "#1d4ed8" : "#6b7280",
                    }}
                  >
                    {shop.personelGirisModu
                      ? "👥 Personel Modu Açık"
                      : "👤 Personel Modu Kapalı"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(shop.id, shop.name)}
                    style={{
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
