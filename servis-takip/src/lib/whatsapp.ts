export const WA_TEMPLATES = {
  SERVICE_RECEIVED: {
    name: "servis_teslim_alindi",
    getParams: (customerName: string, deviceName: string, orderNumber: string) =>
      [customerName, deviceName, orderNumber],
  },
  PRICE_NOTIFICATION: {
    name: "fiyat_bildirimi",
    getParams: (customerName: string, price: string, orderNumber: string) => [
      customerName,
      price,
      orderNumber,
    ],
  },
  APPROVAL_RECEIVED: {
    name: "onay_alindi",
    getParams: (customerName: string, orderNumber: string) => [
      customerName,
      orderNumber,
    ],
  },
  SECOND_HAND_PURCHASE: {
    name: "ikinci_el_satin_alindi",
    getParams: (sellerName: string, deviceName: string, price: string) => [
      sellerName,
      deviceName,
      price,
    ],
  },
} as const;

export async function sendWhatsApp(
  phone: string,
  templateName: string,
  parameters: string[],
) {
  const res = await fetch("/api/whatsapp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, templateName, parameters }),
  });
  const data = (await res.json()) as {
    success?: boolean;
    error?: string;
    data?: unknown;
  };
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Mesaj gönderilemedi",
    );
  }
  return data;
}

export function formatPriceForWa(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);
}
