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
    _count: { orders: number };
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

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d: AdminStatsResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
                    Toplam: {shop._count.orders} · Bu ay: {shop.orders.length}
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
