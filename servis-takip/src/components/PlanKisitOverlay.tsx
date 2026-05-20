"use client";
import Link from "next/link";

type Props = {
  paket: "basic" | "premium" | "enterprise";
  ozellik: string;
};

const paketRenk = {
  basic: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
  premium: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-800",
  },
  enterprise: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    badge: "bg-slate-100 text-slate-800",
  },
};

const paketAd = { basic: "Basic", premium: "Premium", enterprise: "Enterprise" };

export default function PlanKisitOverlay({ paket, ozellik }: Props) {
  const renk = paketRenk[paket];
  return (
    <div
      className={`relative rounded-xl border ${renk.border} ${renk.bg} p-10 text-center`}
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${renk.badge} mb-4`}
      >
        🔒 {paketAd[paket]} Paketi
      </div>
      <h3 className={`text-lg font-semibold ${renk.text} mb-2`}>{ozellik}</h3>
      <p className="text-sm text-slate-500 mb-6">
        Bu özellik {paketAd[paket]} ve üzeri planlarda kullanılabilir.
      </p>
      <Link
        href="/paket-sec"
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
          paket === "basic"
            ? "bg-blue-600 hover:bg-blue-700"
            : paket === "premium"
              ? "bg-violet-600 hover:bg-violet-700"
              : "bg-slate-700 hover:bg-slate-800"
        } transition-colors`}
      >
        Paketi Yükselt →
      </Link>
    </div>
  );
}
