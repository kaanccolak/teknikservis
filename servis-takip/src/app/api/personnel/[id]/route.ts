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
    const body = (await req.json()) as {
      name?: string;
      password?: string;
      isAdmin?: boolean;
      phone?: string;
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
    const {
      name,
      password,
      isAdmin,
      phone,
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
    } = body;

    const existing = await prisma.personnel.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const updateData: {
      name?: string;
      password?: string | null;
      phone?: string | null;
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
    } = {};
    if (name?.trim()) updateData.name = name.trim();
    if ("phone" in body)
      updateData.phone =
        typeof phone === "string" && phone.trim() ? phone.trim() : null;
    if (typeof isAdmin === "boolean") updateData.isAdmin = isAdmin;
    if (typeof canViewSirketim === "boolean")
      updateData.canViewSirketim = canViewSirketim;
    if (typeof canViewRaporlar === "boolean")
      updateData.canViewRaporlar = canViewRaporlar;
    if (typeof canViewPlanlarim === "boolean")
      updateData.canViewPlanlarim = canViewPlanlarim;
    if (typeof canViewBayiler === "boolean") updateData.canViewBayiler = canViewBayiler;
    if (typeof canViewCari === "boolean") updateData.canViewCari = canViewCari;
    if (typeof canViewStok === "boolean") updateData.canViewStok = canViewStok;
    if (typeof canViewDisServis === "boolean")
      updateData.canViewDisServis = canViewDisServis;
    if (typeof canViewBekleyen === "boolean")
      updateData.canViewBekleyen = canViewBekleyen;
    if (typeof canViewIkinciEl === "boolean")
      updateData.canViewIkinciEl = canViewIkinciEl;
    if (typeof canViewCihazSorgula === "boolean")
      updateData.canViewCihazSorgula = canViewCihazSorgula;
    if (typeof canViewCihazKayit === "boolean")
      updateData.canViewCihazKayit = canViewCihazKayit;
    if (typeof canCreateRecord === "boolean")
      updateData.canCreateRecord = canCreateRecord;
    if (typeof canDeleteIkinciEl === "boolean")
      updateData.canDeleteIkinciEl = canDeleteIkinciEl;
    if (typeof canDeleteServis === "boolean")
      updateData.canDeleteServis = canDeleteServis;
    if (typeof canEditServis === "boolean") updateData.canEditServis = canEditServis;
    if (typeof canEditIkinciEl === "boolean")
      updateData.canEditIkinciEl = canEditIkinciEl;
    if (typeof canUpdateServisStatus === "boolean")
      updateData.canUpdateServisStatus = canUpdateServisStatus;
    if (typeof canAddDisServis === "boolean")
      updateData.canAddDisServis = canAddDisServis;
    if (typeof canDeleteDisServis === "boolean")
      updateData.canDeleteDisServis = canDeleteDisServis;
    if (typeof canEditDisServis === "boolean")
      updateData.canEditDisServis = canEditDisServis;
    if (typeof canAddStok === "boolean") updateData.canAddStok = canAddStok;
    if (typeof canDeleteStok === "boolean") updateData.canDeleteStok = canDeleteStok;
    if (typeof canEditStok === "boolean") updateData.canEditStok = canEditStok;
    if (typeof canAddCari === "boolean") updateData.canAddCari = canAddCari;
    if (typeof canEditCari === "boolean") updateData.canEditCari = canEditCari;
    if (typeof canDeleteCari === "boolean") updateData.canDeleteCari = canDeleteCari;
    if (typeof canAddBayi === "boolean") updateData.canAddBayi = canAddBayi;
    if (typeof canEditBayi === "boolean") updateData.canEditBayi = canEditBayi;
    if (typeof canDeleteBayi === "boolean") updateData.canDeleteBayi = canDeleteBayi;
    if (typeof canAddPlan === "boolean") updateData.canAddPlan = canAddPlan;
    if (typeof canEditPlan === "boolean") updateData.canEditPlan = canEditPlan;
    if (typeof canDeletePlan === "boolean") updateData.canDeletePlan = canDeletePlan;
    if (typeof canViewCiro === "boolean") updateData.canViewCiro = canViewCiro;
    if (typeof canPrintMusteri === "boolean")
      updateData.canPrintMusteri = canPrintMusteri;
    if (typeof canPrintTeslim === "boolean")
      updateData.canPrintTeslim = canPrintTeslim;
    if (typeof canPrintEtiket === "boolean")
      updateData.canPrintEtiket = canPrintEtiket;
    if (typeof canPrintAlimFisi === "boolean")
      updateData.canPrintAlimFisi = canPrintAlimFisi;
    if (typeof canPrintSatisFisi === "boolean")
      updateData.canPrintSatisFisi = canPrintSatisFisi;
    if (typeof canSellIkinciEl === "boolean")
      updateData.canSellIkinciEl = canSellIkinciEl;
    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    } else if (password === "") {
      updateData.password = null;
    }

    const updated = await prisma.personnel.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
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
