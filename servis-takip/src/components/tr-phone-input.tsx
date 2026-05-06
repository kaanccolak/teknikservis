"use client";

import { forwardRef, useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import {
  formatTrNationalDisplay,
  normalizeNationalPhoneInput,
  trNationalPartialHint,
  trPhoneDigitsOnly,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";

const PLACEHOLDER = "5XX XXX XX XX";

export type TrPhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value: string;
  onValueChange: (nationalDigits: string) => void;
};

export const TrPhoneInput = forwardRef<HTMLInputElement, TrPhoneInputProps>(
  function TrPhoneInput(
    {
      value,
      onValueChange,
      className,
      disabled,
      id,
      placeholder,
      onKeyDown: onKeyDownProp,
      ...rest
    },
    ref,
  ) {
    const [maxDigitsExceeded, setMaxDigitsExceeded] = useState(false);

    const onChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = trPhoneDigitsOnly(e.target.value);
        if (raw.length > TR_NATIONAL_MOBILE_DIGITS) {
          setMaxDigitsExceeded(true);
          onValueChange(raw.slice(0, TR_NATIONAL_MOBILE_DIGITS));
          return;
        }
        setMaxDigitsExceeded(false);
        onValueChange(normalizeNationalPhoneInput(e.target.value));
      },
      [onValueChange],
    );

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDownProp?.(e);
        if (e.defaultPrevented) return;
        if (disabled) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length !== 1) return;

        const el = e.currentTarget;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = end - start;

        if (/^\d$/.test(e.key)) {
          const nextLen = value.length - sel + 1;
          if (nextLen > TR_NATIONAL_MOBILE_DIGITS) {
            e.preventDefault();
            setMaxDigitsExceeded(true);
          }
          return;
        }

        e.preventDefault();
      },
      [disabled, onKeyDownProp, value.length],
    );

    const onPaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData("text");
        const raw = trPhoneDigitsOnly(text);
        if (raw.length > TR_NATIONAL_MOBILE_DIGITS) {
          setMaxDigitsExceeded(true);
        }
      },
      [],
    );

    const hint = trNationalPartialHint(value);

    return (
      <div className={cn("space-y-1.5", className)}>
        <div
          className={cn(
            "flex h-10 w-full overflow-hidden rounded-md border border-input bg-background shadow-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className="flex shrink-0 select-none items-center border-r border-input bg-muted px-3 text-sm text-muted-foreground"
            aria-hidden
          >
            +90
          </span>
          <input
            ref={ref}
            id={id}
            type="tel"
            inputMode="numeric"
            pattern="[0-9 ]*"
            autoComplete="tel-national"
            disabled={disabled}
            placeholder={placeholder ?? PLACEHOLDER}
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:cursor-not-allowed"
            value={formatTrNationalDisplay(value)}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            {...rest}
          />
        </div>
        {maxDigitsExceeded ? (
          <p className="text-sm text-destructive" role="alert">
            En fazla 10 hane girilebilir
          </p>
        ) : hint ? (
          <p className="text-sm text-amber-700 dark:text-amber-500" role="status">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
