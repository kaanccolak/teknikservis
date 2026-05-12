"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface Props {
  pageKey: string;
  title: string;
  description: string;
  tips: string[];
  icon: string;
}

export default function PageGuideModal({
  pageKey,
  title,
  description,
  tips,
  icon,
}: Props) {
  const [open, setOpen] = useState(false);
  const [storageKey, setStorageKey] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timerRef: { id?: ReturnType<typeof setTimeout> } = {};

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const userId = data.user?.id ?? "guest";
      const key = `onboarding_page_${pageKey}_${userId}`;
      const shown = localStorage.getItem(key);
      if (!shown) {
        timerRef.id = setTimeout(() => {
          if (cancelled) return;
          setOpen(true);
          setStorageKey(key);
        }, 500);
      }
    });

    return () => {
      cancelled = true;
      if (timerRef.id !== undefined) clearTimeout(timerRef.id);
    };
  }, [pageKey]);

  function close() {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "32px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>{icon}</div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "6px",
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6" }}>
            {description}
          </p>
        </div>

        {tips.length > 0 ? (
          <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
            {tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    color: "#4f46e5",
                    fontWeight: 700,
                    flexShrink: 0,
                    fontSize: "13px",
                  }}
                >
                  ✓
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: "1.5",
                  }}
                >
                  {tip}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={close}
          style={{
            width: "100%",
            padding: "11px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Anladım, Başlayalım!
        </button>
      </div>
    </div>
  );
}
