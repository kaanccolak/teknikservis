import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionStatus } from "@/lib/baileys-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== "kaanccolak@gmail.com") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      waEnabled: true,
      waPhoneNumberId: true,
      userId: true,
      googleAccessToken: true,
      _count: {
        select: {
          orders: { where: { deletedAt: null } },
          secondHandDevices: true,
        },
      },
      orders: {
        where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
        select: { id: true },
      },
    },
  });

  const shopIds = shops.map((s) => s.id);

  const [recentOrdersAll, lastOrdersAll] = await Promise.all([
    shopIds.length === 0
      ? Promise.resolve([])
      : prisma.serviceOrder.findMany({
          where: {
            shopId: { in: shopIds },
            deletedAt: null,
            createdAt: { gte: sevenDaysAgo },
          },
          select: { id: true, shopId: true },
        }),
    shopIds.length === 0
      ? Promise.resolve([])
      : prisma.serviceOrder.findMany({
          where: {
            shopId: { in: shopIds },
            deletedAt: null,
          },
          select: { shopId: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          distinct: ["shopId"],
        }),
  ]);

  const recentByShop = new Map<string, Array<{ id: string }>>();
  for (const order of recentOrdersAll) {
    const list = recentByShop.get(order.shopId) ?? [];
    list.push({ id: order.id });
    recentByShop.set(order.shopId, list);
  }

  const lastByShop = new Map<string, Array<{ createdAt: Date }>>();
  for (const order of lastOrdersAll) {
    lastByShop.set(order.shopId, [{ createdAt: order.createdAt }]);
  }

  const [totalOrders, todayOrders] = await Promise.all([
    prisma.serviceOrder.count({ where: { deletedAt: null } }),
    prisma.serviceOrder.count({
      where: {
        deletedAt: null,
        createdAt: { gte: startOfToday },
      },
    }),
  ]);

  const shopsWithWaStatus = await Promise.all(
    shops.map(async (shop) => {
      try {
        const status = await getSessionStatus(shop.id);
        const personelGirisModu = await prisma.setting.findFirst({
          where: { shopId: shop.id, key: "personel_giris_modu" },
          select: { value: true },
        });
        const { googleAccessToken, ...rest } = shop;
        return {
          ...rest,
          recentOrders: recentByShop.get(shop.id) ?? [],
          lastOrder: lastByShop.get(shop.id) ?? [],
          waConnected: status.connected === true,
          googleContactsConnected: !!googleAccessToken,
          personelGirisModu: personelGirisModu?.value === "true",
          secondHandCount: shop._count.secondHandDevices,
        };
      } catch {
        const personelGirisModu = await prisma.setting.findFirst({
          where: { shopId: shop.id, key: "personel_giris_modu" },
          select: { value: true },
        });
        const { googleAccessToken, ...rest } = shop;
        return {
          ...rest,
          recentOrders: recentByShop.get(shop.id) ?? [],
          lastOrder: lastByShop.get(shop.id) ?? [],
          waConnected: false,
          googleContactsConnected: !!googleAccessToken,
          personelGirisModu: personelGirisModu?.value === "true",
          secondHandCount: shop._count.secondHandDevices,
        };
      }
    }),
  );

  const activeShops = shopsWithWaStatus.filter(
    (s) => s.updatedAt >= sevenDaysAgo,
  ).length;
  const newShopsThisMonth = shopsWithWaStatus.filter(
    (s) => s.createdAt >= thirtyDaysAgo,
  ).length;

  return NextResponse.json({
    shops: shopsWithWaStatus,
    totalOrders,
    todayOrders,
    activeShops,
    newShopsThisMonth,
  });
}
