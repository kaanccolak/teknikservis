import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import {
  addOneMonthWithDay,
  startOfDayLocal,
} from "@/lib/payment-plan-helpers";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

const CATEGORY_KEYS = new Set([
  "kira",
  "kredi",
  "fatura",
  "transfer",
  "diger",
]);

function optStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

async function advanceRecurringPlansForShop(shopId: string) {
  const todayStart = startOfDayLocal(new Date());
  const overdue = await prisma.paymentPlan.findMany({
    where: {
      shopId,
      isCompleted: false,
      isRecurring: true,
      dueDate: { lt: todayStart },
    },
  });
  for (const p of overdue) {
    let d = new Date(p.dueDate);
    const day = p.recurringDay ?? d.getDate();
    let guard = 0;
    while (
      startOfDayLocal(d).getTime() < todayStart.getTime() &&
      guard < 240
    ) {
      d = addOneMonthWithDay(d, day);
      guard++;
    }
    await prisma.paymentPlan.update({
      where: { id: p.id },
      data: { dueDate: d },
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const limitRaw = searchParams.get("limit");
  const limit =
    limitRaw != null ? Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 5)) : undefined;

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/payment-plans (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    await advanceRecurringPlansForShop(shop.id);

    const rows = await prisma.paymentPlan.findMany({
      where: {
        shopId: shop.id,
        ...(upcoming ? { isCompleted: false } : {}),
      },
      orderBy: upcoming
        ? [{ dueDate: "asc" }]
        : [{ isCompleted: "asc" }, { dueDate: "asc" }],
      ...(limit != null ? { take: limit } : {}),
    });
    return NextResponse.json(rows);
  } catch (e) {
    return jsonServerError(
      "GET /api/payment-plans",
      e,
      "Ödeme planları alınamadı",
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const body = json as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (title.length < 1) {
    return NextResponse.json({ error: "Başlık zorunludur" }, { status: 400 });
  }

  const dueRaw = body.dueDate;
  if (dueRaw == null || String(dueRaw).trim() === "") {
    return NextResponse.json({ error: "Tarih zorunludur" }, { status: 400 });
  }
  const dueDate = new Date(String(dueRaw));
  if (Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const isRecurring = Boolean(body.isRecurring);
  let recurringDay: number | null = null;
  if (isRecurring) {
    const rd = body.recurringDay;
    const n =
      typeof rd === "number" ? rd : parseInt(String(rd ?? ""), 10);
    if (!Number.isFinite(n) || n < 1 || n > 31) {
      return NextResponse.json(
        { error: "Tekrarlayan plan için ayın günü 1–31 olmalıdır" },
        { status: 400 },
      );
    }
    recurringDay = n;
  }

  let category: string | null = null;
  if (body.category != null && String(body.category).trim()) {
    const c = String(body.category).trim();
    if (!CATEGORY_KEYS.has(c)) {
      return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
    }
    category = c;
  }

  const amount =
    body.amount === undefined || body.amount === null || body.amount === ""
      ? null
      : Number(body.amount);
  if (amount != null && (Number.isNaN(amount) || amount < 0)) {
    return NextResponse.json({ error: "Geçersiz tutar" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/payment-plans (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    await advanceRecurringPlansForShop(shop.id);
    const row = await prisma.paymentPlan.create({
      data: {
        shopId: shop.id,
        title,
        amount,
        dueDate,
        isRecurring,
        recurringDay,
        category,
        notes: optStr(body.notes),
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError(
      "POST /api/payment-plans",
      e,
      "Plan oluşturulamadı",
    );
  }
}
