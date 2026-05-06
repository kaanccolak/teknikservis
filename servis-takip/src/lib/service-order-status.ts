import { cn } from "@/lib/utils";

/** Veritabanında `ServiceOrder.status` — yalnızca bu değerler seçilebilir / API doğrular */
export const SERVICE_ORDER_STATUS_OPTIONS = [
  { value: "in_service", label: "Teknik Serviste" },
  { value: "returned_device", label: "Teknik Serviste (Tekrar Geldi)" },
  { value: "waiting_approval", label: "Onay Bekliyor" },
  { value: "approval_given", label: "Onay Verildi" },
  { value: "waiting_part", label: "Parça Bekliyor" },
  { value: "sent_to_external", label: "Dış Servise Gönderildi" },
  { value: "repair_failed", label: "Tamiri Olmuyor" },
  { value: "no_problem_found", label: "Sorun Görülmedi" },
  { value: "customer_return_request", label: "Müşteri İade İstiyor" },
  { value: "completed", label: "Onarım Tamamlandı" },
  { value: "delivered", label: "Teslim Edildi" },
  { value: "delivered_repair_failed", label: "Teslim Edildi (Tamir Olmuyor)" },
  { value: "delivered_no_problem", label: "Teslim Edildi (Sorun Görülmedi)" },
  { value: "delivered_customer_return", label: "Teslim Edildi (Müşteri İade İstedi)" },
] as const;

export type ServiceOrderStatusDb =
  (typeof SERVICE_ORDER_STATUS_OPTIONS)[number]["value"];

/** Ciro ve "teslim edildi" sayımı */
export const SERVICE_ORDER_DELIVERED_STATUSES = [
  "delivered",
  "delivered_repair_failed",
  "delivered_no_problem",
  "delivered_customer_return",
] as const satisfies readonly ServiceOrderStatusDb[];

export const SERVICE_ORDER_DELIVERED_STATUS_SET = new Set<string>(
  SERVICE_ORDER_DELIVERED_STATUSES,
);

export function isDeliveredServiceOrderStatus(status: string): boolean {
  return SERVICE_ORDER_DELIVERED_STATUS_SET.has(status);
}

/** Tamamlanmış + teslim grubu — "tamamlananları gizle" filtreleri */
export const SERVICE_ORDER_HIDE_COMPLETED_STATUSES: ServiceOrderStatusDb[] = [
  "completed",
  ...SERVICE_ORDER_DELIVERED_STATUSES,
];

/** servis-detay: sol grup (aktif süreç) */
export const SERVICE_ORDER_STATUS_DETAIL_ACTIVE_VALUES: ServiceOrderStatusDb[] =
  [
    "in_service",
    "returned_device",
    "waiting_approval",
    "approval_given",
    "waiting_part",
    "sent_to_external",
    "repair_failed",
    "no_problem_found",
    "customer_return_request",
  ];

/** servis-detay: sağ grup (tamamlanan / teslim) */
export const SERVICE_ORDER_STATUS_DETAIL_COMPLETED_VALUES: ServiceOrderStatusDb[] =
  [
    "completed",
    "delivered",
    "delivered_repair_failed",
    "delivered_no_problem",
    "delivered_customer_return",
  ];

const LABEL_MAP = Object.fromEntries(
  SERVICE_ORDER_STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<string, string>;

/** Eski kayıtlar: kaldırılan / yeniden adlandırılan anahtarlar (metin uygulamada artık kullanılmaz) */
const LEGACY_STATUS_LABELS: Record<string, string> = {
  pending_approval: "Onay Bekliyor",
  approved: "Onay Verildi",
  fee_pending: "Diğer",
  price_to_notify: "Diğer",
  sent_to_service: "Diğer",
  ready_delivery: "Diğer",
  to_be_delivered: "Diğer",
};

export function serviceOrderStatusLabel(status: string): string {
  return (
    LABEL_MAP[status] ??
    LEGACY_STATUS_LABELS[status] ??
    status
  );
}

const baseBadge =
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium";

const STATUS_TONE: Record<string, string> = {
  in_service: "border-blue-200 bg-blue-100 text-blue-800",
  returned_device: "border-purple-300 bg-purple-100 text-purple-900",
  waiting_approval: "border-orange-200 bg-orange-100 text-orange-900",
  approval_given: "border-emerald-200 bg-emerald-50 text-emerald-800",
  waiting_part: "border-yellow-200 bg-yellow-100 text-yellow-900",
  sent_to_external: "border-violet-300 bg-violet-100 text-violet-900",
  repair_failed: "border-red-200 bg-red-100 text-red-800",
  no_problem_found: "border-slate-200 bg-slate-100 text-slate-600",
  customer_return_request: "border-orange-200 bg-orange-100 text-orange-900",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  delivered: "border-emerald-900 bg-emerald-900 text-emerald-50",
  delivered_repair_failed: "border-red-900 bg-red-900 text-red-50",
  delivered_no_problem: "border-slate-700 bg-slate-700 text-slate-50",
  delivered_customer_return: "border-orange-900 bg-orange-900 text-orange-50",
};

const LEGACY_TONE = "border-slate-200 bg-slate-100 text-slate-600";

/** shadcn `Badge` ile birleştirmek için yalnızca renk sınıfları */
export function serviceOrderStatusToneClass(status: string): string {
  if (status in LEGACY_STATUS_LABELS && !(status in STATUS_TONE)) {
    return LEGACY_TONE;
  }
  return STATUS_TONE[status] ?? LEGACY_TONE;
}

export function serviceOrderStatusBadgeClass(status: string): string {
  return cn(baseBadge, serviceOrderStatusToneClass(status));
}

export const SERVICE_ORDER_STATUS_VALUES = new Set<string>(
  SERVICE_ORDER_STATUS_OPTIONS.map((o) => o.value),
);
