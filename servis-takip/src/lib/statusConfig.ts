export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  in_service: {
    label: "Teknik Serviste",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  returned_device: {
    label: "Teknik Serviste (Tekrar Geldi)",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  waiting_approval: {
    label: "Onay Bekliyor",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  approval_given: {
    label: "Onay Verildi",
    color: "#06b6d4",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  waiting_part: {
    label: "Parça Bekliyor",
    color: "#f97316",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  repair_failed: {
    label: "Tamiri Olmuyor",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  no_problem_found: {
    label: "Sorun Görülmedi",
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
  },
  customer_return_request: {
    label: "Müşteri İade İstiyor",
    color: "#ec4899",
    bg: "#fdf2f8",
    border: "#fbcfe8",
  },
  testing: {
    label: "Test Aşamasında",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  completed: {
    label: "Onarım Tamamlandı",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  delivered: {
    label: "Teslim Edildi",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#6ee7b7",
  },
  delivered_repair_failed: {
    label: "Teslim (Tamir Olmuyor)",
    color: "#b91c1c",
    bg: "#fff1f2",
    border: "#fecdd3",
  },
  delivered_no_problem: {
    label: "Teslim (Sorun Görülmedi)",
    color: "#4b5563",
    bg: "#f3f4f6",
    border: "#d1d5db",
  },
  delivered_customer_return: {
    label: "Teslim (Müşteri İade)",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  sent_to_external: {
    label: "Dış Servise Gönderildi",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
};

export const getStatusBadge = (status: string) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
  };
  return config;
};
