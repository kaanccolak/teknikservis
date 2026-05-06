/** +90 sonrası ulusal cep (10 rakam, 5 ile başlar): 5XX XXX XX XX */
export const TR_NATIONAL_MOBILE_DIGITS = 10;

export function trPhoneDigitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

/** Görünüm: 5XX XXX XX XX (kısmi girişte 532 → 532 3 → … → 532 334 45 55) */
export function formatTrNationalDisplay(digits: string): string {
  const d = trPhoneDigitsOnly(digits).slice(0, TR_NATIONAL_MOBILE_DIGITS);
  const n = d.length;
  if (n <= 3) return d;
  if (n <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (n <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

/** Veritabanı: +90 532 334 45 55 */
export function trNationalToStorage(national10: string): string {
  const d = trPhoneDigitsOnly(national10).slice(0, TR_NATIONAL_MOBILE_DIGITS);
  if (d.length !== TR_NATIONAL_MOBILE_DIGITS) return "";
  return `+90 ${formatTrNationalDisplay(d)}`;
}

/** Yapıştırma: 90…, 0 ile başlayan eski biçim */
export function normalizeNationalPhoneInput(raw: string): string {
  let d = trPhoneDigitsOnly(raw);
  if (d.startsWith("90") && d.length >= 2) {
    d = d.slice(2);
  }
  if (d.startsWith("0")) {
    d = d.slice(1);
  }
  return d.slice(0, TR_NATIONAL_MOBILE_DIGITS);
}

export function trNationalPartialHint(
  nationalDigits: string,
): string | undefined {
  const d = nationalDigits;
  if (d.length === 0) return undefined;
  if (d[0] !== "5") {
    return "Cep numarası 5 ile başlamalıdır (5XX XXX XX XX).";
  }
  return undefined;
}

export function isCompleteTrNationalMobile(nationalDigits: string): boolean {
  const d = nationalDigits;
  return d.length === TR_NATIONAL_MOBILE_DIGITS && /^5\d{9}$/.test(d);
}

/** Eşleştirme: +90, eski 0 önekli veya 11 haneli kayıtlar */
export function trPhoneMatchKey(storedOrInput: string | null | undefined): string {
  let d = trPhoneDigitsOnly(storedOrInput ?? "");
  if (d.startsWith("90")) d = d.slice(2);
  if (d.length >= 11 && d.startsWith("05")) {
    d = d.slice(1);
  } else if (d.length === 11 && d.startsWith("0")) {
    d = d.slice(1);
  }
  return d.slice(0, TR_NATIONAL_MOBILE_DIGITS);
}
