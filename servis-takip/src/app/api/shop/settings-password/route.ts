import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { demoGuard } from "@/lib/demo-guard";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Parola var mı kontrol et
export async function GET() {
  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const s = await prisma.shop.findUnique({
    where: { id: shop.id },
    select: { settingsPassword: true },
  });

  return NextResponse.json({ hasPassword: !!s?.settingsPassword });
}

// Parola oluştur veya değiştir
export async function POST(req: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { password, currentPassword } = await req.json();

  if (!password || password.length < 4) {
    return NextResponse.json(
      { error: "Parola en az 4 karakter olmalı" },
      { status: 400 },
    );
  }

  const s = await prisma.shop.findUnique({
    where: { id: shop.id },
    select: { settingsPassword: true },
  });

  // Parola zaten varsa mevcut parolayı doğrula
  if (s?.settingsPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Mevcut parola gerekli" },
        { status: 400 },
      );
    }
    const valid = await bcrypt.compare(currentPassword, s.settingsPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Mevcut parola yanlış" },
        { status: 400 },
      );
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.shop.update({
    where: { id: shop.id },
    data: { settingsPassword: hashed },
  });

  return NextResponse.json({ success: true });
}

// Parolayı doğrula
export async function PUT(req: Request) {
  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { password } = await req.json();

  const s = await prisma.shop.findUnique({
    where: { id: shop.id },
    select: { settingsPassword: true },
  });

  if (!s?.settingsPassword) {
    return NextResponse.json({ valid: true }); // parola yoksa direkt geçir
  }

  const valid = await bcrypt.compare(password, s.settingsPassword);
  return NextResponse.json({ valid });
}
