import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    const { personnelId, password } = (await req.json()) as {
      personnelId: string;
      password: string;
    };
    const personnel = await prisma.personnel.findFirst({
      where: { id: personnelId, shopId: shop.id },
      select: { id: true, password: true },
    });
    if (!personnel) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    if (!personnel.password) {
      return NextResponse.json({ error: "Şifre tanımlı değil" }, { status: 400 });
    }
    const valid = await bcrypt.compare(password, personnel.password);
    if (!valid) return NextResponse.json({ error: "Yanlış şifre" }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
