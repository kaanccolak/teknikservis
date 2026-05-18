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
        canCreateRecord: true,
        canDeleteIkinciEl: true,
        canDeleteServis: true,
        canEditServis: true,
        canEditIkinciEl: true,
        canUpdateServisStatus: true,
        canAddDisServis: true,
        canDeleteDisServis: true,
        canEditDisServis: true,
        canAddStok: true,
        canDeleteStok: true,
        canEditStok: true,
        canAddCari: true,
        canEditCari: true,
        canDeleteCari: true,
        canAddBayi: true,
        canEditBayi: true,
        canDeleteBayi: true,
        canAddPlan: true,
        canEditPlan: true,
        canDeletePlan: true,
        canViewCiro: true,
        canPrintMusteri: true,
        canPrintTeslim: true,
        canPrintEtiket: true,
        canPrintAlimFisi: true,
        canPrintSatisFisi: true,
        canSellIkinciEl: true,
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
        canCreateRecord: p.canCreateRecord,
        canDeleteIkinciEl: p.canDeleteIkinciEl,
        canDeleteServis: p.canDeleteServis,
        canEditServis: p.canEditServis,
        canEditIkinciEl: p.canEditIkinciEl,
        canUpdateServisStatus: p.canUpdateServisStatus,
        canAddDisServis: p.canAddDisServis,
        canDeleteDisServis: p.canDeleteDisServis,
        canEditDisServis: p.canEditDisServis,
        canAddStok: p.canAddStok,
        canDeleteStok: p.canDeleteStok,
        canEditStok: p.canEditStok,
        canAddCari: p.canAddCari,
        canEditCari: p.canEditCari,
        canDeleteCari: p.canDeleteCari,
        canAddBayi: p.canAddBayi,
        canEditBayi: p.canEditBayi,
        canDeleteBayi: p.canDeleteBayi,
        canAddPlan: p.canAddPlan,
        canEditPlan: p.canEditPlan,
        canDeletePlan: p.canDeletePlan,
        canViewCiro: p.canViewCiro,
        canPrintMusteri: p.canPrintMusteri,
        canPrintTeslim: p.canPrintTeslim,
        canPrintEtiket: p.canPrintEtiket,
        canPrintAlimFisi: p.canPrintAlimFisi,
        canPrintSatisFisi: p.canPrintSatisFisi,
        canSellIkinciEl: p.canSellIkinciEl,
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
      canCreateRecord,
      canDeleteIkinciEl,
      canDeleteServis,
      canEditServis,
      canEditIkinciEl,
      canUpdateServisStatus,
      canAddDisServis,
      canDeleteDisServis,
      canEditDisServis,
      canAddStok,
      canDeleteStok,
      canEditStok,
      canAddCari,
      canEditCari,
      canDeleteCari,
      canAddBayi,
      canEditBayi,
      canDeleteBayi,
      canAddPlan,
      canEditPlan,
      canDeletePlan,
      canViewCiro,
      canPrintMusteri,
      canPrintTeslim,
      canPrintEtiket,
      canPrintAlimFisi,
      canPrintSatisFisi,
      canSellIkinciEl,
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
      canCreateRecord?: boolean;
      canDeleteIkinciEl?: boolean;
      canDeleteServis?: boolean;
      canEditServis?: boolean;
      canEditIkinciEl?: boolean;
      canUpdateServisStatus?: boolean;
      canAddDisServis?: boolean;
      canDeleteDisServis?: boolean;
      canEditDisServis?: boolean;
      canAddStok?: boolean;
      canDeleteStok?: boolean;
      canEditStok?: boolean;
      canAddCari?: boolean;
      canEditCari?: boolean;
      canDeleteCari?: boolean;
      canAddBayi?: boolean;
      canEditBayi?: boolean;
      canDeleteBayi?: boolean;
      canAddPlan?: boolean;
      canEditPlan?: boolean;
      canDeletePlan?: boolean;
      canViewCiro?: boolean;
      canPrintMusteri?: boolean;
      canPrintTeslim?: boolean;
      canPrintEtiket?: boolean;
      canPrintAlimFisi?: boolean;
      canPrintSatisFisi?: boolean;
      canSellIkinciEl?: boolean;
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
        canCreateRecord: canCreateRecord ?? false,
        canDeleteIkinciEl: canDeleteIkinciEl ?? false,
        canDeleteServis: canDeleteServis ?? false,
        canEditServis: canEditServis ?? false,
        canEditIkinciEl: canEditIkinciEl ?? false,
        canUpdateServisStatus: canUpdateServisStatus ?? false,
        canAddDisServis: canAddDisServis ?? false,
        canDeleteDisServis: canDeleteDisServis ?? false,
        canEditDisServis: canEditDisServis ?? false,
        canAddStok: canAddStok ?? false,
        canDeleteStok: canDeleteStok ?? false,
        canEditStok: canEditStok ?? false,
        canAddCari: canAddCari ?? false,
        canEditCari: canEditCari ?? false,
        canDeleteCari: canDeleteCari ?? false,
        canAddBayi: canAddBayi ?? false,
        canEditBayi: canEditBayi ?? false,
        canDeleteBayi: canDeleteBayi ?? false,
        canAddPlan: canAddPlan ?? false,
        canEditPlan: canEditPlan ?? false,
        canDeletePlan: canDeletePlan ?? false,
        canViewCiro: canViewCiro ?? false,
        canPrintMusteri: canPrintMusteri ?? false,
        canPrintTeslim: canPrintTeslim ?? false,
        canPrintEtiket: canPrintEtiket ?? false,
        canPrintAlimFisi: canPrintAlimFisi ?? false,
        canPrintSatisFisi: canPrintSatisFisi ?? false,
        canSellIkinciEl: canSellIkinciEl ?? false,
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
