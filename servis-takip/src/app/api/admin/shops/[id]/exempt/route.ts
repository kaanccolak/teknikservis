import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== "kaanccolak@gmail.com") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const body = json as Record<string, unknown>;
  if (typeof body.isExempt !== "boolean") {
    return NextResponse.json({ error: "isExempt alanı gerekli" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) {
    return NextResponse.json({ error: "Dükkan bulunamadı" }, { status: 404 });
  }

  await prisma.shop.update({
    where: { id },
    data: { isExempt: body.isExempt },
  });

  return NextResponse.json({ ok: true });
}
