"use client";

import {
  Check,
  ClipboardList,
  Clock,
  MessageSquare,
  Package,
  Send,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import WelcomeModal from "@/components/onboarding/WelcomeModal";
import { Input } from "@/components/ui/input";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import { getStatusBadge } from "@/lib/statusConfig";
import {
  type PaymentPlanRow,
  calendarDaysUntilDue,
  formatPlanDate,
  getDaysColor,
} from "@/lib/payment-plan-helpers";
import { cn } from "@/lib/utils";

type RecentCustomer = { name: string };
type RecentNamed = { name: string };
type RecentOrder = {
  id: string;
  orderNumber: string | null;
  arrivedAt: string;
  status: string;
  deviceTypeName: string | null;
  brandName: string | null;
  modelName: string | null;
  customer: RecentCustomer;
  deviceType: RecentNamed | null;
  brand: RecentNamed | null;
  deviceModel: RecentNamed | null;
};

type DashboardPayload = {
  totalActive: number;
  waitingApproval: number;
  approvalGiven: number;
  waitingPart: number;
  inService: number;
  completedToday: number;
  revenue: number;
  externalService: number;
  recentOrders: RecentOrder[];
  /** Sunucu sürümü eskiyse undefined olabilir */
  waUnreadCount?: number;
};

type RevenuePeriod = "daily" | "weekly" | "monthly" | "yearly" | "range";

function formatTodayHeader(d: Date) {
  const datePart = d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const weekday = d.toLocaleDateString("tr-TR", { weekday: "long" });
  return `${datePart}, ${weekday}`;
}

function formatTryTr(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(n);
}

function formatArrivedAt(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deviceLabel(row: RecentOrder) {
  return (
    row.deviceModel?.name ??
    row.modelName ??
    row.brand?.name ??
    row.brandName ??
    row.deviceType?.name ??
    row.deviceTypeName ??
    "—"
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-slate-200" />
          <div className="h-4 w-72 max-w-full rounded-md bg-slate-100" />
        </div>
        <div className="h-5 w-56 rounded-md bg-slate-100 sm:text-right" />
      </div>
      <div className="dash-grid-r1-skel">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`r1-${i}`} className="h-[88px] rounded-[10px] bg-slate-100" />
        ))}
      </div>
      <div className="dash-grid-r2-skel">
        <div className="h-[88px] rounded-[10px] bg-slate-100" />
        <div className="h-[88px] min-h-[120px] rounded-[10px] bg-slate-100" />
        <div className="h-[88px] rounded-[10px] bg-slate-100" />
      </div>
      <div className="dash-grid-bottom-skel">
        <div className="h-56 rounded-xl bg-slate-100" />
        <div className="h-64 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

type StatCardDef = {
  title: string;
  valueKey: keyof Pick<
    DashboardPayload,
    | "totalActive"
    | "inService"
    | "waitingPart"
    | "waitingApproval"
    | "completedToday"
    | "externalService"
  >;
  href: string;
  accentColor: string;
  icon: LucideIcon;
};

const statCardsRow1: StatCardDef[] = [
  {
    title: "Toplam Aktif Cihaz",
    valueKey: "totalActive",
    href: "/cihaz-sorgula?hideCompleted=true",
    accentColor: "#3b82f6",
    icon: ClipboardList,
  },
  {
    title: "Teknik Serviste",
    valueKey: "inService",
    href: "/cihaz-sorgula?status=in_service&hideCompleted=true",
    accentColor: "#6366f1",
    icon: Wrench,
  },
  {
    title: "Onay Bekliyor",
    valueKey: "waitingApproval",
    href: "/cihaz-sorgula?status=waiting_approval&hideCompleted=true",
    accentColor: "#f59e0b",
    icon: Clock,
  },
  {
    title: "Parça Bekliyor",
    valueKey: "waitingPart",
    href: "/cihaz-sorgula?status=waiting_part&hideCompleted=true",
    accentColor: "#f97316",
    icon: Package,
  },
];

const statCardCompletedToday: StatCardDef = {
  title: "Bugün Tamamlanan",
  valueKey: "completedToday",
  href: "/cihaz-sorgula?status=completed&hideCompleted=false",
  accentColor: "#10b981",
  icon: Check,
};

const statCardExternal: StatCardDef = {
  title: "Dış Serviste",
  valueKey: "externalService",
  href: "/cihaz-sorgula?status=sent_to_external",
  accentColor: "#7c3aed",
  icon: Send,
};

const CIRO_PERIOD_LABELS: { id: RevenuePeriod; label: string }[] = [
  { id: "daily", label: "Bugün" },
  { id: "weekly", label: "Bu Hafta" },
  { id: "monthly", label: "Bu Ay" },
  { id: "yearly", label: "Bu Yıl" },
  { id: "range", label: "Tarih Aralığı" },
];

function StatCard({
  def,
  counts,
}: {
  def: StatCardDef;
  counts: DashboardPayload;
}) {
  const n = counts[def.valueKey];
  const Icon = def.icon;
  return (
    <Link href={def.href} className="block min-h-0">
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px 20px",
          background: "white",
          borderLeft: `3px solid ${def.accentColor}`,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          transition: "box-shadow 0.15s",
        }}
        className="hover:shadow-md"
      >
        <div className="min-w-0">
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "6px",
            }}
          >
            {def.title}
          </div>
          <div
            className="tabular-nums tracking-tight"
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#111",
              lineHeight: 1,
            }}
          >
            {n}
          </div>
        </div>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "10px",
            background: `${def.accentColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: def.accentColor,
          }}
          aria-hidden
        >
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

function RevenueCiroCard({
  revenue,
  onRevenueChange,
  dailyRevenueFromDashboard,
}: {
  revenue: number;
  onRevenueChange: (n: number) => void;
  /** Ana dashboard yüklemesindeki günlük ciro; period=daily iken ek API çağrısı yapılmaz */
  dailyRevenueFromDashboard: number;
}) {
  const [ciroGoster, setCiroGoster] = useState(false);
  const [period, setPeriod] = useState<RevenuePeriod>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const onRevenueChangeRef = useRef(onRevenueChange);
  onRevenueChangeRef.current = onRevenueChange;

  const fetchCiro = useCallback(
    async (startDateParam: string, endDateParam: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ciroOnly: "true",
          startDate: startDateParam,
          endDate: endDateParam,
        });
        const res = await fetch(`/api/dashboard?${params.toString()}`, {
          cache: "no-store",
        });
        const j = (await res.json()) as { revenue?: number; error?: string };
        if (res.ok && typeof j.revenue === "number") {
          onRevenueChangeRef.current(j.revenue);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getPeriodDates = useCallback((selected: RevenuePeriod) => {
    const now = new Date();
    const toYmd = (d: Date) => {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, "0");
      const day = `${d.getDate()}`.padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    if (selected === "daily") {
      return { start: toYmd(now), end: toYmd(now) };
    }
    if (selected === "weekly") {
      const start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      return { start: toYmd(start), end: toYmd(now) };
    }
    if (selected === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toYmd(start), end: toYmd(now) };
    }
    if (selected === "yearly") {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: toYmd(start), end: toYmd(now) };
    }
    return { start: "", end: "" };
  }, []);

  const handlePeriodChange = useCallback(
    (nextPeriod: RevenuePeriod) => {
      setPeriod(nextPeriod);
      if (nextPeriod !== "range") {
        const { start, end } = getPeriodDates(nextPeriod);
        if (start && end) {
          void fetchCiro(start, end);
        }
      }
    },
    [fetchCiro, getPeriodDates],
  );

  useEffect(() => {
    onRevenueChangeRef.current(dailyRevenueFromDashboard);
  }, [dailyRevenueFromDashboard]);

  useEffect(() => {
    if (period !== "range" || !startDate || !endDate) return;
    const t = window.setTimeout(() => {
      void fetchCiro(startDate, endDate);
    }, 450);
    return () => {
      window.clearTimeout(t);
    };
  }, [period, startDate, endDate, fetchCiro]);

  const fetchCiroManual = useCallback(() => {
    if (period !== "range") {
      const { start, end } = getPeriodDates(period);
      if (start && end) {
        void fetchCiro(start, end);
      }
    } else if (startDate && endDate) {
      void fetchCiro(startDate, endDate);
    }
  }, [period, startDate, endDate, fetchCiro, getPeriodDates]);

  return (
    <>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px 20px",
          background: "white",
          borderLeft: "3px solid #10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          height: "100%",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "6px",
            }}
          >
            Ciro
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className={cn("tabular-nums tracking-tight", loading && "opacity-60")}
              style={{
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
                color: "#111",
              }}
            >
              {ciroGoster ? formatTryTr(revenue) : "₺ ******"}
            </span>
            <button
              type="button"
              onClick={() => setCiroGoster(!ciroGoster)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#666",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
              }}
              title={ciroGoster ? "Gizle" : "Göster"}
            >
              {ciroGoster ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => fetchCiroManual()}
              disabled={loading}
              title="Ciro verisini yenile"
              style={{
                background: "none",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                padding: "4px",
                color: "#666",
                display: "flex",
                alignItems: "center",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <svg
                className={cn(loading && "animate-spin")}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {CIRO_PERIOD_LABELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handlePeriodChange(id)}
              style={{
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                border: "1px solid #e5e7eb",
                background: period === id ? "#10b981" : "white",
                color: period === id ? "white" : "#374151",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {period === "range" ? (
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            fontSize: "12px",
          }}
        >
          <Input
            id="ciro-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-auto min-w-[10rem] bg-white"
            aria-label="Başlangıç tarihi"
          />
          <span style={{ color: "#9ca3af" }}>—</span>
          <Input
            id="ciro-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-auto min-w-[10rem] bg-white"
            aria-label="Bitiş tarihi"
          />
        </div>
      ) : null}
    </>
  );
}

function UpcomingPaymentsCard() {
  const [plans, setPlans] = useState<PaymentPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/payment-plans?upcoming=true&limit=5")
      .then((r) => r.json())
      .then((data: { plans?: PaymentPlanRow[] }) => {
        setPlans(data.plans || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleComplete(plan: PaymentPlanRow) {
    const next = !plan.isCompleted;
    const snapshot = plans;
    if (next) {
      setPlans((p) => p.filter((x) => x.id !== plan.id));
    }
    try {
      const res = await fetch(`/api/payment-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: next }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "İşlem başarısız");
      }
      const refresh = await fetch(
        "/api/payment-plans?upcoming=true&limit=5",
        { cache: "no-store" },
      );
      const j2 = (await refresh.json()) as { plans?: PaymentPlanRow[] };
      if (refresh.ok) setPlans(j2.plans ?? []);
    } catch (e) {
      setPlans(snapshot);
      toast.error(e instanceof Error ? e.message : "Durum güncellenemedi");
    }
  }

  return (
    <div
      className="h-full min-h-0"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#111" }}>
            Planlarım
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginTop: "2px",
            }}
          >
            Tamamlanmamış planlar
          </div>
        </div>
        <Link
          href="/planlarim"
          style={{
            fontSize: "12px",
            color: "#6b7280",
            textDecoration: "none",
          }}
          className="hover:text-slate-900"
        >
          Tümünü Gör →
        </Link>
      </div>

      <div style={{ padding: "8px 20px" }}>
        {loading ? (
          <div className="space-y-3 animate-pulse py-2">
            <div className="h-10 rounded bg-slate-100" />
            <div className="h-10 rounded bg-slate-100" />
            <div className="h-10 rounded bg-slate-100" />
          </div>
        ) : plans.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "13px",
              padding: "20px 0",
            }}
          >
            Yaklaşan ödeme yok
          </div>
        ) : (
          plans.map((plan) => {
            const daysLeft = calendarDaysUntilDue(plan.dueDate);
            return (
              <div
                key={plan.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
              <button
                type="button"
                onClick={() => void toggleComplete(plan)}
                aria-label={
                  plan.isCompleted
                    ? "Tamamlanmadı yap"
                    : "Tamamlandı işaretle"
                }
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: `2px solid ${plan.isCompleted ? "#10b981" : "#d1d5db"}`,
                  background: plan.isCompleted ? "#10b981" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {plan.isCompleted ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>
                  {plan.title}
                </div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                  {formatPlanDate(plan.dueDate)}
                  {plan.amount != null && !Number.isNaN(plan.amount)
                    ? ` · ₺${plan.amount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}`
                    : ""}
                </div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: getDaysColor(daysLeft),
                  flexShrink: 0,
                }}
              >
                {daysLeft === 0
                  ? "Bugün!"
                  : daysLeft < 0
                    ? `${Math.abs(daysLeft)}g geçti`
                    : `${daysLeft}g kaldı`}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [rates, setRates] = useState<{
    usd: { alis: string; satis: string } | null;
    eur: { alis: string; satis: string } | null;
    guncelleme?: string;
  }>({
    usd: null,
    eur: null,
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayLabel = useMemo(() => formatTodayHeader(new Date()), []);

  const handleRevenueChange = useCallback((n: number) => {
    setData((prev) => (prev ? { ...prev, revenue: n } : null));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", {
        next: { revalidate: 30 },
      });
      const json = (await res.json()) as DashboardPayload | { error?: string };
      if (!res.ok) {
        setData(null);
        setError(
          typeof json === "object" && json && "error" in json
            ? String((json as { error: string }).error)
            : "Veriler yüklenemedi",
        );
        return;
      }
      setData(json as DashboardPayload);
    } catch {
      setData(null);
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch(`/api/exchange-rates?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = (await res.json()) as {
        usd: { alis: string; satis: string } | null;
        eur: { alis: string; satis: string } | null;
        guncelleme?: string;
      };
      if (data.usd && data.eur) {
        setRates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRates();
    const interval = window.setInterval(fetchRates, 10 * 60 * 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [fetchRates]);

  function goDetail(id: string) {
    router.push(`/servis-detay/${encodeURIComponent(id)}`);
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Gösterge Paneli</h1>
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Veri alınamadı"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WelcomeModal />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .dash-grid-r1 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        .dash-grid-r2 {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .dash-grid-bottom {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 16px;
        }
        .dash-grid-r1-skel {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        .dash-grid-r2-skel {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .dash-grid-bottom-skel {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .dash-grid-r1, .dash-grid-r1-skel {
            grid-template-columns: repeat(2, 1fr);
          }
          .dash-grid-r2, .dash-grid-r2-skel {
            grid-template-columns: 1fr;
          }
          .dash-grid-bottom, .dash-grid-bottom-skel {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .dash-grid-r1, .dash-grid-r1-skel {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .dash-grid-r2, .dash-grid-r2-skel {
            grid-template-columns: 1fr !important;
          }
          .dash-grid-bottom, .dash-grid-bottom-skel {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Gösterge Paneli
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Servis özetleri ve son kayıtlar. Kartlara tıklayarak filtrelenmiş listeye
            gidebilirsiniz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:gap-5">
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {!ratesLoading && (!rates.usd || !rates.eur) ? null : (
              <>
                {ratesLoading ? (
                  <>
                    <div
                      style={{
                        background: "#f8f9fa",
                        border: "1px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#555" }}>USD</span>
                      <div
                        className="animate-pulse"
                        style={{
                          width: "84px",
                          height: "16px",
                          background: "#e9ecef",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        background: "#f8f9fa",
                        border: "1px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#555" }}>EUR</span>
                      <div
                        className="animate-pulse"
                        style={{
                          width: "84px",
                          height: "16px",
                          background: "#e9ecef",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {rates.usd && (
                      <div
                        style={{
                          background: "#f8f9fa",
                          border: "1px solid #e9ecef",
                          borderRadius: "8px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: "600", color: "#555" }}>USD</span>
                        <span style={{ color: "#16a34a" }}>A: {rates.usd.alis} ₺</span>
                        <span style={{ color: "#dc2626" }}>S: {rates.usd.satis} ₺</span>
                      </div>
                    )}

                    {rates.eur && (
                      <div
                        style={{
                          background: "#f8f9fa",
                          border: "1px solid #e9ecef",
                          borderRadius: "8px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: "600", color: "#555" }}>EUR</span>
                        <span style={{ color: "#16a34a" }}>A: {rates.eur.alis} ₺</span>
                        <span style={{ color: "#dc2626" }}>S: {rates.eur.satis} ₺</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <button
              onClick={() => void fetchRates()}
              disabled={ratesLoading}
              title="Kurları güncelle"
              style={{
                background: "none",
                border: "none",
                cursor: ratesLoading ? "not-allowed" : "pointer",
                padding: "4px",
                color: "#666",
                display: "flex",
                alignItems: "center",
                opacity: ratesLoading ? 0.5 : 1,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: ratesLoading ? "spin 1s linear infinite" : "none",
                }}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
          <span style={{ fontSize: "13px", color: "#666" }}>{todayLabel}</span>
        </div>
      </div>

      {(data.waUnreadCount ?? 0) > 0 ? (
        <Link
          href="/whatsapp-mesajlari"
          className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm transition-colors hover:bg-emerald-100/80"
        >
          <MessageSquare
            className="size-5 shrink-0 text-emerald-700"
            aria-hidden
            strokeWidth={2}
          />
          <span>
            <span className="font-semibold">
              {data.waUnreadCount ?? 0} okunmamış WhatsApp mesajı
            </span>
            <span className="text-emerald-800/90"> — Görüntülemek için tıklayın.</span>
          </span>
        </Link>
      ) : null}

      <div className="dash-grid-r1">
        {statCardsRow1.map((def) => (
          <StatCard key={def.title} def={def} counts={data} />
        ))}
      </div>

      <div className="dash-grid-r2">
        <StatCard def={statCardCompletedToday} counts={data} />
        <div className="min-w-0">
          <RevenueCiroCard
            revenue={data.revenue}
            onRevenueChange={handleRevenueChange}
            dailyRevenueFromDashboard={data.revenue}
          />
        </div>
        <StatCard def={statCardExternal} counts={data} />
      </div>

      <div className="dash-grid-bottom">
        <UpcomingPaymentsCard />
        <div className="min-w-0">
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              background: "white",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#111",
                }}
              >
                Son Kayıtlar
              </div>
              <Link
                href="/cihaz-sorgula"
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  textDecoration: "none",
                }}
                className="hover:text-slate-900"
              >
                Tümünü Gör →
              </Link>
            </div>

            <div>
              {data.recentOrders.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-600">
                  Henüz kayıt yok
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90">
                        <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                          Kayıt No
                        </th>
                        <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                          Müşteri Adı
                        </th>
                        <th className="px-3 py-3 font-medium text-slate-700">
                          Cihaz
                        </th>
                        <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                          Durum
                        </th>
                        <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                          Geliş Tarihi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((row, i) => {
                        const statusBadge = getStatusBadge(row.status);
                        return (
                        <tr
                          key={row.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => goDetail(row.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              goDetail(row.id);
                            }
                          }}
                          className={cn(
                            "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-100/80 focus-visible:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                          )}
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                            {formatServiceOrderNo(row)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800">
                            {row.customer.name}
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-700">
                            {deviceLabel(row)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "500",
                                background: statusBadge.bg,
                                color: statusBadge.color,
                                border: `1px solid ${statusBadge.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                            {formatArrivedAt(row.arrivedAt)}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
