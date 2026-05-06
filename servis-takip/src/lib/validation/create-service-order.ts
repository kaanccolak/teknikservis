import { z } from "zod/v3";

import { parseDatetimeLocal } from "@/lib/datetime-local";
import {
  isCompleteTrNationalMobile,
  trPhoneDigitsOnly,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";

/** zod/v3: @hookform/resolvers + zod v4 ile RHF bazen "Invalid input" (invalid_union) üretiyordu. */
export const createServiceOrderSchema = z
  .object({
    customerName: z
      .string({
        required_error: "Ad soyad boş olamaz",
        invalid_type_error: "Ad soyad metin olmalıdır",
      })
      .min(2, "En az 2 karakter girin"),
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
  })
  .superRefine((data, ctx) => {
    if (!data.noSerialNo && (data.serialNo?.length ?? 0) === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Seri numarası girin veya 'Seri numarası yok' seçeneğini işaretleyin",
        path: ["serialNo"],
      });
    }

    const d = trPhoneDigitsOnly(data.phone).slice(
      0,
      TR_NATIONAL_MOBILE_DIGITS,
    );
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
  });

export type CreateServiceOrderFormValues = z.input<
  typeof createServiceOrderSchema
>;
