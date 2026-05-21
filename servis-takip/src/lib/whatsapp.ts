/** Meta şablon gövdesi için servis kaydı alanları (detay sayfası API yanıtı ile uyumlu) */
export type WaTemplateOrder = {
  customer: { name: string };
  serialNo?: string | null;
  deviceModel?: { name: string } | null;
  brand?: { name: string } | null;
  deviceType?: { name: string } | null;
  repairFailedReason?: string | null;
  totalPrice?: number | null;
};

/**
 * `name` alanları Meta Business’ta onaylı şablon adlarıyla birebir aynı olmalı.
 * `sent_to_external` için şablon yok — bu anahtar eklenmez.
 */
export const WA_TEMPLATES: Record<
  string,
  { name: string; getParams: (o: WaTemplateOrder) => string[] }
> = {
  in_service: {
    name: "servis_teslim_alindi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  returned_device: {
    name: "servis_teslim_alindi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  waiting_approval: {
    name: "onay_bekleniyor",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  approval_given: {
    name: "onay_verildi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  waiting_part: {
    name: "parca_bekleniyor",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  repair_failed: {
    name: "tamiri_olmuyor",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
      o.repairFailedReason || "Belirtilmemiş",
    ],
  },
  no_problem_found: {
    name: "sorun_gorulmedi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  customer_return_request: {
    name: "musteri_iade_istiyor",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  testing: {
    name: "test_asamasinda",
    getParams: (o) => [
      o.customer.name,
      o.serialNo ?? "",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
    ],
  },
  completed: {
    name: "onarim_tamamlandi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
      o.totalPrice ? o.totalPrice.toLocaleString("tr-TR") + " ₺" : "Belirtilmemiş",
    ],
  },
  delivered: {
    name: "teslim_edildi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
      o.totalPrice ? o.totalPrice.toLocaleString("tr-TR") + " ₺" : "",
    ],
  },
  delivered_repair_failed: {
    name: "teslim_tamir_olmuyor",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
      o.totalPrice ? o.totalPrice.toLocaleString("tr-TR") + " ₺" : "",
    ],
  },
  delivered_no_problem: {
    name: "teslim_sorun_gorulmedi",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
      o.totalPrice ? o.totalPrice.toLocaleString("tr-TR") + " ₺" : "",
    ],
  },
  delivered_customer_return: {
    name: "teslim_musteri_iade",
    getParams: (o) => [
      o.customer.name,
      o.serialNo || "Belirtilmemiş",
      o.deviceModel?.name || o.brand?.name || "Cihaz",
      o.totalPrice ? o.totalPrice.toLocaleString("tr-TR") + " ₺" : "",
    ],
  },
};

/** İkinci el alım bildirimi (durum anahtarı değil) */
export const WA_SECOND_HAND_PURCHASE = {
  name: "ikinci_el_satin_alindi",
  getParams: (sellerName: string, deviceName: string, price: string) =>
    [sellerName, deviceName, price],
} as const;

export const WA_SECOND_HAND_SOLD = {
  name: "ikinci_el_satildi",
  getParams: (buyerName: string, deviceName: string, price: string) =>
    [buyerName, deviceName, price],
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
