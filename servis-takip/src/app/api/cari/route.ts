import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

function normalizeDigits(value: string | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

async function allocateCariCode(shopId: string) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `C${year}${month}`;
  const lastCari = await prisma.cari.findFirst({
    where: {
      shopId,
      cariCode: { startsWith: prefix },
    },
    orderBy: { cariCode: "desc" },
    select: { cariCode: true },
  });
  const seq = lastCari?.cariCode
    ? String(Number.parseInt(lastCari.cariCode.slice(-3), 10) + 1).padStart(3, "0")
    : "001";
  return `${prefix}${seq}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("GET /api/cari (shop)", e, "Dükkan bilgisi alınamadı");
  }

  try {
    const rows = await prisma.cari.findMany({
      where: {
        shopId: shop.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { taxOrTcNo: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    return jsonServerError("GET /api/cari", e, "Cariler alınamadı");
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  const json =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const name = String(json.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "İsim/Ünvan zorunludur" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("POST /api/cari (shop)", e, "Dükkan bilgisi alınamadı");
  }

  try {
    const cariCode = await allocateCariCode(shop.id);
    const row = await prisma.cari.create({
      data: {
        shopId: shop.id,
        cariCode,
        name,
        phone: typeof json.phone === "string" ? json.phone.trim() || null : null,
        phoneDigits: normalizeDigits(
          typeof json.phone === "string" ? json.phone : undefined,
        ),
        email: typeof json.email === "string" ? json.email.trim() || null : null,
        address: typeof json.address === "string" ? json.address.trim() || null : null,
        taxOrTcNo:
          typeof json.taxOrTcNo === "string" ? json.taxOrTcNo.trim() || null : null,
        taxOffice:
          typeof json.taxOffice === "string" ? json.taxOffice.trim() || null : null,
        cargoInfo:
          typeof json.cargoInfo === "string" ? json.cargoInfo.trim() || null : null,
        cargoCode:
          typeof json.cargoCode === "string" ? json.cargoCode.trim() || null : null,
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError("POST /api/cari", e, "Cari oluşturulamadı");
  }
}
