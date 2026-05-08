"use client";

import { forwardRef, type RefObject } from "react";

import {
  useSuggestions,
  type SuggestionApiField,
} from "@/hooks/useSuggestions";

export interface SuggestionTextareaProps {
  field: SuggestionApiField;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  deviceTypeId?: string;
  rows?: number;
  nextRef?: RefObject<HTMLElement | null>;
  id?: string;
  name?: string;
}

const SuggestionTextarea = forwardRef<
  HTMLTextAreaElement,
  SuggestionTextareaProps
>(function SuggestionTextarea(
  {
    field,
    value,
    onChange,
    onBlur,
    placeholder,
    deviceTypeId,
    rows = 3,
    nextRef,
    id,
    name,
  },
  ref,
) {
  const {
    setQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    handleKeyDown,
    selectSuggestion,
  } = useSuggestions(field, deviceTypeId);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={ref}
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
        }}
        onKeyDown={(e) => {
          if (showSuggestions && selectedIndex >= 0 && e.key === "Enter") {
            handleKeyDown(e, (val) => selectSuggestion(val, onChange));
            return;
          }
          if (
            showSuggestions &&
            ["ArrowDown", "ArrowUp", "Escape"].includes(e.key)
          ) {
            handleKeyDown(e, (val) => selectSuggestion(val, onChange));
            return;
          }
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !showSuggestions &&
            nextRef
          ) {
            e.preventDefault();
            nextRef.current?.focus();
          }
        }}
        onBlur={() => {
          onBlur?.();
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          resize: "vertical",
          fontFamily: "inherit",
          lineHeight: "1.5",
        }}
      />

      {showSuggestions && suggestions.length > 0 ? (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 50,
            marginTop: "4px",
            overflow: "hidden",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={`${s}-${i}`}
              onMouseDown={() => selectSuggestion(s, onChange)}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                cursor: "pointer",
                background: i === selectedIndex ? "#f5f3ff" : "white",
                color: i === selectedIndex ? "#5b21b6" : "#374151",
                borderBottom:
                  i < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

SuggestionTextarea.displayName = "SuggestionTextarea";

export default SuggestionTextarea;
