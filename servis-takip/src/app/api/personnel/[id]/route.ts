import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    const { id } = await params;
    const { name, password, isAdmin } = (await req.json()) as {
      name?: string;
      password?: string;
      isAdmin?: boolean;
    };

    const existing = await prisma.personnel.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const updateData: { name?: string; password?: string | null; isAdmin?: boolean } = {};
    if (name?.trim()) updateData.name = name.trim();
    if (typeof isAdmin === "boolean") updateData.isAdmin = isAdmin;
    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    } else if (password === "") {
      updateData.password = null;
    }

    const updated = await prisma.personnel.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, createdAt: true, isAdmin: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.personnel.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    await prisma.personnel.delete({ where: { id } });

    // Silme sonrası kalan personel sayısını kontrol et
    const kalanPersonel = await prisma.personnel.count({
      where: { shopId: shop.id },
    });

    // Hiç personel kalmadıysa personel giriş modunu kapat
    if (kalanPersonel === 0) {
      await prisma.setting.upsert({
        where: { shopId_key: { shopId: shop.id, key: "personel_giris_modu" } },
        update: { value: "false" },
        create: { shopId: shop.id, key: "personel_giris_modu", value: "false" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
