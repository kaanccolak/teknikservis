import { z } from "zod/v3";

import { parseDatetimeLocal } from "@/lib/datetime-local";
import {
  isCompleteTrNationalMobile,
  trPhoneDigitsOnly,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";

const baseServiceOrderSchema = z.object({
  customerName: z
    .string({
      required_error: "Ad soyad boş olamaz",
      invalid_type_error: "Ad soyad metin olmalıdır",
    })
    .min(2, "En az 2 karakter girin"),
  cariId: z.string().optional(),
  bayiId: z.string().optional(),
  personnelId: z.string().min(1, "Personel seçimi zorunludur"),
  phone: z.string(),
  arrivedByCargo: z.boolean().default(false),
  cargoInfo: z.string().optional(),
  arrivedAt: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      "Geçerli tarih ve saat seçin",
    )
    .refine((s) => parseDatetimeLocal(s) !== null, {
      message: "Geçerli tarih ve saat seçin",
    }),
  deviceTypeId: z.string().min(1, "Cihaz türü seçin"),
  brandId: z.string().min(1, "Marka seçin"),
  deviceModelId: z.string().min(1, "Model seçin"),
  serialNo: z.string(),
  noSerialNo: z.boolean().default(false),
  warrantyStatus: z.enum(["guaranteed", "no_warranty"], {
    required_error: "Garanti durumu seçin",
    invalid_type_error: "Garanti durumu seçin",
  }),
  isTampered: z.boolean().default(false),
  complaint: z.string().optional(),
  accessories: z.string().optional(),
  physicalDamage: z.string().optional(),
  estimatedPrice: z.string().optional(),
});

function serviceOrderSuperRefine(
  data: z.infer<typeof baseServiceOrderSchema>,
  ctx: z.RefinementCtx,
) {
  if (!data.noSerialNo && (data.serialNo?.length ?? 0) === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Seri numarası girin veya 'Seri numarası yok' seçeneğini işaretleyin",
      path: ["serialNo"],
    });
  }

  const d = trPhoneDigitsOnly(data.phone).slice(0, TR_NATIONAL_MOBILE_DIGITS);
  if (d.length === 0) return;
  if (!isCompleteTrNationalMobile(d)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        d.length < TR_NATIONAL_MOBILE_DIGITS
          ? "Telefon numarasını eksiksiz girin (5XX XXX XX XX)."
          : "Geçerli bir Türkiye cep numarası girin (5XX).",
      path: ["phone"],
    });
  }

  const ep = data.estimatedPrice?.trim() ?? "";
  if (ep !== "") {
    const n = Number(ep.replace(",", "."));
    if (Number.isNaN(n) || n < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Geçerli bir tutar girin",
        path: ["estimatedPrice"],
      });
    }
  }
}

/** zod/v3: @hookform/resolvers + zod v4 ile RHF bazen "Invalid input" (invalid_union) üretiyordu. */
export const createServiceOrderSchema =
  baseServiceOrderSchema.superRefine(serviceOrderSuperRefine);

/** Kayıt düzenleme — mevcut kayıtlarda personel boş olabilir. */
export const editServiceOrderSchema = baseServiceOrderSchema
  .omit({ personnelId: true })
  .extend({
    personnelId: z.string().optional(),
  })
  .superRefine(serviceOrderSuperRefine);

/** Formdaki tahmini fiyat metnini veritabanı alanına çevirir; boş veya 0 → null. */
export function formEstimatedPriceToDb(
  raw: string | undefined,
): number | null {
  const ep = raw?.trim() ?? "";
  if (ep === "") return null;
  const n = Number(ep.replace(",", "."));
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

export type CreateServiceOrderFormValues = z.input<
  typeof createServiceOrderSchema
>;
