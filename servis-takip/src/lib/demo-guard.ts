import { NextResponse } from "next/server";

import { getShop } from "./getShop";

export async function demoGuard() {
  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (shop.isDemo) {
    return NextResponse.json(
      { error: "Demo hesapta bu işlem yapılamaz." },
      { status: 403 },
    );
  }
  return null;
}
