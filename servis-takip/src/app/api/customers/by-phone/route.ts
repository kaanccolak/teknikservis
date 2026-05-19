import { NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { trPhoneMatchKey } from "@/lib/tr-phone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone") ?? "";
    if (!phone.trim()) return NextResponse.json({ customer: null });

    const key = trPhoneMatchKey(phone);
    if (!key) return NextResponse.json({ customer: null });

    const candidates = await prisma.customer.findMany({
      where: { shopId: shop.id, phone: { not: null } },
      select: { id: true, name: true, phone: true },
    });

    const customer =
      candidates.find((c) => trPhoneMatchKey(c.phone ?? "") === key) ?? null;
    return NextResponse.json({ customer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
