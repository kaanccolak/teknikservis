import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import {
  SERVICE_ORDER_DELIVERED_STATUSES,
} from "@/lib/service-order-status";

export const dynamic = "force-dynamic";

type RaporlarTab = "servis" | "finansal" | "ikinciEl";

function periodBounds(
  year: number,
  month1Based: number | null,
): { start: Date; end: Date } {
  if (month1Based == null) {
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }
  const m = month1Based;
  return {
    start: new Date(year, m - 1, 1, 0, 0, 0, 0),
    end: new Date(year, m, 0, 23, 59, 59, 999),
  };
}

function chartBounds(
  year: number,
  month1Based: number | null,
): { start: Date; end: Date } {
  if (month1Based == null) {
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }
  const m = month1Based;
  const end = new Date(year, m, 0, 23, 59, 59, 999);
  const start = new Date(year, m - 1 - 11, 1, 0, 0, 0, 0);
  return { start, end };
}

function lastNCalendarMonths(
  periodEnd: Date,
  n: number,
): { year: number; month: number; start: Date; end: Date }[] {
  const out: { year: number; month: number; start: Date; end: Date }[] = [];
  const y = periodEnd.getFullYear();
  const mo = periodEnd.getMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, mo - i, 1);
    const yy = d.getFullYear();
    const mm = d.getMonth() + 1;
    out.push({
      year: yy,
      month: mm,
      start: new Date(yy, mm - 1, 1, 0, 0, 0, 0),
      end: new Date(yy, mm, 0, 23, 59, 59, 999),
    });
  }
  return out;
}

function inRange(d: Date, start: Date, end: Date): boolean {
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function buildMonthPoints(
  year: number,
  month1Based: number | null,
): { year: number; month: number }[] {
  const monthPoints: { year: number; month: number }[] = [];
  if (month1Based == null) {
    for (let m = 1; m <= 12; m++) {
      monthPoints.push({ year, month: m });
    }
  } else {
    const end = new Date(year, month1Based - 1, 1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      monthPoints.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      });
    }
  }
  return monthPoints;
}

export async function GET(request: Request) {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/raporlar (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const shopId = shop.id;
  const { searchParams } = new URL(request.url);
  const tabRaw = searchParams.get("tab");
  const tab: RaporlarTab =
    tabRaw === "finansal" || tabRaw === "ikinciEl"
      ? tabRaw
      : "servis";

  const yearRaw = searchParams.get("year");
  const year = parseInt(
    yearRaw || `${new Date().getFullYear()}`,
    10,
  );
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Geçersiz year" }, { status: 400 });
  }

  const monthParam = searchParams.get("month");
  const monthParsed =
    monthParam !== null && monthParam !== ""
      ? parseInt(monthParam, 10)
      : null;
  const month1Based =
    monthParsed !== null &&
    Number.isFinite(monthParsed) &&
    monthParsed >= 1 &&
    monthParsed <= 12
      ? monthParsed
      : null;

  const { start: startDate, end: endDate } = periodBounds(year, month1Based);
  const { start: chartStart, end: chartEnd } = chartBounds(year, month1Based);
  const monthPoints = buildMonthPoints(year, month1Based);
  const ordersKey = (y: number, m: number) => `${y}-${m}`;

  const comparisonMonths = lastNCalendarMonths(endDate, 6);
  const fetchStart = new Date(
    Math.min(
      chartStart.getTime(),
      startDate.getTime(),
      comparisonMonths[0].start.getTime(),
    ),
  );
  const fetchEnd = new Date(
    Math.max(chartEnd.getTime(), endDate.getTime()),
  );

  const periodJson = {
    year,
    month: month1Based,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  try {
    const [allOrders, deliveredLogs, secondHandRows] = await Promise.all([
      prisma.serviceOrder.findMany({
        where: {
          shopId,
          deletedAt: null,
          arrivedAt: { gte: fetchStart, lte: fetchEnd },
        },
        select: {
          arrivedAt: true,
          status: true,
          totalPrice: true,
          deviceTypeId: true,
          deviceType: { select: { name: true } },
        },
      }),
      prisma.statusLog.findMany({
        where: {
          serviceOrder: { shopId, deletedAt: null },
          newStatus: { in: [...SERVICE_ORDER_DELIVERED_STATUSES] },
          createdAt: { gte: fetchStart, lte: fetchEnd },
        },
        select: {
          serviceOrderId: true,
          createdAt: true,
        },
      }),
      prisma.secondHandDevice.findMany({
        where: {
          shopId,
          OR: [
            { createdAt: { gte: startDate, lte: endDate } },
            {
              isSold: true,
              soldAt: { gte: startDate, lte: endDate },
            },
          ],
        },
        select: {
          createdAt: true,
          isSold: true,
          soldAt: true,
          purchasePrice: true,
          soldPrice: true,
        },
      }),
    ]);

    const ordersInPeriod = allOrders.filter((o) =>
      inRange(o.arrivedAt, startDate, endDate),
    );

    const totalOrders = ordersInPeriod.length;
    const successOrders = ordersInPeriod.filter((o) =>
      o.status === "completed" || o.status === "delivered",
    ).length;
    const failedOrders = ordersInPeriod.filter((o) =>
      o.status === "repair_failed" ||
      o.status === "delivered_repair_failed",
    ).length;
    const successRatePercent =
      totalOrders > 0
        ? Math.round((successOrders / totalOrders) * 1000) / 10
        : 0;

    const arrivedChartCounts = new Map<string, number>();
    for (const o of allOrders) {
      if (!inRange(o.arrivedAt, chartStart, chartEnd)) continue;
      const k = ordersKey(o.arrivedAt.getFullYear(), o.arrivedAt.getMonth() + 1);
      arrivedChartCounts.set(k, (arrivedChartCounts.get(k) ?? 0) + 1);
    }
    const monthlyOrders = monthPoints.map(({ year: y, month: m }) => ({
      year: y,
      month: m,
      count: arrivedChartCounts.get(ordersKey(y, m)) ?? 0,
    }));

    const typeMap = new Map<string | null, { name: string; count: number }>();
    for (const o of ordersInPeriod) {
      const id = o.deviceTypeId;
      const name =
        id && o.deviceType
          ? o.deviceType.name
          : id
            ? "Bilinmeyen tür"
            : "Belirtilmemiş";
      const prev = typeMap.get(id);
      if (prev) prev.count += 1;
      else typeMap.set(id, { name, count: 1 });
    }
    const deviceTypeStatsEnriched = [...typeMap.entries()].map(
      ([deviceTypeId, { name, count }]) => ({
        deviceTypeId,
        name,
        count,
      }),
    );

    const deliveredOrderIds = [...new Set(deliveredLogs.map((l) => l.serviceOrderId))];
    const deliveredOrdersCurrent =
      deliveredOrderIds.length > 0
        ? await prisma.serviceOrder.findMany({
            where: {
              shopId,
              deletedAt: null,
              id: { in: deliveredOrderIds },
              status: { in: [...SERVICE_ORDER_DELIVERED_STATUSES] },
              totalPrice: { gt: 0 },
            },
            select: {
              id: true,
              totalPrice: true,
            },
          })
        : [];
    const deliveredOrderPriceMap = new Map(
      deliveredOrdersCurrent.map((o) => [o.id, Number(o.totalPrice ?? 0)]),
    );

    const ciroChartTotals = new Map<string, number>();
    for (const { year: y, month: m } of monthPoints) {
      const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
      const ids = new Set(
        deliveredLogs
          .filter((l) => inRange(l.createdAt, monthStart, monthEnd))
          .map((l) => l.serviceOrderId),
      );
      let monthTotal = 0;
      for (const id of ids) {
        monthTotal += deliveredOrderPriceMap.get(id) ?? 0;
      }
      ciroChartTotals.set(ordersKey(y, m), monthTotal);
    }
    const monthlyCiro = monthPoints.map(({ year: y, month: m }) => ({
      year: y,
      month: m,
      total: ciroChartTotals.get(ordersKey(y, m)) ?? 0,
    }));

    const deliveredInPeriodIds = new Set(
      deliveredLogs
        .filter((l) => inRange(l.createdAt, startDate, endDate))
        .map((l) => l.serviceOrderId),
    );
    const totalRevenue = [...deliveredInPeriodIds].reduce(
      (s, id) => s + (deliveredOrderPriceMap.get(id) ?? 0),
      0,
    );
    const deliveredCountForAvg = [...deliveredInPeriodIds].filter((id) =>
      deliveredOrderPriceMap.has(id),
    ).length;
    const averageOrderValue =
      deliveredCountForAvg > 0 ? totalRevenue / deliveredCountForAvg : 0;

    const comparisonBase = comparisonMonths.map((slot) => {
      const orderCount = allOrders.filter((o) =>
        inRange(o.arrivedAt, slot.start, slot.end),
      ).length;
      const deliveredIdsForSlot = new Set(
        deliveredLogs
          .filter((l) => inRange(l.createdAt, slot.start, slot.end))
          .map((l) => l.serviceOrderId),
      );
      const revenue = [...deliveredIdsForSlot].reduce(
        (s, id) => s + (deliveredOrderPriceMap.get(id) ?? 0),
        0,
      );
      return {
        year: slot.year,
        month: slot.month,
        orderCount,
        revenue,
      };
    });
    const monthlyComparison = comparisonBase.map((row, idx) => {
      let prevChangePercent: number | null = null;
      if (idx > 0) {
        const prev = comparisonBase[idx - 1].revenue;
        if (prev === 0 && row.revenue === 0) prevChangePercent = 0;
        else if (prev === 0) prevChangePercent = null;
        else {
          prevChangePercent =
            Math.round(((row.revenue - prev) / prev) * 1000) / 10;
        }
      }
      return { ...row, prevChangePercent };
    });

    let secondHandBought = 0;
    let secondHandSold = 0;
    let totalBoughtAmount = 0;
    let totalSoldAmount = 0;
    for (const r of secondHandRows) {
      if (inRange(r.createdAt, startDate, endDate)) {
        secondHandBought += 1;
        totalBoughtAmount += Number(r.purchasePrice ?? 0);
      }
      if (
        r.isSold &&
        r.soldAt &&
        inRange(r.soldAt, startDate, endDate)
      ) {
        secondHandSold += 1;
        totalSoldAmount += Number(r.soldPrice ?? 0);
      }
    }
    const netProfit = totalSoldAmount - totalBoughtAmount;

    const hasDataServis =
      totalOrders > 0 ||
      deviceTypeStatsEnriched.some((d) => d.count > 0);
    const hasDataFinansal =
      totalRevenue > 0 ||
      monthlyComparison.some((r) => r.orderCount > 0 || r.revenue > 0);
    const hasDataIkinciEl = secondHandBought > 0 || secondHandSold > 0;

    if (tab === "servis") {
      return NextResponse.json({
        tab,
        period: periodJson,
        hasData: hasDataServis,
        service: {
          totalOrders,
          successRatePercent,
          failedOrders,
          monthlyOrders,
          deviceTypeStats: deviceTypeStatsEnriched,
        },
      });
    }

    if (tab === "finansal") {
      return NextResponse.json({
        tab,
        period: periodJson,
        hasData: hasDataFinansal,
        financial: {
          totalRevenue,
          averageOrderValue,
          monthlyCiro,
          monthlyComparison,
        },
      });
    }

    return NextResponse.json({
      tab,
      period: periodJson,
      hasData: hasDataIkinciEl,
      secondHand: {
        totalBought: secondHandBought,
        totalSold: secondHandSold,
        totalBoughtAmount,
        totalSoldAmount,
        netProfit,
      },
    });
  } catch (e) {
    return jsonServerError("GET /api/raporlar", e, "Rapor verisi alınamadı");
  }
}
