import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function verifySettingsPassword(
  shopId: string,
  password: string,
): Promise<boolean> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { settingsPassword: true },
  });
  if (!shop?.settingsPassword) return true; // parola yoksa geç
  return bcrypt.compare(password, shop.settingsPassword);
}
