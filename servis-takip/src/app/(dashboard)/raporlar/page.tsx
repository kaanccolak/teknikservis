"use client";

import PageGuideModal from "@/components/onboarding/PageGuideModal";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount || 0);
}

type TabKey = "servis" | "finansal" | "ikinciEl";

type ServisResponse = {
  tab: "servis";
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
  };
  hasData: boolean;
  service: {
    totalOrders: number;
    successRatePercent: number;
    failedOrders: number;
    monthlyOrders: { year: number; month: number; count: number }[];
    deviceTypeStats: {
      deviceTypeId: string | null;
      name: string;
      count: number;
    }[];
  };
};

type FinansalResponse = {
  tab: "finansal";
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
  };
  hasData: boolean;
  financial: {
    totalRevenue: number;
    averageOrderValue: number;
    monthlyCiro: { year: number; month: number; total: number }[];
    monthlyComparison: {
      year: number;
      month: number;
      orderCount: number;
      revenue: number;
      prevChangePercent: number | null;
    }[];
  };
};

type IkinciElResponse = {
  tab: "ikinciEl";
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
  };
  hasData: boolean;
  secondHand: {
    totalBought: number;
    totalSold: number;
    totalBoughtAmount: number;
    totalSoldAmount: number;
    netProfit: number;
  };
};

function ayLabel(y: number, m: number) {
  return `${MONTHS[m - 1]} ${y}`;
}

function monthLongTr(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("tr-TR", {
    month: "long",
  });
}

function TabSkeleton({ cols }: { cols: 3 | 2 | 4 }) {
  const n = cols;
  const gridClass =
    cols === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className="animate-pulse space-y-6">
      <div className={`grid gap-3 ${gridClass}`}>
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="h-24 rounded-[10px] bg-slate-100" />
        ))}
      </div>
      <div className="h-[250px] rounded-[10px] bg-slate-100" />
    </div>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "servis", label: "📊 Servis Raporları" },
  { key: "finansal", label: "💰 Finansal Raporlar" },
  { key: "ikinciEl", label: "📱 İkinci El Raporları" },
];

export default function RaporlarPage() {
  const [year, setYear] = useState(() => {
    const y = new Date().getFullYear();
    if (y >= 2024 && y <= 2026) return y;
    return 2026;
  });
  const [period, setPeriod] = useState<"yearly" | "monthly">("yearly");
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState<TabKey>("servis");

  const [servisData, setServisData] = useState<ServisResponse | null>(null);
  const [finansalData, setFinansalData] = useState<FinansalResponse | null>(
    null,
  );
  const [ikinciElData, setIkinciElData] = useState<IkinciElResponse | null>(
    null,
  );

  const [loading, setLoading] = useState({
    servis: false,
    finansal: false,
    ikinciEl: false,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchTab = useCallback(
    async (t: TabKey) => {
      setError(null);
      setLoading((prev) => ({ ...prev, [t]: true }));
      try {
        const qs = new URLSearchParams({
          year: String(year),
          tab: t,
        });
        if (period === "monthly") qs.set("month", String(month));
        const res = await fetch(`/api/raporlar?${qs.toString()}`);
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError((json as { error?: string }).error ?? "Rapor yüklenemedi");
          return;
        }
        if (t === "servis") setServisData(json as ServisResponse);
        if (t === "finansal") setFinansalData(json as FinansalResponse);
        if (t === "ikinciEl") setIkinciElData(json as IkinciElResponse);
      } catch {
        setError("Bağlantı hatası");
      } finally {
        setLoading((prev) => ({ ...prev, [t]: false }));
      }
    },
    [year, period, month],
  );

  useEffect(() => {
    void fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const monthlyData = useMemo(() => {
    if (!servisData) return [];
    return servisData.service.monthlyOrders.map((r) => ({
      ay: ayLabel(r.year, r.month),
      sayi: r.count,
    }));
  }, [servisData]);

  const deviceTypeData = useMemo(() => {
    if (!servisData) return [];
    return servisData.service.deviceTypeStats
      .filter((d) => d.count > 0)
      .map((d) => ({ name: d.name, value: d.count }));
  }, [servisData]);

  const monthlyRevenueData = useMemo(() => {
    if (!finansalData) return [];
    return finansalData.financial.monthlyCiro.map((r) => ({
      ay: ayLabel(r.year, r.month),
      ciro: r.total,
    }));
  }, [finansalData]);

  const monthlyCompare = useMemo(() => {
    if (!finansalData) return [];
    return finansalData.financial.monthlyComparison.map((row) => ({
      ay: `${monthLongTr(row.year, row.month)} ${row.year}`,
      sayi: row.orderCount,
      ciro: row.revenue,
      degisim: row.prevChangePercent,
    }));
  }, [finansalData]);

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-0">
      <PageGuideModal
        pageKey="raporlar"
        icon="📊"
        title="Raporlar"
        description="İşletmenizin finansal ve operasyonel performansını buradan analiz edin."
        tips={[
          "Günlük, haftalık, aylık ve yıllık ciro görün",
          "En çok gelen cihaz türlerini analiz edin",
          "İkinci el alım/satım kar/zarar raporunu inceleyin",
        ]}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "600" }}>Raporlar</h1>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            style={{
              padding: "6px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              background: "white",
              color: "#374151",
            }}
            aria-label="Yıl"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPeriod("yearly")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              background: period === "yearly" ? "#111" : "white",
              color: period === "yearly" ? "white" : "#374151",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
            }}
          >
            Yıllık
          </button>
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              background: period === "monthly" ? "#111" : "white",
              color: period === "monthly" ? "white" : "#374151",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
            }}
          >
            Aylık
          </button>
          {period === "monthly" ? (
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              style={{
                padding: "6px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "13px",
                background: "white",
                color: "#374151",
              }}
              aria-label="Ay"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString("tr-TR", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "24px",
          gap: "4px",
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: activeTab === tab.key ? "600" : "400",
              color: activeTab === tab.key ? "#111" : "#6b7280",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #111"
                  : "2px solid transparent",
              cursor: "pointer",
              marginBottom: "-1px",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive mb-4" role="alert">
          {error}
        </p>
      ) : null}

      {activeTab === "servis" ? (
        <>
          {loading.servis && !servisData ? <TabSkeleton cols={3} /> : null}
          {!loading.servis && servisData && !servisData.hasData ? (
            <p
              className="text-center py-16 rounded-lg border border-dashed text-[#6b7280] text-sm"
              style={{ borderColor: "#e5e7eb" }}
            >
              Bu dönemde veri bulunamadı
            </p>
          ) : null}
          {!loading.servis && servisData && servisData.hasData ? (
            <>
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                style={{ marginBottom: "24px" }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Toplam Kayıt
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700" }}>
                    {servisData.service.totalOrders.toLocaleString("tr-TR")}{" "}
                    cihaz
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #dcfce7",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#f0fdf4",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#16a34a",
                      marginBottom: "6px",
                    }}
                  >
                    Tamir Başarı Oranı
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#16a34a",
                    }}
                  >
                    %
                    {servisData.service.successRatePercent.toLocaleString(
                      "tr-TR",
                    )}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #fee2e2",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#fef2f2",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dc2626",
                      marginBottom: "6px",
                    }}
                  >
                    Tamir Olmayan
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#dc2626",
                    }}
                  >
                    {servisData.service.failedOrders.toLocaleString("tr-TR")}{" "}
                    cihaz
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "16px",
                    }}
                  >
                    Aylık Kayıt Sayısı
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="ay" fontSize={11} />
                      <YAxis fontSize={11} allowDecimals={false} />
                      <Tooltip
                        formatter={(v) => [
                          `${Number(v ?? 0).toLocaleString("tr-TR")} cihaz`,
                          "Kayıt",
                        ]}
                      />
                      <Bar
                        dataKey="sayi"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "16px",
                    }}
                  >
                    Cihaz Türü Dağılımı
                  </div>
                  {deviceTypeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Bu dönemde cihaz türü verisi yok.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={deviceTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (%${((percent ?? 0) * 100).toFixed(0)})`
                          }
                        >
                          {deviceTypeData.map((_, i) => (
                            <Cell
                              key={`c-${i}`}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) =>
                            `${Number(v ?? 0).toLocaleString("tr-TR")} adet`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {activeTab === "finansal" ? (
        <>
          {loading.finansal && !finansalData ? <TabSkeleton cols={2} /> : null}
          {!loading.finansal && finansalData && !finansalData.hasData ? (
            <p
              className="text-center py-16 rounded-lg border border-dashed text-[#6b7280] text-sm"
              style={{ borderColor: "#e5e7eb" }}
            >
              Bu dönemde veri bulunamadı
            </p>
          ) : null}
          {!loading.finansal && finansalData && finansalData.hasData ? (
            <>
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                style={{ marginBottom: "24px" }}
              >
                <div
                  style={{
                    border: "1px solid #dcfce7",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#f0fdf4",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#16a34a",
                      marginBottom: "6px",
                    }}
                  >
                    Toplam Ciro
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#16a34a",
                    }}
                  >
                    {formatCurrency(finansalData.financial.totalRevenue)}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Ortalama İş Emri Değeri
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700" }}>
                    {formatCurrency(finansalData.financial.averageOrderValue)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}
                >
                  Aylık Ciro
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="ay" fontSize={11} />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v ?? 0))}
                    />
                    <Line
                      type="monotone"
                      dataKey="ciro"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <th
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontWeight: 500,
                          color: "#6b7280",
                        }}
                      >
                        Ay
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          textAlign: "right",
                          fontWeight: 500,
                          color: "#6b7280",
                        }}
                      >
                        Kayıt Sayısı
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          textAlign: "right",
                          fontWeight: 500,
                          color: "#6b7280",
                        }}
                      >
                        Ciro
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          textAlign: "right",
                          fontWeight: 500,
                          color: "#6b7280",
                        }}
                      >
                        Önceki Aya Göre
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyCompare.map((row, i) => (
                      <tr
                        key={`${row.ay}-${i}`}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "10px 16px" }}>{row.ay}</td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                          }}
                        >
                          {row.sayi.toLocaleString("tr-TR")}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(row.ciro)}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                          }}
                        >
                          {row.degisim === null ? (
                            "—"
                          ) : (
                            <span
                              style={{
                                color:
                                  row.degisim >= 0 ? "#16a34a" : "#dc2626",
                                fontWeight: 500,
                              }}
                            >
                              {row.degisim >= 0 ? "↑" : "↓"} %
                              {Math.abs(row.degisim).toLocaleString("tr-TR")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {activeTab === "ikinciEl" ? (
        <>
          {loading.ikinciEl && !ikinciElData ? <TabSkeleton cols={4} /> : null}
          {!loading.ikinciEl && ikinciElData && !ikinciElData.hasData ? (
            <p
              className="text-center py-16 rounded-lg border border-dashed text-[#6b7280] text-sm"
              style={{ borderColor: "#e5e7eb" }}
            >
              Bu dönemde veri bulunamadı
            </p>
          ) : null}
          {!loading.ikinciEl && ikinciElData && ikinciElData.hasData ? (
            <>
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                style={{ marginBottom: "24px" }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Alınan Cihaz
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700" }}>
                    {ikinciElData.secondHand.totalBought.toLocaleString(
                      "tr-TR",
                    )}{" "}
                    adet
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Satılan Cihaz
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "700" }}>
                    {ikinciElData.secondHand.totalSold.toLocaleString("tr-TR")}{" "}
                    adet
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #fee2e2",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#fef2f2",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dc2626",
                      marginBottom: "6px",
                    }}
                  >
                    Toplam Alım
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#dc2626",
                    }}
                  >
                    {formatCurrency(
                      ikinciElData.secondHand.totalBoughtAmount,
                    )}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #dcfce7",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#f0fdf4",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#16a34a",
                      marginBottom: "6px",
                    }}
                  >
                    Toplam Satım
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#16a34a",
                    }}
                  >
                    {formatCurrency(ikinciElData.secondHand.totalSoldAmount)}
                  </div>
                </div>
              </div>

              {(() => {
                const netProfit =
                  ikinciElData.secondHand.totalSoldAmount -
                  ikinciElData.secondHand.totalBoughtAmount;
                const isProfit = netProfit >= 0;
                return (
                  <div
                    style={{
                      border: `1px solid ${isProfit ? "#86efac" : "#fca5a5"}`,
                      borderRadius: "10px",
                      padding: "24px",
                      background: isProfit ? "#f0fdf4" : "#fef2f2",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: isProfit ? "#16a34a" : "#dc2626",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      {isProfit ? "✓ Net Kar" : "✗ Net Zarar"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginBottom: "8px",
                      }}
                    >
                      Toplam Satım − Toplam Alım
                    </div>
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: 700,
                        color: isProfit ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {isProfit ? "+" : ""}
                      {formatCurrency(netProfit)}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
