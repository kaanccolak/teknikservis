"use client";

import { Package, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon?: LucideIcon }[] = [
  { href: "/", label: "Gösterge Paneli" },
  { href: "/cihaz-kayit", label: "Cihaz Kayıt" },
  { href: "/cihaz-sorgula", label: "Cihaz Sorgula" },
  { href: "/bekleyen-cihazlar", label: "Bekleyen Cihazlar" },
  { href: "/tanimlar", label: "Tanımlar", icon: Settings },
  { href: "/stok", label: "Stok Yönetimi", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Teknik Servis
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">Servis Takip</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {Icon ? (
                <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
              ) : null}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
