import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAdminData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [shops, totalOrders, todayOrders, recentOrders] = await Promise.all([
    prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    }),
    prisma.serviceOrder.count({ where: { deletedAt: null } }),
    prisma.serviceOrder.count({
      where: {
        deletedAt: null,
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.serviceOrder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { shop: { select: { name: true } } },
    }),
  ]);

  const activeShops = shops.filter((s) => s.updatedAt >= sevenDaysAgo).length;
  const newShopsThisMonth = shops.filter((s) => s.createdAt >= thirtyDaysAgo)
    .length;

  return {
    shops,
    totalOrders,
    todayOrders,
    recentOrders,
    activeShops,
    newShopsThisMonth,
  };
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component: set yalnızca Server Action / Route Handler içinde */
          }
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== "kaanccolak@gmail.com") redirect("/");

  const {
    shops,
    totalOrders,
    todayOrders,
    recentOrders,
    activeShops,
    newShopsThisMonth,
  } = await getAdminData();

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
        <a
          href="/"
          style={{ color: "#9ca3af", fontSize: "13px", textDecoration: "none" }}
        >
          ← Uygulamaya Dön
        </a>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
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
              <h2
                style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}
              >
                Kayıtlı Dükkanlar
              </h2>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                {shops.length} toplam
              </span>
            </div>
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#111827",
                        marginBottom: "2px",
                      }}
                    >
                      {shop.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {new Date(shop.createdAt).toLocaleDateString("tr-TR")} ·{" "}
                      {shop._count.orders} kayıt
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background:
                          shop.updatedAt >=
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            ? "#dcfce7"
                            : "#f3f4f6",
                        color:
                          shop.updatedAt >=
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            ? "#16a34a"
                            : "#6b7280",
                      }}
                    >
                      {shop.updatedAt >=
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? "Aktif"
                        : "Pasif"}
                    </span>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        marginTop: "4px",
                      }}
                    >
                      {shop.waEnabled ? "✅ WA" : "❌ WA"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
              }}
            >
              <h2
                style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}
              >
                Son Servis Kayıtları
              </h2>
            </div>
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #f3f4f6",
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
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "2px",
                        }}
                      >
                        #{order.orderNumber ?? "—"}
                      </p>
                      <p style={{ fontSize: "11px", color: "#6b7280" }}>
                        {order.shop.name}
                      </p>
                    </div>
                    <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
