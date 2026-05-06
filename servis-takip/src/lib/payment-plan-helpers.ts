export type PaymentPlanRow = {
  id: string;
  title: string;
  amount: number | null;
  dueDate: string;
  isRecurring: boolean;
  recurringDay: number | null;
  category: string | null;
  notes: string | null;
  isCompleted: boolean;
  completedAt: string | null;
};

export const PAYMENT_CATEGORIES = {
  kira: { label: "Kira", bg: "#eff6ff", color: "#2563eb" },
  kredi: { label: "Kredi/Kart", bg: "#fef2f2", color: "#dc2626" },
  fatura: { label: "Fatura", bg: "#fffbeb", color: "#d97706" },
  transfer: { label: "Transfer", bg: "#f0fdf4", color: "#16a34a" },
  diger: { label: "Diğer", bg: "#f5f3ff", color: "#7c3aed" },
} as const;

export type PaymentCategoryKey = keyof typeof PAYMENT_CATEGORIES;

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  const k = category as PaymentCategoryKey;
  return PAYMENT_CATEGORIES[k]?.label ?? category;
}

export function getCategoryColor(category: string | null | undefined): {
  bg: string;
  color: string;
} {
  if (!category) return { bg: "#f3f4f6", color: "#4b5563" };
  const k = category as PaymentCategoryKey;
  return PAYMENT_CATEGORIES[k] ?? { bg: "#f3f4f6", color: "#4b5563" };
}

export function getDaysColor(days: number): string {
  if (days < 0) return "#ef4444";
  if (days === 0) return "#f97316";
  if (days <= 3) return "#f59e0b";
  if (days <= 7) return "#3b82f6";
  return "#6b7280";
}

export function formatPlanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function calendarDaysUntilDue(iso: string): number {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 0;
  const dueStart = startOfDayLocal(due);
  const todayStart = startOfDayLocal(new Date());
  return Math.round(
    (dueStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Bir sonraki ayda `dayOfMonth` günü (ay uzunluğuna göre sınırlı). */
export function addOneMonthWithDay(from: Date, dayOfMonth: number): Date {
  const y = from.getFullYear();
  const m = from.getMonth() + 1;
  const dim = daysInMonth(y, m);
  const d = Math.min(dayOfMonth, dim);
  return new Date(y, m, d, 12, 0, 0, 0);
}

export function computeNextRecurringDueDate(
  currentDue: Date,
  recurringDay: number | null,
): Date {
  const day = recurringDay ?? currentDue.getDate();
  return addOneMonthWithDay(currentDue, day);
}
