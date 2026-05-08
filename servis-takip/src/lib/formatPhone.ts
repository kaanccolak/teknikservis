export function formatPhone(phone: string): string {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("90") ? digits.slice(2) : digits;

  if (local.length === 10) {
    return `+90 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }

  return phone;
}
