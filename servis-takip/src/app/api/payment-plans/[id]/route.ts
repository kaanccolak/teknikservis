import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

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

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/payment-plans/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const existing = await prisma.paymentPlan.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (title.length < 1) {
      return NextResponse.json({ error: "Başlık zorunludur" }, { status: 400 });
    }
    data.title = title;
  }

  if (body.dueDate !== undefined) {
    const dueDate = new Date(String(body.dueDate));
    if (Number.isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
    }
    data.dueDate = dueDate;
  }

  if (body.amount !== undefined) {
    if (body.amount === null || body.amount === "") {
      data.amount = null;
    } else {
      const amount = Number(body.amount);
      if (Number.isNaN(amount) || amount < 0) {
        return NextResponse.json({ error: "Geçersiz tutar" }, { status: 400 });
      }
      data.amount = amount;
    }
  }

  if (body.isRecurring !== undefined) {
    data.isRecurring = Boolean(body.isRecurring);
  }

  if (body.recurringDay !== undefined) {
    if (body.recurringDay === null || body.recurringDay === "") {
      data.recurringDay = null;
    } else {
      const n =
        typeof body.recurringDay === "number"
          ? body.recurringDay
          : parseInt(String(body.recurringDay), 10);
      if (!Number.isFinite(n) || n < 1 || n > 31) {
        return NextResponse.json(
          { error: "Ayın günü 1–31 olmalıdır" },
          { status: 400 },
        );
      }
      data.recurringDay = n;
    }
  }

  if (body.category !== undefined) {
    if (body.category === null || String(body.category).trim() === "") {
      data.category = null;
    } else {
      const c = String(body.category).trim();
      if (!CATEGORY_KEYS.has(c)) {
        return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
      }
      data.category = c;
    }
  }

  if (body.notes !== undefined) {
    data.notes = optStr(body.notes);
  }

  if (body.isCompleted === false) {
    data.isCompleted = false;
    data.completedAt = null;
  } else if (body.isCompleted === true) {
    data.isCompleted = true;
    data.completedAt = new Date();
  } else if (body.isCompleted !== undefined) {
    const done = Boolean(body.isCompleted);
    data.isCompleted = done;
    data.completedAt = done ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek alan yok" },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.paymentPlan.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError(
      "PATCH /api/payment-plans/[id]",
      e,
      "Güncelleme başarısız",
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "DELETE /api/payment-plans/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  // Parola kontrolü
  const hasPassword = Boolean(shop.settingsPassword);
  if (hasPassword) {
    const body = await request.json().catch(() => ({}));
    const { settingsPassword } = body as { settingsPassword?: string };
    if (!settingsPassword) {
      return NextResponse.json({ error: "Parola gerekli" }, { status: 403 });
    }
    const { verifySettingsPassword } = await import(
      "@/lib/verify-settings-password"
    );
    const valid = await verifySettingsPassword(shop.id, settingsPassword);
    if (!valid) {
      return NextResponse.json({ error: "Parola yanlış" }, { status: 403 });
    }
  }

  const existing = await prisma.paymentPlan.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  try {
    await prisma.paymentPlan.delete({ where: { id } });
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/payment-plans/[id]",
      e,
      "Silme başarısız",
    );
  }
}
