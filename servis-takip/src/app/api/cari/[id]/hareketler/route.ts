import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("GET /api/cari/[id]/hareketler", e, "Dükkan bilgisi alınamadı");
  }

  try {
    const hareketler = await prisma.cariHareket.findMany({
      where: { cariId: id, shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(hareketler);
  } catch (e) {
    return jsonServerError("GET /api/cari/[id]/hareketler", e, "Hareketler yüklenemedi");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("POST /api/cari/[id]/hareketler", e, "Dükkan bilgisi alınamadı");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const tip =
    typeof o.tip === "string" && ["alacak", "verecek"].includes(o.tip)
      ? o.tip
      : null;
  const tutar =
    typeof o.tutar === "number" ? o.tutar : parseFloat(String(o.tutar));
  const aciklama =
    typeof o.aciklama === "string" ? o.aciklama.trim() || null : null;

  if (!tip)
    return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
  if (!Number.isFinite(tutar) || tutar <= 0)
    return NextResponse.json({ error: "Geçerli tutar girin" }, { status: 400 });

  const cari = await prisma.cari.findFirst({ where: { id, shopId: shop.id } });
  if (!cari)
    return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });

  try {
    const hareket = await prisma.cariHareket.create({
      data: { shopId: shop.id, cariId: id, tip, tutar, aciklama },
    });
    return NextResponse.json(hareket);
  } catch (e) {
    return jsonServerError("POST /api/cari/[id]/hareketler", e, "Hareket eklenemedi");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id: cariId } = await params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("PATCH /api/cari/[id]/hareketler", e, "Dükkan bilgisi alınamadı");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const hareketId = typeof o.hareketId === "string" ? o.hareketId : null;
  if (!hareketId)
    return NextResponse.json({ error: "hareketId gerekli" }, { status: 400 });

  try {
    const hareket = await prisma.cariHareket.updateMany({
      where: { id: hareketId, shopId: shop.id, cariId: cariId },
      data: { odendi: true, odemeTarihi: new Date() },
    });
    return NextResponse.json({ ok: true, updated: hareket.count });
  } catch (e) {
    return jsonServerError("PATCH /api/cari/[id]/hareketler", e, "Güncellenemedi");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id: cariId } = await params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("DELETE /api/cari/[id]/hareketler", e, "Dükkan bilgisi alınamadı");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const hareketId = typeof o.hareketId === "string" ? o.hareketId : null;
  if (!hareketId)
    return NextResponse.json({ error: "hareketId gerekli" }, { status: 400 });

  try {
    await prisma.cariHareket.deleteMany({
      where: { id: hareketId, shopId: shop.id, cariId: cariId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError("DELETE /api/cari/[id]/hareketler", e, "Silinemedi");
  }
}
