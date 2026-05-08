import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_FIELDS = ["complaint", "accessories", "physicalCondition"] as const;
type ApiField = (typeof VALID_FIELDS)[number];

function toDbField(field: ApiField): "complaint" | "accessories" | "physicalDamage" {
  if (field === "physicalCondition") return "physicalDamage";
  return field;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fieldParam = searchParams.get("field");
    const q = searchParams.get("q");
    const deviceTypeId = searchParams.get("deviceTypeId")?.trim() || undefined;

    if (!fieldParam || !q || q.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const shop = await getShop();
    if (!shop) return NextResponse.json({ suggestions: [] });

    if (!VALID_FIELDS.includes(fieldParam as ApiField)) {
      return NextResponse.json({ suggestions: [] });
    }

    const field = fieldParam as ApiField;
    const dbField = toDbField(field);
    const qTrim = q.trim();

    const baseWhere = {
      shopId: shop.id,
      [dbField]: {
        contains: qTrim,
        mode: "insensitive" as const,
      },
      NOT: { [dbField]: null },
      ...(deviceTypeId ? { deviceTypeId } : {}),
    };

    const select =
      dbField === "complaint"
        ? { complaint: true as const }
        : dbField === "accessories"
          ? { accessories: true as const }
          : { physicalDamage: true as const };

    const results = await prisma.serviceOrder.findMany({
      where: baseWhere,
      select,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const counts: Record<string, number> = {};
    for (const r of results) {
      const val =
        dbField === "complaint"
          ? r.complaint
          : dbField === "accessories"
            ? r.accessories
            : r.physicalDamage;
      if (val && typeof val === "string" && val.trim()) {
        const normalized = val.trim();
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value]) => value);

    return NextResponse.json({ suggestions: sorted });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
