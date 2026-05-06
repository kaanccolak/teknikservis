import { cn } from "@/lib/utils";

/** Veritabanında `ServiceOrder.status` — yalnızca bu değerler seçilebilir / API doğrular */
export const SERVICE_ORDER_STATUS_OPTIONS = [
  { value: "in_service", label: "Teknik Serviste" },
  { value: "waiting_approval", label: "Onay Bekliyor" },
  { value: "approval_given", label: "Onay Verildi" },
  { value: "waiting_part", label: "Parça Bekliyor" },
  { value: "completed", label: "Onarım Tamamlandı" },
  { value: "delivered", label: "Teslim Edildi" },
] as const;

export type ServiceOrderStatusDb =
  (typeof SERVICE_ORDER_STATUS_OPTIONS)[number]["value"];

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
  sent_to_external: "Diğer",
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
  waiting_approval: "border-orange-200 bg-orange-100 text-orange-900",
  approval_given: "border-emerald-200 bg-emerald-50 text-emerald-800",
  waiting_part: "border-yellow-200 bg-yellow-100 text-yellow-900",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  delivered: "border-emerald-900 bg-emerald-900 text-emerald-50",
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
