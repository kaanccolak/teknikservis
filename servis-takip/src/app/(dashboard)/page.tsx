"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatServiceOrderNo } from "@/lib/service-order-number";
import {
  serviceOrderStatusBadgeClass,
  serviceOrderStatusLabel,
} from "@/lib/service-order-status";
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
  recentOrders: RecentOrder[];
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
  const parts = [
    row.deviceType?.name ?? row.deviceTypeName,
    row.brand?.name ?? row.brandName,
    row.deviceModel?.name ?? row.modelName,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-slate-100 ring-1 ring-slate-200/80"
          />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-100 ring-1 ring-slate-200/80" />
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
  >;
  description: string;
  href: string;
  accent: string;
};

const statCards: StatCardDef[] = [
  {
    title: "Toplam Aktif Cihaz",
    valueKey: "totalActive",
    description: "Tamamlanmamış tüm kayıtlar",
    href: "/cihaz-sorgula?hideCompleted=true",
    accent: "border-blue-500 bg-blue-50/40 text-blue-950",
  },
  {
    title: "Teknik Serviste",
    valueKey: "inService",
    description: "Aktif servis kayıtları",
    href: "/cihaz-sorgula?status=in_service&hideCompleted=true",
    accent: "border-blue-500 bg-blue-50/40 text-blue-950",
  },
  {
    title: "Parça Bekliyor",
    valueKey: "waitingPart",
    description: "Parça bekleyen cihazlar",
    href: "/cihaz-sorgula?status=waiting_part&hideCompleted=true",
    accent: "border-orange-500 bg-orange-50/50 text-orange-950",
  },
  {
    title: "Onay Bekliyor",
    valueKey: "waitingApproval",
    description: "Müşteri onayı bekleyenler",
    href: "/cihaz-sorgula?status=waiting_approval&hideCompleted=true",
    accent: "border-yellow-500 bg-yellow-50/60 text-yellow-950",
  },
  {
    title: "Bugün Tamamlanan",
    valueKey: "completedToday",
    description: "Bugün onarımı biten kayıtlar",
    href: "/cihaz-sorgula?status=completed&hideCompleted=false",
    accent: "border-emerald-500 bg-emerald-50/50 text-emerald-950",
  },
];

const revenuePills: { id: Exclude<RevenuePeriod, "range">; label: string }[] = [
  { id: "daily", label: "Bugün" },
  { id: "weekly", label: "Bu Hafta" },
  { id: "monthly", label: "Bu Ay" },
  { id: "yearly", label: "Bu Yıl" },
];

function StatCard({
  def,
  counts,
}: {
  def: StatCardDef;
  counts: DashboardPayload;
}) {
  const n = counts[def.valueKey];
  return (
    <Link
      href={def.href}
      className={cn(
        "block cursor-pointer rounded-xl transition-shadow hover:shadow-md",
      )}
    >
      <Card
        className={cn(
          "h-full border-l-4 bg-white shadow-sm ring-1 ring-slate-200/60",
          def.accent,
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{def.title}</CardTitle>
          <CardDescription className="text-slate-600">
            {def.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums tracking-tight">{n}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function RevenueCiroCard({
  revenue,
  onRevenueChange,
}: {
  revenue: number;
  onRevenueChange: (n: number) => void;
}) {
  const [period, setPeriod] = useState<RevenuePeriod>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const onRevenueChangeRef = useRef(onRevenueChange);
  onRevenueChangeRef.current = onRevenueChange;

  const fetchCiro = useCallback(
    async (
      params: URLSearchParams,
      isStale: () => boolean,
    ) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard?${params}`, {
          cache: "no-store",
        });
        const j = (await res.json()) as { revenue?: number; error?: string };
        if (isStale()) return;
        if (res.ok && typeof j.revenue === "number") {
          onRevenueChangeRef.current(j.revenue);
        }
      } finally {
        if (!isStale()) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const isStale = () => cancelled;

    if (period !== "range") {
      const p = new URLSearchParams({ ciroOnly: "true", period });
      void fetchCiro(p, isStale);
      return () => {
        cancelled = true;
      };
    }
    if (!startDate || !endDate) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    const t = window.setTimeout(() => {
      const p = new URLSearchParams({
        ciroOnly: "true",
        startDate,
        endDate,
      });
      void fetchCiro(p, isStale);
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // fetchCiro: useCallback([]) — stable; only filters should refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, startDate, endDate]);

  return (
    <Card
      className={cn(
        "h-full border-l-4 border-green-800 bg-green-50/70 shadow-sm ring-1 ring-green-900/15",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-green-950">Ciro</CardTitle>
        <CardDescription className="text-green-900/80">
          Teslim edilen kayıtların toplam ücreti (seçilen dönem)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p
          className={cn(
            "text-3xl font-bold tabular-nums tracking-tight text-green-950 sm:text-4xl",
            loading && "opacity-60",
          )}
        >
          {formatTryTr(revenue)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {revenuePills.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={period === p.id ? "default" : "outline"}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium",
                period === p.id &&
                  "border-green-800 bg-green-800 text-white hover:bg-green-800/90",
              )}
              onClick={() => {
                setPeriod(p.id);
              }}
            >
              {p.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={period === "range" ? "default" : "outline"}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium",
              period === "range" &&
                "border-green-800 bg-green-800 text-white hover:bg-green-800/90",
            )}
            onClick={() => setPeriod("range")}
          >
            Tarih Aralığı
          </Button>
        </div>
        {period === "range" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ciro-start" className="text-xs text-green-900">
                Başlangıç
              </Label>
              <Input
                id="ciro-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-green-200 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ciro-end" className="text-xs text-green-900">
                Bitiş
              </Label>
              <Input
                id="ciro-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-green-200 bg-white"
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
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
        <p className="text-sm font-medium text-slate-700 sm:text-right">
          {todayLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((def) => (
          <StatCard key={def.title} def={def} counts={data} />
        ))}
        <RevenueCiroCard
          revenue={data.revenue}
          onRevenueChange={handleRevenueChange}
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Son Kayıtlar</h2>
          <Link
            href="/cihaz-sorgula"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Tümünü Gör →
          </Link>
        </div>
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardContent className="p-0">
            {data.recentOrders.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-600">
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
                    {data.recentOrders.map((row, i) => (
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
                            className={serviceOrderStatusBadgeClass(row.status)}
                          >
                            {serviceOrderStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                          {formatArrivedAt(row.arrivedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
