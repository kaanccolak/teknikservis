import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEMO_ADMIN_PASSWORD = "Kaanky316293!";

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };

  if (password === DEMO_ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("demo_unlocked", "true", {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "Yanlış şifre" }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("demo_unlocked", "", {
    maxAge: 0,
    path: "/",
  });
  return res;
}
