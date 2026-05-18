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
      select: {
        id: true,
        name: true,
        createdAt: true,
        password: true,
        isAdmin: true,
        canViewSirketim: true,
        canViewRaporlar: true,
        canViewPlanlarim: true,
        canViewBayiler: true,
        canViewCari: true,
        canViewStok: true,
        canViewDisServis: true,
        canViewBekleyen: true,
        canViewIkinciEl: true,
        canViewCihazSorgula: true,
        canViewCihazKayit: true,
      },
    });
    return NextResponse.json(
      personnel.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        hasPassword: !!p.password,
        isAdmin: p.isAdmin,
        canViewSirketim: p.canViewSirketim,
        canViewRaporlar: p.canViewRaporlar,
        canViewPlanlarim: p.canViewPlanlarim,
        canViewBayiler: p.canViewBayiler,
        canViewCari: p.canViewCari,
        canViewStok: p.canViewStok,
        canViewDisServis: p.canViewDisServis,
        canViewBekleyen: p.canViewBekleyen,
        canViewIkinciEl: p.canViewIkinciEl,
        canViewCihazSorgula: p.canViewCihazSorgula,
        canViewCihazKayit: p.canViewCihazKayit,
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
    const {
      name,
      password,
      isAdmin,
      canViewSirketim,
      canViewRaporlar,
      canViewPlanlarim,
      canViewBayiler,
      canViewCari,
      canViewStok,
      canViewDisServis,
      canViewBekleyen,
      canViewIkinciEl,
      canViewCihazSorgula,
      canViewCihazKayit,
    } = (await req.json()) as {
      name: string;
      password?: string;
      isAdmin?: boolean;
      canViewSirketim?: boolean;
      canViewRaporlar?: boolean;
      canViewPlanlarim?: boolean;
      canViewBayiler?: boolean;
      canViewCari?: boolean;
      canViewStok?: boolean;
      canViewDisServis?: boolean;
      canViewBekleyen?: boolean;
      canViewIkinciEl?: boolean;
      canViewCihazSorgula?: boolean;
      canViewCihazKayit?: boolean;
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
        canViewSirketim: canViewSirketim ?? false,
        canViewRaporlar: canViewRaporlar ?? false,
        canViewPlanlarim: canViewPlanlarim ?? false,
        canViewBayiler: canViewBayiler ?? false,
        canViewCari: canViewCari ?? false,
        canViewStok: canViewStok ?? false,
        canViewDisServis: canViewDisServis ?? false,
        canViewBekleyen: canViewBekleyen ?? false,
        canViewIkinciEl: canViewIkinciEl ?? false,
        canViewCihazSorgula: canViewCihazSorgula ?? false,
        canViewCihazKayit: canViewCihazKayit ?? false,
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
