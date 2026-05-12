import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getShop } from "./getShop";

export async function demoGuard() {
  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!shop.isDemo) return null;

  const cookieStore = cookies();
  const unlocked = cookieStore.get("demo_unlocked")?.value;
  if (unlocked === "true") return null;

  return NextResponse.json(
    { error: "Demo hesapta bu işlem yapılamaz." },
    { status: 403 },
  );
}
