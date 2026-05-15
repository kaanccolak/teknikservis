import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  try {
    // Cascade: bağlı tüm verileri sırayla sil
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return NextResponse.json({ error: "Dükkan bulunamadı" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // ServiceOrder bağlantıları
      const orders = await tx.serviceOrder.findMany({
        where: { shopId: id },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      if (orderIds.length > 0) {
        await tx.statusLog.deleteMany({
          where: { serviceOrderId: { in: orderIds } },
        });
        await tx.sparePartUsage.deleteMany({
          where: { serviceOrderId: { in: orderIds } },
        });
        await tx.serviceOrder.deleteMany({ where: { shopId: id } });
      }

      // Diğer bağlı kayıtlar
      await tx.customer.deleteMany({ where: { shopId: id } });
      await tx.secondHandDevice.deleteMany({ where: { shopId: id } });
      await tx.sparePart.deleteMany({ where: { shopId: id } });
      await tx.deviceModel.deleteMany({ where: { shopId: id } });
      await tx.brand.deleteMany({ where: { shopId: id } });
      await tx.deviceType.deleteMany({ where: { shopId: id } });
      await tx.waTemplate.deleteMany({ where: { shopId: id } });
      await tx.setting.deleteMany({ where: { shopId: id } });
      await tx.externalService.deleteMany({ where: { shopId: id } }).catch(() => null);
      await tx.cari.deleteMany({ where: { shopId: id } }).catch(() => null);
      await tx.bayi.deleteMany({ where: { shopId: id } }).catch(() => null);
      await tx.paymentPlan.deleteMany({ where: { shopId: id } }).catch(() => null);
      await tx.whatsAppMessage.deleteMany({ where: { shopId: id } }).catch(() => null);

      // Son olarak shop'u sil
      await tx.shop.delete({ where: { id } });
    });

    // Supabase Auth kullanıcısını da sil
    if (shop.userId) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        await adminClient.auth.admin.deleteUser(shop.userId);
      } catch (authErr) {
        console.error("Supabase kullanıcı silme hatası:", authErr);
        // Auth silme başarısız olsa bile devam et, shop zaten silindi
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shop delete error:", error);
    return NextResponse.json(
      { error: "Silinemedi: " + String(error) },
      { status: 500 },
    );
  }
}
