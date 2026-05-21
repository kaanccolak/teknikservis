import { serviceOrderStatusLabel } from "@/lib/service-order-status";
import { STATUS_CONFIG, getStatusBadge } from "@/lib/statusConfig";

export type StatusUiConfig = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

export { STATUS_CONFIG };

export const STATUS_GROUPS: { title: string; statuses: string[] }[] = [
  {
    title: "Aktif",
    statuses: [
      "in_service",
      "returned_device",
      "waiting_approval",
      "approval_given",
      "waiting_part",
      "sent_to_external",
    ],
  },
  {
    title: "Sonuçlandı",
    statuses: [
      "repair_failed",
      "no_problem_found",
      "customer_return_request",
      "testing",
      "completed",
    ],
  },
  {
    title: "Teslim Edildi",
    statuses: [
      "delivered",
      "delivered_repair_failed",
      "delivered_no_problem",
      "delivered_customer_return",
    ],
  },
];

export function getStatusUiConfig(status: string): StatusUiConfig {
  const badge = getStatusBadge(status);
  if (STATUS_CONFIG[status]) return badge;
  return {
    ...badge,
    label: serviceOrderStatusLabel(status),
  };
}
