"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import YetkiYok from "@/components/YetkiYok";

interface Personnel {
  id: string;
  name: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  arrivedAt: string;
  brandName: string | null;
  modelName: string | null;
  deviceTypeName: string | null;
  personnelId: string | null;
  personnel: Personnel | null;
  customer: { name: string; phone: string | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  in_service: { label: "Teknik Serviste", color: "#92400e", bg: "#fef3c7" },
  waiting_parts: { label: "Parça Bekliyor", color: "#9a3412", bg: "#ffedd5" },
  waiting_approval: { label: "Onay Bekliyor", color: "#6b21a8", bg: "#f3e8ff" },
  completed: { label: "Tamamlandı", color: "#166534", bg: "#dcfce7" },
  delivered: { label: "Teslim Edildi", color: "#166534", bg: "#dcfce7" },
  repair_failed: { label: "Tamir Olmadı", color: "#991b1b", bg: "#fee2e2" },
  sent_to_external: { label: "Dış Serviste", color: "#1e40af", bg: "#dbeafe" },
};

export default function IsEmirleriPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [personeller, setPersoneller] = useState<Personnel[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenPersonel, setSecilenPersonel] = useState("");
  const [secilenDurum, setSecilenDurum] = useState("");

  // Yetki kontrolü
  const [yetkiYuklendi, setYetkiYuklendi] = useState(false);
  const [canView, setCanView] = useState(true);
  const [isAtamaModuAktif, setIsAtamaModuAktif] = useState(true);

  useEffect(() => {
    const mod = sessionStorage.getItem("isAtamaModuAktif");
    setIsAtamaModuAktif(mod !== "false");

    const isAdminRaw = sessionStorage.getItem("activePersonnelIsAdmin");
    if (isAdminRaw === null || isAdminRaw === "true") {
      setCanView(true);
    } else {
      const permsRaw = sessionStorage.getItem("activePersonnelPermissions");
      if (permsRaw) {
        try {
          const perms = JSON.parse(permsRaw) as Record<string, boolean>;
          setCanView(!!perms["canAssignPersonnel"]);
        } catch {
          setCanView(false);
        }
      } else {
        setCanView(false);
      }
    }
    setYetkiYuklendi(true);
  }, []);

  useEffect(() => {
    fetch("/api/personnel")
      .then((r) => r.json())
      .then((data: Personnel[]) => setPersoneller(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (secilenPersonel) params.set("personnelId", secilenPersonel);
    if (secilenDurum) params.set("status", secilenDurum);
    setYukleniyor(true);
    fetch(`/api/service-orders?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { orders: Order[] }) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setYukleniyor(false));
  }, [secilenPersonel, secilenDurum]);

  if (!yetkiYuklendi) return null;
  if (!isAtamaModuAktif) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", gap: "16px", textAlign: "center", padding: "24px",
      }}>
        <div style={{ fontSize: "48px" }}>⚙️</div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>
          İş Atama Modu Aktif Değil
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, maxWidth: "400px" }}>
          Bu özelliği kullanmak için İş Atama Modunu aktif etmeniz gerekiyor.
        </p>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
          <strong>Şirketim → Personeller</strong> sekmesinden aktif edebilirsiniz.
        </p>
        <a
          href="/sirketim"
          style={{
            padding: "10px 24px", background: "#111827", color: "white",
            borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none",
          }}
        >
          Şirketim&apos;e Git
        </a>
      </div>
    );
  }
  if (!canView) return <YetkiYok />;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Başlık */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>İş Emirleri</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>Personellere atanan servis kayıtları</p>
        </div>
      </div>

      {/* Filtreler */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <select
          value={secilenPersonel}
          onChange={(e) => setSecilenPersonel(e.target.value)}
          style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", outline: "none", background: "white", minWidth: "180px" }}
        >
          <option value="">Tüm Personeller</option>
          {personeller.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={secilenDurum}
          onChange={(e) => setSecilenDurum(e.target.value)}
          style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", outline: "none", background: "white", minWidth: "180px" }}
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {yukleniyor ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "12px", background: "white" }}>
          <p style={{ fontSize: "16px", margin: "0 0 8px 0" }}>📋</p>
          <p style={{ fontSize: "14px", margin: 0 }}>Kayıt bulunamadı</p>
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", background: "white", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Kayıt No", "Müşteri", "Cihaz", "Durum", "Atanan Personel", "Tarih"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: "#374151", bg: "#f3f4f6" };
                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/servis-detay/${encodeURIComponent(order.id)}`)}
                    style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#4f46e5" }}>{order.orderNumber}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#111827" }}>{order.customer.name}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#374151" }}>
                      {[order.deviceTypeName, order.brandName, order.modelName].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#374151" }}>
                      {order.personnel ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                            {order.personnel.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{order.personnel.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>Atanmadı</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "#6b7280" }}>
                      {new Date(order.arrivedAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
