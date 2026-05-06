"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          success: "!bg-green-600 !text-white !border-green-700",
          error: "!bg-red-600 !text-white !border-red-700",
        },
      }}
    />
  );
}
