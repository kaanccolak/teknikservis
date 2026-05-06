/** `datetime-local` değeri: YYYY-MM-DDTHH:mm (yerel saat) */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Yerel takvim/saat bileşenlerinden Date; geçersiz takvim günü → null */
export function parseDatetimeLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const h = Number(m[4]);
  const min = Number(m[5]);
  const d = new Date(y, mo, day, h, min, 0, 0);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== mo ||
    d.getDate() !== day ||
    d.getHours() !== h ||
    d.getMinutes() !== min
  ) {
    return null;
  }
  return d;
}
