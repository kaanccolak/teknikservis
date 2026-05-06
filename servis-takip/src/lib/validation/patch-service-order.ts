import { z } from "zod/v3";

import { parseDatetimeLocal } from "@/lib/datetime-local";
import { SERVICE_ORDER_STATUS_OPTIONS } from "@/lib/service-order-status";
import {
  isCompleteTrNationalMobile,
  trPhoneDigitsOnly,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";

const statusLiterals = SERVICE_ORDER_STATUS_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];
const statusEnum = z.enum(statusLiterals);

export const patchServiceOrderSchema = z
  .object({
    status: statusEnum.optional(),
    totalPrice: z.number().min(0).max(99_999_999).nullable().optional(),
    estimatedPrice: z.number().min(0).max(99_999_999).nullable().optional(),
    technicianNote: z.string().max(20_000).nullable().optional(),
    customerName: z.string().min(2, "En az 2 karakter girin").optional(),
    phone: z.string().optional(),
    arrivedByCargo: z.boolean().optional(),
    cargoInfo: z.string().optional(),
    arrivedAt: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
        "Geçerli tarih ve saat seçin",
      )
      .refine((s) => parseDatetimeLocal(s) !== null, {
        message: "Geçerli tarih ve saat seçin",
      })
      .optional(),
    deviceTypeId: z.string().min(1).optional(),
    brandId: z.string().min(1).optional(),
    deviceModelId: z.string().min(1).optional(),
    serialNo: z.string().optional(),
    noSerialNo: z.boolean().optional(),
    warrantyStatus: z.enum(["guaranteed", "no_warranty"]).optional(),
    isTampered: z.boolean().optional(),
    complaint: z.string().optional(),
    accessories: z.string().optional(),
    physicalDamage: z.string().optional(),
    externalServiceId: z.string().nullable().optional(),
    externalNote: z.string().max(20_000).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const keys = Object.entries(data).filter(([, v]) => v !== undefined);
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Güncellenecek alan yok",
      });
      return;
    }

    const dt = data.deviceTypeId !== undefined;
    const br = data.brandId !== undefined;
    const md = data.deviceModelId !== undefined;
    const deviceCount = [dt, br, md].filter(Boolean).length;
    if (deviceCount > 0 && deviceCount < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cihaz türü, marka ve model birlikte güncellenmelidir",
        path: ["deviceTypeId"],
      });
    }

    const touchesSerial =
      data.serialNo !== undefined ||
      data.noSerialNo !== undefined ||
      data.deviceModelId !== undefined;

    if (touchesSerial) {
      const noSerial = data.noSerialNo ?? false;
      const serial = data.serialNo ?? "";
      if (!noSerial && serial.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Seri numarası girin veya 'Seri numarası yok' seçeneğini işaretleyin",
          path: ["serialNo"],
        });
      }
    }

    if (data.phone !== undefined) {
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
    }

    if (data.status === "sent_to_external") {
      const ext = data.externalServiceId?.trim() ?? "";
      if (!ext) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dış servis seçin",
          path: ["externalServiceId"],
        });
      }
    }
  });

export type PatchServiceOrderBody = z.infer<typeof patchServiceOrderSchema>;
