"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { getStatusBadge } from "@/lib/statusConfig";

type SorgulaResponse = {
  orderNumber: string | null;
  status: string;
  repairFailedReason?: string | null;
  customerName?: string | null;
  deviceType?: string | null;
  brand?: string | null;
  model?: string | null;
  arrivedAt: string;
  totalPrice: number | null;
};

export default function SorgulaPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumberError, setOrderNumberError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SorgulaResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderNumber.length !== 9) {
      toast.error("Kayıt numarası 9 haneli olmalıdır");
      return;
    }
    if (phone.length !== 10) {
      toast.error("Telefon numarası 10 haneli olmalıdır");
      return;
    }
    if (!phone.startsWith("5")) {
      toast.error("Telefon numarası 5 ile başlamalıdır");
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);

    let digitsForApi = phone;
    if (phone.length === 10 && phone.startsWith("5")) {
      digitsForApi = `90${phone}`;
    }

    const params = new URLSearchParams({
      orderNumber,
      phone: digitsForApi,
    });

    try {
      const res = await fetch(`/api/sorgula?${params.toString()}`);
      const data = (await res.json()) as SorgulaResponse & { error?: string };

      if (!res.ok) {
        setNotFound(true);
        return;
      }

      setResult({
        orderNumber: data.orderNumber,
        status: data.status,
        repairFailedReason: data.repairFailedReason,
        customerName: data.customerName,
        deviceType: data.deviceType,
        brand: data.brand,
        model: data.model,
        arrivedAt: data.arrivedAt,
        totalPrice: data.totalPrice,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const badge = result ? getStatusBadge(result.status) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f7ff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "0 16px 48px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          marginTop: "60px",
          background: "white",
          borderRadius: "16px",
          padding: "36px",
          border: "1px solid #eeeeee",
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/landing"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#534AB7",
              flexShrink: 0,
            }}
            aria-hidden
          />
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#0f0f0f" }}>
            Servis Takip
          </span>
        </Link>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            marginTop: "24px",
            marginBottom: 0,
            color: "#0f0f0f",
          }}
        >
          Cihaz Durumu Sorgula
        </h1>
        <p style={{ fontSize: "14px", color: "#666666", marginTop: "12px" }}>
          Kayıt numaranızı ve telefon numaranızı girerek cihazınızın durumunu
          öğrenin.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: "28px" }}>
          <label
            htmlFor="sorgula-order"
            style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
          >
            Kayıt No
          </label>
          <input
            id="sorgula-order"
            type="text"
            inputMode="numeric"
            placeholder="Örn: 202605001"
            value={orderNumber}
            onChange={(e) => {
              const raw = e.target.value;
              const val = raw.replace(/\D/g, "");

              if (raw !== val) {
                setOrderNumberError("Sadece rakam girilebilir");
                setTimeout(() => setOrderNumberError(""), 2000);
              } else if (val.length > 9) {
                setOrderNumberError("En fazla 9 hane girilebilir");
                setTimeout(() => setOrderNumberError(""), 2000);
              } else {
                setOrderNumberError("");
              }

              if (val.length <= 9) setOrderNumber(val);
            }}
            required
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "12px 14px",
              fontSize: "15px",
              borderRadius: "9px",
              border: "1px solid #e5e7eb",
              boxSizing: "border-box",
            }}
          />
          {orderNumberError ? (
            <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
              {orderNumberError}
            </p>
          ) : null}

          <label
            htmlFor="sorgula-phone"
            style={{
              display: "block",
              marginTop: "16px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            Telefon
          </label>
          <div
            style={{
              display: "flex",
              marginTop: "8px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                padding: "10px 12px",
                background: "#f9fafb",
                borderRight: "1px solid #e5e7eb",
                color: "#6b7280",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              +90
            </span>
            <input
              id="sorgula-phone"
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="5XX XXX XX XX"
              value={phone}
              onChange={(e) => {
                const raw = e.target.value;
                const val = raw.replace(/\D/g, "");

                if (raw !== val) {
                  setPhoneError("Sadece rakam girilebilir");
                  setTimeout(() => setPhoneError(""), 2000);
                } else if (val.length > 10) {
                  setPhoneError("En fazla 10 hane girilebilir");
                  setTimeout(() => setPhoneError(""), 2000);
                } else if (val.length > 0 && !val.startsWith("5")) {
                  setPhoneError("Telefon numarası 5 ile başlamalıdır");
                } else {
                  setPhoneError("");
                }

                if (val.length <= 10) setPhone(val);
              }}
              required
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "none",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>
          {phoneError ? (
            <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
              {phoneError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "12px",
              borderRadius: "9px",
              border: "none",
              background: "#534AB7",
              color: "white",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? "Sorgulanıyor…" : "Sorgula"}
          </button>
        </form>

        {result && badge ? (
          <div
            style={{
              border: "1px solid #eeeeee",
              borderRadius: "12px",
              padding: "24px",
              marginTop: "24px",
              background: badge.bg,
              transition: "all 0.3s",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "white",
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                {badge.label}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  gap: "12px",
                }}
              >
                <span style={{ color: "#666666" }}>Ad Soyad</span>
                <span style={{ fontWeight: 500, textAlign: "right" }}>
                  {result.customerName ?? "—"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  gap: "12px",
                }}
              >
                <span style={{ color: "#666666" }}>Kayıt No</span>
                <span style={{ fontWeight: 600, textAlign: "right" }}>
                  #{result.orderNumber ?? "—"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  gap: "12px",
                }}
              >
                <span style={{ color: "#666666" }}>Cihaz</span>
                <span
                  style={{
                    fontWeight: 500,
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {[result.deviceType, result.brand, result.model]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  gap: "12px",
                }}
              >
                <span style={{ color: "#666666" }}>Geliş Tarihi</span>
                <span style={{ fontWeight: 500, textAlign: "right" }}>
                  {result.arrivedAt}
                </span>
              </div>
              {result.totalPrice != null && result.totalPrice > 0 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: "#666666" }}>Toplam Ücret</span>
                  <span style={{ fontWeight: 700, fontSize: "16px" }}>
                    ₺{result.totalPrice.toLocaleString("tr-TR")}
                  </span>
                </div>
              ) : null}
            </div>

            {result.status === "repair_failed" && result.repairFailedReason ? (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#dc2626",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                >
                  Tamir Olmama Nedeni
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: "1.5",
                  }}
                >
                  {result.repairFailedReason}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {notFound ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "16px",
              marginTop: "20px",
              color: "#dc2626",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Kayıt bulunamadı. Kayıt numaranızı ve telefon numaranızı kontrol
            edin.
          </div>
        ) : null}

        <p style={{ marginTop: "28px", textAlign: "center", fontSize: "13px" }}>
          <Link
            href="/landing"
            style={{ color: "#534AB7", fontWeight: 500, textDecoration: "none" }}
          >
            ← Ana sayfaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}
