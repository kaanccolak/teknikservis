"use client";

import { createPortal } from "react-dom";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type RefObject,
} from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const {
    setQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    handleKeyDown,
    selectSuggestion,
  } = useSuggestions(field, deviceTypeId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 9999,
      overflow: "hidden",
    });
  }, []);

  useLayoutEffect(() => {
    if (!showSuggestions || suggestions.length === 0) return;
    updateDropdownPosition();
    const onReposition = () => updateDropdownPosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [showSuggestions, suggestions, updateDropdownPosition]);

  const setTextareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        (ref as MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }
    },
    [ref],
  );

  return (
    <div>
      <textarea
        ref={setTextareaRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          updateDropdownPosition();
        }}
        onFocus={updateDropdownPosition}
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

      {mounted &&
        showSuggestions &&
        suggestions.length > 0 &&
        createPortal(
          <div style={dropdownStyle}>
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
          </div>,
          document.body,
        )}
    </div>
  );
});

SuggestionTextarea.displayName = "SuggestionTextarea";

export default SuggestionTextarea;
