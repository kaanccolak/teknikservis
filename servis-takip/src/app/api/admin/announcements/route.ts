import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function isAdmin() {
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
  return user?.email === "kaanccolak@gmail.com";
}

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reads: true } } },
  });
  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { title, content } = (await req.json()) as {
    title: string;
    content: string;
  };
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "Başlık ve içerik zorunludur" },
      { status: 400 },
    );
  }
  const announcement = await prisma.announcement.create({
    data: { title: title.trim(), content: content.trim() },
  });
  return NextResponse.json(announcement);
}

export async function DELETE(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = (await req.json()) as { id: string };
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
