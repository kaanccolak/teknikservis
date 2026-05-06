import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import { SERVICE_ORDER_DELIVERED_STATUSES } from "@/lib/service-order-status";

/** Takvim günü (sunucu yerel saati) */
function localDayBounds(d = new Date()): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

function startOfIsoWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfIsoWeekFromStart(start: Date): Date {
  const e = new Date(start);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function monthBounds(d = new Date()): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function yearBounds(d = new Date()): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function parseYmdLocal(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const dt = new Date(y, mo, da, 0, 0, 0, 0);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo ||
    dt.getDate() !== da
  ) {
    return null;
  }
  return dt;
}

function endOfYmdLocal(ymd: string): Date | null {
  const start = parseYmdLocal(ymd);
  if (!start) return null;
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return end;
}

type Period = "daily" | "weekly" | "monthly" | "yearly";

function resolveRevenueWindow(
  searchParams: URLSearchParams,
): { start: Date; end: Date } | { error: string } {
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();

  if (startDate || endDate) {
    if (!startDate || !endDate) {
      return {
        error: "Tarih aralığı için başlangıç ve bitiş birlikte gönderilmelidir",
      };
    }
    const start = parseYmdLocal(startDate);
    const end = endOfYmdLocal(endDate);
    if (!start || !end) {
      return { error: "Geçersiz tarih aralığı" };
    }
    if (start.getTime() > end.getTime()) {
      return { error: "Başlangıç tarihi bitişten sonra olamaz" };
    }
    return { start, end };
  }

  const period = (searchParams.get("period") ?? "daily") as Period;
  const now = new Date();

  switch (period) {
    case "daily":
      return localDayBounds(now);
    case "weekly": {
      const start = startOfIsoWeek(now);
      return { start, end: endOfIsoWeekFromStart(start) };
    }
    case "monthly":
      return monthBounds(now);
    case "yearly":
      return yearBounds(now);
    default:
      return { error: "Geçersiz period parametresi" };
  }
}

async function sumDeliveredRevenue(
  shopId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const agg = await prisma.serviceOrder.aggregate({
    where: {
      shopId,
      status: { in: [...SERVICE_ORDER_DELIVERED_STATUSES] },
      updatedAt: { gte: start, lte: end },
    },
    _sum: { totalPrice: true },
  });
  return Number(agg._sum.totalPrice ?? 0);
}

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
};

const TERMINAL_STATUSES = [
  "completed",
  ...SERVICE_ORDER_DELIVERED_STATUSES,
] as const;

const COMPLETED_TODAY_STATUSES = [
  "completed",
  ...SERVICE_ORDER_DELIVERED_STATUSES,
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ciroOnly = searchParams.get("ciroOnly") === "true";

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/dashboard (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const shopId = shop.id;

  if (ciroOnly) {
    const win = resolveRevenueWindow(searchParams);
    if ("error" in win) {
      return NextResponse.json({ error: win.error }, { status: 400 });
    }
    try {
      const revenue = await sumDeliveredRevenue(shopId, win.start, win.end);
      return NextResponse.json({ revenue }, { headers: cacheHeaders });
    } catch (e) {
      return jsonServerError(
        "GET /api/dashboard (ciro)",
        e,
        "Ciro hesaplanamadı",
      );
    }
  }

  const { start: dayStart, end: dayEnd } = localDayBounds();

  try {
    const [
      totalActive,
      inService,
      waitingApproval,
      approvalGiven,
      waitingPart,
      externalService,
      completedToday,
      recentOrders,
      revenueAgg,
    ] = await Promise.all([
      prisma.serviceOrder.count({
        where: {
          shopId,
          status: { notIn: [...TERMINAL_STATUSES] },
        },
      }),
      prisma.serviceOrder.count({
        where: { shopId, status: "in_service" },
      }),
      prisma.serviceOrder.count({
        where: { shopId, status: "waiting_approval" },
      }),
      prisma.serviceOrder.count({
        where: { shopId, status: "approval_given" },
      }),
      prisma.serviceOrder.count({
        where: { shopId, status: "waiting_part" },
      }),
      prisma.serviceOrder.count({
        where: { shopId, status: "sent_to_external" },
      }),
      prisma.serviceOrder.count({
        where: {
          shopId,
          status: { in: [...COMPLETED_TODAY_STATUSES] },
          updatedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.serviceOrder.findMany({
        where: { shopId },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          arrivedAt: true,
          status: true,
          deviceTypeName: true,
          brandName: true,
          modelName: true,
          customer: { select: { name: true } },
          deviceType: { select: { name: true } },
          brand: { select: { name: true } },
          deviceModel: { select: { name: true } },
        },
      }),
      prisma.serviceOrder.aggregate({
        where: {
          shopId,
          status: { in: [...SERVICE_ORDER_DELIVERED_STATUSES] },
          updatedAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    const revenue = Number(revenueAgg._sum.totalPrice ?? 0);

    const payload = {
      totalActive,
      waitingApproval,
      approvalGiven,
      waitingPart,
      inService,
      completedToday,
      revenue,
      externalService,
      recentOrders,
    };

    return NextResponse.json(payload, { headers: cacheHeaders });
  } catch (e) {
    return jsonServerError(
      "GET /api/dashboard",
      e,
      "Gösterge verileri alınamadı",
    );
  }
}
