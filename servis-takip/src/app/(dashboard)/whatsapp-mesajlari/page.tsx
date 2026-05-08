"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { formatServiceOrderNo } from "@/lib/service-order-number";
import { cn } from "@/lib/utils";

type WaMsg = {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  customerName: string | null;
  serviceOrderId: string | null;
  orderNumber: string | null;
  isRead: boolean;
};

export default function WhatsAppMesajlariPage() {
  const [messages, setMessages] = useState<WaMsg[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/whatsapp/messages?page=${p}&limit=${limit}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as
        | {
            messages: WaMsg[];
            total: number;
            page: number;
          }
        | { error?: string };
      if (!res.ok) {
        toast.error(
          typeof j === "object" && j && "error" in j
            ? String((j as { error: string }).error)
            : "Mesajlar yüklenemedi",
        );
        return;
      }
      const ok = j as { messages: WaMsg[]; total: number; page: number };
      setMessages((prev) => (append ? [...prev, ...ok.messages] : ok.messages));
      setTotal(ok.total);
      setPage(ok.page);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load(1);
  }, [load]);

  async function markRead(id: string) {
    try {
      const res = await fetch("/api/whatsapp/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        toast.error(j.error ?? "İşlem başarısız");
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
      );
      window.dispatchEvent(new CustomEvent("wa-messages-updated"));
    } catch {
      toast.error("Bağlantı hatası");
    }
  }

  const hasMore = page * limit < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          WhatsApp Mesajları
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Müşterilerden gelen mesajlar. Okunmamışlar vurgulanır; satıra tıklayınca
          okundu işaretlenir.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Yükleniyor…</p>
      ) : messages.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Henüz kayıtlı mesaj yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg) => (
            <li key={msg.id}>
              <button
                type="button"
                onClick={() => void markRead(msg.id)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                  msg.isRead
                    ? "border-slate-200 bg-white hover:bg-slate-50"
                    : "border-emerald-300 bg-emerald-50/90 font-semibold text-slate-900 shadow-sm hover:bg-emerald-50",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-900">
                      {msg.customerName ?? "Bilinmeyen müşteri"}{" "}
                      <span className="font-normal text-slate-500">
                        · {msg.from}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-sm text-slate-800",
                        !msg.isRead && "font-semibold",
                      )}
                    >
                      {msg.message}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-slate-500"
                    dateTime={msg.timestamp}
                  >
                    {new Date(msg.timestamp).toLocaleString("tr-TR")}
                  </time>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {msg.serviceOrderId ? (
                    <Link
                      href={`/servis-detay/${encodeURIComponent(msg.serviceOrderId)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Kayıt #
                      {formatServiceOrderNo({
                        orderNumber: msg.orderNumber,
                        id: msg.serviceOrderId,
                      })}
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">
                      İlişkili açık kayıt yok
                    </span>
                  )}
                  {!msg.isRead ? (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Okunmadı
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          onClick={() => void load(page + 1, true)}
          disabled={loading}
        >
          Daha fazla yükle
        </button>
      ) : null}
    </div>
  );
}
