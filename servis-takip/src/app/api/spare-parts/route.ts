import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";
import { checkSubscription } from "@/lib/checkSubscription";

export const dynamic = "force-dynamic";

const sparePartInclude = {
  deviceType: true,
  brand: true,
  deviceModel: true,
} as const;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export async function GET(request: Request) {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/spare-parts (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const { searchParams } = new URL(request.url);
  const deviceTypeId = searchParams.get("deviceTypeId")?.trim() ?? "";
  const brandId = searchParams.get("brandId")?.trim() ?? "";
  const deviceModelId = searchParams.get("deviceModelId")?.trim() ?? "";
  const search = searchParams.get("search")?.trim() ?? "";
  const forServiceOrderId = searchParams.get("forServiceOrderId")?.trim() ?? "";
  const stockStatus = searchParams.get("stockStatus")?.trim() ?? "all";

  const andParts: Prisma.SparePartWhereInput[] = [{ shopId: shop.id }];

  if (stockStatus === "empty") {
    andParts.push({ stock: 0 });
  } else if (stockStatus === "critical") {
    andParts.push({ stock: { gte: 1, lte: 3 } });
  } else if (stockStatus === "in_stock") {
    andParts.push({ stock: { gte: 4 } });
  }

  if (search) {
    andParts.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { partCode: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (forServiceOrderId) {
    const order = await prisma.serviceOrder.findFirst({
      where: { id: forServiceOrderId, shopId: shop.id },
      select: {
        deviceTypeId: true,
        brandId: true,
        deviceModelId: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Servis kaydı bulunamadı" }, { status: 404 });
    }
    const orBranches: Prisma.SparePartWhereInput[] = [
      {
        deviceTypeId: null,
        brandId: null,
        deviceModelId: null,
      },
    ];
    if (order.deviceTypeId) {
      orBranches.push({
        deviceTypeId: order.deviceTypeId,
        brandId: null,
        deviceModelId: null,
      });
      if (order.brandId) {
        orBranches.push({
          deviceTypeId: order.deviceTypeId,
          brandId: order.brandId,
          deviceModelId: null,
        });
        if (order.deviceModelId) {
          orBranches.push({
            deviceTypeId: order.deviceTypeId,
            brandId: order.brandId,
            deviceModelId: order.deviceModelId,
          });
        }
      }
    }
    andParts.push({ OR: orBranches });
  } else {
    if (deviceTypeId) andParts.push({ deviceTypeId });
    if (brandId) andParts.push({ brandId });
    if (deviceModelId) andParts.push({ deviceModelId });
  }

  const where: Prisma.SparePartWhereInput =
    andParts.length === 1 ? andParts[0]! : { AND: andParts };

  try {
    const items = await prisma.sparePart.findMany({
      where,
      include: sparePartInclude,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    return jsonServerError("GET /api/spare-parts", e, "Parçalar yüklenemedi");
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  const subCheck = await checkSubscription();
  if (subCheck) return subCheck.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const o = json as {
    name?: unknown;
    partCode?: unknown;
    cost?: unknown;
    stock?: unknown;
    deviceTypeId?: unknown;
    brandId?: unknown;
    deviceModelId?: unknown;
  };
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const partCode = typeof o.partCode === "string" ? o.partCode.trim() : "";
  const cost = typeof o.cost === "number" ? o.cost : Number(o.cost);
  const stock = typeof o.stock === "number" ? o.stock : Number(o.stock);
  const deviceTypeId =
    typeof o.deviceTypeId === "string" && o.deviceTypeId.trim()
      ? o.deviceTypeId.trim()
      : null;
  const brandId =
    typeof o.brandId === "string" && o.brandId.trim() ? o.brandId.trim() : null;
  const deviceModelId =
    typeof o.deviceModelId === "string" && o.deviceModelId.trim()
      ? o.deviceModelId.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Parça adı gerekli" }, { status: 400 });
  }
  if (!Number.isFinite(cost) || cost < 0) {
    return NextResponse.json({ error: "Geçerli maliyet girin" }, { status: 400 });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Geçerli stok girin" }, { status: 400 });
  }

  if (brandId && !deviceTypeId) {
    return NextResponse.json(
      { error: "Marka için önce cihaz türü seçin" },
      { status: 400 },
    );
  }
  if (deviceModelId && (!deviceTypeId || !brandId)) {
    return NextResponse.json(
      { error: "Model için cihaz türü ve marka gerekli" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/spare-parts (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  if (deviceTypeId || brandId || deviceModelId) {
    const dt = deviceTypeId
      ? await prisma.deviceType.findFirst({
          where: { id: deviceTypeId, shopId: shop.id },
        })
      : null;
    if (deviceTypeId && !dt) {
      return NextResponse.json({ error: "Cihaz türü bulunamadı" }, { status: 400 });
    }
    if (brandId) {
      const br = await prisma.brand.findFirst({
        where: { id: brandId, shopId: shop.id, deviceTypeId: deviceTypeId! },
      });
      if (!br) {
        return NextResponse.json({ error: "Marka bulunamadı" }, { status: 400 });
      }
    }
    if (deviceModelId) {
      const md = await prisma.deviceModel.findFirst({
        where: { id: deviceModelId, shopId: shop.id, brandId: brandId! },
      });
      if (!md) {
        return NextResponse.json({ error: "Model bulunamadı" }, { status: 400 });
      }
    }
  }

  try {
    const created = await prisma.sparePart.create({
      data: {
        shopId: shop.id,
        name,
        partCode: emptyToNull(partCode),
        cost,
        stock,
        deviceTypeId,
        brandId,
        deviceModelId,
      },
      include: sparePartInclude,
    });
    return NextResponse.json(created);
  } catch (e) {
    const d = getErrorDetails(e);
    console.error("[POST /api/spare-parts]", { ...d, raw: e });
    return NextResponse.json(
      { error: "Parça oluşturulamadı", details: d.message },
      { status: 500 },
    );
  }
}
