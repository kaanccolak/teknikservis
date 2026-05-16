import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    const personnel = await prisma.personnel.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, createdAt: true, password: true, isAdmin: true },
    });
    return NextResponse.json(
      personnel.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        hasPassword: !!p.password,
        isAdmin: p.isAdmin,
      })),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await demoGuard();
  if (guard) return guard;
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    const { name, password, isAdmin } = (await req.json()) as {
      name: string;
      password?: string;
      isAdmin?: boolean;
    };
    if (!name?.trim()) {
      return NextResponse.json({ error: "İsim zorunludur" }, { status: 400 });
    }
    const hashedPassword = password?.trim()
      ? await bcrypt.hash(password.trim(), 10)
      : null;
    const personnel = await prisma.personnel.create({
      data: {
        shopId: shop.id,
        name: name.trim(),
        password: hashedPassword,
        isAdmin: isAdmin ?? false,
      },
    });
    return NextResponse.json({
      id: personnel.id,
      name: personnel.name,
      createdAt: personnel.createdAt,
      isAdmin: personnel.isAdmin,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
