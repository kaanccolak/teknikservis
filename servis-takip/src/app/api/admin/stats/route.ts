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
      _count: { select: { orders: true } },
      orders: {
        where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
        select: { id: true },
      },
    },
  });

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
        return { ...shop, waConnected: status.connected === true };
      } catch {
        return { ...shop, waConnected: false };
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
