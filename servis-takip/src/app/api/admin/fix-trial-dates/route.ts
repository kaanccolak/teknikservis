import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "kaanccolak@gmail.com") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  // trialEndsAt NULL olan ve subscriptionStatus "trial" olan dükkanları bul
  const shops = await prisma.shop.findMany({
    where: {
      trialEndsAt: null,
      subscriptionStatus: "trial",
    },
    select: { id: true, createdAt: true },
  });

  let updated = 0;
  for (const shop of shops) {
    const trialEndsAt = new Date(shop.createdAt);
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    await prisma.shop.update({
      where: { id: shop.id },
      data: { trialEndsAt, planType: "trial", subscriptionStatus: "trial" },
    });
    updated++;
  }

  return NextResponse.json({ ok: true, updated });
}
