import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "kaanccolak@gmail.com") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { isExempt } = await req.json();

  await prisma.shop.update({
    where: { id: params.shopId },
    data: { isExempt },
  });

  return NextResponse.json({ ok: true });
}
