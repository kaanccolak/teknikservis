import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

function optStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/external-services/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const row = await prisma.externalService.findFirst({
      where: { id, shopId: shop.id },
      include: {
        serviceOrders: {
          include: {
            customer: { select: { name: true } },
            deviceType: { select: { name: true } },
            brand: { select: { name: true } },
            deviceModel: { select: { name: true } },
            statusLogs: {
              where: { newStatus: "sent_to_external" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ ...row, totalPaid: row.totalPaid ?? 0 });
  } catch (e) {
    return jsonServerError(
      "GET /api/external-services/[id]",
      e,
      "Dış servis alınamadı",
    );
  }
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
      "PATCH /api/external-services/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const existing = await prisma.externalService.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const name =
    body.name !== undefined ? String(body.name ?? "").trim() : existing.name;
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Servis adı en az 2 karakter olmalıdır" },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.externalService.update({
      where: { id },
      data: {
        name,
        contactName:
          body.contactName !== undefined
            ? optStr(body.contactName)
            : existing.contactName,
        phone:
          body.phone !== undefined ? optStr(body.phone) : existing.phone,
        address:
          body.address !== undefined ? optStr(body.address) : existing.address,
        notes:
          body.notes !== undefined ? optStr(body.notes) : existing.notes,
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError(
      "PATCH /api/external-services/[id]",
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
      "DELETE /api/external-services/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  // Parola doğrulama
  const body = await request.json().catch(() => ({}));
  const { settingsPassword } = body as { settingsPassword?: string };
  const { verifySettingsPassword } = await import(
    "@/lib/verify-settings-password"
  );
  const valid = await verifySettingsPassword(
    shop.id,
    settingsPassword ?? "",
  );
  if (!valid) {
    return NextResponse.json({ error: "Parola yanlış" }, { status: 403 });
  }

  const existing = await prisma.externalService.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const linkedCount = await prisma.serviceOrder.count({
    where: { externalServiceId: id, shopId: shop.id },
  });
  if (linkedCount > 0) {
    return NextResponse.json(
      {
        error: `Bu dış servise bağlı ${linkedCount} servis kaydı var. Önce kayıtları güncelleyin.`,
        linkedCount,
      },
      { status: 400 },
    );
  }

  try {
    await prisma.externalService.delete({ where: { id } });
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/external-services/[id]",
      e,
      "Silme başarısız",
    );
  }
}
